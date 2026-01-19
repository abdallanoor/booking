import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server-auth";
import { ListingForm } from "@/components/hosting/ListingForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default async function NewListingPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role !== "Host" && user.role !== "Admin") {
    redirect("/hosting");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hosting/listings">
          <Button variant="secondary" size="icon" className="rounded-full">
            <ChevronLeft />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Listing</h1>
          <p className="text-muted-foreground">Add a new listing</p>
        </div>
      </div>
      <ListingForm mode="create" />
    </div>
  );
}
