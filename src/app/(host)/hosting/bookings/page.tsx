import { redirect } from "next/navigation";
import { apiGet } from "@/lib/api";
import { getServerUser } from "@/lib/auth/server-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Booking } from "@/types";

export default async function HostingBookingsPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch bookings (Unified API handles role-based filtering)
  const response = await apiGet<{ data: { bookings: Booking[] } }>(
    "/bookings?view=host"
  );
  const bookings = response.data.bookings;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Bookings</h2>
        <p className="text-muted-foreground">Manage your bookings.</p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="text-center">
            <p className="text-muted-foreground">No bookings found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking._id}>
              <CardContent>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {booking.listing?.title || "Unknown Listing"}
                      </h3>
                      <Badge
                        variant={
                          booking.status === "confirmed"
                            ? "default"
                            : booking.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Guest: {booking.guest?.name} ({booking.guest?.email})
                    </p>
                    <p className="text-sm">
                      {new Date(booking.checkIn).toLocaleDateString()} -{" "}
                      {new Date(booking.checkOut).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold">${booking.totalPrice}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.guests} guests
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
