/**
 * Payout eligibility validation
 * Validates host has sufficient balance, valid bank details, and national ID.
 */

import type { BankDetails } from "@/types";

export interface UserForEligibility {
  walletBalanceCents?: number;
  bankDetails?: BankDetails | null;
  nationalId?: string | null;
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

const MIN_PAYOUT_CENTS = 100;

/**
 * Check if a host is eligible to request a payout of the given amount.
 * Optionally pass pendingPayoutCents (sum of pending/processing payout amounts) to reserve balance.
 */
export function checkPayoutEligibility(
  user: UserForEligibility,
  amountCents: number,
  pendingPayoutCents?: number,
): EligibilityResult {
  if (amountCents < MIN_PAYOUT_CENTS) {
    return {
      eligible: false,
      reason: `Minimum payout amount is ${MIN_PAYOUT_CENTS / 100} EGP`,
    };
  }

  const balance = user.walletBalanceCents ?? 0;
  const reserved = pendingPayoutCents ?? 0;
  const available = balance - reserved;

  if (available < amountCents) {
    return {
      eligible: false,
      reason: "Insufficient available balance",
    };
  }

  const bank = user.bankDetails;
  if (!bank) {
    return { eligible: false, reason: "Bank account details not set" };
  }
  if (!bank.bankCode?.trim()) {
    return { eligible: false, reason: "Bank code is required" };
  }
  if (!bank.fullName?.trim()) {
    return { eligible: false, reason: "Account holder full name is required" };
  }
  const hasAccount = !!(bank.iban?.trim() || bank.accountNumber?.trim());
  if (!hasAccount) {
    return { eligible: false, reason: "Either IBAN or account number is required" };
  }

  if (!user.nationalId?.trim()) {
    return {
      eligible: false,
      reason: "National ID is required for payouts (Paymob requirement)",
    };
  }

  return { eligible: true };
}

export { MIN_PAYOUT_CENTS };
