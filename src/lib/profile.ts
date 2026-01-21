import type { UserBase } from "@/types";

export function calculateProfileScore(user: UserBase): number {
  let score = 0;
  if (user.name) score += 20;
  if (user.emailVerified) score += 20;
  if (user.phoneNumber) score += 20;
  if (user.country) score += 20;

  const isHostOrAdmin = user.role === "Host" || user.role === "Admin";

  if (isHostOrAdmin) {
    if (user.nationalId) score += 20;
  } else {
    if (user.nationalId) score += 20;
  }

  return Math.min(score, 100);
}
