"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Check, X, Trash2, Loader2, MapPin, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateListingStatusAction, deleteListingAction } from "@/actions";
import type { Listing } from "@/types";
import Link from "next/link";

export default function AdminListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchListings = async () => {
    try {
      const response = await fetch("/api/listings?dashboard=true&view=admin");
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

  const handleAction = async (
    id: string,
    action: "approve" | "reject" | "delete"
  ) => {
    setProcessingId(id);
    try {
      if (action === "delete") {
        if (!confirm("Are you sure you want to delete this listing?")) {
          setProcessingId(null);
          return;
        }
        await deleteListingAction(id);
        setListings((prev) => prev.filter((p) => p._id !== id));
        toast.success("Listing deleted");
      } else {
        const status = action === "approve" ? "approved" : "rejected";
        await updateListingStatusAction(id, status);

        // Update local state
        setListings((prev) =>
          prev.map((p) => (p._id === id ? { ...p, status } : p))
        );
        toast.success(`Listing ${status}`);
      }
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredListings = listings.filter(
    (p) => (p.status || "pending") === activeTab
  );

  const counts = {
    pending: listings.filter((p) => (p.status || "pending") === "pending")
      .length,
    approved: listings.filter((p) => p.status === "approved").length,
    rejected: listings.filter((p) => p.status === "rejected").length,
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
            Listings Management
          </h2>
          <p className="text-muted-foreground">
            Review and manage all listings on the platform
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({counts.rejected})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredListings.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/10">
                <p className="text-muted-foreground">
                  No {activeTab} listings found.
                </p>
              </div>
            ) : (
              filteredListings.map((listing) => (
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
                              {listing.location.city},{" "}
                              {listing.location.country}
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
                            <p className="text-sm">
                              <span className="font-semibold">Host:</span>{" "}
                              {listing.host?.name || "Unknown"}
                            </p>
                            <p className="text-lg font-bold">
                              ${listing.pricePerNight}/night
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/listings/${listing._id}`}
                              target="_blank"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                              >
                                <Eye /> View
                              </Button>
                            </Link>

                            {listing.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleAction(listing._id, "approve")
                                  }
                                  disabled={processingId === listing._id}
                                  className="rounded-full"
                                >
                                  <Check /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleAction(listing._id, "reject")
                                  }
                                  disabled={processingId === listing._id}
                                  className="rounded-full"
                                >
                                  <X /> Reject
                                </Button>
                              </>
                            )}

                            <Button
                              size="icon"
                              variant="outline"
                              className="text-red-500 hover:text-red-600 rounded-full"
                              onClick={() =>
                                handleAction(listing._id, "delete")
                              }
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
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
