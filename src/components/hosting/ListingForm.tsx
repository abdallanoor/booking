"use client";

import { useState, useTransition, useCallback, useRef } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import type { Listing } from "@/types";
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";
import { LocationPicker, LocationData } from "@/components/maps/LocationPicker";

const WIZARD_STEPS = [
  "Property type",
  "Location",
  "Basics",
  "Spaces & price",
  "Amenities",
  "Photos",
  "Policies",
  "Review & publish",
] as const;
const TOTAL_STEPS = WIZARD_STEPS.length;

const AMENITY_PRESETS = [
  "WiFi",
  "Kitchen",
  "Air conditioning",
  "Heating",
  "Washer",
  "Dryer",
  "Parking",
  "Pool",
  "Gym",
  "TV",
  "Workspace",
  "Elevator",
  "Smoke alarm",
  "First aid kit",
  "Hair dryer",
  "Iron",
  "Hot tub",
  "BBQ grill",
  "Beach access",
  "Pets allowed",
] as const;

const POLICY_PRESETS = [
  "No smoking",
  "No pets",
  "No parties or events",
  "Check-in after 3PM",
  "Check-out before 11AM",
  "Self check-in",
  "Not suitable for infants",
  "Not suitable for children",
  "No unregistered guests",
  "Quiet hours",
] as const;

interface ListingFormProps {
  listing?: Listing;
  mode?: "create" | "edit";
}

