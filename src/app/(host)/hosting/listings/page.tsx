"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Trash2, Loader2, Edit, MapPin, HousePlus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { deleteListingAction } from "@/actions";
import type { Listing } from "@/types";

export default function HostingListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchListings = async () => {
    try {
      const response = await fetch("/api/listings?dashboard=true");
      const result = await response.json();
      if (result.success) {
        setListings(result.data.listings);
      } else {
        throw new Error(result.message);
      }
    } catch {
      toast.error("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    setProcessingId(id);
    try {
      await deleteListingAction(id);
      setListings((prev) => prev.filter((p) => p._id !== id));
      toast.success("Listing deleted");
      router.refresh();
    } catch {
      toast.error("Delete failed");
    } finally {
      setProcessingId(null);
    }
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
                  <div className="relative w-full sm:w-48 h-32 shrink-0">
                    <Image
                      src={listing.images[0] || "/placeholder.jpg"}
                      alt={listing.title}
                      fill
                      className="object-cover rounded-lg"
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

                    <div className="flex items-center justify-between mt-4">
                      <div className="space-y-1">
                        <p className="text-lg font-bold">
                          ${listing.pricePerNight}/night
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {listing.maxGuests} guests · {listing.bedrooms}{" "}
                          bedrooms
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
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
                          className="text-red-500 hover:text-red-600 rounded-full"
                          onClick={() => handleDelete(listing._id)}
                          disabled={processingId === listing._id}
                        >
                          {processingId === listing._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
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
