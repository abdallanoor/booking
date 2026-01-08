import mongoose, { Model, Schema } from "mongoose";
import { IQuestionDocument } from "@/types";

const questionSchema = new Schema<IQuestionDocument>(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    guestId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for FAQs or if we allow anonymous questions later (though plan says logged in)
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true, // The host of the listing
    },
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
    },
    answer: {
      type: String,
      trim: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    isFAQ: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
questionSchema.index({ listingId: 1 });
questionSchema.index({ hostId: 1 });
questionSchema.index({ listingId: 1, isVisible: 1 }); // For fetching public questions

const Question: Model<IQuestionDocument> =
  mongoose.models.Question ||
  mongoose.model<IQuestionDocument>("Question", questionSchema);

export default Question;
