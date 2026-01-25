import { redirect } from "next/navigation";
import Link from "next/link";
import { getListing, getListingBookedDates } from "@/services/listings.service";
import { getBlockedDates } from "@/services/blocked-dates.service";
import { getServerUser } from "@/lib/auth/server-auth";
import { AvailabilityCalendar } from "@/components/hosting/AvailabilityCalendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default async function AvailabilityPage({
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

  // Fetch booked dates (bookings + blocked) for calendar view
  const bookedDates = await getListingBookedDates(id);

  // Fetch specific blocked date objects for management list
  const blockedDates = await getBlockedDates(id);

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
            Manage Availability
          </h1>
          <p className="text-muted-foreground">{listing.title}</p>
        </div>
      </div>

      <AvailabilityCalendar
        listingId={id}
        bookedDates={bookedDates}
        initialBlockedDates={blockedDates}
      />
    </div>
  );
}
