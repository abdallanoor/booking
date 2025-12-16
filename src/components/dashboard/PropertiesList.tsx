"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Check, X, Trash2, Loader2, Plus, Edit, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updatePropertyStatusAction, deletePropertyAction } from "@/actions";
import type { Property } from "@/types";

interface PropertiesListProps {
  initialProperties: Property[];
  userRole: "Admin" | "Host";
}

export function PropertiesList({
  initialProperties,
  userRole,
}: PropertiesListProps) {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>(initialProperties);
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
        if (!confirm("Are you sure you want to delete this property?")) return;
        await deletePropertyAction(id);
        setProperties((prev) => prev.filter((p) => p._id !== id));
        toast.success("Property deleted");
      } else {
        const status = action === "approve" ? "approved" : "rejected";
        await updatePropertyStatusAction(id, status);

        // Update local state
        setProperties((prev) =>
          prev.map((p) => (p._id === id ? { ...p, status } : p))
        );
        toast.success(`Property ${status}`);
      }
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredProperties = isAdmin
    ? properties.filter((p) => p.status === activeTab)
    : properties; // Host sees all

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Properties</h2>
        {!isAdmin && (
          <Link href="/dashboard/properties/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Property
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
            <PropertyGrid
              properties={filteredProperties}
              isAdmin={isAdmin}
              processingId={processingId}
              onAction={handleAction}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <PropertyGrid
          properties={properties}
          isAdmin={isAdmin}
          processingId={processingId}
          onAction={handleAction}
        />
      )}
    </div>
  );
}

function PropertyGrid({
  properties,
  isAdmin,
  processingId,
  onAction,
}: {
  properties: Property[];
  isAdmin: boolean;
  processingId: string | null;
  onAction: (id: string, action: "approve" | "reject" | "delete") => void;
}) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">No properties found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {properties.map((property) => (
        <Card key={property._id}>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="relative w-full sm:w-48 h-32 shrink-0">
                <Image
                  src={property.images[0] || "/placeholder.jpg"}
                  alt={property.title}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{property.title}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="mr-1 h-3 w-3" />
                      {property.location.city}, {property.location.country}
                    </div>
                  </div>
                  <Badge
                    variant={
                      property.status === "approved"
                        ? "default"
                        : property.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {property.status || "pending"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-semibold">Host:</span>{" "}
                      {property.host?.name || "Unknown"}
                    </p>
                    <p className="text-lg font-bold">
                      ${property.pricePerNight}/night
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {/* Admin Actions */}
                    {isAdmin && property.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => onAction(property._id, "approve")}
                          disabled={processingId === property._id}
                        >
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onAction(property._id, "reject")}
                          disabled={processingId === property._id}
                        >
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}

                    {/* Common Actions */}
                    {!isAdmin && (
                      <Link href={`/dashboard/properties/${property._id}/edit`}>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      </Link>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => onAction(property._id, "delete")}
                      disabled={processingId === property._id}
                    >
                      {processingId === property._id ? (
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
  );
}
