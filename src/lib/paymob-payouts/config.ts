/**
 * Paymob Payouts Configuration
 * Separate from accept.paymob.com (Intention API) - uses payouts.paymobsolutions.com
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const paymobPayoutsConfig = {
  baseUrl:
    process.env.PAYMOB_PAYOUTS_BASE_URL ||
    "https://payouts.paymobsolutions.com/api/secure",
  clientId: process.env.PAYMOB_PAYOUTS_CLIENT_ID || "",
  clientSecret: process.env.PAYMOB_PAYOUTS_CLIENT_SECRET || "",
  username: process.env.PAYMOB_PAYOUTS_USERNAME || "",
  password: process.env.PAYMOB_PAYOUTS_PASSWORD || "",
  webhookSecret: process.env.PAYMOB_PAYOUTS_WEBHOOK_SECRET || "",
  webhookUrl: `${APP_URL}/api/payouts/webhook`,
  /** Token refresh buffer in ms - refresh when less than this remains (e.g. 10 min) */
  tokenRefreshBufferMs: 10 * 60 * 1000,
} as const;

export function validatePaymobPayoutsConfig(): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (!paymobPayoutsConfig.clientId) missing.push("PAYMOB_PAYOUTS_CLIENT_ID");
  if (!paymobPayoutsConfig.clientSecret)
    missing.push("PAYMOB_PAYOUTS_CLIENT_SECRET");
  if (!paymobPayoutsConfig.username) missing.push("PAYMOB_PAYOUTS_USERNAME");
  if (!paymobPayoutsConfig.password) missing.push("PAYMOB_PAYOUTS_PASSWORD");
  return {
    valid: missing.length === 0,
    missing,
  };
}
