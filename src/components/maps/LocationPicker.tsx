"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import { useGoogleMaps } from "./GoogleMapsProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Navigation, Edit3 } from "lucide-react";

export interface LocationData {
  streetAddress: string;
  apt?: string;
  city: string;
  governorate?: string;
  country: string;
  postalCode?: string;
  coordinates: { lat: number; lng: number };
  placeId?: string;
  formattedAddress?: string;
}

interface LocationPickerProps {
  value: LocationData | null;
  onChange: (location: LocationData) => void;
}

type InputMode = "search" | "current" | "manual" | null;

const mapContainerStyle = {
  width: "100%",
  height: "200px",
};

const defaultCenter = {
  lat: 30.0444, // Cairo, Egypt
  lng: 31.2357,
};

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [inputMode, setInputMode] = useState<InputMode>(
    value ? "search" : null
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(!!value);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Form fields for confirmation
  const [formFields, setFormFields] = useState<LocationData>({
    streetAddress: value?.streetAddress || "",
    apt: value?.apt || "",
    city: value?.city || "",
    governorate: value?.governorate || "",
    country: value?.country || "",
    postalCode: value?.postalCode || "",
    coordinates: value?.coordinates || { lat: 0, lng: 0 },
    placeId: value?.placeId || "",
    formattedAddress: value?.formattedAddress || "",
  });

  // Update form fields when value prop changes
  useEffect(() => {
    if (value) {
      setFormFields(value);
      setShowConfirmation(true);
    }
  }, [value]);

  // Update parent when form fields change
  useEffect(() => {
    if (
      showConfirmation &&
      formFields.streetAddress &&
      formFields.city &&
      formFields.country &&
      formFields.coordinates.lat !== 0
    ) {
      onChange(formFields);
    }
  }, [formFields, showConfirmation, onChange]);

  // Parse address components from Google Place result
  const parseAddressComponents = useCallback(
    (place: google.maps.places.PlaceResult): Partial<LocationData> => {
      const components = place.address_components || [];
      const result: Partial<LocationData> = {
        formattedAddress: place.formatted_address,
        placeId: place.place_id,
      };

      for (const component of components) {
        const types = component.types;

        if (types.includes("street_number")) {
          result.streetAddress = component.long_name;
        } else if (types.includes("route")) {
          result.streetAddress = result.streetAddress
            ? `${result.streetAddress} ${component.long_name}`
            : component.long_name;
        } else if (
          types.includes("locality") ||
          types.includes("administrative_area_level_2")
        ) {
          result.city = component.long_name;
        } else if (types.includes("administrative_area_level_1")) {
          result.governorate = component.long_name;
        } else if (types.includes("country")) {
          result.country = component.long_name;
        } else if (types.includes("postal_code")) {
          result.postalCode = component.long_name;
        }
      }

      // Use formatted address as street if we couldn't parse it
      if (!result.streetAddress && place.formatted_address) {
        const parts = place.formatted_address.split(",");
        result.streetAddress = parts[0]?.trim() || "";
      }

      if (place.geometry?.location) {
        result.coordinates = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
      }

      return result;
    },
    []
  );

  // Handle autocomplete place selection
  const onPlaceSelected = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place || !place.geometry?.location) return;

    const parsed = parseAddressComponents(place);
    setFormFields((prev) => ({
      ...prev,
      streetAddress: parsed.streetAddress || "",
      city: parsed.city || "",
      governorate: parsed.governorate || "",
      country: parsed.country || "",
      postalCode: parsed.postalCode || "",
      coordinates: parsed.coordinates || prev.coordinates,
      placeId: parsed.placeId || "",
      formattedAddress: parsed.formattedAddress || "",
    }));
    setShowConfirmation(true);
  }, [parseAddressComponents]);

  // Handle current location detection
  const detectCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingLocation(true);
    setInputMode("current");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder();
        try {
          const response = await geocoder.geocode({
            location: { lat: latitude, lng: longitude },
          });

          if (response.results[0]) {
            const parsed = parseAddressComponents(response.results[0]);
            setFormFields((prev) => ({
              ...prev,
              streetAddress: parsed.streetAddress || "",
              city: parsed.city || "",
              governorate: parsed.governorate || "",
              country: parsed.country || "",
              postalCode: parsed.postalCode || "",
              coordinates: { lat: latitude, lng: longitude },
              placeId: parsed.placeId || "",
              formattedAddress: parsed.formattedAddress || "",
            }));
            setShowConfirmation(true);
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          // Still set coordinates even if geocoding fails
          setFormFields((prev) => ({
            ...prev,
            coordinates: { lat: latitude, lng: longitude },
          }));
          setShowConfirmation(true);
        }
        setIsDetectingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to detect your location. Please try another method.");
        setIsDetectingLocation(false);
        setInputMode(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [parseAddressComponents]);

  // Handle manual entry
  const startManualEntry = useCallback(() => {
    setInputMode("manual");
    setShowConfirmation(true);
  }, []);

  // Reset to selection mode
  const resetSelection = useCallback(() => {
    setInputMode(null);
    setShowConfirmation(false);
    setFormFields({
      streetAddress: "",
      apt: "",
      city: "",
      governorate: "",
      country: "",
      postalCode: "",
      coordinates: { lat: 0, lng: 0 },
      placeId: "",
      formattedAddress: "",
    });
  }, []);

  // Handle form field change
  const handleFieldChange = (field: keyof LocationData, value: string) => {
    setFormFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loadError) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        Error loading Google Maps. Please check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading maps...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Input Method Selection */}
      {!showConfirmation && (
        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Autocomplete
              onLoad={(autocomplete) => {
                autocompleteRef.current = autocomplete;
              }}
              onPlaceChanged={onPlaceSelected}
              options={{
                types: ["address"],
                fields: [
                  "address_components",
                  "formatted_address",
                  "geometry",
                  "place_id",
                ],
              }}
            >
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for address..."
                  className="pl-10"
                  onClick={() => setInputMode("search")}
                />
              </div>
            </Autocomplete>
          </div>

          {/* Alternative Options */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={detectCurrentLocation}
              disabled={isDetectingLocation}
              className="h-auto py-3"
            >
              {isDetectingLocation ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm">Use Current Location</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={startManualEntry}
              className="h-auto py-3"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              <span className="text-sm">Enter Manually</span>
            </Button>
          </div>
        </div>
      )}

      {/* Address Confirmation Form */}
      {showConfirmation && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Confirm Address Details</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetSelection}
            >
              Change
            </Button>
          </div>

          <div className="grid gap-4">
            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="location-country">Country / Region *</Label>
              <Input
                id="location-country"
                value={formFields.country}
                onChange={(e) => handleFieldChange("country", e.target.value)}
                placeholder="Egypt"
                required
              />
            </div>

            {/* Street Address */}
            <div className="space-y-2">
              <Label htmlFor="location-street">Street Address *</Label>
              <Input
                id="location-street"
                value={formFields.streetAddress}
                onChange={(e) =>
                  handleFieldChange("streetAddress", e.target.value)
                }
                placeholder="123 Main Street"
                required
              />
            </div>

            {/* Apt / Suite */}
            <div className="space-y-2">
              <Label htmlFor="location-apt">Apt, Suite, Room, etc.</Label>
              <Input
                id="location-apt"
                value={formFields.apt || ""}
                onChange={(e) => handleFieldChange("apt", e.target.value)}
                placeholder="Apt 5B"
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="location-city">City / Markaz *</Label>
              <Input
                id="location-city"
                value={formFields.city}
                onChange={(e) => handleFieldChange("city", e.target.value)}
                placeholder="Cairo"
                required
              />
            </div>

            {/* Governorate */}
            <div className="space-y-2">
              <Label htmlFor="location-governorate">Governorate</Label>
              <Input
                id="location-governorate"
                value={formFields.governorate || ""}
                onChange={(e) =>
                  handleFieldChange("governorate", e.target.value)
                }
                placeholder="Cairo Governorate"
              />
            </div>

            {/* Postal Code */}
            <div className="space-y-2">
              <Label htmlFor="location-postal">Postal Code</Label>
              <Input
                id="location-postal"
                value={formFields.postalCode || ""}
                onChange={(e) => handleFieldChange("postalCode", e.target.value)}
                placeholder="12345"
              />
            </div>
          </div>

          {/* Map Preview */}
          {formFields.coordinates.lat !== 0 && (
            <div className="space-y-2">
              <Label>Location Preview</Label>
              <div className="rounded-lg overflow-hidden border">
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={formFields.coordinates}
                  zoom={15}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    draggable: false,
                  }}
                >
                  <Marker position={formFields.coordinates} />
                </GoogleMap>
              </div>
              <p className="text-xs text-muted-foreground">
                {formFields.formattedAddress ||
                  `${formFields.streetAddress}, ${formFields.city}, ${formFields.country}`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
