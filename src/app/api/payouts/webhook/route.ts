import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Payout from "@/models/Payout";
import User from "@/models/User";
import {
  verifyPayoutWebhookSignature,
  isPayoutWebhookPayload,
  mapDisbursementStatusToPayoutStatus,
} from "@/lib/paymob-payouts/webhook";

const SIGNATURE_HEADER = "x-paymob-payouts-signature";

/**
 * POST /api/payouts/webhook
 * Paymob Payouts status callback. Paymob is source of truth for payout status.
 * Verify signature, update Payout, reconcile wallet on failure.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get(SIGNATURE_HEADER);

    if (!verifyPayoutWebhookSignature(rawBody, signature)) {
      console.error("[Payouts Webhook] Invalid or missing signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 },
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody) as unknown;
    } catch {
      console.error("[Payouts Webhook] Invalid JSON body");
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 },
      );
    }

    if (!isPayoutWebhookPayload(payload)) {
      console.error("[Payouts Webhook] Unexpected payload shape");
      return NextResponse.json(
        { error: "Invalid payload structure" },
        { status: 400 },
      );
    }

    const transactionId = payload.transaction_id.trim();
    const disbursementStatus = payload.disbursement_status;
    const statusDescription =
      typeof payload.status_description === "string"
        ? payload.status_description
        : payload.status_description != null
          ? JSON.stringify(payload.status_description)
          : "";
    const statusCode =
      typeof payload.status_code === "string" ? payload.status_code : "";
    const updatedAtStr = payload.updated_at ?? payload.created_at;
    const paymobEventAt = updatedAtStr
      ? new Date(updatedAtStr)
      : new Date();

    await dbConnect();

    const payout = await Payout.findOne({
      paymobTransactionId: transactionId,
    });

    if (!payout) {
      console.warn(
        "[Payouts Webhook] Payout not found for transaction:",
        transactionId,
      );
      return NextResponse.json({
        status: "ignored",
        message: "Payout not found",
      });
    }

    const newStatus = mapDisbursementStatusToPayoutStatus(disbursementStatus);

    const alreadyProcessed =
      payout.paymobStatus === disbursementStatus &&
      payout.paymobEventAt?.getTime() === paymobEventAt.getTime();

    if (alreadyProcessed) {
      return NextResponse.json({
        status: "already_processed",
        payoutId: payout._id.toString(),
      });
    }

    const previousStatus = payout.status;

    payout.paymobStatus = disbursementStatus;
    payout.paymobStatusDescription = statusDescription;
    payout.paymobStatusCode = statusCode;
    payout.paymobEventAt = paymobEventAt;
    payout.status = newStatus;

    payout.events = payout.events ?? [];
    payout.events.push({
      at: new Date(),
      status: newStatus,
      paymobStatus: disbursementStatus,
      paymobMessage: statusDescription,
      source: "webhook",
    });

    if (newStatus === "failed" && previousStatus !== "failed") {
      await User.updateOne(
        { _id: payout.host },
        { $inc: { walletBalanceCents: payout.amountCents } },
      );
      console.log(
        "[Payouts Webhook] Restored wallet for payout:",
        payout._id,
        "amount:",
        payout.amountCents,
      );
    }

    await payout.save();

    return NextResponse.json({
      status: "processed",
      payoutId: payout._id.toString(),
      payoutStatus: payout.status,
    });
  } catch (error) {
    console.error("[Payouts Webhook] Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Internal error",
      },
      { status: 200 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    message: "Paymob Payouts webhook endpoint is active",
  });
}
