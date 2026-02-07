import { redirect } from "next/navigation";
import Link from "next/link";
import { getListing } from "@/services/listings.service";
import { getServerUser } from "@/lib/auth/server-auth";
import { ListingForm } from "@/components/hosting/ListingForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getServerUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    redirect("/hosting/listings");
  }

  // Verify ownership
  if (
    listing.host._id.toString() !== user._id.toString() &&
    user.role !== "Admin"
  ) {
    redirect("/hosting/listings");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center py-5 gap-4">
        <Link href="/hosting/listings">
          <Button variant="secondary" size="icon" className="rounded-full">
            <ChevronLeft />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Listing</h1>
        </div>
      </div>
      <ListingForm listing={listing} mode="edit" />
    </div>
  );
}
