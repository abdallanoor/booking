import mongoose, { Model, Schema } from "mongoose";
import { IReviewDocument } from "@/types";

const reviewSchema = new Schema<IReviewDocument>(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },
    guest: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at most 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for listing reviews
reviewSchema.index({ listing: 1, createdAt: -1 });

// Unique compound index: one review per user per listing
reviewSchema.index({ listing: 1, guest: 1 }, { unique: true });

// Prevent Mongoose overwrite warning in development
if (process.env.NODE_ENV === "development") {
  if (mongoose.models.Review) {
    delete mongoose.models.Review;
  }
}

const Review: Model<IReviewDocument> =
  mongoose.models.Review ||
  mongoose.model<IReviewDocument>("Review", reviewSchema);

export default Review;
