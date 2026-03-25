import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Booking from "@/models/Booking";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/auth-middleware";
import Listing from "@/models/Listing";
import Message from "@/models/Message";
import { applyListingLocale } from "@/lib/listing-translation";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const acceptLang = req.headers.get("accept-language");
    await dbConnect();

    // Ensure Listing model is loaded so populate works
    Listing.init();

    const conversations = await Conversation.find({ participants: user._id })
      .populate("participants", "name avatar role")
      .populate({
        path: "booking",
        select: "checkIn checkOut status listing",
        populate: {
          path: "listing",
          select: "title images",
        },
      })
      .sort({ lastMessageAt: -1 });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: user._id },
          isRead: false,
        });
        const obj = conv.toObject();
        if (acceptLang && obj.booking && (obj.booking as any).listing) {
          const locale = acceptLang.split(",")[0].split("-")[0].trim();
          (obj.booking as any).listing = applyListingLocale((obj.booking as any).listing, locale);
        }

        return {
          ...obj,
          unreadCount,
        };
      })
    );

    return successResponse({ conversations: conversationsWithUnread });
  } catch (error) {
    console.error("Get conversations error:", error);
    const message = error instanceof Error ? error.message : "Failed to get conversations";
    const status = message === "Unauthorized" ? 401 : 500;
    return errorResponse(message, status);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const acceptLang = req.headers.get("accept-language");
    await dbConnect();

    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return errorResponse("Booking ID is required", 400);
    }

    const booking = await Booking.findById(bookingId).populate("listing");

    if (!booking) {
      return errorResponse("Booking not found", 404);
    }

    // Check if user is either the guest or the host of this booking
    const isGuest = booking.guest.toString() === user._id.toString();
    const isHost = (booking.listing as any).host.toString() === user._id.toString();

    if (!isGuest && !isHost) {
      return errorResponse("You are not authorized to create a conversation for this booking", 403);
    }

    if (booking.status !== "confirmed") {
      return errorResponse("Chat is only allowed for confirmed bookings", 403);
    }

    const guestId = booking.guest;
    const hostId = (booking.listing as any).host;

    // Check if a conversation between these two users already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [guestId, hostId], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [guestId, hostId],
        booking: bookingId,
      });
    } else if (conversation.booking.toString() !== bookingId.toString()) {
      // Update the conversation's booking context to the current booking
      conversation.booking = bookingId;
      await conversation.save();
    }

    await conversation.populate("participants", "name avatar role");
    await conversation.populate({
      path: "booking",
      select: "checkIn checkOut status listing",
      populate: { path: "listing", select: "title images" }
    });

    const obj = conversation.toObject();
    if (acceptLang && obj.booking && (obj.booking as any).listing) {
      const locale = acceptLang.split(",")[0].split("-")[0].trim();
      (obj.booking as any).listing = applyListingLocale((obj.booking as any).listing, locale);
    }

    return successResponse({ conversation: obj }, "Conversation retrieved", 200);
  } catch (error) {
    console.error("Create conversation error:", error);
    const message = error instanceof Error ? error.message : "Failed to create conversation";
    return errorResponse(message, 500);
  }
}
