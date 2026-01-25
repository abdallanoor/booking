/**
 * Paymob API Client
 * Handles communication with Paymob's Unified Intention API
 */

import { paymobConfig, validatePaymobConfig } from "./config";
import type {
  CreateIntentionRequest,
  PaymobIntentionResponse,
  InitiatePaymentParams,
  PaymobBillingData,
} from "./types";

/**
 * Creates a payment intention with Paymob
 * This returns a client_secret that can be used for the checkout page
 */
export async function createPaymentIntention(
  params: InitiatePaymentParams,
): Promise<PaymobIntentionResponse> {
  const { valid, missing } = validatePaymobConfig();
  if (!valid) {
    throw new Error(
      `Paymob configuration incomplete. Missing: ${missing.join(", ")}`,
    );
  }

  // Split customer name into first and last name
  const nameParts = params.customerName.trim().split(" ");
  const firstName = nameParts[0] || "Guest";
  const lastName = nameParts.slice(1).join(" ") || "User";

  const billingData: PaymobBillingData = {
    first_name: firstName,
    last_name: lastName,
    email: params.customerEmail,
    phone_number: params.customerPhone || "+20000000000", // Default Egyptian phone
    country: "EG",
  };

  const requestBody: CreateIntentionRequest = {
    amount: params.amount, // Amount should already be in piasters
    currency: params.currency,
    payment_methods: [paymobConfig.integrationId],
    billing_data: billingData,
    items: [
      {
        name: params.listingTitle,
        amount: params.amount,
        description: `Booking for ${params.listingTitle}`,
        quantity: 1,
      },
    ],
    special_reference: params.bookingId, // Our booking ID for reference
    notification_url: paymobConfig.webhookUrl,
    redirection_url: `${paymobConfig.returnUrl}?bookingId=${params.bookingId}&listingId=${params.listingId}`,
    extras: {
      booking_id: params.bookingId,
    },
    ...(params.cardTokens &&
      params.cardTokens.length > 0 && {
        card_tokens: params.cardTokens,
      }),
  };

  const response = await fetch(
    `${paymobConfig.apiBaseUrl}${paymobConfig.intentionEndpoint}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${paymobConfig.secretKey}`,
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Paymob] Intention API Error:", errorText);
    throw new Error(`Failed to create payment intention: ${response.status}`);
  }

  const data = await response.json();

  // Paymob unified checkout API returns 'id' for the intention ID
  const intentionId = data.id || data.intention_id;

  if (!intentionId) {
    console.error("[Paymob] Missing id/intention_id in response:", data);
    throw new Error("Paymob API response missing intention ID");
  }

  return {
    ...data,
    intention_id: intentionId,
  } as PaymobIntentionResponse;
}

/**
 * Generates the checkout URL for a given client secret
 */
export function getCheckoutUrl(clientSecret: string): string {
  return `${paymobConfig.checkoutBaseUrl}?publicKey=${paymobConfig.publicKey}&clientSecret=${clientSecret}`;
}

/**
 * Converts an amount to piasters (smallest currency unit)
 * 1 EGP = 100 piasters
 */
export function toPiasters(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Converts piasters to EGP
 */
export function fromPiasters(piasters: number): number {
  return piasters / 100;
}

/**
 * Authenticates with Paymob to get an auth token
 * Required for refund operations
 */
export async function authenticate(): Promise<string> {
  const { valid, missing } = validatePaymobConfig();
  if (!valid) {
    throw new Error(`Paymob config missing: ${missing.join(", ")}`);
  }

  const response = await fetch("https://accept.paymob.com/api/auth/tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: paymobConfig.apiKey }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Paymob] Auth Failed:", error);
    throw new Error("Failed to authenticate with Paymob");
  }

  const data = await response.json();
  return data.token;
}

/**
 * Refunds a transaction
 */
export async function refundTransaction(
  transactionId: string,
  amountCents: number,
): Promise<void> {
  const authToken = await authenticate();

  const response = await fetch(
    "https://accept.paymob.com/api/acceptance/void_refund/refund",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authToken,
        transaction_id: transactionId,
        amount_cents: amountCents,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[Paymob] Refund Failed:", error);
    throw new Error(`Refund failed: ${error}`);
  }

  const data = await response.json();

  if (data.success === false) {
    throw new Error("Paymob returned success: false for refund");
  }
}
