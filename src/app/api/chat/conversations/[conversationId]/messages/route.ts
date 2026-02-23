import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/auth-middleware";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const { conversationId } = await params;

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return errorResponse("Conversation not found", 404);
    }

    if (!conversation.participants.includes(user._id)) {
      return errorResponse("You are not a participant in this conversation", 403);
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 }); // Oldest first

    // Optionally mark messages as read here if they were sent by the other participant
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: user._id }, isRead: false },
      { $set: { isRead: true } }
    );

    return successResponse({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    const message = error instanceof Error ? error.message : "Failed to get messages";
    return errorResponse(message, 500);
  }
}
