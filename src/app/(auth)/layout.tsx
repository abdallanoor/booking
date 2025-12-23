import { GuestLayout } from "@/components/layout/GuestLayout";

export default function AuthRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestLayout>{children}</GuestLayout>;
}
