import mongoose, { Model, Schema } from "mongoose";
import { IBlockedDateDocument } from "@/types";

const blockedDateSchema = new Schema<IBlockedDateDocument>(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (value: Date): boolean {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return value >= (this as any).startDate;
        },
        message: "End date must be on or after start date",
      },
    },
    reason: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient queries
blockedDateSchema.index({ listing: 1, startDate: 1, endDate: 1 });
blockedDateSchema.index({ listing: 1 });

const BlockedDate: Model<IBlockedDateDocument> =
  mongoose.models.BlockedDate ||
  mongoose.model<IBlockedDateDocument>("BlockedDate", blockedDateSchema);

export default BlockedDate;
