import { redirect } from "next/navigation";
import { getListing } from "@/services/listings.service";
import { getServerUser } from "@/lib/auth/server-auth";
import { ListingForm } from "@/components/dashboard/ListingForm";

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
    redirect("/dashboard/listings");
  }

  // Verify ownership
  if (
    listing.host._id.toString() !== user._id.toString() &&
    user.role !== "Admin"
  ) {
    redirect("/dashboard/listings");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <ListingForm listing={listing} mode="edit" />
    </div>
  );
}
