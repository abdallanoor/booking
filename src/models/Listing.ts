import mongoose, { Model, Schema } from "mongoose";
import { IListingDocument } from "@/types";

const listingSchema = new Schema<IListingDocument>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    listingType: {
      type: String,
      required: [true, "Listing type is required"],
    },
    location: {
      address: {
        type: String,
        required: [true, "Address is required"],
      },
      city: {
        type: String,
        required: [true, "City is required"],
      },
      country: {
        type: String,
        required: [true, "Country is required"],
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    images: {
      type: [String],
      required: [true, "At least one image is required"],
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: "At least one image is required",
      },
    },
    amenities: {
      type: [String],
      default: [],
    },
    pricePerNight: {
      type: Number,
      required: [true, "Price per night is required"],
      min: 0,
    },
    maxGuests: {
      type: Number,
      required: [true, "Maximum guests is required"],
      min: 1,
    },
    bedrooms: {
      type: Number,
      required: [true, "Number of bedrooms is required"],
      min: 0,
    },
    beds: {
      type: Number,
      required: [true, "Number of beds is required"],
      min: 1,
    },
    bathrooms: {
      type: Number,
      required: [true, "Number of bathrooms is required"],
      min: 0.5,
    },
    rooms: {
      type: Number,
      required: [true, "Number of rooms is required"],
      min: 1,
    },
    privacyType: {
      type: String,
      required: [true, "Privacy type is required"],
      enum: {
        values: ["entire_place", "private_room", "shared_room"],
        message:
          "Privacy type must be entire_place, private_room, or shared_room",
      },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
listingSchema.index({ "location.city": 1 });
listingSchema.index({ "location.country": 1 });
listingSchema.index({ pricePerNight: 1 });
listingSchema.index({ host: 1 });

const Listing: Model<IListingDocument> =
  mongoose.models.Listing ||
  mongoose.model<IListingDocument>("Listing", listingSchema);

export default Listing;
