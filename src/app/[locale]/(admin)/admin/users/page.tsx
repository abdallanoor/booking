"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { toast } from "sonner";
import {
  MoreVertical,
  Shield,
  Search,
  Building2,
  UserIcon,
  Ban,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Paginator } from "@/components/ui/paginator";
import { usersService } from "@/services/users.service";
import { formatDate } from "@/lib/utils";
import type { User } from "@/types";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

export default function AdminUsersPage() {
  const locale = useLocale();
  const t = useTranslations("admin");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const currentPage = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10),
  );
  const statusFilter = searchParams.get("status") || "all";
  const searchFilter = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(searchFilter);

  const fetchUsers = useCallback(
    async (pageNum: number, status: string, searchStr?: string) => {
      setLoading(true);
      try {
        const data = await usersService.getAdminUsers(
          pageNum,
          10,
          status === "all" ? undefined : status,
          searchStr || undefined,
        );
        setUsers(data.users);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error(t("failed_load_users"));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    fetchUsers(currentPage, statusFilter, searchFilter);
  }, [currentPage, statusFilter, searchFilter, fetchUsers]);

  const handleSearch = () => {
    if (searchQuery === searchFilter) return;
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/admin/users?${params.toString()}`, { scroll: false });
  };

  const setStatusFilter = useCallback(
    (status: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("status", status);
      params.set("page", "1");
      router.push(`/admin/users?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/admin/users?${params.toString()}`, { scroll: false });
  };

  const handleToggleBlock = async (
    id: string,
    currentBlockedStatus: boolean,
  ) => {
    setProcessingId(id);
    const newStatus = !currentBlockedStatus;
    try {
      await usersService.updateUser(id, { isBlocked: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isBlocked: newStatus } : u)),
      );
      toast.success(newStatus ? t("blocked_success") : t("unblocked_success"));
    } catch (error) {
      console.error(error);
      toast.error(newStatus ? t("block_failed") : t("unblock_failed"));
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "Admin":
        return (
          <Badge
            variant="outline"
            className="bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400 capitalize whitespace-nowrap"
          >
            <Shield /> {t("role_admin")}
          </Badge>
        );
      case "Host":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400 capitalize whitespace-nowrap"
          >
            <Building2 /> {t("role_host")}
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-muted/50 text-muted-foreground border-muted-foreground/10 capitalize whitespace-nowrap"
          >
            <UserIcon /> {t("role_guest")}
          </Badge>
        );
    }
  };

  const TableHeadRow = () => (
    <TableRow className="bg-muted!">
      <TableHead className="w-[300px] px-6">{t("col_user")}</TableHead>
      <TableHead>{t("col_role")}</TableHead>
      <TableHead>{t("col_joined")}</TableHead>
      <TableHead className="text-end px-6">{t("col_actions")}</TableHead>
    </TableRow>
  );

  const UserSkeleton = () => (
    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm mt-6">
      <Table>
        <TableHeader>
          <TableHeadRow />
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell className="px-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-[140px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[70px] rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[80px]" />
              </TableCell>
              <TableCell className="text-end px-6">
                <div className="flex justify-end py-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center flex-wrap gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("users_title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("users_desc")}</p>
        </div>
        <div className="flex items-center justify-end gap-4 ms-auto">
          {loading ? (
            <Skeleton className="h-9 w-40 rounded-full" />
          ) : (
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              dir={locale === "ar" ? "rtl" : "ltr"}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("filter_status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="blocked">{t("blocked_filter")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("search_users")}
          value={searchQuery}
          onChange={(e) => {
            const val = e.target.value;
            setSearchQuery(val);
            if (!val && searchFilter !== "") {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("search");
              params.set("page", "1");
              router.push(`/admin/users?${params.toString()}`, {
                scroll: false,
              });
            }
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="ps-9 pe-20"
        />
        <Button
          size="sm"
          onClick={handleSearch}
          variant="default"
          className="absolute end-2 top-1/2 -translate-y-1/2"
        >
          {t("search")}
        </Button>
      </div>

      {loading && users.length === 0 ? (
        <UserSkeleton />
      ) : (
        <div className="space-y-6">
          <div
            className={
              loading
                ? "opacity-50 pointer-events-none transition-opacity"
                : "transition-opacity"
            }
          >
            {users.length === 0 ? (
              <div className="rounded-2xl border bg-card overflow-hidden shadow-sm mt-6">
                <Table>
                  <TableHeader>
                    <TableHeadRow />
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {t("no_users")}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-2xl border bg-card overflow-hidden mt-6">
                <Table>
                  <TableHeader>
                    <TableHeadRow />
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="px-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border shadow-sm">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="bg-primary/5 text-primary text-xs">
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">
                                  {user.name}
                                </span>
                                {user.isBlocked && (
                                  <Badge
                                    variant="destructive"
                                    className="h-4 px-1.5 text-[10px] leading-none uppercase font-semibold"
                                  >
                                    {t("blocked")}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground font-medium">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground font-medium">
                            {formatDate(user.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-end px-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-muted"
                                disabled={
                                  processingId === user._id ||
                                  user.role === "Admin"
                                }
                              >
                                {processingId === user._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 shadow-lg"
                            >
                              <DropdownMenuLabel>
                                {t("actions")}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleToggleBlock(user._id, user.isBlocked)
                                }
                                disabled={
                                  processingId === user._id ||
                                  user.role === "Admin"
                                }
                                className={
                                  user.isBlocked
                                    ? "text-emerald-600 focus:text-emerald-600 font-medium"
                                    : "text-destructive focus:text-destructive font-medium"
                                }
                              >
                                {user.isBlocked ? (
                                  <>
                                    <CheckCircle className="text-emerald-600" />
                                    {t("unblock_user")}
                                  </>
                                ) : (
                                  <>
                                    <Ban className="text-destructive" />
                                    {t("block_user")}
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="mt-8 flex justify-center">
              <Paginator
                currentPage={currentPage}
                totalPages={pagination.pages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
