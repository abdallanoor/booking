import { getAllBookingsAction } from "@/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import { Booking } from "@/types";
import { RecentBookings } from "@/components/dashboard/RecentBookings";
import { LogInIcon, LogOutIcon, HomeIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function TodayPage() {
  const result = await getAllBookingsAction();
  const bookings = result.data.bookings || [];

  const today = new Date();

  // Categorize bookings
  const checkingIn = bookings.filter(
    (b) => b.status === "confirmed" && isSameDay(new Date(b.checkIn), today)
  );

  const checkingOut = bookings.filter(
    (b) => b.status === "confirmed" && isSameDay(new Date(b.checkOut), today)
  );

  const currentlyHosting = bookings.filter((b) => {
    const checkIn = new Date(b.checkIn);

    // Started before today AND ends after today (or is today but not checked out yet? logic simplifiction)
    // Actually simpler:
    // Is active if: checkIn < today AND checkOut >= today
    // Excluding those checking in today (already in checkingIn)
    // Excluding those checking out today (already in checkingOut)

    return (
      b.status === "confirmed" &&
      isBefore(startOfDay(checkIn), startOfDay(today)) &&
      isAfter(new Date(b.checkOut), today)
    ); // Ends in future
  });

  // Also include those checking out today in "currently hosting" until they leave?
  // Airbnb separates them. Checking In, Checking Out, Currently Hosting (staying through).
  // "Currently hosting" usually means guests who are already here and not leaving today.

  // Upcoming: Starts after today
  const upcoming = bookings
    .filter(
      (b) =>
        b.status === "confirmed" &&
        isAfter(startOfDay(new Date(b.checkIn)), startOfDay(today))
    )
    .sort(
      (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Today</h2>
        <p className="text-muted-foreground">
          Manage your daily tasks and view upcoming reservations.
        </p>
      </div>

      <Tabs defaultValue="today" className="space-y-6">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <ActivityCard
              title="Checking In"
              count={checkingIn.length}
              icon={<LogInIcon className="h-4 w-4" />}
              bookings={checkingIn}
              type="check-in"
            />
            <ActivityCard
              title="Checking Out"
              count={checkingOut.length}
              icon={<LogOutIcon className="h-4 w-4" />}
              bookings={checkingOut}
              type="check-out"
            />
            <ActivityCard
              title="Currently Hosting"
              count={currentlyHosting.length}
              icon={<HomeIcon className="h-4 w-4" />}
              bookings={currentlyHosting}
              type="staying"
            />
          </div>

          {/* Detailed lists if needed */}
          {checkingIn.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Arriving Today</h3>
              <RecentBookings bookings={checkingIn} />
            </div>
          )}

          {checkingOut.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Departing Today</h3>
              <RecentBookings bookings={checkingOut} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming">
          <RecentBookings bookings={upcoming} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActivityCard({
  title,
  count,
  icon,
  bookings,
  type,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  bookings: Booking[];
  type: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{count}</div>
        <div className="flex -space-x-2 overflow-hidden mb-2">
          {bookings.slice(0, 5).map((booking) => (
            <Avatar
              key={booking._id}
              className="inline-block h-6 w-6 ring-2 ring-background"
            >
              <AvatarImage src={booking.guest.avatar} />
              {/* Note: booking.guest.avatar might not exist in type yet, check types */}
              <AvatarFallback className="text-[10px]">
                {booking.guest.name?.[0]?.toUpperCase() || "G"}
              </AvatarFallback>
            </Avatar>
          ))}
          {bookings.length > 5 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-background bg-muted text-[10px]">
              +{bookings.length - 5}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {type === "check-in" && "Guests arriving"}
          {type === "check-out" && "Guests departing"}
          {type === "staying" && "Guests staying"}
        </p>
      </CardContent>
    </Card>
  );
}
