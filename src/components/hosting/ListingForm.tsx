"use client";

import { z } from "zod";
import { useState, useTransition, useCallback } from "react";
import { useRouter } from "nextjs-toploader/app";
import NextImage from "next/image";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { createListing, updateListing } from "@/services/listings.service";
import { uploadListingImagesAction, deleteListingImageAction } from "@/actions";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, XIcon, UploadCloud, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { Listing } from "@/types";
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";
import { LocationPicker, LocationData } from "@/components/maps/LocationPicker";
import { listingSchema, type ListingInput } from "@/lib/validations/listing";

const COMMON_AMENITIES = [
  "Wifi",
  "TV",
  "Kitchen",
  "Air conditioning",
  "Heating",
  "Washer",
  "Dryer",
  "Free parking",
  "Pool",
  "Hot tub",
  "Gym",
  "Breakfast",
  "Dedicated workspace",
  "Iron",
  "Hair dryer",
  "Smoke alarm",
  "Carbon monoxide alarm",
  "First aid kit",
  "Fire extinguisher",
  "Essentials",
];

const COMMON_POLICIES = [
  "No smoking",
  "No pets",
  "No parties or events",
  "Check-in after 2PM",
  "Check-out before 11AM",
  "Self check-in",
  "Quiet hours (10PM - 8AM)",
  "Suitable for children",
  "Suitable for infants",
];

interface ListingFormProps {
  listing?: Listing;
  mode?: "create" | "edit";
}

type UploadStatus = "idle" | "uploading" | "saving" | "error";

