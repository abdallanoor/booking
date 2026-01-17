import Image from "next/image";
import {
  getListing,
  getListingBookedDates,
  Listing,
} from "@/services/listings.service";
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
import { Review } from "@/types";
import QuestionList from "@/components/Question/QuestionList";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let listing: Listing;
  let bookedDates: { from: string; to: string }[] = [];
  let isInWishlist = false;
  let reviews: Review[] | undefined = [];

  try {
    listing = await getListing(id);
    bookedDates = await getListingBookedDates(id);

    // Fetch reviews for the listing
    try {
      reviews = await getReviews(id);
    } catch {
      // Reviews fetch failed, continue without reviews
      reviews = [];
    }

    // Check wishlist using the same approach as home page
    try {
      const wishlist = await getWishlist();
      const validWishlist = wishlist.filter((item) => item.listing !== null);
      isInWishlist = validWishlist.some(
        (item) => item.listing._id === listing._id
      );
    } catch {
      // User not logged in - wishlist check skipped
      isInWishlist = false;
    }
  } catch {
    notFound();
  }

  return (
    <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-semibold text-foreground">
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
      <div className="mb-8 rounded-xl overflow-hidden relative group">
        <Carousel className="w-full">
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
          <CarouselPrevious className="left-4 bg-background!" />
          <CarouselNext className="right-4 bg-background!" />
        </Carousel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title & Stats */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-1">
              {listing.privacyType === "entire_place"
                ? "Entire home"
                : listing.privacyType === "private_room"
                ? "Private room"
                : "Shared room"}{" "}
              in {listing.location.city}, {listing.location.country}
            </h2>
            <div className="flex gap-1 text-sm text-muted-foreground">
              <span>{listing.maxGuests} guests</span>
              <span>·</span>
              <span>{listing.bedrooms} bedrooms</span>
              <span>·</span>
              <span>{listing.beds} beds</span>
              <span>·</span>
              <span>{listing.bathrooms} baths</span>
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
                Hosted by {listing.host.name}
              </span>
              {listing.host.createdAt && (
                <span className="text-muted-foreground text-sm">
                  Joined{" "}
                  {new Date(listing.host.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      year: "numeric",
                    }
                  )}
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
              <div>
                <h3 className="font-semibold">Great location</h3>
                <p className="text-muted-foreground text-sm">
                  Guests love the location of this listing.
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
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold mb-4">
                What this place offers
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
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold mb-4">House Rules</h2>
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
        <div className="relative">
          <div className="sticky top-8">
            <BookingForm listing={listing} bookedDates={bookedDates} />
          </div>
        </div>
      </div>
    </main>
  );
}
