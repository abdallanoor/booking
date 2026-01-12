"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Calendar, Ban, MapPin, Loader2, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cancelBookingAction } from "@/actions";
import type { Booking } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings?view=admin");
      const result = await response.json();
      if (result.success) {
        setBookings(result.data.bookings);
      } else {
        throw new Error(result.message);
      }
    } catch {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setProcessingId(id);
    try {
      await cancelBookingAction(id);
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b))
      );
      toast.success("Booking cancelled");
    } catch {
      toast.error("Failed to cancel booking");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesTab = activeTab === "all" || booking.status === activeTab;
    const matchesSearch =
      (booking.guest?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.listing?.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const counts = {
    all: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    pending_payment: bookings.filter((b) => b.status === "pending_payment")
      .length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Bookings Management
          </h2>
          <p className="text-muted-foreground">
            View and manage all bookings across the platform
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by guest or listing..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed ({counts.confirmed})
          </TabsTrigger>
          <TabsTrigger value="pending_payment">
            Pending Payment ({counts.pending_payment})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({counts.cancelled})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/10">
                <p className="text-muted-foreground">No bookings found.</p>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <Card key={booking._id}>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-6">
                      {/* Left: Listing Image */}
                      <div className="relative w-full sm:w-48 h-32 shrink-0">
                        <Image
                          src={booking.listing?.images?.[0]}
                          alt={booking.listing?.title || "Listing"}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>

                      {/* Right: Content */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="text-xl font-semibold">
                              {booking.listing?.title || "Unknown Listing"}
                            </h3>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <MapPin className="mr-1 h-3 w-3" />
                              {booking.listing?.location?.city || "Unknown City"},{" "}
                              {booking.listing?.location?.country || "Unknown Country"}
                            </div>
                          </div>

                          <Badge
                            variant={
                              booking.status === "confirmed"
                                ? "default"
                                : booking.status === "cancelled"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="capitalize"
                          >
                            {booking.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={booking.guest?.avatar} />
                              <AvatarFallback>
                                {booking.guest?.name?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-xs">Guest</p>
                              <p className="font-semibold">
                                {booking.guest?.name || "Unknown Guest"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-xs">Stay Dates</p>
                              <p className="font-semibold">
                                {formatDate(booking.checkIn, "short")} -{" "}
                                {formatDate(booking.checkOut, "short")}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="space-y-1">
                            <p className="text-xl font-bold">
                              {formatCurrency(booking.totalPrice)}
                            </p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                              Total Price
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {booking.listing && (
                              <Link
                                href={`/listings/${booking.listing._id}`}
                                target="_blank"
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full"
                                >
                                  <Eye />
                                  View
                                </Button>
                              </Link>
                            )}

                            {booking.status !== "cancelled" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancel(booking._id)}
                                disabled={processingId === booking._id}
                                className="rounded-full"
                              >
                                {processingId === booking._id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Ban />
                                )}
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
