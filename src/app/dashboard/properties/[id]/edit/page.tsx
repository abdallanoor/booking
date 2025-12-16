import { redirect } from "next/navigation";
import { getProperty } from "@/services/properties.service";
import { getServerUser } from "@/lib/auth/server-auth";
import { PropertyForm } from "@/components/dashboard/PropertyForm";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getServerUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    redirect("/dashboard/properties");
  }

  // Verify ownership
  if (
    property.host._id.toString() !== user._id.toString() &&
    user.role !== "Admin"
  ) {
    redirect("/dashboard/properties");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <PropertyForm property={property} mode="edit" />
    </div>
  );
}
