import { GuestLayout } from "@/components/layout/GuestLayout";

export default function GuestRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestLayout>{children}</GuestLayout>;
}
