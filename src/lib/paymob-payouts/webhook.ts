/**
 * Paymob Payouts webhook verification
 * Verifies webhook authenticity via shared secret or HMAC.
 */

import crypto from "crypto";
import { paymobPayoutsConfig } from "./config";

const SIGNATURE_HEADER = "x-paymob-payouts-signature";

/**
 * Verify webhook signature if PAYMOB_PAYOUTS_WEBHOOK_SECRET is set.
 * Expects header X-Paymob-Payouts-Signature to be HMAC-SHA256(rawBody, secret).
 */
export function verifyPayoutWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!paymobPayoutsConfig.webhookSecret) {
    return true; // Skip verification if not configured (dev)
  }
  if (!signatureHeader) {
    return false;
  }
  const expected = crypto
    .createHmac("sha256", paymobPayoutsConfig.webhookSecret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}

export interface PayoutWebhookPayload {
  transaction_id: string;
  disbursement_status: string;
  status_description?: string;
  status_code?: string;
  updated_at?: string;
  created_at?: string;
}

/**
 * Check if payload has minimal payout webhook shape.
 */
export function isPayoutWebhookPayload(
  payload: unknown,
): payload is PayoutWebhookPayload {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.transaction_id === "string" &&
    typeof p.disbursement_status === "string"
  );
}

/**
 * Map Paymob disbursement_status to internal Payout status.
 */
export function mapDisbursementStatusToPayoutStatus(
  disbursementStatus: string,
): "pending" | "processing" | "success" | "failed" {
  const s = disbursementStatus.toLowerCase();
  if (s === "success" || s === "successful") return "success";
  if (s === "failed") return "failed";
  if (s === "processing") return "processing";
  return "pending";
}
