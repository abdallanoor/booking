import { getBookings } from "@/services/bookings.service";
import { BookingsList } from "@/components/booking/BookingsList";
import { getTranslations } from "next-intl/server";

// Force dynamic rendering - this page requires user authentication
export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const t = await getTranslations("bookings");
  const bookings = await getBookings();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>
      <BookingsList bookings={bookings} />
    </main>
  );
}
