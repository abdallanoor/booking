"use client";

import { useState, useTransition } from "react";
import { useRouter } from "nextjs-toploader/app";
import NextImage from "next/image";
import { createPropertyAction, updatePropertyAction } from "@/actions";
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
import type { Property } from "@/types";

interface PropertyFormProps {
  property?: Property;
  mode?: "create" | "edit";
}

export function PropertyForm({ property, mode = "create" }: PropertyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    title: property?.title || "",
    description: property?.description || "",
    propertyType: property?.propertyType || "",
    address: property?.location?.address || "",
    city: property?.location?.city || "",
    country: property?.location?.country || "",
    pricePerNight: property?.pricePerNight?.toString() || "",
    maxGuests: property?.maxGuests?.toString() || "",
    bedrooms: property?.bedrooms?.toString() || "",
    beds: property?.beds?.toString() || "",
    bathrooms: property?.bathrooms?.toString() || "",
    rooms: property?.rooms?.toString() || "",
    privacyType: (property?.privacyType || "entire_place") as
      | "entire_place"
      | "private_room"
      | "shared_room",
    amenities: property?.amenities?.join(", ") || "",
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    property?.images || []
  );
  const [isUploading, setIsUploading] = useState(false);

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

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.data?.urls) {
        setUploadedImages([...uploadedImages, ...result.data.urls]);
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

    startTransition(async () => {
      try {
        const propertyData = {
          title: formData.title,
          description: formData.description,
          propertyType: formData.propertyType,
          location: {
            address: formData.address,
            city: formData.city,
            country: formData.country,
          },
          images: uploadedImages,
          amenities: formData.amenities
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          pricePerNight: parseFloat(formData.pricePerNight),
          maxGuests: parseInt(formData.maxGuests),
          bedrooms: parseInt(formData.bedrooms),
          beds: parseInt(formData.beds),
          bathrooms: parseFloat(formData.bathrooms),
          rooms: parseInt(formData.rooms),
          privacyType: formData.privacyType,
        };

        if (mode === "edit" && property?._id) {
          await updatePropertyAction(property._id, propertyData);
          toast.success("Property updated successfully");
        } else {
          await createPropertyAction(propertyData);
          toast.success("Property created successfully");
        }

        router.push("/dashboard/properties");
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : `Failed to ${mode} property`;
        toast.error(message);
      }
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "edit" ? "Edit Property" : "List a New Property"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="title">Property Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
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
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type *</Label>
                <Input
                  id="propertyType"
                  placeholder="e.g., Apartment, House"
                  value={formData.propertyType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      propertyType: e.target.value,
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

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Property Details</h3>

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
                <Label htmlFor="pricePerNight">Price/Night ($) *</Label>
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
                "Update Property"
              ) : (
                "Create Property"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
