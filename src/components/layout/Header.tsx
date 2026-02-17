"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSection } from "@/contexts/SectionContext";
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
  LogOut,
  LogIn,
  UserPlus,
  User,
  type LucideIcon,
  Shield,
  Map,
  Building2,
} from "lucide-react";
import { useTransition, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useRouter } from "nextjs-toploader/app";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { Section, HeaderUser } from "@/types";

const emptySubscribe = () => () => {};

interface HeaderProps {
  links?: { href: string; label: string; icon?: LucideIcon }[];
}

export function Header({ links }: HeaderProps) {
  const { user, logout, loading } = useAuth();
  const section = useSection();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modern hydration mismatch handling
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const handleLogout = () => {
    startTransition(async () => {
      toast.promise(
        (async () => {
          await logoutAction();
          await logout();
          router.push("/");
        })(),
        {
          loading: "Logging out...",
          success: "Logged out successfully",
          error: "Failed to logout",
        },
      );
    });
  };

  // Show skeleton while hydrating OR while auth state is loading
  if (!isClient || loading) return <HeaderSkeleton />;

  return (
    <header className="border-b bg-card">
      <div className="container py-2.5 relative">
        <div className="flex items-center justify-between">
          <Logo />
          <SectionNavigation section={section} customLinks={links} />
          <div className="flex items-center gap-3">
            <NavActions user={user as HeaderUser | null} section={section} />
            <AuthNavigation user={user as HeaderUser | null} />
            <UserProfileLink user={user as HeaderUser | null} />
            <UserMenu
              user={user as HeaderUser | null}
              section={section}
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
            <Button variant="secondary" size="icon">
              <Menu />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function SectionNavigation({
  section,
  customLinks,
}: {
  section: Section;
  customLinks?: { href: string; label: string; icon?: LucideIcon }[];
}) {
  const pathname = usePathname();
  const routes = customLinks || [];

  if (routes.length === 0) return null;

  const baseRoute = section === "hosting" ? "/hosting" : "/admin";

  return (
    <nav className="hidden md:flex items-center gap-px absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary hover:bg-accent py-1.5 px-3 rounded-full leading-normal dark:hover:bg-accent/50",
            pathname === route.href ||
              (route.href !== baseRoute && pathname?.startsWith(route.href))
              ? "text-primary bg-accent"
              : "text-muted-foreground",
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}

function AuthNavigation({ user }: { user: HeaderUser | null }) {
  if (user) return null;

  return (
    <Link href="/auth/login">
      <Button size="sm" variant="ghost">
        Login
      </Button>
    </Link>
  );
}

function NavActions({
  user,
  section,
}: {
  user: HeaderUser | null;
  section: Section;
}) {
  if (!user) return null;

  return (
    <div className="hidden md:flex items-center gap-2">
      {/* Admin specific header actions */}
      {user.role === "Admin" && (
        <>
          {section === "guest" ? (
            <>
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  Switch to admin
                </Button>
              </Link>
            </>
          ) : null}
        </>
      )}

      {/* Host specific header actions */}
      {user.role === "Host" && (
        <Link href={section === "guest" ? "/hosting" : "/"}>
          <Button variant="ghost" size="sm">
            {section === "guest" ? "Switch to hosting" : "Switch to travelling"}
          </Button>
        </Link>
      )}

      {/* Guest specific header actions */}
      {user.role === "Guest" && (
        <Link href="/become-host">
          <Button variant="ghost" size="sm">
            Become a Host
          </Button>
        </Link>
      )}
    </div>
  );
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
  section,
  isPending,
  onLogout,
}: {
  user: HeaderUser | null;
  section: Section;
  isPending: boolean;
  onLogout: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon">
          <Menu />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 mt-2.5">
        {user ? (
          <AuthenticatedMenu
            user={user}
            section={section}
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
  section,
  isPending,
  onLogout,
}: {
  user: HeaderUser;
  section: Section;
  isPending: boolean;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="px-2 py-1.5 focus:bg-accent focus:text-accent-foreground outline-none">
        <p className="font-semibold truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      <DropdownMenuSeparator />

      <MenuItem href="/profile" icon={User} label="Profile" />
      <MenuItem href="/bookings" icon={Calendar} label="My Bookings" />
      <MenuItem href="/wishlist" icon={Heart} label="Wishlist" />

      <DropdownMenuSeparator />

      {/* Role and Section based context switches */}
      {user.role === "Guest" && (
        <MenuItem href="/become-host" icon={Building2} label="Become a Host" />
      )}

      {user.role === "Host" && (
        <MenuItem
          href={section === "hosting" ? "/" : "/hosting"}
          icon={section === "hosting" ? Map : Building2}
          label={
            section === "hosting" ? "Switch to travelling" : "Switch to hosting"
          }
        />
      )}

      {user.role === "Admin" && (
        <>
          {section === "guest" && (
            <>
              <MenuItem href="/admin" icon={Shield} label="Switch to admin" />
              <MenuItem
                href="/hosting"
                icon={Building2}
                label="Switch to hosting"
              />
            </>
          )}
          {section === "admin" && (
            <>
              <MenuItem href="/" icon={Map} label="Switch to travelling" />
              <MenuItem
                href="/hosting"
                icon={Building2}
                label="Switch to hosting"
              />
            </>
          )}
          {section === "hosting" && (
            <>
              <MenuItem href="/" icon={Map} label="Switch to travelling" />
              <MenuItem href="/admin" icon={Shield} label="Switch to admin" />
            </>
          )}
        </>
      )}

      <DropdownMenuSeparator />
      <ThemeToggle />
      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={onLogout} disabled={isPending}>
        <LogOut />
        Logout
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
