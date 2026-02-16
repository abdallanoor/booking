"use client";

import { z } from "zod";
import {
  useState,
  useTransition,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useRouter } from "nextjs-toploader/app";
import NextImage from "next/image";
import {
  useForm,
  Controller,
  FormProvider,
  useFormContext,
  type SubmitHandler,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { createListing, updateListing } from "@/services/listings.service";
import { uploadListingImagesAction, deleteListingImageAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  XIcon,
  UploadCloud,
  Image as ImageIcon,
  Check,
  MapPin,
  Bed,
  DoorOpen,
  Bath,
  Users,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import type { Listing } from "@/types";
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";
import { LocationPicker, LocationData } from "@/components/maps/LocationPicker";
import { listingSchema, type ListingInput } from "@/lib/validations/listing";
import { cn } from "@/lib/utils";
import { Counter } from "@/components/ui/counter";

// =============================================================================
// CONSTANTS
// =============================================================================

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
] as const;

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
] as const;

/** Wizard steps configuration */
const WIZARD_STEPS = [
  { id: 1, title: "Basics", shortTitle: "Basics" },
  { id: 2, title: "Location", shortTitle: "Location" },
  { id: 3, title: "Details", shortTitle: "Details" },
  { id: 4, title: "Pricing", shortTitle: "Pricing" },
  { id: 5, title: "Amenities", shortTitle: "Amenities" },
  { id: 6, title: "Policies", shortTitle: "Policies" },
  { id: 7, title: "Photos", shortTitle: "Photos" },
  { id: 8, title: "Preview", shortTitle: "Preview" },
] as const;

/** Maps form fields to their corresponding wizard step for error navigation */
const STEP_FIELDS_MAP: Record<number, (keyof ListingInput)[]> = {
  1: ["title", "description", "listingType", "privacyType"],
  2: ["location"],
  3: ["maxGuests", "bedrooms", "beds", "bathrooms"],
  4: ["pricePerNight", "weekendPrice", "discounts"],
  5: ["amenities"],
  6: ["policies"],
  7: ["images"],
};

// =============================================================================
// TYPES
// =============================================================================

interface ListingFormProps {
  listing?: Listing;
  mode?: "create" | "edit";
}

type UploadStatus = "idle" | "uploading" | "saving" | "error";
type Direction = "left" | "right";

/** Extended schema for frontend - relaxes image validation (handled manually) */
const frontendListingSchema = listingSchema.extend({
  images: z.string().array().default([]),
});

type FrontendListingInput = z.infer<typeof frontendListingSchema>;

// =============================================================================
// STEP COMPONENTS (Local to file)
// =============================================================================

/** Step 1: Basic listing information - title, description, type */
function StepBasics() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<FrontendListingInput>();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Tell us about your place</h2>
        <p className="text-muted-foreground">Start with the basics.</p>
      </div>

      <div className="space-y-6">
        {/* Title Field */}
        <div className="space-y-2">
          <Label htmlFor="title">Listing Title</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="Cozy apartment in downtown"
            className="h-12"
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            rows={4}
            placeholder="Describe what makes your place special..."
            aria-invalid={!!errors.description}
          />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Property & Privacy Type - Hidden, using defaults */}
        {/* 
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="listingType">Property Type</Label>
            <Input
              id="listingType"
              placeholder="e.g., Apartment"
              {...register("listingType")}
              className="h-12"
              aria-invalid={!!errors.listingType}
            />
            {errors.listingType && (
              <p className="text-sm text-destructive">
                {errors.listingType.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="privacyType">Privacy Type</Label>
            <Controller
              control={control}
              name="privacyType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-12">
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
              <p className="text-sm text-destructive">
                {errors.privacyType.message}
              </p>
            )}
          </div>
        </div>
        */}
      </div>
    </div>
  );
}

/** Step 2: Location selection with Google Maps */
function StepLocation() {
  const {
    control,
    formState: { errors },
  } = useFormContext<FrontendListingInput>();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Where's your place located?</h2>
        <p className="text-muted-foreground">
          Search for your address or pin it on the map.
        </p>
      </div>

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
    </div>
  );
}

