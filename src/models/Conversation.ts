import mongoose, { Model, Schema } from "mongoose";
import { IConversationDocument } from "@/types";

const conversationSchema = new Schema<IConversationDocument>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ booking: 1 });

const Conversation: Model<IConversationDocument> =
  mongoose.models.Conversation ||
  mongoose.model<IConversationDocument>("Conversation", conversationSchema);

export default Conversation;
