"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Check,
  X,
  Trash2,
  Loader2,
  Edit,
  MapPin,
  HousePlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateListingStatusAction, deleteListingAction } from "@/actions";
import type { Listing } from "@/types";

interface ListingsListProps {
  initialListings: Listing[];
  userRole: "Admin" | "Host";
}

export function ListingsList({ initialListings, userRole }: ListingsListProps) {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [activeTab, setActiveTab] = useState("pending"); // Default for Admin
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isAdmin = userRole === "Admin";

  const handleAction = async (
    id: string,
    action: "approve" | "reject" | "delete"
  ) => {
    setProcessingId(id);
    try {
      if (action === "delete") {
        if (!confirm("Are you sure you want to delete this listing?")) return;
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

  const filteredListings = isAdmin
    ? listings.filter((p) => p.status === activeTab)
    : listings; // Host sees all

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Listings</h2>
        {!isAdmin && (
          <Link href="/dashboard/listings/new">
            <Button className="rounded-full">
              <HousePlus /> Add Listing
            </Button>
          </Link>
        )}
      </div>

      {isAdmin ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <ListingGrid
              listings={filteredListings}
              isAdmin={isAdmin}
              processingId={processingId}
              onAction={handleAction}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <ListingGrid
          listings={listings}
          isAdmin={isAdmin}
          processingId={processingId}
          onAction={handleAction}
        />
      )}
    </div>
  );
}

function ListingGrid({
  listings,
  isAdmin,
  processingId,
  onAction,
}: {
  listings: Listing[];
  isAdmin: boolean;
  processingId: string | null;
  onAction: (id: string, action: "approve" | "reject" | "delete") => void;
}) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">No listings found.</p>
      </div>
    );
  }

  return (
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
                    <h3 className="text-xl font-semibold">{listing.title}</h3>
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
                    <p className="text-sm">
                      <span className="font-semibold">Host:</span>{" "}
                      {listing.host?.name || "Unknown"}
                    </p>
                    <p className="text-lg font-bold">
                      ${listing.pricePerNight}/night
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Admin Actions */}
                    {isAdmin && listing.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => onAction(listing._id, "approve")}
                          disabled={processingId === listing._id}
                          className="rounded-full"
                        >
                          <Check /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onAction(listing._id, "reject")}
                          disabled={processingId === listing._id}
                          className="rounded-full"
                        >
                          <X /> Reject
                        </Button>
                      </>
                    )}

                    {/* Common Actions */}
                    {!isAdmin && (
                      <Link href={`/dashboard/listings/${listing._id}/edit`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                        >
                          <Edit /> Edit
                        </Button>
                      </Link>
                    )}

                    <Button
                      size="icon"
                      variant="outline"
                      className="text-red-500 hover:text-red-600 rounded-full"
                      onClick={() => onAction(listing._id, "delete")}
                      disabled={processingId === listing._id}
                    >
                      {processingId === listing._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
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
  );
}
