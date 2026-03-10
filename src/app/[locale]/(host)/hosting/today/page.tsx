"use client";

import { useEffect, useState } from "react";
import { getAllBookingsAction } from "@/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import type { Booking } from "@/types";
import { RecentBookings } from "@/components/hosting/RecentBookings";
import { LogInIcon, LogOutIcon, HomeIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "next-intl";

export default function TodayPage() {
  const t = useTranslations("hosting");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const result = await getAllBookingsAction();
        setBookings(result.data?.bookings || []);
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  const today = new Date();

  const checkingIn = bookings.filter(
    (b) => b.status === "confirmed" && isSameDay(new Date(b.checkIn), today),
  );
  const checkingOut = bookings.filter(
    (b) => b.status === "confirmed" && isSameDay(new Date(b.checkOut), today),
  );
  const currentlyHosting = bookings.filter((b) => {
    const checkIn = new Date(b.checkIn);
    return (
      b.status === "confirmed" &&
      isBefore(startOfDay(checkIn), startOfDay(today)) &&
      isAfter(new Date(b.checkOut), today)
    );
  });
  const upcoming = bookings
    .filter(
      (b) =>
        b.status === "confirmed" &&
        isAfter(startOfDay(new Date(b.checkIn)), startOfDay(today)),
    )
    .sort(
      (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime(),
    );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t("today_title")}
          </h2>
          <p className="text-muted-foreground">{t("today_desc")}</p>
        </div>

        {/* Skeleton tabs bar */}
        <div className="flex gap-1 rounded-4xl bg-muted p-1 w-fit">
          <Skeleton className="h-8 w-[60px] rounded-4xl bg-card" />
          <Skeleton className="h-8 w-[60px] rounded-4xl bg-card" />
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-5 w-[100px]" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[50px] mb-2" />
                  <div className="flex -space-x-2 overflow-hidden mb-2">
                    <Skeleton className="h-6 w-6 rounded-full border" />
                    <Skeleton className="h-6 w-6 rounded-full border" />
                    <Skeleton className="h-6 w-6 rounded-full border" />
                  </div>
                  <Skeleton className="h-3 w-[120px]" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 space-y-8">
            <div>
              <Skeleton className="h-7 w-[200px] mb-4 rounded-2xl" />
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {[...Array(5)].map((_, i) => (
                          <TableHead
                            key={i}
                            className={
                              i === 4 ? "text-end px-6" : i === 0 ? "px-6" : ""
                            }
                          >
                            <Skeleton className="h-4 w-[60px]" />
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(2)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell className="px-6">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[120px]" />
                                <Skeleton className="h-3 w-[100px]" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[140px]" />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-[90px]" />
                              <Skeleton className="h-3 w-[110px]" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[60px]" />
                          </TableCell>
                          <TableCell className="text-end px-6">
                            <Skeleton className="h-6 w-[80px] rounded-full ms-auto" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {t("today_title")}
        </h2>
        <p className="text-muted-foreground">{t("today_desc")}</p>
      </div>

      <Tabs defaultValue="today" className="space-y-6">
        <TabsList>
          <TabsTrigger value="today">{t("tab_today")}</TabsTrigger>
          <TabsTrigger value="upcoming">{t("tab_upcoming")}</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <ActivityCard
              title={t("checking_in")}
              count={checkingIn.length}
              icon={<LogInIcon className="h-4 w-4 rtl:scale-x-[-1]" />}
              bookings={checkingIn}
              description={t("guests_arriving")}
            />
            <ActivityCard
              title={t("checking_out")}
              count={checkingOut.length}
              icon={<LogOutIcon className="h-4 w-4 rtl:scale-x-[-1]" />}
              bookings={checkingOut}
              description={t("guests_departing")}
            />
            <ActivityCard
              title={t("currently_hosting")}
              count={currentlyHosting.length}
              icon={<HomeIcon className="h-4 w-4" />}
              bookings={currentlyHosting}
              description={t("guests_staying")}
            />
          </div>

          {checkingIn.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">
                {t("arriving_today")}
              </h3>
              <RecentBookings bookings={checkingIn} />
            </div>
          )}

          {checkingOut.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">
                {t("departing_today")}
              </h3>
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
  description,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  bookings: Booking[];
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{count}</div>
        <div className="flex -space-x-2 rtl:space-x-reverse overflow-hidden mb-2">
          {bookings.slice(0, 5).map((booking) => (
            <Avatar
              key={booking._id}
              className="inline-block h-6 w-6 ring-2 ring-background"
            >
              <AvatarImage src={booking.guest.avatar} />
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
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
