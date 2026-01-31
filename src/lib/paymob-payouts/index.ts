/**
 * Paymob Payouts Integration
 * Disburse to host bank accounts; separate from accept.paymob.com (guest payments).
 */

export { paymobPayoutsConfig, validatePaymobPayoutsConfig } from "./config";
export { getPaymobPayoutsAccessToken } from "./token";
export {
  createDisbursement,
  centsToEgp,
  normalizeBankCardNumber,
  type CreateDisbursementParams,
  type CreateDisbursementResult,
} from "./client";
export {
  verifyPayoutWebhookSignature,
  isPayoutWebhookPayload,
  mapDisbursementStatusToPayoutStatus,
  type PayoutWebhookPayload,
} from "./webhook";
