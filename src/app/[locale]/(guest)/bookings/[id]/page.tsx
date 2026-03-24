import { notFound } from "next/navigation";
import { getBooking } from "@/services/bookings.service";
import { BookingDetailsView } from "./BookingDetailsView";
import { getServerUser } from "@/lib/auth/server-auth";
import { getLocale } from "next-intl/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailsPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Get current user
  const user = await getServerUser();

  // 2. If not logged in, return null
  if (!user) {
    return null;
  }

  let booking;

  try {
    const locale = await getLocale();
    booking = await getBooking(id, locale);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      notFound();
    }
    throw error;
  }

  if (!booking) {
    notFound();
  }

  // 3. Check ownership
  // We compare the strings. user._id is string, booking.guest._id is string.
  if (booking.guest._id !== user._id) {
    notFound();
  }

  return (
    <main className="container py-8">
      <BookingDetailsView booking={booking} />
    </main>
  );
}
