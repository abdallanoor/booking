"use client";

import { Link } from "@/navigation";
import { usePathname } from "@/navigation";
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
  MessageSquare,
} from "lucide-react";
import { useTransition, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useRouter } from "nextjs-toploader/app";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { Section, HeaderUser } from "@/types";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLocale, useTranslations } from "next-intl";

const emptySubscribe = () => () => {};

interface HeaderProps {
  links?: { href: string; label: string; icon?: LucideIcon }[];
}

export function Header({ links }: HeaderProps) {
  const { user, logout, loading } = useAuth();
  const section = useSection();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("nav");

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
          loading: t("logging_out"),
          success: t("logged_out_success"),
          error: t("failed_logout"),
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
          <SectionNavigation customLinks={links} />
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
  const t = useTranslations("nav");
  return (
    <Link href="/" prefetch={false} className="text-2xl font-bold text-primary">
      {t("booking")}
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
  customLinks,
}: {
  customLinks?: { href: string; label: string; icon?: LucideIcon }[];
}) {
  const pathname = usePathname();
  const routes = customLinks || [];

  if (routes.length === 0) return null;

  // Find the best matching link (the longest one that matches the current pathname)
  const activeLink = routes
    .filter(
      (l) =>
        pathname === l.href ||
        (l.href !== "/" && pathname?.startsWith(l.href + "/")),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <nav className="hidden md:flex items-center gap-px absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          prefetch={false}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary hover:bg-accent py-1.5 px-3 rounded-full leading-normal dark:hover:bg-accent/50",
            activeLink?.href === route.href
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
  const t = useTranslations("nav");
  if (user) return null;

  return (
    <Link href="/auth/login" prefetch={false}>
      <Button size="sm" variant="ghost">
        {t("login")}
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
  const t = useTranslations("nav");
  if (!user) return null;

  return (
    <div className="hidden md:flex items-center gap-2">
      {/* Admin specific header actions */}
      {user.role === "Admin" && (
        <>
          {section === "guest" ? (
            <>
              <Link href="/admin" prefetch={false}>
                <Button variant="ghost" size="sm">
                  {t("switch_to_admin")}
                </Button>
              </Link>
            </>
          ) : null}
        </>
      )}

      {/* Host specific header actions */}
      {user.role === "Host" && (
        <Link href={section === "guest" ? "/hosting" : "/"} prefetch={false}>
          <Button variant="ghost" size="sm">
            {section === "guest"
              ? t("switch_to_hosting")
              : t("switch_to_travelling")}
          </Button>
        </Link>
      )}

      {/* Guest specific header actions */}
      {user.role === "Guest" && (
        <Link href="/become-host" prefetch={false}>
          <Button variant="ghost" size="sm">
            {t("become_host")}
          </Button>
        </Link>
      )}
    </div>
  );
}

function UserProfileLink({ user }: { user: HeaderUser | null }) {
  if (!user) return null;

  return (
    <Link href="/profile" prefetch={false}>
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
  const locale = useLocale();

  return (
    <DropdownMenu dir={locale === "ar" ? "rtl" : "ltr"}>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon">
          <Menu />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 mt-2.5">
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
  const t = useTranslations("nav");
  return (
    <>
      <div
        dir="ltr"
        className="px-2 py-1.5 focus:bg-accent focus:text-accent-foreground outline-none"
      >
        <p className="font-semibold truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      <DropdownMenuSeparator />

      <MenuItem href="/profile" icon={User} label={t("profile")} />
      <MenuItem
        href={section === "hosting" ? "/hosting/messages" : "/messages"}
        icon={MessageSquare}
        label={t("messages")}
      />
      <MenuItem href="/bookings" icon={Calendar} label={t("my_bookings")} />
      <MenuItem href="/wishlist" icon={Heart} label={t("wishlist")} />

      <DropdownMenuSeparator />

      {/* Role and Section based context switches */}
      {user.role === "Guest" && (
        <MenuItem
          href="/become-host"
          icon={Building2}
          label={t("become_host")}
        />
      )}

      {user.role === "Host" && (
        <MenuItem
          href={section === "hosting" ? "/" : "/hosting"}
          icon={section === "hosting" ? Map : Building2}
          label={
            section === "hosting"
              ? t("switch_to_travelling")
              : t("switch_to_hosting")
          }
        />
      )}

      {user.role === "Admin" && (
        <>
          {section === "guest" && (
            <>
              <MenuItem
                href="/admin"
                icon={Shield}
                label={t("switch_to_admin")}
              />
              <MenuItem
                href="/hosting"
                icon={Building2}
                label={t("switch_to_hosting")}
              />
            </>
          )}
          {section === "admin" && (
            <>
              <MenuItem href="/" icon={Map} label={t("switch_to_travelling")} />
              <MenuItem
                href="/hosting"
                icon={Building2}
                label={t("switch_to_hosting")}
              />
            </>
          )}
          {section === "hosting" && (
            <>
              <MenuItem href="/" icon={Map} label={t("switch_to_travelling")} />
              <MenuItem
                href="/admin"
                icon={Shield}
                label={t("switch_to_admin")}
              />
            </>
          )}
        </>
      )}

      <DropdownMenuSeparator />
      <LanguageSwitcher />
      <ThemeToggle />
      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={onLogout} disabled={isPending}>
        <LogOut />
        {t("logout")}
      </DropdownMenuItem>
    </>
  );
}

function GuestMenu() {
  const t = useTranslations("nav");
  return (
    <>
      <MenuItem href="/auth/login" icon={LogIn} label={t("login")} />
      <MenuItem href="/auth/register" icon={UserPlus} label={t("sign_up")} />
      <DropdownMenuSeparator />
      <LanguageSwitcher />
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
      <Link href={href} prefetch={false}>
        <Icon />
        {label}
      </Link>
    </DropdownMenuItem>
  );
}
