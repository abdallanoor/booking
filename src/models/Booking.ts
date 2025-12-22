import mongoose, { Document, Model, Schema, HydratedDocument } from "mongoose";

export interface IBooking {
  listing: mongoose.Types.ObjectId;
  guest: mongoose.Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled";
}

export interface IBookingDocument extends IBooking, Document {
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBookingDocument>(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    guest: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    checkIn: {
      type: Date,
      required: [true, "Check-in date is required"],
    },
    checkOut: {
      type: Date,
      required: [true, "Check-out date is required"],
      validate: {
        validator: function (value: Date): boolean {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return value > (this as any).checkIn;
        },
        message: "Check-out date must be after check-in date",
      },
    },
    guests: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: 1,
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for availability queries
bookingSchema.index({ listing: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ guest: 1 });
bookingSchema.index({ status: 1 });

// Prevent double bookings - check for overlapping dates
bookingSchema.pre("save", async function () {
  const booking = this as HydratedDocument<IBookingDocument>;

  // Skip validation if booking is cancelled
  if (booking.status === "cancelled") {
    return;
  }

  const overlappingBooking = await mongoose.models.Booking.findOne({
    listing: booking.listing,
    _id: { $ne: booking._id },
    status: { $ne: "cancelled" },
    $or: [
      {
        checkIn: { $lte: booking.checkOut },
        checkOut: { $gte: booking.checkIn },
      },
    ],
  });

  if (overlappingBooking) {
    throw new Error("Listing is already booked for the selected dates");
  }
});

const Booking: Model<IBookingDocument> =
  mongoose.models.Booking ||
  mongoose.model<IBookingDocument>("Booking", bookingSchema);

export default Booking;
