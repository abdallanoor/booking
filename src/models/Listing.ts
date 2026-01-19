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
      streetAddress: {
        type: String,
        required: [true, "Street address is required"],
      },
      apt: {
        type: String,
      },
      city: {
        type: String,
        required: [true, "City is required"],
      },
      governorate: {
        type: String,
      },
      country: {
        type: String,
        required: [true, "Country is required"],
      },
      postalCode: {
        type: String,
      },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      geometry: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude] - MongoDB order
        },
      },
      placeId: {
        type: String,
      },
      formattedAddress: {
        type: String,
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
    policies: {
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
  },
);

// Indexes
listingSchema.index({ "location.city": 1 });
listingSchema.index({ "location.country": 1 });
listingSchema.index({ pricePerNight: 1 });
listingSchema.index({ host: 1 });
listingSchema.index({ "location.geometry": "2dsphere" });

// Pre-save hook to sync geometry from coordinates
listingSchema.pre("save", async function () {
  const doc = this as IListingDocument;
  if (doc.location?.coordinates?.lat && doc.location?.coordinates?.lng) {
    doc.location.geometry = {
      type: "Point",
      coordinates: [doc.location.coordinates.lng, doc.location.coordinates.lat],
    };
  }
});

const Listing: Model<IListingDocument> =
  mongoose.models.Listing ||
  mongoose.model<IListingDocument>("Listing", listingSchema);

export default Listing;
