import { ClientLayout } from "@/components/layout/ClientLayout";
import { getBookings } from "@/services/bookings.service";
import { BookingsList } from "@/components/booking/BookingsList";
import { Card, CardContent } from "@/components/ui/card";

export default async function BookingsPage() {
  let bookings;

  try {
    bookings = await getBookings();
  } catch {
    // User not authenticated or error fetching
    return (
      <ClientLayout>
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">My Bookings</h1>
          <Card>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Please login to view your bookings
              </p>
            </CardContent>
          </Card>
        </main>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>
        <BookingsList bookings={bookings} />
      </main>
    </ClientLayout>
  );
}
