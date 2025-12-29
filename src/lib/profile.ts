export interface ProfileScoreData {
  name?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  country?: string;
  role?: string;
  nationalId?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
  };
}

export function calculateProfileScore(user: ProfileScoreData): number {
  let score = 0;
  if (user.name) score += 20;
  if (user.emailVerified) score += 20;
  if (user.phoneNumber) score += 20;
  if (user.country) score += 20;

  const isHostOrAdmin = user.role === "Host" || user.role === "Admin";

  if (isHostOrAdmin) {
    if (user.nationalId) score += 10;
    if (user.bankDetails?.bankName && user.bankDetails?.accountNumber)
      score += 10;
  } else {
    if (user.nationalId) score += 20;
  }

  return Math.min(score, 100);
}
