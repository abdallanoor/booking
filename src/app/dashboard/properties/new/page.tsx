import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server-auth";
import { PropertyForm } from "@/components/dashboard/PropertyForm";

export default async function NewPropertyPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role !== "Host" && user.role !== "Admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <PropertyForm mode="create" />
    </div>
  );
}
