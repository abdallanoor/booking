"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "nextjs-toploader/app";
import NextImage from "next/image";
import { createListing, updateListing } from "@/services/listings.service";
import { uploadListingImagesAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Listing } from "@/types";
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";
import { LocationPicker, LocationData } from "@/components/maps/LocationPicker";

interface ListingFormProps {
  listing?: Listing;
  mode?: "create" | "edit";
}

export function ListingForm({ listing, mode = "create" }: ListingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    title: listing?.title || "",
    description: listing?.description || "",
    listingType: listing?.listingType || "",
    pricePerNight: listing?.pricePerNight?.toString() || "",
    maxGuests: listing?.maxGuests?.toString() || "",
    bedrooms: listing?.bedrooms?.toString() || "",
    beds: listing?.beds?.toString() || "",
    bathrooms: listing?.bathrooms?.toString() || "",
    rooms: listing?.rooms?.toString() || "",
    privacyType: (listing?.privacyType || "entire_place") as
      | "entire_place"
      | "private_room"
      | "shared_room",
    amenities: listing?.amenities?.join(", ") || "",
  });

  // Location state - separate from form data for LocationPicker
  const [locationData, setLocationData] = useState<LocationData | null>(
    listing?.location
      ? {
          streetAddress: listing.location.streetAddress,
          apt: listing.location.apt,
          city: listing.location.city,
          governorate: listing.location.governorate,
          country: listing.location.country,
          postalCode: listing.location.postalCode,
          coordinates: listing.location.coordinates,
          placeId: listing.location.placeId,
          formattedAddress: listing.location.formattedAddress,
        }
      : null,
  );

  const handleLocationChange = useCallback((location: LocationData) => {
    setLocationData(location);
  }, []);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    listing?.images || [],
  );
  const [policies, setPolicies] = useState<string[]>(listing?.policies || []);
  const [currentPolicy, setCurrentPolicy] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleAddPolicy = () => {
    if (currentPolicy.trim()) {
      setPolicies([...policies, currentPolicy.trim()]);
      setCurrentPolicy("");
    }
  };

  const handleRemovePolicy = (index: number) => {
    setPolicies(policies.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const result = await uploadListingImagesAction(formData);

      if (result.success && result.urls) {
        setUploadedImages([...uploadedImages, ...result.urls]);
        setSelectedFiles([]);
        toast.success("Images uploaded successfully");
      }
    } catch {
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadedImages.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    if (
      !locationData ||
      !locationData.streetAddress ||
      !locationData.city ||
      !locationData.country
    ) {
      toast.error("Please select a location for your listing");
      return;
    }

    if (!locationData.coordinates || locationData.coordinates.lat === 0) {
      toast.error("Please select a valid location with coordinates");
      return;
    }

    startTransition(async () => {
      try {
        const listingData = {
          title: formData.title,
          description: formData.description,
          listingType: formData.listingType,
          location: {
            streetAddress: locationData.streetAddress,
            apt: locationData.apt,
            city: locationData.city,
            governorate: locationData.governorate,
            country: locationData.country,
            postalCode: locationData.postalCode,
            coordinates: locationData.coordinates,
            placeId: locationData.placeId,
            formattedAddress: locationData.formattedAddress,
          },
          images: uploadedImages,
          amenities: formData.amenities
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          policies: policies,
          pricePerNight: parseFloat(formData.pricePerNight),
          maxGuests: parseInt(formData.maxGuests),
          bedrooms: parseInt(formData.bedrooms),
          beds: parseInt(formData.beds),
          bathrooms: parseFloat(formData.bathrooms),
          rooms: parseInt(formData.rooms),
          privacyType: formData.privacyType,
        };

        if (mode === "edit" && listing?._id) {
          await updateListing(listing._id, listingData);
          toast.success("Listing updated successfully");
        } else {
          await createListing(listingData);
          toast.success("Listing created successfully");
        }

        router.refresh(); // Refresh server components to show new data
        router.push("/hosting/listings"); // Client-side navigation
      } catch (error) {
        const message =
          error instanceof Error ? error.message : `Failed to ${mode} listing`;
        toast.error(message);
      }
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="title">Listing Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                minLength={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                minLength={10}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="listingType">Listing Type *</Label>
                <Input
                  id="listingType"
                  placeholder="e.g., Apartment, House"
                  value={formData.listingType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      listingType: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacyType">Privacy Type *</Label>
                <Select
                  value={formData.privacyType}
                  onValueChange={(value: typeof formData.privacyType) =>
                    setFormData({ ...formData, privacyType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entire_place">Entire Place</SelectItem>
                    <SelectItem value="private_room">Private Room</SelectItem>
                    <SelectItem value="shared_room">Shared Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-semibold">Location</h3>
            <p className="text-sm text-muted-foreground">
              Search for your property address, use your current location, or
              enter it manually
            </p>
            <GoogleMapsProvider>
              <LocationPicker
                value={locationData}
                onChange={handleLocationChange}
              />
            </GoogleMapsProvider>
          </div>

          {/* Listing Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Listing Details</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxGuests">Max Guests *</Label>
                <Input
                  id="maxGuests"
                  type="number"
                  min="1"
                  value={formData.maxGuests}
                  onChange={(e) =>
                    setFormData({ ...formData, maxGuests: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) =>
                    setFormData({ ...formData, bedrooms: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="beds">Beds *</Label>
                <Input
                  id="beds"
                  type="number"
                  min="1"
                  value={formData.beds}
                  onChange={(e) =>
                    setFormData({ ...formData, beds: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) =>
                    setFormData({ ...formData, bathrooms: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rooms">Total Rooms *</Label>
                <Input
                  id="rooms"
                  type="number"
                  min="1"
                  value={formData.rooms}
                  onChange={(e) =>
                    setFormData({ ...formData, rooms: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerNight">Price/Night (EGP) *</Label>
                <Input
                  id="pricePerNight"
                  type="number"
                  min="1"
                  value={formData.pricePerNight}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricePerNight: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <Label htmlFor="amenities">Amenities (comma-separated)</Label>
            <Input
              id="amenities"
              placeholder="WiFi, Kitchen, Parking, Pool"
              value={formData.amenities}
              onChange={(e) =>
                setFormData({ ...formData, amenities: e.target.value })
              }
            />
          </div>

          {/* Policies */}
          <div className="space-y-4">
            <h3 className="font-semibold">Policies</h3>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., No smoking, Check-in after 2PM"
                value={currentPolicy}
                onChange={(e) => setCurrentPolicy(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPolicy();
                  }
                }}
              />
              <Button type="button" onClick={handleAddPolicy}>
                Add
              </Button>
            </div>
            {policies.length > 0 && (
              <div className="space-y-2 mt-2">
                {policies.map((policy, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-muted p-2 rounded-md"
                  >
                    <span className="text-sm">{policy}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePolicy(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="font-semibold">Images *</h3>

            <div className="space-y-4">
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />

              {/* Preview of selected (not yet uploaded) files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative w-full h-32">
                        <NextImage
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover rounded opacity-75"
                        />
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      `Upload ${selectedFiles.length} file(s)`
                    )}
                  </Button>
                </div>
              )}
            </div>

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative w-full h-32 group">
                    <NextImage
                      src={url}
                      alt={`Upload ${index + 1}`}
                      fill
                      className="object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending || uploadedImages.length === 0}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "edit" ? "Updating..." : "Creating..."}
                </>
              ) : mode === "edit" ? (
                "Update Listing"
              ) : (
                "Create Listing"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
