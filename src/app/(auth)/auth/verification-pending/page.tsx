"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { authService } from "@/services/auth.service";

function VerificationPendingContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Persistent countdown logic
    const savedUntil = localStorage.getItem("resend_until");
    if (savedUntil) {
      const remaining = Math.ceil((parseInt(savedUntil) - Date.now()) / 1000);
      if (remaining > 0) {
        setCountdown(remaining);
      }
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            localStorage.removeItem("resend_until");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      await authService.resendVerificationEmail(email);
      toast.success("Verification email sent! Check your inbox.");
      const until = Date.now() + 30 * 1000;
      localStorage.setItem("resend_until", until.toString());
      setCountdown(30);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An error occurred. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Verify Your Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <Mail className="h-20 w-20 text-primary relative z-10" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3 text-center">
            <h3 className="text-xl font-semibold">Check Your Email</h3>
            <p className="text-muted-foreground leading-relaxed">
              We&apos;ve sent a verification link to{" "}
              <span className="font-semibold text-foreground">{email}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account and start using the platform.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleResendEmail}
              disabled={resending || countdown > 0}
              variant="secondary"
              className="w-full h-12"
            >
              {resending ? (
                <>
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                "Resend Verification Email"
              )}
            </Button>

            <Link href="/auth/login" className="w-full">
              <Button variant="ghost" className="w-full h-12">
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerificationPendingPage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <Suspense
        fallback={
          <div className="flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <VerificationPendingContent />
      </Suspense>
    </main>
  );
}

