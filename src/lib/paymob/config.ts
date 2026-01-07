/**
 * Paymob Configuration
 * Centralized configuration for Paymob payment gateway
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const paymobConfig = {
  // API Credentials
  secretKey: process.env.PAYMOB_SECRET_KEY || "", // For Intention API (Flash)
  apiKey: process.env.PAYMOB_API_KEY || "", // For Classic API (Refunds)
  publicKey: process.env.PAYMOB_PUBLIC_KEY || "",
  hmacSecret: process.env.PAYMOB_HMAC_SECRET || "",

  // Integration ID for card payments
  integrationId: parseInt(process.env.PAYMOB_INTEGRATION_ID || "0"),

  // API Endpoints
  apiBaseUrl: "https://accept.paymob.com/v1",
  intentionEndpoint: "/intention/",

  // Callback URLs
  webhookUrl: `${APP_URL}/api/payments/webhook`,
  returnUrl: `${APP_URL}/bookings/payment-result`,

  // Checkout URL template
  checkoutBaseUrl: "https://accept.paymob.com/unifiedcheckout/",

  // Currency settings
  defaultCurrency: "EGP",
} as const;

/**
 * Validates that all required Paymob configuration is present
 */
export function validatePaymobConfig(): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!paymobConfig.secretKey) missing.push("PAYMOB_SECRET_KEY");
  if (!paymobConfig.apiKey) missing.push("PAYMOB_API_KEY");
  if (!paymobConfig.publicKey) missing.push("PAYMOB_PUBLIC_KEY");
  if (!paymobConfig.hmacSecret) missing.push("PAYMOB_HMAC_SECRET");
  if (!paymobConfig.integrationId) missing.push("PAYMOB_INTEGRATION_ID");

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Logs a warning if Paymob configuration is incomplete
 */
export function checkPaymobConfig(): void {
  const { valid, missing } = validatePaymobConfig();
  if (!valid) {
    console.warn(
      `[Paymob] Missing configuration: ${missing.join(
        ", "
      )}. Payment features will not work.`
    );
  }
}
