/**
 * Paymob Webhook Handler
 * HMAC verification and webhook payload parsing
 */

import crypto from "crypto";
import { paymobConfig } from "./config";
import type {
  PaymobWebhookPayload,
  PaymobTransactionData,
  PaymobTokenWebhookData, // Added
  ParsedPaymentResult,
} from "./types";

/**
 * Fields used for HMAC calculation (in order)
 * These fields are concatenated and hashed to verify the webhook signature
 */
const HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
] as const;

/**
 * Gets a nested value from an object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}

/**
 * Builds the string to be hashed for HMAC verification
 */
function buildHmacString(transaction: PaymobTransactionData): string {
  const values: string[] = [];

  for (const field of HMAC_FIELDS) {
    const value = getNestedValue(
      transaction as unknown as Record<string, unknown>,
      field,
    );
    // Convert to string, handling booleans and undefined
    if (value === undefined || value === null) {
      values.push("");
    } else if (typeof value === "boolean") {
      values.push(value.toString());
    } else {
      values.push(String(value));
    }
  }

  return values.join("");
}

/**
 * Verifies the HMAC signature from a Paymob webhook
 * @param transaction - The transaction object from the webhook
 * @param receivedHmac - The HMAC provided in the webhook
 * @returns boolean indicating if the signature is valid
 */
export function verifyHmacSignature(
  transaction: PaymobTransactionData,
  receivedHmac: string,
): boolean {
  if (!paymobConfig.hmacSecret) {
    console.error("[Paymob] HMAC secret not configured");
    return false;
  }

  const dataToHash = buildHmacString(transaction);

  const calculatedHmac = crypto
    .createHmac("sha512", paymobConfig.hmacSecret)
    .update(dataToHash)
    .digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculatedHmac, "hex"),
      Buffer.from(receivedHmac, "hex"),
    );
  } catch {
    // If buffers are different lengths, comparison will fail
    return false;
  }
}

/**
 * Parses the webhook payload into a structured result
 */
export function parseWebhookPayload(
  payload: PaymobWebhookPayload,
): ParsedPaymentResult {
  const transaction = payload.obj as PaymobTransactionData;

  return {
    success: transaction.success && !transaction.error_occured,
    transactionId: String(transaction.id),
    orderId: String(transaction.order.id),
    amount: transaction.amount_cents,
    currency: transaction.currency,
    paymentMethod: transaction.source_data.type,
    errorMessage: transaction.data?.message,
    specialReference: transaction.order.merchant_order_id,
    isPending: transaction.pending,
    isRefunded: transaction.is_refunded,
    isVoided: transaction.is_voided,
  };
}

/**
 * Validates that a webhook payload has the expected structure
 */
export function isValidWebhookPayload(
  payload: unknown,
): payload is PaymobWebhookPayload {
  if (!payload || typeof payload !== "object") return false;

  const p = payload as Record<string, unknown>;

  return (
    typeof p.type === "string" &&
    p.obj !== null &&
    typeof p.obj === "object" &&
    typeof (p.obj as Record<string, unknown>).id === "number"
  );
}

/**
 * Validates that a webhook payload is a token callback
 */
export function isValidTokenWebhookPayload(
  payload: unknown,
): payload is PaymobWebhookPayload & { obj: PaymobTokenWebhookData } {
  if (!payload || typeof payload !== "object") return false;

  const p = payload as Record<string, unknown>;

  return (
    p.type === "TOKEN" &&
    p.obj !== null &&
    typeof p.obj === "object" &&
    typeof (p.obj as Record<string, unknown>).token === "string"
  );
}

export interface ParsedTokenResult {
  token: string;
  last4: string;
  brand: string;
  email: string;
}

/**
 * Parses the token webhook payload
 */
export function parseTokenWebhookPayload(
  payload: PaymobWebhookPayload & { obj: PaymobTokenWebhookData },
): ParsedTokenResult {
  const { obj: tokenData } = payload;

  return {
    token: tokenData.token,
    last4: tokenData.masked_pan.slice(-4),
    brand: tokenData.card_subtype,
    email: tokenData.email,
  };
}
