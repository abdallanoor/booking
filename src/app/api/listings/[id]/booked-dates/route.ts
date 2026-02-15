import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import CalendarDate from "@/models/CalendarDate";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Fetch confirmed bookings for this listing
    const bookings = await Booking.find({
      listing: id,
      status: "confirmed",
    }).select("checkIn checkOut");

    // Fetch blocked calendar dates for this listing
    const blockedDates = await CalendarDate.find({
      listing: id,
      isBlocked: true,
    }).select("date");

    // Format the booked dates from bookings
    const bookedFromBookings = bookings.map((booking) => ({
      from: booking.checkIn,
      to: booking.checkOut,
      type: "booking" as const,
    }));

    // Format the blocked dates
    // CalendarDate represents a single blocked night. 
    // For the frontend logic (day >= start && day < end), we represent a single night as [date, date+1]
    const bookedFromBlocked = blockedDates.map((blocked) => {
      const start = new Date(blocked.date);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      
      return {
        from: start,
        to: end,
        type: "blocked" as const,
      };
    });

    // Merge both sources
    const bookedDates = [...bookedFromBookings, ...bookedFromBlocked];

    return successResponse({ bookedDates });
  } catch (error) {
    console.error("Get booked dates error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch booked dates";
    return errorResponse(message, 500);
  }
}
