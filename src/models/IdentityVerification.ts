import mongoose, { Model, Schema } from "mongoose";
import { IIdentityVerificationDocument } from "@/types";

const identityVerificationSchema = new Schema<IIdentityVerificationDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["national_id", "passport"],
      required: true,
    },
    idNumber: {
      type: String,
      required: [true, "ID number is required"],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Document image is required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one pending request per user
identityVerificationSchema.index(
  { user: 1, status: 1 },
  { background: true }
);

const IdentityVerification: Model<IIdentityVerificationDocument> =
  mongoose.models.IdentityVerification ||
  mongoose.model<IIdentityVerificationDocument>(
    "IdentityVerification",
    identityVerificationSchema
  );

export default IdentityVerification;
