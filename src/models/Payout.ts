import mongoose, { Model, Schema } from "mongoose";
import { IPayoutDocument } from "@/types";

const payoutEventSchema = new Schema(
  {
    at: { type: Date, required: true, default: Date.now },
    status: { type: String, required: true },
    paymobStatus: { type: String },
    paymobMessage: { type: String },
    source: { type: String, enum: ["api", "webhook"], required: true },
  },
  { _id: false }
);

const payoutSchema = new Schema<IPayoutDocument>(
  {
    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amountCents: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "EGP",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "success", "failed"],
      default: "pending",
      index: true,
    },
    paymobTransactionId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    paymobClientReference: {
      type: String,
      sparse: true,
      unique: true,
    },
    paymobStatus: { type: String },
    paymobStatusDescription: { type: String },
    paymobStatusCode: { type: String },
    paymobEventAt: { type: Date },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    events: {
      type: [payoutEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

payoutSchema.index({ host: 1, status: 1 });
payoutSchema.index({ createdAt: -1 });

const Payout: Model<IPayoutDocument> =
  mongoose.models.Payout ||
  mongoose.model<IPayoutDocument>("Payout", payoutSchema);

export default Payout;