/** Step 3: Listing details - capacity, rooms, price */
function StepDetails() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<FrontendListingInput>();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Share some details</h2>
        <p className="text-muted-foreground">
          Help guests know what to expect.
        </p>
      </div>

      <div>
        {/* Max Guests Counter */}
        <div className="pb-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="maxGuests" className="text-base font-normal">
              Max Guests
            </Label>
            <Controller
              control={control}
              name="maxGuests"
              rules={{ required: "Max guests is required", min: 1 }}
              render={({ field }) => (
                <Counter
                  value={field.value || 0}
                  onChange={(val) => field.onChange(val)}
                  min={1}
                  max={50}
                />
              )}
            />
          </div>
          {errors.maxGuests && (
            <p className="text-sm text-destructive mt-1">
              {errors.maxGuests.message}
            </p>
          )}
        </div>

        {/* Bedrooms Counter */}
        <div className="border-t py-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="bedrooms" className="text-base font-normal">
              Bedrooms
            </Label>
            <Controller
              control={control}
              name="bedrooms"
              render={({ field }) => (
                <Counter
                  value={field.value || 0}
                  onChange={(val) => field.onChange(val)}
                  min={0}
                  max={50}
                />
              )}
            />
          </div>
          {errors.bedrooms && (
            <p className="text-sm text-destructive mt-1">
              {errors.bedrooms.message}
            </p>
          )}
        </div>

        {/* Beds Counter */}
        <div className="border-t py-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="beds" className="text-base font-normal">
              Beds
            </Label>
            <Controller
              control={control}
              name="beds"
              render={({ field }) => (
                <Counter
                  value={field.value || 0}
                  onChange={(val) => field.onChange(val)}
                  min={1}
                  max={50}
                />
              )}
            />
          </div>
          {errors.beds && (
            <p className="text-sm text-destructive mt-1">
              {errors.beds.message}
            </p>
          )}
        </div>

        {/* Bathrooms Counter */}
        <div className="border-t py-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="bathrooms" className="text-base font-normal">
              Bathrooms
            </Label>
            <Controller
              control={control}
              name="bathrooms"
              render={({ field }) => (
                <Counter
                  value={field.value || 0}
                  onChange={(val) => field.onChange(val)}
                  min={0.5}
                  max={50}
                  step={0.5}
                />
              )}
            />
          </div>
          {errors.bathrooms && (
            <p className="text-sm text-destructive mt-1">
              {errors.bathrooms.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Step 4: Pricing strategy */
function StepPricing() {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useFormContext<FrontendListingInput>();

  const pricePerNight = watch("pricePerNight");
  const weeklyDiscount = watch("discounts.weekly");
  const monthlyDiscount = watch("discounts.monthly");

  const weeklyPrice =
    pricePerNight && weeklyDiscount > 0
      ? Math.round(pricePerNight * (1 - weeklyDiscount / 100))
      : null;

  const monthlyPrice =
    pricePerNight && monthlyDiscount > 0
      ? Math.round(pricePerNight * (1 - monthlyDiscount / 100))
      : null;

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  const handleDiscountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: number) => void,
  ) => {
    const inputValue = e.target.value;

    // If input is empty, default to 0
    if (inputValue === "") {
      onChange(0);
      return;
    }

    // Parse integer, clamping leading zeros automatically via parseInt
    let value = parseInt(inputValue, 10);

    // Handle invalid number
    if (isNaN(value)) {
      onChange(0);
      return;
    }

    // Clamp value between 0 and 99
    if (value > 99) value = 99;
    if (value < 0) value = 0;

    onChange(value);
  };

  const handleWeekendPriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: number) => void,
  ) => {
    const inputValue = e.target.value;

    // If input is empty, default to 0
    if (inputValue === "") {
      onChange(0);
      return;
    }

    // Parse integer, clamping leading zeros automatically via parseInt
    let value = parseInt(inputValue, 10);

    // Handle invalid number
    if (isNaN(value)) {
      onChange(0);
      return;
    }

    // Ensure range [0, 100000]
    if (value < 0) value = 0;
    if (value > 100000) value = 100000;

    onChange(value);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Pricing</h2>
        <p className="text-muted-foreground">
          Set your price and offer discounts to attract more guests.
        </p>
      </div>

      <div className="space-y-6">
        {/* Base Price */}
        <div className="space-y-2">
          <Label htmlFor="pricePerNight">Base Price per Night (EGP)</Label>
          <Input
            id="pricePerNight"
            type="number"
            min="10"
            max="100000"
            {...register("pricePerNight", { valueAsNumber: true })}
            className="h-12"
            aria-invalid={!!errors.pricePerNight}
          />
          {errors.pricePerNight && (
            <p className="text-sm text-destructive">
              {errors.pricePerNight.message}
            </p>
          )}
        </div>

        {/* Weekend Price */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="weekendPrice">
              Weekend Price (Friday & Saturday)
            </Label>
            <span className="text-xs text-muted-foreground">
              Optional. Set 0 to use base price.
            </span>
          </div>
          <Controller
            control={control}
            name="weekendPrice"
            render={({ field }) => (
              <Input
                {...field}
                id="weekendPrice"
                type="text"
                inputMode="numeric"
                min="0"
                max="100000"
                className="h-12"
                placeholder="0"
                onFocus={handleFocus}
                onChange={(e) => handleWeekendPriceChange(e, field.onChange)}
                value={field.value ?? 0}
              />
            )}
          />
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="font-medium text-lg">Discounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weekly Discount */}
            <div className="space-y-2">
              <Label htmlFor="weeklyDiscount">Weekly Discount (%)</Label>
              <p className="text-xs text-muted-foreground">
                For stays of 7 nights or more
              </p>
              <div className="relative">
                <Controller
                  control={control}
                  name="discounts.weekly"
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="weeklyDiscount"
                      type="text"
                      inputMode="numeric"
                      min="0"
                      max="99"
                      className="h-12 pr-8"
                      onFocus={handleFocus}
                      onChange={(e) => handleDiscountChange(e, field.onChange)}
                      value={field.value ?? 0}
                    />
                  )}
                />
                <span className="absolute right-3 top-3.5 text-muted-foreground">
                  %
                </span>
              </div>
              {weeklyPrice !== null && (
                <p className="text-sm text-muted-foreground">
                  Price after discount:{" "}
                  <span className="font-medium text-foreground">
                    {weeklyPrice} EGP
                  </span>
                </p>
              )}
              {errors.discounts?.weekly && (
                <p className="text-sm text-destructive">
                  {errors.discounts.weekly.message}
                </p>
              )}
            </div>

            {/* Monthly Discount */}
            <div className="space-y-2">
              <Label htmlFor="monthlyDiscount">Monthly Discount (%)</Label>
              <p className="text-xs text-muted-foreground">
                For stays of 28 nights or more
              </p>
              <div className="relative">
                <Controller
                  control={control}
                  name="discounts.monthly"
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="monthlyDiscount"
                      type="text"
                      inputMode="numeric"
                      min="0"
                      max="99"
                      className="h-12 pr-8"
                      onFocus={handleFocus}
                      onChange={(e) => handleDiscountChange(e, field.onChange)}
                      value={field.value ?? 0}
                    />
                  )}
                />
                <span className="absolute right-3 top-3.5 text-muted-foreground">
                  %
                </span>
              </div>
              {monthlyPrice !== null && (
                <p className="text-sm text-muted-foreground">
                  Price after discount:{" "}
                  <span className="font-medium text-foreground">
                    {monthlyPrice} EGP
                  </span>
                </p>
              )}
              {errors.discounts?.monthly && (
                <p className="text-sm text-destructive">
                  {errors.discounts.monthly.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Step 4: Amenities selection and custom amenities */
interface StepAmenitiesProps {
  currentAmenity: string;
  setCurrentAmenity: (value: string) => void;
  onAddAmenity: () => void;
  onRemoveAmenity: (amenity: string) => void;
  onToggleAmenity: (amenity: string) => void;
}

function StepAmenities({
  currentAmenity,
  setCurrentAmenity,
  onAddAmenity,
  onRemoveAmenity,
  onToggleAmenity,
}: StepAmenitiesProps) {
  const { watch } = useFormContext<FrontendListingInput>();
  const amenities = watch("amenities");

  /** Filters out common amenities to show only custom ones */
  const customAmenities = amenities.filter(
    (a) => !COMMON_AMENITIES.includes(a as (typeof COMMON_AMENITIES)[number]),
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Amenities</h2>
        <p className="text-muted-foreground">What amenities do you offer?</p>
      </div>

      <div className="space-y-4">
        <Label>Amenities</Label>

        {/* Common Amenities Grid */}
        <div className="flex flex-wrap gap-2">
          {COMMON_AMENITIES.map((amenity) => (
            <Badge
              key={amenity}
              variant={amenities.includes(amenity) ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onToggleAmenity(amenity)}
            >
              {amenity}
            </Badge>
          ))}
        </div>

        {/* Custom Amenity Input */}
        <div className="flex gap-2 max-w-md">
          <Input
            placeholder="Add custom amenity..."
            value={currentAmenity}
            onChange={(e) => setCurrentAmenity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddAmenity();
              }
            }}
          />
          <Button type="button" onClick={onAddAmenity} variant="secondary">
            Add
          </Button>
        </div>

        {/* Custom Amenities Display */}
        {customAmenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customAmenities.map((amenity, index) => (
              <Badge key={index} variant="secondary" className="gap-1 pr-1">
                {amenity}
                <button
                  type="button"
                  onClick={() => onRemoveAmenity(amenity)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Step 5: Policies/house rules selection */
interface StepPoliciesProps {
  currentPolicy: string;
  setCurrentPolicy: (value: string) => void;
  onAddPolicy: () => void;
  onRemovePolicy: (policy: string) => void;
  onTogglePolicy: (policy: string) => void;
}

function StepPolicies({
  currentPolicy,
  setCurrentPolicy,
  onAddPolicy,
  onRemovePolicy,
  onTogglePolicy,
}: StepPoliciesProps) {
  const { watch } = useFormContext<FrontendListingInput>();
  const policies = watch("policies");

  /** Filters out common policies to show only custom ones */
  const customPolicies = policies.filter(
    (p) => !COMMON_POLICIES.includes(p as (typeof COMMON_POLICIES)[number]),
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Policies</h2>
        <p className="text-muted-foreground">What are your house rules?</p>
      </div>

      <div className="space-y-4">
        <Label>House Rules</Label>

        {/* Common Policies Grid */}
        <div className="flex flex-wrap gap-2">
          {COMMON_POLICIES.map((policy) => (
            <Badge
              key={policy}
              variant={policies.includes(policy) ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onTogglePolicy(policy)}
            >
              {policy}
            </Badge>
          ))}
        </div>

        {/* Custom Policy Input */}
        <div className="flex gap-2 max-w-md">
          <Input
            placeholder="Add custom rule..."
            value={currentPolicy}
            onChange={(e) => setCurrentPolicy(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddPolicy();
              }
            }}
          />
          <Button type="button" onClick={onAddPolicy} variant="secondary">
            Add
          </Button>
        </div>

        {/* Custom Policies Display */}
        {customPolicies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customPolicies.map((policy, index) => (
              <Badge key={index} variant="secondary" className="gap-1 pr-1">
                {policy}
                <button
                  type="button"
                  onClick={() => onRemovePolicy(policy)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Step 6: Photo upload with dropzone and preview */
interface StepPhotosProps {
  newFiles: File[];
  previewUrls: string[];
  onRemoveNewFile: (index: number) => void;
  onRemoveExistingImage: (index: number) => void;
  getRootProps: ReturnType<typeof useDropzone>["getRootProps"];
  getInputProps: ReturnType<typeof useDropzone>["getInputProps"];
  isDragActive: boolean;
}

function StepPhotos({
  newFiles,
  previewUrls,
  onRemoveNewFile,
  onRemoveExistingImage,
  getRootProps,
  getInputProps,
  isDragActive,
}: StepPhotosProps) {
  const {
    watch,
    formState: { errors },
  } = useFormContext<FrontendListingInput>();
  const existingImages = watch("images") ?? [];

  const totalImages = existingImages.length + newFiles.length;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Add some photos</h2>
        <p className="text-muted-foreground">
          The first photo will be your cover image.
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden rounded-xl border-2 border-dashed p-8 text-center cursor-pointer
          transition-all duration-300 ease-out
          ${
            isDragActive
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div
            className={`
            p-4 rounded-full transition-all duration-300
            ${isDragActive ? "bg-primary/10" : "bg-muted"}
          `}
          >
            <UploadCloud
              className={`h-7 w-7 transition-colors duration-300 ${isDragActive ? "text-primary" : "text-muted-foreground"}`}
            />
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
      {totalImages > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Existing Images */}
          {existingImages.map((url, index) => {
            const isFirstImage = index === 0;
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveExistingImage(index);
                  }}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 
                    flex items-center justify-center transition-colors cursor-pointer z-20"
                >
                  <XIcon className="h-3.5 w-3.5 text-white" />
                </button>
                {isFirstImage && (
                  <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-[11px] font-medium px-2 py-0.5 rounded-md z-10">
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
                  src={previewUrls[index]}
                  alt={`New photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveNewFile(index);
                  }}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 
                    flex items-center justify-center transition-colors z-20 cursor-pointer"
                >
                  <XIcon className="h-3.5 w-3.5 text-white" />
                </button>
                {/* Status Dot - New */}
                <div
                  className="absolute top-2 left-2 w-2.5 h-2.5 bg-green-500 rounded-full ring-1 ring-white z-10 shadow-sm"
                  title="New Image"
                />

                {isFirstImage && (
                  <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-[11px] font-medium px-2 py-0.5 rounded-md z-10">
                    Cover
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Image count */}
      {totalImages > 0 && (
        <p className="text-xs text-muted-foreground">
          {totalImages} photo{totalImages !== 1 ? "s" : ""} added
        </p>
      )}

      {errors.images && (
        <p className="text-sm text-destructive">{errors.images.message}</p>
      )}

      {/* Empty state */}
      {totalImages === 0 && (
        <div className="flex flex-col items-center gap-2 text-center py-6 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20">
          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No photos yet. Add at least one photo to continue.
          </p>
        </div>
      )}
    </div>
  );
}

/** Step 7: Preview the complete listing before submission */
interface StepPreviewProps {
  previewUrls: string[];
}

function StepPreview({ previewUrls }: StepPreviewProps) {
  const { watch } = useFormContext<FrontendListingInput>();
  const formValues = watch();
  const existingImages = formValues.images ?? [];

  /** Gets the cover image URL (first existing or first new upload) */
  const coverImageUrl =
    existingImages.length > 0
      ? existingImages[0]
      : previewUrls.length > 0
        ? previewUrls[0]
        : "";

  /** Formats privacy type for display */
  const privacyTypeLabel =
    formValues.privacyType === "entire_place"
      ? "Entire Place"
      : formValues.privacyType === "private_room"
        ? "Private Room"
        : "Shared Room";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Review your listing</h2>
        <p className="text-muted-foreground">
          Here's what we'll show to guests. Make sure everything looks good.
        </p>
      </div>

      <Card className="overflow-hidden p-0 shadow-none gap-0">
        {/* Cover Image */}
        <div className="relative aspect-video w-full bg-muted">
          {coverImageUrl ? (
            <>
              <NextImage
                src={coverImageUrl}
                alt="Cover Image"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <ImageIcon className="h-12 w-12 opacity-20" />
            </div>
          )}
          <div className="absolute bottom-4 right-4 text-white font-bold text-xl drop-shadow-md z-10">
            {formValues.pricePerNight
              ? `${formValues.pricePerNight} EGP`
              : "Price not set"}
            <span className="text-sm font-normal opacity-90 mx-1">/ night</span>
          </div>
        </div>

        <CardContent className="p-6 space-y-8">
          {/* Title & Description */}
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-2xl font-bold leading-tight">
                  {formValues.title || "Untitled Listing"}
                </h3>
                <div className="flex items-center text-muted-foreground mt-2 text-sm">
                  <MapPin className="h-4 w-4 mr-1.5 shrink-0" />
                  <span className="line-clamp-1">
                    {formValues.location?.formattedAddress ||
                      "No address selected"}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {formValues.description || "No description provided."}
            </p>
          </div>

          <div className="h-px bg-border" />

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/40 border border-border/50">
              <Users className="h-6 w-6 text-primary mb-2" />
              <span className="font-semibold text-lg">
                {formValues.maxGuests || 0}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Guests
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/40 border border-border/50">
              <DoorOpen className="h-6 w-6 text-primary mb-2" />
              <span className="font-semibold text-lg">
                {formValues.bedrooms || 0}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Bedrooms
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/40 border border-border/50">
              <Bed className="h-6 w-6 text-primary mb-2" />
              <span className="font-semibold text-lg">
                {formValues.beds || 0}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Beds
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/40 border border-border/50">
              <Bath className="h-6 w-6 text-primary mb-2" />
              <span className="font-semibold text-lg">
                {formValues.bathrooms || 0}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Baths
              </span>
            </div>
          </div>

          {/* Amenities */}
          {formValues.amenities && formValues.amenities.length > 0 && (
            <>
              <div className="h-px bg-border" />
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  What this place offers
                </h4>
                <div className="flex flex-wrap gap-2">
                  {formValues.amenities.map((amenity) => (
                    <Badge
                      key={amenity}
                      variant="outline"
                      className="px-3 py-1 text-sm bg-background"
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Policies */}
          {formValues.policies && formValues.policies.length > 0 && (
            <>
              <div className="h-px bg-border" />
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  House Rules
                </h4>
                <div className="flex flex-wrap gap-2">
                  {formValues.policies.map((policy) => (
                    <Badge
                      key={policy}
                      variant="secondary"
                      className="px-3 py-1 text-sm font-normal"
                    >
                      {policy}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ListingForm({ listing, mode = "create" }: ListingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");

  // Wizard navigation state
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<Direction>("right");

  // Image upload state
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // Custom input state for amenities/policies
  const [currentAmenity, setCurrentAmenity] = useState("");
  const [currentPolicy, setCurrentPolicy] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<{
    index: number;
    type: "new" | "existing";
  } | null>(null);

  // Prepare default location from existing listing
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

  // =============================================================================
  // FORM SETUP
  // =============================================================================

  const formMethods = useForm<FrontendListingInput>({
    resolver: zodResolver(
      frontendListingSchema,
    ) as Resolver<FrontendListingInput>,
    defaultValues: {
      title: listing?.title || "",
      description: listing?.description || "",
      listingType: listing?.listingType || "House",
      privacyType:
        (listing?.privacyType as
          | "entire_place"
          | "private_room"
          | "shared_room") || "entire_place",
      maxGuests: listing?.maxGuests || 1,
      bedrooms: listing?.bedrooms || 1,
      beds: listing?.beds || 1,
      bathrooms: listing?.bathrooms || 1,
      pricePerNight: listing?.pricePerNight || undefined,
      weekendPrice: listing?.weekendPrice || 0,
      discounts: listing?.discounts || { weekly: 0, monthly: 0 },
      location: defaultLocation,
      amenities: listing?.amenities || [],
      policies: listing?.policies || [],
      images: listing?.images || [],
    },
  });

  const { handleSubmit, setValue, watch, setError, clearErrors } = formMethods;

  const amenities = watch("amenities");
  const policies = watch("policies");
  const existingImages = watch("images") ?? [];

  // =============================================================================
  // IMAGE PREVIEW URLs (with memory leak prevention)
  // =============================================================================

  /** Memoized preview URLs to prevent unnecessary recalculations */
  const previewUrls = useMemo(() => {
    return newFiles.map((file) => URL.createObjectURL(file));
  }, [newFiles]);

  /** Cleanup object URLs to prevent memory leaks */
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // =============================================================================
  // NAVIGATION HANDLERS
  // =============================================================================

  /** Navigate to a specific step with direction animation */
  const goToStep = useCallback(
    (step: number) => {
      if (step === currentStep || step < 1 || step > WIZARD_STEPS.length)
        return;
      setDirection(step > currentStep ? "right" : "left");
      setCurrentStep(step);
    },
    [currentStep],
  );

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    goToStep(currentStep + 1);
  };

  const goBack = (e: React.MouseEvent) => {
    e.preventDefault();
    goToStep(currentStep - 1);
  };

  // =============================================================================
  // DROPZONE SETUP
  // =============================================================================

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setNewFiles((prev) => {
        if (acceptedFiles.length > 0) {
          clearErrors("images");
        }
        return [...prev, ...acceptedFiles];
      });
    },
    [clearErrors],
  );

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

  // =============================================================================
  // IMAGE HANDLERS
  // =============================================================================

  const removeNewFile = (index: number) => {
    setImageToDelete({ index, type: "new" });
  };

  const removeExistingImage = (index: number) => {
    setImageToDelete({ index, type: "existing" });
  };

  const confirmDeleteImage = () => {
    if (!imageToDelete) return;

    if (imageToDelete.type === "new") {
      // Revoke the URL before removing to prevent memory leak
      URL.revokeObjectURL(previewUrls[imageToDelete.index]);
      setNewFiles((prev) => prev.filter((_, i) => i !== imageToDelete.index));
    } else {
      setValue(
        "images",
        existingImages.filter((_, i) => i !== imageToDelete.index),
        { shouldValidate: true },
      );
    }
    setImageToDelete(null);
  };

  // =============================================================================
  // AMENITIES HANDLERS
  // =============================================================================

  const handleAddAmenity = () => {
    if (currentAmenity.trim()) {
      setValue("amenities", [...amenities, currentAmenity.trim()], {
        shouldValidate: true,
      });
      setCurrentAmenity("");
    }
  };

  const handleRemoveAmenity = (amenityToRemove: string) => {
    setValue(
      "amenities",
      amenities.filter((amenity) => amenity !== amenityToRemove),
      { shouldValidate: true },
    );
  };

  const toggleAmenity = (amenity: string) => {
    if (amenities.includes(amenity)) {
      setValue(
        "amenities",
        amenities.filter((a) => a !== amenity),
        { shouldValidate: true },
      );
    } else {
      setValue("amenities", [...amenities, amenity], { shouldValidate: true });
    }
  };

  // =============================================================================
  // POLICIES HANDLERS
  // =============================================================================

  const handleAddPolicy = () => {
    if (currentPolicy.trim()) {
      setValue("policies", [...policies, currentPolicy.trim()], {
        shouldValidate: true,
      });
      setCurrentPolicy("");
    }
  };

  const handleRemovePolicy = (policyToRemove: string) => {
    setValue(
      "policies",
      policies.filter((policy) => policy !== policyToRemove),
      { shouldValidate: true },
    );
  };

  const togglePolicy = (policy: string) => {
    if (policies.includes(policy)) {
      setValue(
        "policies",
        policies.filter((p) => p !== policy),
        { shouldValidate: true },
      );
    } else {
      setValue("policies", [...policies, policy], { shouldValidate: true });
    }
  };

  // =============================================================================
  // FORM SUBMISSION
  // =============================================================================

  /** Uploads a single file and returns the result */
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("files", file);
    return uploadListingImagesAction(formData);
  };

  const onSubmit: SubmitHandler<FrontendListingInput> = async (data) => {
    // Manual validation for images (frontend schema makes images optional)
    if (newFiles.length === 0 && existingImages.length === 0) {
      setError("images", {
        type: "manual",
        message: "At least one image is required",
      });
      goToStep(6);
      return;
    }

    setUploadStatus("uploading");

    // 1. Upload new images in parallel
    const newlyUploadedUrls: string[] = [];

    if (newFiles.length > 0) {
      try {
        const uploadResults = await Promise.allSettled(
          newFiles.map(uploadFile),
        );

        // Filter successful uploads
        uploadResults.forEach((result) => {
          if (
            result.status === "fulfilled" &&
            result.value?.success &&
            result.value?.urls
          ) {
            newlyUploadedUrls.push(...result.value.urls);
          }
        });

        // Check for partial failures
        const failedCount = uploadResults.filter(
          (r) =>
            r.status === "rejected" ||
            (r.status === "fulfilled" && !r.value?.success),
        ).length;
        if (failedCount > 0) {
          toast.warning(
            `Failed to upload ${failedCount} images. Continuing with successful ones.`,
          );
        }

        // Critical: If we ended up with NO images (neither existing nor new), stop.
        if (existingImages.length === 0 && newlyUploadedUrls.length === 0) {
          throw new Error(
            "All image uploads failed. At least one image is required.",
          );
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload images.",
        );

        // Rollback: delete any successfully uploaded images from this batch
        if (newlyUploadedUrls.length > 0) {
          await Promise.all(
            newlyUploadedUrls.map((url) => deleteListingImageAction(url)),
          );
        }

        setUploadStatus("idle");
        return;
      }
    }

    // 2. Prepare final data with complete images array
    const finalImages = [...existingImages, ...newlyUploadedUrls];
    const finalData: ListingInput = {
      ...data,
      images: finalImages,
    } as ListingInput;

    // 3. Save listing
    setUploadStatus("saving");

    startTransition(async () => {
      try {
        if (mode === "edit" && listing?._id) {
          await updateListing(listing._id, finalData);
          toast.success("Listing updated successfully");
        } else {
          await createListing(finalData);
          toast.success("Listing created successfully");
        }

        // Clear temporary files on success
        setNewFiles([]);
        router.refresh();
        router.push("/hosting/listings");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : `Failed to ${mode} listing`;
        toast.error(message);

        // 4. Rollback: If saving listing fails, delete the images we just uploaded
        if (newlyUploadedUrls.length > 0) {
          toast.info("Cleaning up uploaded images...");
          await Promise.all(
            newlyUploadedUrls.map((url) => deleteListingImageAction(url)),
          );
        }

        setUploadStatus("idle");
      }
    });
  };

  /** Handles form errors by navigating to the first step with an error */
  const handleFormErrors = (errors: FieldErrors<FrontendListingInput>) => {
    const errorStep = Object.keys(STEP_FIELDS_MAP).find((step) => {
      const stepNumber = parseInt(step);
      return STEP_FIELDS_MAP[stepNumber].some(
        (field) => errors[field] !== undefined,
      );
    });

    if (errorStep) {
      goToStep(parseInt(errorStep));
    }
  };

  // =============================================================================
  // RENDER CURRENT STEP
  // =============================================================================

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <StepBasics />;
      case 2:
        return <StepLocation />;
      case 3:
        return <StepDetails />;
      case 4:
        return <StepPricing />;
      case 5:
        return (
          <StepAmenities
            currentAmenity={currentAmenity}
            setCurrentAmenity={setCurrentAmenity}
            onAddAmenity={handleAddAmenity}
            onRemoveAmenity={handleRemoveAmenity}
            onToggleAmenity={toggleAmenity}
          />
        );
      case 6:
        return (
          <StepPolicies
            currentPolicy={currentPolicy}
            setCurrentPolicy={setCurrentPolicy}
            onAddPolicy={handleAddPolicy}
            onRemovePolicy={handleRemovePolicy}
            onTogglePolicy={togglePolicy}
          />
        );
      case 7:
        return (
          <StepPhotos
            newFiles={newFiles}
            previewUrls={previewUrls}
            onRemoveNewFile={removeNewFile}
            onRemoveExistingImage={removeExistingImage}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
          />
        );
      case 8:
        return <StepPreview previewUrls={previewUrls} />;
      default:
        return null;
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <FormProvider {...formMethods}>
      <div className="min-h-[calc(100vh-200px)] flex flex-col">
        {/* Form Content */}
        <div className="flex-1 overflow-hidden">
          <form className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto pb-40 md:pb-24">
              <div className="max-w-2xl mx-auto">
                <div
                  key={currentStep}
                  className={cn(
                    "animate-in fade-in duration-500 ease-out",
                    direction === "right"
                      ? "slide-in-from-right-8"
                      : "slide-in-from-left-8",
                  )}
                >
                  {renderCurrentStep()}
                </div>
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="fixed left-0 right-0 z-50 bottom-0 bg-background">
              {/* Progress Bar */}
              <div className="w-full h-1 bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-in-out"
                  style={{
                    width: `${(currentStep / WIZARD_STEPS.length) * 100}%`,
                  }}
                />
              </div>
              <div className="container py-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={currentStep === 1 ? () => router.back() : goBack}
                  disabled={isPending || uploadStatus !== "idle"}
                >
                  {currentStep === 1 ? "Cancel" : "Back"}
                </Button>

                {currentStep !== WIZARD_STEPS.length ? (
                  <Button type="button" onClick={goNext} size="lg">
                    Next
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="lg"
                      disabled={isPending || uploadStatus !== "idle"}
                      onClick={() => setShowConfirmDialog(true)}
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

                    <AlertDialog
                      open={showConfirmDialog}
                      onOpenChange={setShowConfirmDialog}
                    >
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {mode === "edit"
                              ? "Update Listing?"
                              : "Create Listing?"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {mode === "edit"
                              ? "Are you sure you want to update this listing? The changes will be visible to guests immediately."
                              : "Are you sure you want to create this listing? Once published, it will be visible to guests."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              setShowConfirmDialog(false);
                              handleSubmit(onSubmit, handleFormErrors)();
                            }}
                          >
                            {mode === "edit" ? "Yes, Update" : "Yes, Create"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>

            {/* Image Deletion Confirmation Dialog */}
            <AlertDialog
              open={!!imageToDelete}
              onOpenChange={(open) => !open && setImageToDelete(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Image?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove this image? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDeleteImage}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </form>
        </div>
      </div>
    </FormProvider>
  );
}
