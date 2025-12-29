"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { refreshUser, user } = useAuth();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Verifying your email...");

  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (hasVerified.current) return;
      hasVerified.current = true;

      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token provided.");
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          // Refresh user state to reflect verification
          await refreshUser();
        } else {
          setStatus("error");
          setMessage(data.message || "Email verification failed.");
        }
      } catch {
        setStatus("error");
        setMessage("An error occurred while verifying your email.");
      }
    };

    verifyEmail();
  }, [token, refreshUser, user]);

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
          {/* Status Icon */}
          <div className="flex justify-center">
            <div className="relative">
              {status === "loading" && (
                <Loader2 className="h-20 w-20 text-primary animate-spin" />
              )}
              {status === "success" && (
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full" />
                  <CheckCircle2 className="h-20 w-20 text-green-500 relative z-10 animate-in zoom-in duration-500" />
                </div>
              )}
              {status === "error" && (
                <div className="relative">
                  <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full" />
                  <XCircle className="h-20 w-20 text-destructive relative z-10 animate-in zoom-in duration-500" />
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-semibold capitalize">{status}</h3>
            <p className="text-muted-foreground leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <Link href="/" className="w-full">
              <Button className="w-full h-12 text-lg">Go to Home</Button>
            </Link>

            {status === "success" && user && (
              <Link href="/profile" className="w-full">
                <Button variant="outline" className="w-full h-12 text-lg">
                  View Profile
                </Button>
              </Link>
            )}

            {status === "error" && !user && (
              <Link href="/auth/register" className="w-full">
                <Button variant="ghost" className="w-full h-12 text-lg">
                  Try Registering Again
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <Suspense
        fallback={
          <div className="flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
