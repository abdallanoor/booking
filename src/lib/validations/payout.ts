import { z } from "zod";

/**
 * Validation schema for Bank Details (Paymob Payouts)
 */
export const bankDetailsSchema = z
  .object({
    bankCode: z.string().min(1, "Bank code is required"),
    fullName: z.string().min(3, "Full name is required"),
    accountNumber: z.string().optional(),
    iban: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^EG\d{27}$/.test(val),
        "Invalid Egyptian IBAN format (EG + 27 digits)",
      ),
  })
  .refine((data) => data.accountNumber || data.iban, {
    message: "Either Account Number or IBAN is required",
    path: ["accountNumber"], // Attach error to account number field
  });

export type BankDetailsInput = z.infer<typeof bankDetailsSchema>;

/**
 * Request body for creating a payout
 */
export const createPayoutSchema = z.object({
  amountCents: z
    .number()
    .int()
    .min(100, "Minimum payout is 1 EGP (100 piasters)"),
});

export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;
