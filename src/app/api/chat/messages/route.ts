import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/auth-middleware";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await dbConnect();

    const body = await req.json();
    const { conversationId, content } = body;

    if (!conversationId || !content) {
      return errorResponse("Conversation ID and content are required", 400);
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return errorResponse("Conversation not found", 404);
    }

    if (!conversation.participants.includes(user._id)) {
      return errorResponse("You are not authorized to send messages in this conversation", 403);
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: user._id,
      content,
    });

    // Update conversation lastMessageAt
    conversation.lastMessageAt = new Date();
    await conversation.save();

    await message.populate("sender", "name avatar");

    return successResponse({ message }, "Message sent", 201);
  } catch (error) {
    console.error("Send message error:", error);
    const message = error instanceof Error ? error.message : "Failed to send message";
    return errorResponse(message, 500);
  }
}
