"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Trash2,
  Loader2,
  Edit,
  MapPin,
  HousePlus,
  Eye,
  MessageCircleQuestion,
  CalendarOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { deleteListing } from "@/services/listings.service";
import type { Listing } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface ListingsClientProps {
  initialListings: Listing[];
}

export default function ListingsClient({
  initialListings,
}: ListingsClientProps) {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    setProcessingId(id);
    try {
      await deleteListing(id);
      setListings((prev) => prev.filter((p) => p._id !== id));
      toast.success("Listing deleted");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Listings</h2>
          <p className="text-muted-foreground">Manage your property listings</p>
        </div>
        <Link href="/hosting/listings/new">
          <Button className="rounded-full">
            <HousePlus /> Add Listing
          </Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/10">
          <p className="text-muted-foreground mb-4">
            You don&apos;t have any listings yet.
          </p>
          <Link href="/hosting/listings/new">
            <Button>Create your first listing</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Card key={listing._id}>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="relative w-full sm:w-48 h-40 sm:h-32 shrink-0">
                    <Image
                      src={listing.images[0] || "/placeholder.jpg"}
                      alt={listing.title}
                      fill
                      className="object-cover rounded-2xl"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {listing.title}
                        </h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="mr-1 h-3 w-3" />
                          {listing.location.city}, {listing.location.country}
                        </div>
                      </div>
                      <Badge
                        variant={
                          listing.status === "approved"
                            ? "default"
                            : listing.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {listing.status || "pending"}
                      </Badge>
                    </div>

                    <div className="flex items-start gap-4 justify-between flex-wrap mt-4">
                      <div className="space-y-1">
                        <p className="text-lg font-bold">
                          {formatCurrency(listing.pricePerNight)}/night
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {listing.maxGuests} guests · {listing.bedrooms}{" "}
                          bedrooms
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {/* View Listing */}
                        <Link href={`/listings/${listing._id}`} target="_blank">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                          >
                            <Eye /> View
                          </Button>
                        </Link>

                        {/* Questions */}
                        <Link
                          href={`/hosting/listings/${listing._id}/questions`}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                          >
                            <MessageCircleQuestion /> Q&A
                          </Button>
                        </Link>

                        {/* Calendar */}
                        <Link
                          href={`/hosting/listings/${listing._id}/calendar`}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                          >
                            <CalendarOff /> Calendar
                          </Button>
                        </Link>

                        {/* Edit */}
                        <Link href={`/hosting/listings/${listing._id}/edit`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                          >
                            <Edit /> Edit
                          </Button>
                        </Link>

                        {/* Delete */}
                        <Button
                          size="icon"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => handleDelete(listing._id)}
                          disabled={processingId === listing._id}
                        >
                          {processingId === listing._id ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Trash2 />
                          )}
                        </Button>
                      </div>
                    </div>
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
