/**
 * Paymob Payouts API Client
 * Disburse (payout) to bank accounts via payouts.paymobsolutions.com
 */

import { getPaymobPayoutsAccessToken } from "./token";
import { paymobPayoutsConfig, validatePaymobPayoutsConfig } from "./config";

export interface CreateDisbursementParams {
  amountCents: number;
  currency: string;
  bankCode: string;
  bankCardNumber: string;
  fullName: string;
  nationalId: string;
  clientReference: string;
}

export interface CreateDisbursementResult {
  transactionId: string;
  disbursementStatus: string;
  statusDescription: string;
  statusCode: string;
}

/**
 * Normalize bank account number / IBAN for Paymob (remove spaces, trim).
 */
export function normalizeBankCardNumber(value: string): string {
  return value.replace(/\s/g, "").trim();
}

/**
 * Convert amount from cents/piasters to EGP (2 decimal places) for Paymob API.
 */
export function centsToEgp(amountCents: number): number {
  return Math.round(amountCents) / 100;
}

/**
 * Create a disbursement (payout) to a bank account via Paymob Payouts.
 */
export async function createDisbursement(
  params: CreateDisbursementParams,
): Promise<CreateDisbursementResult> {
  const { valid, missing } = validatePaymobPayoutsConfig();
  if (!valid) {
    throw new Error(
      `Paymob Payouts config incomplete. Missing: ${missing.join(", ")}`,
    );
  }

  const accessToken = await getPaymobPayoutsAccessToken();
  const amountEgp = centsToEgp(params.amountCents);
  const bankCardNumber = normalizeBankCardNumber(params.bankCardNumber);

  const body = {
    issuer: "bank_card",
    amount: amountEgp.toFixed(2),
    bank_card_number: bankCardNumber,
    bank_transaction_type: "cash_transfer",
    bank_code: params.bankCode.trim(),
    full_name: params.fullName.trim(),
    national_id: params.nationalId.trim(),
    client_reference: params.clientReference,
  };

  const res = await fetch(`${paymobPayoutsConfig.baseUrl}/disburse/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    transaction_id?: string;
    disbursement_status?: string;
    status_description?: string;
    status_code?: string;
  };

  if (!res.ok) {
    const desc =
      typeof data.status_description === "string"
        ? data.status_description
        : JSON.stringify(data.status_description ?? data);
    throw new Error(
      `Paymob Payouts disburse failed: ${res.status} - ${desc}`,
    );
  }

  return {
    transactionId: data.transaction_id ?? "",
    disbursementStatus: data.disbursement_status ?? "unknown",
    statusDescription:
      typeof data.status_description === "string"
        ? data.status_description
        : JSON.stringify(data.status_description ?? ""),
    statusCode: data.status_code ?? "",
  };
}
