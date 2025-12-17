"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logoutAction } from "@/actions";
import {
  Menu,
  Calendar,
  Heart,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserPlus,
  User,
  type LucideIcon,
  Map,
} from "lucide-react";
import { useTransition, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useRouter } from "nextjs-toploader/app";
import { ThemeToggle } from "@/components/theme-toggle";

// Types wrapper to ensure type safety with minimal noise
interface HeaderUser {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

const emptySubscribe = () => () => {};

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modern hydration mismatch handling
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await logoutAction();
        await logout();
        toast.success("Logged out successfully");
        router.push("/");
      } catch {
        toast.error("Failed to logout");
      }
    });
  };

  if (!isClient) return <HeaderSkeleton />;

  return (
    <header className="border-b bg-card">
      <div className="container py-2.5 relative">
        <div className="flex items-center justify-between">
          <Logo />
          <DashboardNavigation />
          <div className="flex items-center gap-3">
            <NavActions user={user as HeaderUser | null} />
            <UserProfileLink user={user as HeaderUser | null} />
            <UserMenu
              user={user as HeaderUser | null}
              isPending={isPending}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <Link href="/" className="text-2xl font-bold text-primary">
      Booking
    </Link>
  );
}

function HeaderSkeleton() {
  return (
    <header className="border-b bg-card">
      <div className="container py-2.5">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="icon" className="rounded-full">
              <Menu />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function DashboardNavigation() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  if (!isDashboard) return null;

  const dashboardRoutes = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/properties", label: "Properties" },
    { href: "/dashboard/bookings", label: "Bookings" },
  ];

  return (
    <nav className="hidden md:flex items-center gap-px absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      {dashboardRoutes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary hover:bg-accent py-1.5 px-3 rounded-full leading-normal dark:hover:bg-accent/50",
            pathname === route.href ||
              (route.href !== "/dashboard" && pathname?.startsWith(route.href))
              ? "text-primary bg-accent"
              : "text-muted-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}

function NavActions({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  if (!user) return null;

  if (isDashboard) {
    return (
      <Link href="/" className="hidden md:block">
        <Button variant="ghost" size="sm" className="rounded-full">
          Switch to travelling
        </Button>
      </Link>
    );
  }

  if (user.role === "Admin" || user.role === "Host") {
    return (
      <Link href="/dashboard" className="hidden md:block">
        <Button variant="ghost" size="sm" className="rounded-full">
          Switch to hosting
        </Button>
      </Link>
    );
  }

  if (user.role === "Guest") {
    return (
      <Link href="/become-host" className="hidden md:block">
        <Button variant="ghost" size="sm" className="rounded-full">
          Become a Host
        </Button>
      </Link>
    );
  }

  return null;
}

function UserProfileLink({ user }: { user: HeaderUser | null }) {
  if (!user) return null;

  return (
    <Link href="/profile">
      <Avatar className="size-9 hover:opacity-80 transition-opacity">
        {user.avatar && <AvatarImage src={user.avatar} />}
        <AvatarFallback className="bg-muted">
          {user.name?.[0]?.toUpperCase() ?? "U"}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}

function UserMenu({
  user,
  isPending,
  onLogout,
}: {
  user: HeaderUser | null;
  isPending: boolean;
  onLogout: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <Menu />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 mt-2.5">
        {user ? (
          <AuthenticatedMenu
            user={user}
            isPending={isPending}
            onLogout={onLogout}
          />
        ) : (
          <GuestMenu />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AuthenticatedMenu({
  user,
  isPending,
  onLogout,
}: {
  user: HeaderUser;
  isPending: boolean;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const showDashboard = user.role === "Admin" || user.role === "Host";

  return (
    <>
      <div className="px-2 py-1.5 focus:bg-accent focus:text-accent-foreground outline-none">
        <p className="font-semibold truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        <p className="text-xs text-muted-foreground mt-1 capitalize">
          {user.role}
        </p>
      </div>
      <DropdownMenuSeparator />

      <MenuItem href="/profile" icon={User} label="Profile" />
      <MenuItem href="/bookings" icon={Calendar} label="My Bookings" />
      <MenuItem href="/wishlist" icon={Heart} label="Wishlist" />

      {showDashboard && (
        <>
          <DropdownMenuSeparator />
          {pathname?.startsWith("/dashboard") ? (
            <MenuItem href="/" icon={Map} label="Switch to travelling" />
          ) : (
            <MenuItem
              href="/dashboard"
              icon={LayoutDashboard}
              label="Switch to hosting"
            />
          )}
        </>
      )}

      <DropdownMenuSeparator />
      <ThemeToggle />
      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={onLogout} disabled={isPending}>
        <LogOut />
        {isPending ? "Logging out..." : "Logout"}
      </DropdownMenuItem>
    </>
  );
}

function GuestMenu() {
  return (
    <>
      <MenuItem href="/auth/login" icon={LogIn} label="Login" />
      <MenuItem href="/auth/register" icon={UserPlus} label="Sign up" />
      <DropdownMenuSeparator />
      <ThemeToggle />
    </>
  );
}

function MenuItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <DropdownMenuItem asChild>
      <Link href={href}>
        <Icon />
        {label}
      </Link>
    </DropdownMenuItem>
  );
}
