import { redirect } from "next/navigation";
import { getListingsAction } from "@/actions";
import { ListingsList } from "@/components/dashboard/ListingsList";
import { getServerUser } from "@/lib/auth/server-auth";

export default async function DashboardListingsPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch listings (API handles filtering based on role)
  const response = await getListingsAction();
  const listings = response.data.listings;

  return (
    <ListingsList
      initialListings={listings}
      userRole={user.role as "Admin" | "Host"}
    />
  );
}
