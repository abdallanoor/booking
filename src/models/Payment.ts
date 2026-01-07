import mongoose, { Model, Schema } from "mongoose";
import { IPaymentDocument } from "@/types";

const paymentSchema = new Schema<IPaymentDocument>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    guest: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "EGP",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    paymobIntentionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paymobTransactionId: {
      type: String,
      sparse: true,
      index: true,
    },
    paymobOrderId: {
      type: String,
      sparse: true,
    },
    paymentMethod: {
      type: String,
      default: "card",
    },
    cardLastFour: {
      type: String,
    },
    cardBrand: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
paymentSchema.index({ booking: 1, status: 1 });
paymentSchema.index({ guest: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment: Model<IPaymentDocument> =
  mongoose.models.Payment ||
  mongoose.model<IPaymentDocument>("Payment", paymentSchema);

export default Payment;
