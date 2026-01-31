import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Payout from "@/models/Payout";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/auth-middleware";
import { createPayoutSchema } from "@/lib/validations/payout";
import { checkPayoutEligibility } from "@/lib/payouts/eligibility";
import { getPendingPayoutCentsForHost } from "@/services/payouts.service";
import {
  createDisbursement,
  normalizeBankCardNumber,
} from "@/lib/paymob-payouts";

const IDEMPOTENCY_HEADER = "idempotency-key";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * GET /api/payouts
 * List payouts for the authenticated host. Paginated, optional status filter.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ["Host", "Admin"]);
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
    );

    const filter: { host: typeof user._id; status?: string } = {
      host: user._id,
    };
    if (status && ["pending", "processing", "success", "failed"].includes(status)) {
      filter.status = status;
    }

    const [payouts, total] = await Promise.all([
      Payout.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Payout.countDocuments(filter),
    ]);

    return successResponse({
      payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Payouts GET] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to list payouts";
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/payouts
 * Create a payout request for the authenticated host.
 * Body: { amountCents: number }
 * Header: Idempotency-Key (required)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ["Host", "Admin"]);
    await dbConnect();

    const idempotencyKey = req.headers.get(IDEMPOTENCY_HEADER)?.trim();
    if (!idempotencyKey) {
      return errorResponse("Idempotency-Key header is required", 400);
    }

    const body = await req.json();
    const parseResult = createPayoutSchema.safeParse(body);
    if (!parseResult.success) {
      const msg = parseResult.error.issues.map((i) => i.message).join(", ");
      return errorResponse(msg, 400);
    }
    const { amountCents } = parseResult.data;

    const hostId = user._id;

    const existing = await Payout.findOne({
      idempotencyKey,
      host: hostId,
    });
    if (existing) {
      return successResponse(
        {
          payoutId: existing._id.toString(),
          status: existing.status,
          amountCents: existing.amountCents,
          paymobTransactionId: existing.paymobTransactionId,
        },
        "Payout already created (idempotent)",
        200,
      );
    }

    const dbUser = await User.findById(hostId)
      .select("walletBalanceCents bankDetails nationalId")
      .lean();
    if (!dbUser) {
      return errorResponse("User not found", 404);
    }

    const pendingCents = await getPendingPayoutCentsForHost(hostId);
    const eligibility = checkPayoutEligibility(
      {
        walletBalanceCents: dbUser.walletBalanceCents ?? 0,
        bankDetails: dbUser.bankDetails,
        nationalId: dbUser.nationalId,
      },
      amountCents,
      pendingCents,
    );
    if (!eligibility.eligible) {
      return errorResponse(eligibility.reason ?? "Not eligible", 400);
    }

    const clientReference = crypto.randomUUID();
    const payout = await Payout.create({
      host: hostId,
      amountCents,
      currency: "EGP",
      status: "pending",
      paymobClientReference: clientReference,
      idempotencyKey,
      events: [
        {
          at: new Date(),
          status: "pending",
          source: "api",
        },
      ],
    });

    const deductResult = await User.updateOne(
      {
        _id: hostId,
        walletBalanceCents: { $gte: amountCents },
      },
      { $inc: { walletBalanceCents: -amountCents } },
    );
    if (deductResult.modifiedCount === 0) {
      await Payout.findByIdAndDelete(payout._id);
      return errorResponse("Insufficient balance or concurrent request", 400);
    }

    const bank = dbUser.bankDetails!;
    const bankCardNumber = bank.iban?.trim()
      ? bank.iban
      : bank.accountNumber!;

    try {
      const result = await createDisbursement({
        amountCents,
        currency: "EGP",
        bankCode: bank.bankCode.trim(),
        bankCardNumber: normalizeBankCardNumber(bankCardNumber),
        fullName: bank.fullName.trim(),
        nationalId: dbUser.nationalId!.trim(),
        clientReference,
      });

      payout.paymobTransactionId = result.transactionId;
      payout.paymobStatus = result.disbursementStatus;
      payout.paymobStatusDescription = result.statusDescription;
      payout.paymobStatusCode = result.statusCode;
      payout.paymobEventAt = new Date();
      payout.events = payout.events ?? [];
      payout.events.push({
        at: new Date(),
        status: payout.status,
        paymobStatus: result.disbursementStatus,
        paymobMessage: result.statusDescription,
        source: "api",
      });

      const statusLower = result.disbursementStatus.toLowerCase();
      if (statusLower === "failed") {
        payout.status = "failed";
        await User.updateOne(
          { _id: hostId },
          { $inc: { walletBalanceCents: amountCents } },
        );
      } else if (statusLower === "pending" || statusLower === "processing") {
        payout.status = statusLower === "processing" ? "processing" : "pending";
      } else if (statusLower === "success" || statusLower === "successful") {
        payout.status = "success";
      }

      await payout.save();
    } catch (paymobError) {
      await User.updateOne(
        { _id: hostId },
        { $inc: { walletBalanceCents: amountCents } },
      );
      payout.status = "failed";
      payout.paymobStatusDescription =
        paymobError instanceof Error ? paymobError.message : "Paymob API error";
      payout.events = payout.events ?? [];
      payout.events.push({
        at: new Date(),
        status: "failed",
        paymobMessage: payout.paymobStatusDescription,
        source: "api",
      });
      await payout.save();
      return errorResponse(
        payout.paymobStatusDescription ?? "Failed to create payout",
        502,
      );
    }

    return successResponse(
      {
        payoutId: payout._id.toString(),
        status: payout.status,
        amountCents: payout.amountCents,
        paymobTransactionId: payout.paymobTransactionId,
      },
      "Payout created",
      201,
    );
  } catch (error) {
    console.error("[Payouts POST] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create payout";
    return errorResponse(message, 500);
  }
}
