import mongoose, { Model, Schema } from "mongoose";
import { ICalendarDateDocument } from "@/types";

const calendarDateSchema = new Schema<ICalendarDateDocument>(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    customPrice: {
      type: Number,
      min: 0,
    },
    note: {
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

// Compound unique index to prevent duplicate dates per listing
calendarDateSchema.index({ listing: 1, date: 1 }, { unique: true });

// Index for efficient range queries
calendarDateSchema.index({ listing: 1 });

const CalendarDate: Model<ICalendarDateDocument> =
  mongoose.models.CalendarDate ||
  mongoose.model<ICalendarDateDocument>("CalendarDate", calendarDateSchema);

export default CalendarDate;
