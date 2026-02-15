import { redirect } from "next/navigation";
import Link from "next/link";
import { getListing, getListingBookedDates } from "@/services/listings.service";
import { getServerUser } from "@/lib/auth/server-auth";
import { ListingCalendar } from "@/components/hosting/ListingCalendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getServerUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    redirect("/hosting/listings");
  }

  // Verify ownership
  if (
    listing.host._id.toString() !== user._id.toString() &&
    user.role !== "Admin"
  ) {
    redirect("/hosting/listings");
  }

  // Fetch booked dates (bookings) for showing on calendar
  const bookedDates = await getListingBookedDates(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hosting/listings">
          <Button variant="secondary" size="icon" className="rounded-full">
            <ChevronLeft />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Calendar ({listing.title})
          </h1>
        </div>
      </div>

      <ListingCalendar
        listingId={id}
        basePrice={listing.pricePerNight}
        weekendPrice={listing.weekendPrice}
        bookedDates={bookedDates}
      />
    </div>
  );
}
