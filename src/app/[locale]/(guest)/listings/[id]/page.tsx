import Image from "next/image";
import {
  getListing,
  getListingBookedDates,
  Listing,
} from "@/services/listings.service";
import { getCalendarDates } from "@/services/calendar-dates.service";
import { getWishlist } from "@/services/wishlist.service";
import { getReviews } from "@/services/reviews.server";
import { BookingForm } from "@/components/booking/BookingForm";
import { ReviewSection } from "@/components/review/ReviewSection";
import { notFound } from "next/navigation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShareButton } from "@/components/listing/ShareButton";
import { SaveButton } from "@/components/listing/SaveButton";
import { getLocale, getTranslations } from "next-intl/server";
import { Review } from "@/types";
import QuestionList from "@/components/Question/QuestionList";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("listing_details");
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  let listing: Listing;
  let bookedDates: {
    from: string;
    to: string;
    type?: "booking" | "blocked";
  }[] = [];
  let customPrices: Record<string, number> = {};
  let isInWishlist = false;
  let reviews: Review[] | undefined = [];

  try {
    listing = await getListing(id, locale);
    bookedDates = await getListingBookedDates(id);

    // Fetch custom prices for the next year
    try {
      const today = new Date();
      const nextYear = new Date(today);
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      const calendarData = await getCalendarDates(
        id,
        today.toISOString(),
        nextYear.toISOString(),
      );

      calendarData.forEach((cd) => {
        if (cd.customPrice) {
          // cd.date is string from API
          const dateKey = cd.date.toString().split("T")[0];
          customPrices[dateKey] = cd.customPrice;
        }
      });
    } catch (error: any) {
      if (error?.digest?.startsWith("NEXT_REDIRECT")) {
        throw error;
      }
      console.error("Failed to fetch calendar dates:", error);
    }

    // Fetch reviews for the listing
    try {
      reviews = await getReviews(id);
    } catch {
      // Reviews fetch failed, continue without reviews
      reviews = [];
    }

    // Check wishlist using the same approach as home page
    try {
      const wishlist = await getWishlist(locale);
      const validWishlist = wishlist.filter((item) => item.listing !== null);
      isInWishlist = validWishlist.some(
        (item) => item.listing._id === listing._id,
      );
    } catch {
      // User not logged in - wishlist check skipped
      isInWishlist = false;
    }
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    notFound();
  }

  return (
    <main className="container max-w-6xl! py-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-2xl font-semibold text-foreground text-start">
            {listing.title}
          </h1>
          <div className="flex gap-2">
            <ShareButton listingTitle={listing.title} />
            <SaveButton
              listingId={listing._id}
              initialIsInWishlist={isInWishlist}
            />
          </div>
        </div>
      </div>

      {/* Images Carousel Section */}
      <div className="mb-8 rounded-3xl overflow-hidden relative group">
        {listing.images.length === 1 ? (
          <div className="relative aspect-4/3 sm:aspect-video max-h-96 w-full">
            <Image
              src={listing.images[0]}
              alt={`${listing.title} - Image 1`}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <Carousel
            dir={dir}
            opts={{
              direction: dir,
            }}
            className="w-full"
          >
            <CarouselContent>
              {listing.images.map((image, index) => (
                <CarouselItem
                  key={index}
                  className="sm:basis-1/2 lg:basis-1/2 cursor-pointer z-40"
                >
                  <div className="relative aspect-4/3 sm:aspect-video w-full">
                    <Image
                      src={image}
                      alt={`${listing.title} - Image ${index + 1}`}
                      fill
                      className="object-cover hover:opacity-95 transition-opacity"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="start-2 bg-background!" />
            <CarouselNext className="end-2 bg-background!" />
          </Carousel>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-8 gap-12 relative">
        {/* Left Column: Details */}
        <div className="lg:col-span-5 space-y-8 text-start">
          {/* Title & Stats */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-1" dir="auto">
              {listing.privacyType === "entire_place"
                ? t("entire_home")
                : listing.privacyType === "private_room"
                  ? t("private_room")
                  : t("shared_room")}{" "}
              {t("in_location", {
                city: listing.location.city,
                country: listing.location.country,
              })}
            </h2>
            <div className="flex gap-1 text-sm text-muted-foreground">
              <span>{t("guests", { count: listing.maxGuests })}</span>
              <span>·</span>
              <span>{t("bedrooms", { count: listing.bedrooms })}</span>
              <span>·</span>
              <span>{t("beds", { count: listing.beds })}</span>
              <span>·</span>
              <span>{t("baths", { count: listing.bathrooms })}</span>
            </div>
          </div>

          {/* Host Section */}
          <div className="border-b pb-6 flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={listing.host.avatar} />
              <AvatarFallback>
                {listing.host.name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-base">
                {t("hosted_by", { name: listing.host.name })}
              </span>
              {listing.host.createdAt && (
                <span className="text-muted-foreground text-sm">
                  {t("joined", {
                    date: new Date(listing.host.createdAt).toLocaleDateString(
                      locale === "ar" ? "ar-EG" : "en-US",
                      {
                        month: "long",
                        year: "numeric",
                      },
                    ),
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Features / Highlights */}
          <div className="border-b pb-6 space-y-4">
            <div className="flex gap-4">
              <div className="mt-1">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="text-start">
                <h3 className="font-semibold">{t("great_location")}</h3>
                <p className="text-muted-foreground text-sm">
                  {t("great_location_desc")}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-b pb-6">
            {/* <h2 className="text-xl font-semibold mb-4">About this place</h2> */}
            <p className="leading-relaxed text-muted-foreground whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div className="border-b pb-6 text-start">
              <h2 className="text-xl font-semibold mb-4">
                {t("what_this_place_offers")}
              </h2>
              <div className="grid grid-cols-2 gap-y-3">
                {listing.amenities.map((amenity) => (
                  <div key={amenity} className="text-muted-foreground">
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Policies */}
          {listing.policies && listing.policies.length > 0 && (
            <div className="border-b pb-6 text-start">
              <h2 className="text-xl font-semibold mb-4">{t("house_rules")}</h2>
              <div className="grid grid-cols-2 gap-y-3">
                {listing.policies.map((policy, index) => (
                  <div key={index} className="text-muted-foreground">
                    {policy}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="border-b pb-6">
            <ReviewSection listingId={id} initialReviews={reviews} />
          </div>

          {/* Questions Section */}
          <div className="pb-6">
            <QuestionList listingId={id} hostId={listing.host._id} />
          </div>
        </div>

        {/* Right Column: Sticky Booking Card */}
        <div className="relative lg:col-span-3">
          <div className="sticky top-8">
            <BookingForm
              listing={listing}
              bookedDates={bookedDates}
              customPrices={customPrices}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
