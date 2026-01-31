/**
 * Payouts service
 * Aggregates pending/processing payout amounts for eligibility.
 */

import dbConnect from "@/lib/mongodb";
import Payout from "@/models/Payout";
import type { Types } from "mongoose";

export async function getPendingPayoutCentsForHost(
  hostId: Types.ObjectId,
): Promise<number> {
  await dbConnect();
  const result = await Payout.aggregate<{ total: number }>([
    {
      $match: {
        host: hostId,
        status: { $in: ["pending", "processing"] },
      },
    },
    { $group: { _id: null, total: { $sum: "$amountCents" } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
}
