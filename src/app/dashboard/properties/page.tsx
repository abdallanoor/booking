import { redirect } from "next/navigation";
import { getPropertiesAction } from "@/actions";
import { PropertiesList } from "@/components/dashboard/PropertiesList";
import { getServerUser } from "@/lib/auth/server-auth";

export default async function DashboardPropertiesPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch properties (API handles filtering based on role)
  const response = await getPropertiesAction();
  const properties = response.data.properties;

  return (
    <PropertiesList
      initialProperties={properties}
      userRole={user.role as "Admin" | "Host"}
    />
  );
}
