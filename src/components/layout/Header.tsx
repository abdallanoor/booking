"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
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
  PlusCircle,
  LogOut,
  LogIn,
  UserPlus,
  User,
} from "lucide-react";
import { useTransition, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const emptySubscribe = () => () => {};

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modern hydration mismatch handling without useEffect
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

  // Prevent hydration mismatch by deferring user-specific rendering
  if (!isClient) {
    return (
      <header className="border-b bg-card">
        <div className="container py-2">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary">
              Booking
            </Link>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="flex items-center gap-2 rounded-full border p-1 pl-3 hover:shadow-md transition-shadow h-auto"
              >
                <Menu />
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-card">
      <div className="container py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-primary">
            Booking
          </Link>

          {/* Right side - Menu */}
          <div className="flex items-center gap-4">
            {/* Become a Host Button */}
            {user && user.role === "Guest" && (
              <Link href="/become-host" className="hidden md:block">
                <Button variant="ghost" size="sm" className="rounded-full">
                  Become a Host
                </Button>
              </Link>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 rounded-full border p-1 pl-3 hover:shadow-md transition-shadow h-auto ml-1"
                >
                  <Menu />
                  <Avatar className="h-8 w-8">
                    {user?.avatar && <AvatarImage src={user.avatar} />}
                    <AvatarFallback className="bg-muted">
                      {user ? (
                        user.name[0].toUpperCase()
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 mt-2 rounded-xl shadow-xl"
              >
                {user ? (
                  <>
                    <div className="px-2 py-1.5 focus:bg-accent focus:text-accent-foreground outline-none">
                      <p className="font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        {user.role}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile">
                        <User />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bookings">
                        <Calendar />
                        My Bookings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wishlist">
                        <Heart />
                        Wishlist
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "Admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard/properties">
                            <LayoutDashboard />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {user.role === "Host" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard">
                            <LayoutDashboard />
                            Host Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard/properties">
                            <PlusCircle />
                            My Properties
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <ThemeToggle />

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      disabled={isPending}
                    >
                      <LogOut />
                      {isPending ? "Logging out..." : "Logout"}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/login">
                        <LogIn />
                        Login
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/register">
                        <UserPlus />
                        Sign up
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <ThemeToggle />
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
