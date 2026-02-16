"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

type VerificationRequest = {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  type: "national_id" | "passport";
  idNumber: string;
  imageUrl: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
};

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await apiClient.get<{
          data: { verifications: VerificationRequest[] };
        }>("/admin/identity-verifications?status=pending");
        setVerifications(data.data.verifications);
      } catch {
        toast.error("Failed to load verifications");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/admin/identity-verifications/${id}`, {
        action: "approve",
      });
      toast.success("Approved");
      setVerifications((prev) => prev.filter((v) => v._id !== id));
    } catch {
      toast.error("Failed to approve");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/admin/identity-verifications/${id}`, {
        action: "reject",
        rejectionReason,
      });
      toast.success("Rejected");
      setVerifications((prev) => prev.filter((v) => v._id !== id));
      setRejectingId(null);
      setRejectionReason("");
    } catch {
      toast.error("Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-muted-foreground/50">/</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">
          Identity Verifications
        </h2>
        <p className="text-muted-foreground">
          Review pending identity verification requests.
        </p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[250px]">User</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Image</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : verifications.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No pending verifications.
                </TableCell>
              </TableRow>
            ) : (
              verifications.map((v) => (
                <TableRow
                  key={v._id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border">
                        <AvatarImage src={v.user.avatar} />
                        <AvatarFallback className="bg-primary/5 text-primary text-xs">
                          {v.user.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {v.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {v.user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge
                        variant="outline"
                        className="bg-muted/50 text-muted-foreground border-muted-foreground/10"
                      >
                        {v.type === "national_id" ? "National ID" : "Passport"}
                      </Badge>
                      <p className="text-sm font-mono">{v.idNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(v.createdAt)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={v.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </a>
                  </TableCell>
                  <TableCell className="text-right">
                    {rejectingId === v._id ? (
                      <div className="flex items-center gap-2 justify-end">
                        <Input
                          placeholder="Reason (optional)"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="max-w-[180px] h-8 text-sm"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(v._id)}
                          disabled={actionLoading === v._id}
                        >
                          {actionLoading === v._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Confirm"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setRejectingId(null);
                            setRejectionReason("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(v._id)}
                          disabled={actionLoading === v._id}
                        >
                          {actionLoading === v._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectingId(v._id)}
                          disabled={actionLoading === v._id}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    )}
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
