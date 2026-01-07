import mongoose, { Model, Schema } from "mongoose";
import { IWishlistDocument } from "@/types";

const wishlistSchema = new Schema<IWishlistDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate wishlist entries
wishlistSchema.index({ user: 1, listing: 1 }, { unique: true });

const Wishlist: Model<IWishlistDocument> =
  mongoose.models.Wishlist ||
  mongoose.model<IWishlistDocument>("Wishlist", wishlistSchema);

export default Wishlist;
