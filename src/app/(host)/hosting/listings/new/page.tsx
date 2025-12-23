import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server-auth";
import { ListingForm } from "@/components/hosting/ListingForm";

export default async function NewListingPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role !== "Host" && user.role !== "Admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <ListingForm mode="create" />
    </div>
  );
}