export function ListingForm({ listing, mode = "create" }: ListingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");

  const [formData, setFormData] = useState({
    title: listing?.title || "",
    description: listing?.description || "",
    listingType: listing?.listingType || (mode === "create" ? "House" : ""),
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
  });

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    listing?.amenities ? [...listing.amenities] : [],
  );
  const [customAmenity, setCustomAmenity] = useState("");

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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    e.target.value = "";
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.length) {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length) setSelectedFiles((prev) => [...prev, ...imageFiles]);
    }
  }, []);

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
          amenities: selectedAmenities,
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!formData.listingType.trim()) {
          toast.error("Please enter a listing type (e.g. Apartment, House)");
          return false;
        }
        return true;
      case 1:
        if (
          !locationData?.streetAddress ||
          !locationData?.city ||
          !locationData?.country
        ) {
          toast.error("Please select a location for your listing");
          return false;
        }
        if (
          !locationData.coordinates ||
          locationData.coordinates.lat === 0
        ) {
          toast.error("Please select a valid location with coordinates");
          return false;
        }
        return true;
      case 2:
        if (formData.title.trim().length < 3) {
          toast.error("Title must be at least 3 characters");
          return false;
        }
        if (formData.description.trim().length < 10) {
          toast.error("Description must be at least 10 characters");
          return false;
        }
        return true;
      case 3: {
        const guests = parseInt(formData.maxGuests, 10);
        const bedrooms = parseInt(formData.bedrooms, 10);
        const beds = parseInt(formData.beds, 10);
        const bathrooms = parseFloat(formData.bathrooms);
        const rooms = parseInt(formData.rooms, 10);
        const price = parseFloat(formData.pricePerNight);
        if (!Number.isInteger(guests) || guests < 1) {
          toast.error("Max guests must be at least 1");
          return false;
        }
        if (!Number.isInteger(bedrooms) || bedrooms < 0) {
          toast.error("Bedrooms cannot be negative");
          return false;
        }
        if (!Number.isInteger(beds) || beds < 1) {
          toast.error("Beds must be at least 1");
          return false;
        }
        if (Number.isNaN(bathrooms) || bathrooms < 0.5) {
          toast.error("Bathrooms must be at least 0.5");
          return false;
        }
        if (!Number.isInteger(rooms) || rooms < 1) {
          toast.error("Total rooms must be at least 1");
          return false;
        }
        if (Number.isNaN(price) || price < 1) {
          toast.error("Price per night must be at least 1 EGP");
          return false;
        }
        return true;
      }
      case 4:
        return true;
      case 5:
        if (uploadedImages.length === 0) {
          toast.error("Please upload at least one image");
          return false;
        }
        return true;
      case 6:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1 && validateStep(currentStep)) {
      setSlideDirection("right");
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setSlideDirection("left");
      setCurrentStep((s) => s - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex === currentStep) return;
    setSlideDirection(stepIndex > currentStep ? "right" : "left");
    setCurrentStep(stepIndex);
  };

  return (
    <div>
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {TOTAL_STEPS}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {WIZARD_STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleStepClick(i)}
                className={`flex shrink-0 items-center gap-2 rounded-full border-2 py-1.5 pl-1.5 pr-2 text-xs font-medium transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  i < currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : i === currentStep
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted bg-muted/50 text-muted-foreground hover:border-muted-foreground/50"
                }`}
                title={WIZARD_STEPS[i]}
                aria-current={i === currentStep ? "step" : undefined}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  {i < currentStep ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="hidden md:inline truncate max-w-[80px]">
                  {WIZARD_STEPS[i]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="min-h-[280px] overflow-hidden">
          <div
            key={currentStep}
            className={`animate-in duration-300 ${
              slideDirection === "right"
                ? "slide-in-from-right-4"
                : "slide-in-from-left-4"
            }`}
          >
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Property type</h3>
              <p className="text-sm text-muted-foreground">
                Choose the type of property and who will have access.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wizard-listingType">Listing Type *</Label>
                  <Input
                    id="wizard-listingType"
                    placeholder="e.g., Apartment, House"
                    value={formData.listingType}
                    onChange={(e) =>
                      setFormData({ ...formData, listingType: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wizard-privacyType">Privacy Type *</Label>
                  <Select
                    value={formData.privacyType}
                    onValueChange={(value: typeof formData.privacyType) =>
                      setFormData({ ...formData, privacyType: value })
                    }
                  >
                    <SelectTrigger id="wizard-privacyType">
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
          )}

          {currentStep === 1 && (
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
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Basics</h3>
              <div className="space-y-2">
                <Label htmlFor="wizard-title">Listing Title *</Label>
                <Input
                  id="wizard-title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  minLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wizard-description">Description *</Label>
                <Textarea
                  id="wizard-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  minLength={10}
                  rows={4}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Spaces & price</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wizard-maxGuests">Max Guests *</Label>
                  <Input
                    id="wizard-maxGuests"
                    type="number"
                    min={1}
                    value={formData.maxGuests}
                    onChange={(e) =>
                      setFormData({ ...formData, maxGuests: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wizard-bedrooms">Bedrooms *</Label>
                  <Input
                    id="wizard-bedrooms"
                    type="number"
                    min={0}
                    value={formData.bedrooms}
                    onChange={(e) =>
                      setFormData({ ...formData, bedrooms: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wizard-beds">Beds *</Label>
                  <Input
                    id="wizard-beds"
                    type="number"
                    min={1}
                    value={formData.beds}
                    onChange={(e) =>
                      setFormData({ ...formData, beds: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wizard-bathrooms">Bathrooms *</Label>
                  <Input
                    id="wizard-bathrooms"
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={formData.bathrooms}
                    onChange={(e) =>
                      setFormData({ ...formData, bathrooms: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wizard-rooms">Total Rooms *</Label>
                  <Input
                    id="wizard-rooms"
                    type="number"
                    min={1}
                    value={formData.rooms}
                    onChange={(e) =>
                      setFormData({ ...formData, rooms: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wizard-pricePerNight">Price/Night (EGP) *</Label>
                  <Input
                    id="wizard-pricePerNight"
                    type="number"
                    min={1}
                    value={formData.pricePerNight}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerNight: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Amenities</h3>
              <p className="text-sm text-muted-foreground">
                Select what your place offers. You can add your own below.
              </p>
              <div className="flex flex-wrap gap-2">
                {AMENITY_PRESETS.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
                        } else {
                          setSelectedAmenities([...selectedAmenities, amenity]);
                        }
                      }}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Add your own..."
                  value={customAmenity}
                  onChange={(e) => setCustomAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const trimmed = customAmenity.trim();
                      if (trimmed && !selectedAmenities.includes(trimmed)) {
                        setSelectedAmenities([...selectedAmenities, trimmed]);
                        setCustomAmenity("");
                      }
                    }
                  }}
                  className="max-w-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const trimmed = customAmenity.trim();
                    if (trimmed && !selectedAmenities.includes(trimmed)) {
                      setSelectedAmenities([...selectedAmenities, trimmed]);
                      setCustomAmenity("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              {selectedAmenities.some((a) => !AMENITY_PRESETS.includes(a as (typeof AMENITY_PRESETS)[number])) && (
                <div className="flex flex-wrap gap-2">
                  {selectedAmenities
                    .filter((a) => !AMENITY_PRESETS.includes(a as (typeof AMENITY_PRESETS)[number]))
                    .map((amenity) => (
                      <span
                        key={amenity}
                        className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-sm"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedAmenities(selectedAmenities.filter((x) => x !== amenity))
                          }
                          className="rounded-full p-0.5 hover:bg-primary/20 focus:outline-none"
                          aria-label={`Remove ${amenity}`}
                        >
                          <span className="sr-only">Remove</span>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="font-semibold">Photos *</h3>
              <p className="text-sm text-muted-foreground">
                Add at least one photo. The first image will be the cover photo.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
                aria-label="Choose photos"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"
                }`}
              >
                <p className="text-sm font-medium text-muted-foreground">
                  Drag and drop photos here, or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PNG, JPG up to 10MB
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Selected ({selectedFiles.length}) — upload when ready
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted"
                      >
                        <NextImage
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full sm:w-auto"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      `Upload ${selectedFiles.length} photo${selectedFiles.length === 1 ? "" : "s"}`
                    )}
                  </Button>
                </div>
              )}

              {uploadedImages.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Uploaded photos</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {uploadedImages.map((url, index) => (
                      <div
                        key={url}
                        className="group relative aspect-square w-full overflow-hidden rounded-lg border bg-muted"
                      >
                        <NextImage
                          src={url}
                          alt={`Upload ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 rounded-full bg-destructive p-1.5 text-destructive-foreground opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none"
                          aria-label={`Remove photo ${index + 1}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-4 w-4"
                          >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Policies</h3>
              <p className="text-sm text-muted-foreground">
                Select house rules. You can add your own below.
              </p>
              <div className="flex flex-wrap gap-2">
                {POLICY_PRESETS.map((policy) => {
                  const isSelected = policies.includes(policy);
                  return (
                    <button
                      key={policy}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setPolicies(policies.filter((p) => p !== policy));
                        } else {
                          setPolicies([...policies, policy]);
                        }
                      }}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {policy}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Add custom policy..."
                  value={currentPolicy}
                  onChange={(e) => setCurrentPolicy(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPolicy();
                    }
                  }}
                  className="max-w-xs"
                />
                <Button type="button" variant="outline" onClick={handleAddPolicy}>
                  Add
                </Button>
              </div>
              {policies.some((p) => !POLICY_PRESETS.includes(p as (typeof POLICY_PRESETS)[number])) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {policies
                    .filter((p) => !POLICY_PRESETS.includes(p as (typeof POLICY_PRESETS)[number]))
                    .map((policy) => (
                      <span
                        key={policy}
                        className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-sm"
                      >
                        {policy}
                        <button
                          type="button"
                          onClick={() => setPolicies(policies.filter((x) => x !== policy))}
                          className="rounded-full p-0.5 hover:bg-primary/20 focus:outline-none"
                          aria-label={`Remove ${policy}`}
                        >
                          <span className="sr-only">Remove</span>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 7 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Review & publish</h3>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3 text-sm">
                <p>
                  <span className="font-medium text-muted-foreground">Type:</span>{" "}
                  {formData.listingType || "—"} ·{" "}
                  {formData.privacyType?.replace("_", " ") || "—"}
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Location:
                  </span>{" "}
                  {locationData?.formattedAddress ||
                    [locationData?.streetAddress, locationData?.city]
                      .filter(Boolean)
                      .join(", ") ||
                    "—"}
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Title:
                  </span>{" "}
                  {formData.title || "—"}
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Spaces:
                  </span>{" "}
                  {formData.maxGuests} guests · {formData.bedrooms} bedrooms ·{" "}
                  {formData.beds} beds · {formData.bathrooms} bathrooms
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Price:
                  </span>{" "}
                  {formData.pricePerNight ? `${formData.pricePerNight} EGP/night` : "—"}
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Photos:
                  </span>{" "}
                  {uploadedImages.length} image(s)
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Amenities:
                  </span>{" "}
                  {selectedAmenities.length ? selectedAmenities.join(", ") : "—"}
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Policies:
                  </span>{" "}
                  {policies.length ? policies.join(" · ") : "—"}
                </p>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          {currentStep > 0 ? (
            <Button type="button" variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : null}
          {currentStep < TOTAL_STEPS - 1 ? (
            <Button type="button" onClick={handleNext} className="flex-1">
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "edit" ? "Updating..." : "Publishing..."}
                </>
              ) : mode === "edit" ? (
                "Update listing"
              ) : (
                "Publish listing"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
