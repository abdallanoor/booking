"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  MoreVertical,
  Shield,
  Search,
  Building2,
  UserIcon,
  Ban,
  CheckCircle,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usersService, type User } from "@/services/users.service";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage({
  initialUsers,
}: {
  initialUsers: User[];
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleToggleBlock = async (
    id: string,
    currentBlockedStatus: boolean
  ) => {
    setProcessingId(id);
    const newStatus = !currentBlockedStatus;
    try {
      await usersService.updateUser(id, { isBlocked: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isBlocked: newStatus } : u))
      );

      toast.success(`User ${newStatus ? "blocked" : "unblocked"} successfully`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${newStatus ? "block" : "unblock"} user`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "Admin":
        return (
          <Badge
            variant="outline"
            className="bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400"
          >
            <Shield /> Admin
          </Badge>
        );
      case "Host":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
          >
            <Building2 /> Host
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-muted/50 text-muted-foreground border-muted-foreground/10"
          >
            <UserIcon /> Guest
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions.
          </p>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow
                  key={user._id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-primary/5 text-primary text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {user.name}
                          </span>
                          {user.isBlocked && (
                            <Badge
                              variant="destructive"
                              className="h-4 px-1.5 text-[10px] leading-none uppercase font-medium"
                            >
                              Blocked
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                        >
                          <MoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleToggleBlock(user._id, user.isBlocked)
                          }
                          variant={user.isBlocked ? "default" : "destructive"}
                          disabled={
                            processingId === user._id || user.role === "Admin"
                          }
                        >
                          {user.isBlocked ? (
                            <>
                              <CheckCircle />
                              Unblock User
                            </>
                          ) : (
                            <>
                              <Ban /> Block User
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