export function ListingForm({ listing, mode = "create" }: ListingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  
  // State for new files to be uploaded
  const [newFiles, setNewFiles] = useState<File[]>([]);
  
  const [currentAmenity, setCurrentAmenity] = useState("");
  const [currentPolicy, setCurrentPolicy] = useState("");

  const defaultLocation: LocationData | undefined = listing?.location
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
    : undefined;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ListingInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(listingSchema.extend({
      images: z.string().array().optional() // Relax image validation for frontend - we handle it manually in onSubmit
    })) as any,
    defaultValues: {
      title: listing?.title || "",
      description: listing?.description || "",
      listingType: listing?.listingType || "",
      privacyType: (listing?.privacyType as "entire_place" | "private_room" | "shared_room") || "entire_place",
      maxGuests: listing?.maxGuests || undefined,
      bedrooms: listing?.bedrooms || undefined,
      beds: listing?.beds || undefined,
      bathrooms: listing?.bathrooms || undefined,
      pricePerNight: listing?.pricePerNight || undefined,
      location: defaultLocation,
      amenities: listing?.amenities || [],
      policies: listing?.policies || [],
      images: listing?.images || [],
    },
  });

  const amenities = watch("amenities");
  const policies = watch("policies");
  const existingImages = watch("images");

  // Dropzone setup
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setNewFiles((prev) => {
      if (acceptedFiles.length > 0) {
        clearErrors("images");
      }
      return [...prev, ...acceptedFiles];
    });
  }, [clearErrors]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 10,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        const { errors } = rejection;
        errors.forEach((error) => {
          if (error.code === "file-too-large") {
            toast.error(`File ${rejection.file.name} is too large. Max 5MB.`);
          } else if (error.code === "too-many-files") {
            toast.error("Max 10 images allowed.");
          } else {
            toast.error(error.message);
          }
        });
      });
    },
  });

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setValue(
      "images",
      existingImages.filter((_, i) => i !== index),
      { shouldValidate: true }
    );
  };

  const handleAddAmenity = () => {
    if (currentAmenity.trim()) {
      setValue("amenities", [...amenities, currentAmenity.trim()], { shouldValidate: true });
      setCurrentAmenity("");
    }
  };

  const handleRemoveAmenity = (amenityToRemove: string) => {
    setValue(
      "amenities",
      amenities.filter((amenity) => amenity !== amenityToRemove),
      { shouldValidate: true }
    );
  };

  const handleAddPolicy = () => {
    if (currentPolicy.trim()) {
      setValue("policies", [...policies, currentPolicy.trim()], { shouldValidate: true });
      setCurrentPolicy("");
    }
  };

  const handleRemovePolicy = (policyToRemove: string) => {
    setValue(
      "policies",
      policies.filter((policy) => policy !== policyToRemove),
      { shouldValidate: true }
    );
  };

  const toggleAmenity = (amenity: string) => {
    const current = amenities;
    if (current.includes(amenity)) {
      setValue(
        "amenities",
        current.filter((a) => a !== amenity),
        { shouldValidate: true }
      );
    } else {
      setValue("amenities", [...current, amenity], { shouldValidate: true });
    }
  };

  const togglePolicy = (policy: string) => {
    const current = policies;
    if (current.includes(policy)) {
      setValue(
        "policies",
        current.filter((p) => p !== policy),
        { shouldValidate: true }
      );
    } else {
      setValue("policies", [...current, policy], { shouldValidate: true });
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("files", file);
    return uploadListingImagesAction(formData);
  };

  const onSubmit: SubmitHandler<ListingInput> = async (data) => {
    // Manual validation for images
    if (newFiles.length === 0 && existingImages.length === 0) {
      setError("images", { type: "manual", message: "At least one image is required" });
      return;
    }

      setUploadStatus("uploading");
    
    // 1. Upload new images in parallel
    const newlyUploadedUrls: string[] = [];
    
    if (newFiles.length > 0) {
      try {
        const uploadResults = await Promise.allSettled(newFiles.map(uploadFile));
        
        // Filter successful uploads
        uploadResults.forEach(result => {
           if (result.status === "fulfilled" && result.value?.success && result.value?.urls) {
               newlyUploadedUrls.push(...result.value.urls);
           }
        });

        // Check for partial failures
        const failedCount = uploadResults.filter(r => r.status === "rejected" || (r.status === "fulfilled" && !r.value?.success)).length;
        if (failedCount > 0) {
            toast.warning(`Failed to upload ${failedCount} images. Continuing with successful ones.`);
        }

        // Critical: If we ended up with NO images (neither existing nor new), stop.
        if (existingImages.length === 0 && newlyUploadedUrls.length === 0) {
           throw new Error("All image uploads failed. At least one image is required.");
        }

      } catch (error) {
        console.error("Upload error:", error);
        toast.error(error instanceof Error ? error.message : "Failed to upload images.");
        
        // Rollback: delete any successfully uploaded images from this batch
        if (newlyUploadedUrls.length > 0) {
            await Promise.all(newlyUploadedUrls.map(url => deleteListingImageAction(url)));
        }
        
        setUploadStatus("idle");
        return; 
      }
    }

    // 2. Prepare final data
    const finalImages = [...existingImages, ...newlyUploadedUrls];
    const finalData = { ...data, images: finalImages };

    // 3. Save listing
    setUploadStatus("saving");
    
    startTransition(async () => {
        try {
            if (mode === "edit" && listing?._id) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await updateListing(listing._id, finalData as any);
                toast.success("Listing updated successfully");
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await createListing(finalData as any);
                toast.success("Listing created successfully");
            }

            // Clear temporary files on success
            setNewFiles([]);
            router.refresh();
            router.push("/hosting/listings");
        } catch (error) {
            const message = error instanceof Error ? error.message : `Failed to ${mode} listing`;
            toast.error(message);
            
            // 4. Rollback: If saving listing fails, delete the images we just uploaded
            if (newlyUploadedUrls.length > 0) {
                toast.info("Cleaning up uploaded images...");
                await Promise.all(newlyUploadedUrls.map(url => deleteListingImageAction(url)));
            }
            
            setUploadStatus("idle");
        }
    });
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="title">Listing Title *</Label>
              <Input
                id="title"
                {...register("title")}
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register("description")}
                rows={4}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="listingType">Listing Type *</Label>
                <Input
                  id="listingType"
                  placeholder="e.g., Apartment, House"
                  {...register("listingType")}
                  aria-invalid={!!errors.listingType}
                />
                {errors.listingType && (
                  <p className="text-sm text-destructive">{errors.listingType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacyType">Privacy Type *</Label>
                <Controller
                  control={control}
                  name="privacyType"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
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
                  )}
                />
                {errors.privacyType && (
                  <p className="text-sm text-destructive">{errors.privacyType.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Location</h3>
            <p className="text-sm text-muted-foreground">
              Search for your property address, use your current location, or
              enter it manually
            </p>
            <GoogleMapsProvider>
              <Controller
                control={control}
                name="location"
                render={({ field }) => (
                  <LocationPicker
                    value={field.value ?? null}
                    onChange={field.onChange}
                  />
                )}
              />
            </GoogleMapsProvider>
            {errors.location && (
              <p className="text-sm text-destructive">
                {errors.location.message || "Please select a valid location"}
              </p>
            )}
            {errors.location?.coordinates && (
               <p className="text-sm text-destructive">
               {errors.location.coordinates.message}
             </p>
            )}
          </div>

          {/* Listing Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Listing Details</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxGuests">Max Guests *</Label>
                <Input
                  id="maxGuests"
                  type="number"
                  min="1"
                  {...register("maxGuests", { valueAsNumber: true })}
                  aria-invalid={!!errors.maxGuests}
                />
                {errors.maxGuests && (
                  <p className="text-sm text-destructive">{errors.maxGuests.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  {...register("bedrooms", { valueAsNumber: true })}
                  aria-invalid={!!errors.bedrooms}
                />
                {errors.bedrooms && (
                  <p className="text-sm text-destructive">{errors.bedrooms.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="beds">Beds *</Label>
                <Input
                  id="beds"
                  type="number"
                  min="1"
                  {...register("beds", { valueAsNumber: true })}
                  aria-invalid={!!errors.beds}
                />
                {errors.beds && (
                  <p className="text-sm text-destructive">{errors.beds.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0.5"
                  step="0.5"
                  {...register("bathrooms", { valueAsNumber: true })}
                  aria-invalid={!!errors.bathrooms}
                />
                {errors.bathrooms && (
                  <p className="text-sm text-destructive">{errors.bathrooms.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerNight">Price/Night (EGP) *</Label>
                <Input
                  id="pricePerNight"
                  type="number"
                  min="1"
                  {...register("pricePerNight", { valueAsNumber: true })}
                  aria-invalid={!!errors.pricePerNight}
                />
                {errors.pricePerNight && (
                  <p className="text-sm text-destructive">{errors.pricePerNight.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Amenities</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_AMENITIES.map((amenity) => (
                <Badge
                  key={amenity}
                  variant={amenities.includes(amenity) ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => toggleAmenity(amenity)}
                >
                  {amenity}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 max-w-md">
              <Input
                placeholder="e.g., WiFi, Kitchen, Parking"
                value={currentAmenity}
                onChange={(e) => setCurrentAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddAmenity();
                  }
                }}
              />
              <Button type="button" onClick={handleAddAmenity}>
                Add
              </Button>
            </div>
            {amenities.filter(a => !COMMON_AMENITIES.includes(a)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {amenities
                  .filter((a) => !COMMON_AMENITIES.includes(a))
                  .map((amenity, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(amenity)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <XIcon className="h-3 w-3" />
                        <span className="sr-only">Remove {amenity}</span>
                      </button>
                    </Badge>
                  ))}
              </div>
            )}
            {errors.amenities && (
               <p className="text-sm text-destructive">{errors.amenities.message}</p>
            )}
          </div>

          {/* Policies */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Policies</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_POLICIES.map((policy) => (
                <Badge
                  key={policy}
                  variant={policies.includes(policy) ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => togglePolicy(policy)}
                >
                  {policy}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 max-w-md">
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
            {policies.filter(p => !COMMON_POLICIES.includes(p)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {policies
                  .filter((p) => !COMMON_POLICIES.includes(p))
                  .map((policy, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {policy}
                      <button
                        type="button"
                        onClick={() => handleRemovePolicy(policy)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <XIcon className="h-3 w-3" />
                        <span className="sr-only">Remove {policy}</span>
                      </button>
                    </Badge>
                  ))}
              </div>
            )}
             {errors.policies && (
               <p className="text-sm text-destructive">{errors.policies.message}</p>
            )}
          </div>

          {/* Images */}
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-lg">Photos *</h3>
              <p className="text-sm text-muted-foreground mt-1">
                The first photo will be your cover image. Drag and drop to reorder.
              </p>
            </div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`
                relative overflow-hidden rounded-xl border-2 border-dashed p-8 text-center cursor-pointer
                transition-all duration-300 ease-out
                ${isDragActive 
                  ? "border-primary bg-primary/5 scale-[1.01]" 
                  : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className={`
                  p-4 rounded-full transition-all duration-300
                  ${isDragActive ? "bg-primary/10" : "bg-muted"}
                `}>
                  <UploadCloud className={`h-7 w-7 transition-colors duration-300 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-base font-medium">
                    {isDragActive ? "Drop your photos here" : "Add photos"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse • JPG, PNG, WEBP up to 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Images Preview Grid */}
            {(existingImages.length > 0 || newFiles.length > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {/* Existing Images */}
                {existingImages.map((url, index) => {
                  const isFirstImage = index === 0 && newFiles.length === 0;
                  return (
                    <div 
                      key={`existing-${index}`} 
                      className={`
                        relative aspect-square rounded-xl overflow-hidden bg-muted
                        ring-1 ring-border/50 transition-all duration-200
                        ${isFirstImage ? "ring-2 ring-primary/50" : ""}
                      `}
                    >
                      <NextImage
                        src={url}
                        alt={`Photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      {/* Always visible delete button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeExistingImage(index);
                        }}
                        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 
                          flex items-center justify-center transition-colors shadow-sm"
                      >
                        <XIcon className="h-3.5 w-3.5 text-white" />
                      </button>
                      {/* Cover badge for first image */}
                      {isFirstImage && (
                        <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-[11px] font-medium px-2 py-0.5 rounded-md shadow-sm">
                          Cover
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* New Files */}
                {newFiles.map((file, index) => {
                  const isFirstImage = existingImages.length === 0 && index === 0;
                  return (
                    <div 
                      key={`new-${index}`} 
                      className={`
                        relative aspect-square rounded-xl overflow-hidden bg-muted
                        ring-1 ring-border/50 transition-all duration-200
                        ${isFirstImage ? "ring-2 ring-primary/50" : ""}
                      `}
                    >
                      <NextImage
                        src={URL.createObjectURL(file)}
                        alt={`New photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      {/* Always visible delete button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNewFile(index);
                        }}
                        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 
                          flex items-center justify-center transition-colors shadow-sm"
                      >
                        <XIcon className="h-3.5 w-3.5 text-white" />
                      </button>
                      {/* Cover badge for first image */}
                      {isFirstImage && (
                        <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-[11px] font-medium px-2 py-0.5 rounded-md shadow-sm">
                          Cover
                        </div>
                      )}
                      {/* New indicator (small dot) */}
                      {!isFirstImage && (
                        <div className="absolute bottom-2 left-2 h-2 w-2 rounded-full bg-blue-500 shadow-sm" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Image count */}
            {(existingImages.length > 0 || newFiles.length > 0) && (
              <p className="text-xs text-muted-foreground">
                {existingImages.length + newFiles.length} photo{existingImages.length + newFiles.length !== 1 ? 's' : ''} added
              </p>
            )}

            {errors.images && (
               <p className="text-sm text-destructive">{errors.images.message}</p>
            )}
            
            {newFiles.length === 0 && existingImages.length === 0 && (
              <div className="flex flex-col items-center gap-2 text-center py-6 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20">
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No photos yet. Add at least one photo to continue.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending || uploadStatus !== "idle"}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending || uploadStatus !== "idle"}
            >
              {uploadStatus === "uploading" ? (
                <>
                  <Loader2 className="animate-spin" />
                  Uploading {newFiles.length} Images...
                </>
              ) : uploadStatus === "saving" ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving Listing...
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
