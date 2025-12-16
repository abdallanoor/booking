import mongoose, { Document, Model, Schema } from "mongoose";

export interface IProperty extends Document {
  title: string;
  description: string;
  propertyType: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  amenities: string[];
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  rooms: number;
  privacyType: "entire_place" | "private_room" | "shared_room";
  status: "pending" | "approved" | "rejected";
  host: mongoose.Types.ObjectId;
  createdAt: Date;
}

const propertySchema = new Schema<IProperty>(
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
    propertyType: {
      type: String,
      required: [true, "Property type is required"],
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
propertySchema.index({ "location.city": 1 });
propertySchema.index({ "location.country": 1 });
propertySchema.index({ pricePerNight: 1 });
propertySchema.index({ host: 1 });

const Property: Model<IProperty> =
  mongoose.models.Property ||
  mongoose.model<IProperty>("Property", propertySchema);

export default Property;
