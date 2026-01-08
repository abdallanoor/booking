import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import { successResponse, errorResponse } from "@/lib/api-response";
import { sendReviewInvitationEmail } from "@/lib/email/nodemailer";
import { differenceInHours } from "date-fns";

/**
 * POST /api/reviews/send-notifications
 * Cron job endpoint to send review invitation emails
 * Should be called periodically (e.g., hourly or daily)
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: Add authentication/authorization for cron job
    // For example, check for a secret token in headers
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return errorResponse("Unauthorized", 401);
    }

    await dbConnect();

    const now = new Date();
    let emailsSent = 0;
    let errors = 0;

    // Find bookings where:
    // 1. Status is "confirmed"
    // 2. Checkout date + 24 hours has passed
    // 3. reviewEmailSent is false
    const bookings = await Booking.find({
      status: "confirmed",
      reviewEmailSent: false,
    })
      .populate("listing", "title")
      .populate("guest", "name email");

    for (const booking of bookings) {
      try {
        const checkoutDate = new Date(booking.checkOut);
        const hoursSinceCheckout = differenceInHours(now, checkoutDate);

        // Check if 24 hours have passed since checkout
        if (hoursSinceCheckout >= 24) {
          const listing =
            booking.listing &&
            typeof booking.listing === "object" &&
            "title" in booking.listing
              ? (booking.listing as { title: string; _id: { toString: () => string } })
              : null;

          const guest =
            booking.guest &&
            typeof booking.guest === "object" &&
            "email" in booking.guest &&
            "name" in booking.guest
              ? (booking.guest as { email: string; name: string })
              : null;

          if (listing && guest && guest.email) {
            const listingId =
              typeof booking.listing === "object" &&
              booking.listing !== null &&
              "_id" in booking.listing
                ? (booking.listing as { _id: { toString: () => string } })._id.toString()
                : null;

            if (listingId) {
              // Send review invitation email
              await sendReviewInvitationEmail(guest.email, {
                listingTitle: listing.title,
                listingId,
                guestName: guest.name,
              });

              // Mark email as sent
              booking.reviewEmailSent = true;
              await booking.save();

              emailsSent++;
            }
          }
        }
      } catch (error) {
        console.error(
          `Error sending review email for booking ${booking._id}:`,
          error
        );
        errors++;
      }
    }

    return successResponse({
      emailsSent,
      errors,
      totalProcessed: bookings.length,
      message: `Processed ${bookings.length} bookings. Sent ${emailsSent} emails.`,
    });
  } catch (error) {
    console.error("Send review notifications error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send review notifications";
    return errorResponse(message, 500);
  }
}
