import { authServerService } from "@/services/auth.server";
import ProfileClient from "./ProfileClient";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  let user;
  try {
    user = await authServerService.getUser();
  } catch (error) {
    console.error("Profile page error:", error);
    redirect("/");
  }

  if (!user) {
    redirect("/");
  }

  return <ProfileClient initialUser={user} />;
}
