"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Handle countdown timer
  useEffect(() => {
    const savedUntil = localStorage.getItem("otp_resend_until");
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
            localStorage.removeItem("otp_resend_until");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = useCallback(async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      await authService.verifyOtp(email, otp);

      await refreshUser();
      toast.success("Verified successfully");
      router.push("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Invalid verification code",
      );
      // Clear OTP on error
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  }, [otp, email, refreshUser, router]);

  const handleResend = async () => {
    if (countdown > 0) return;
    setIsResending(true);
    try {
      await authService.resendOtp(email);
      toast.success("New verification code sent!");
      const until = Date.now() + 30 * 1000;
      localStorage.setItem("otp_resend_until", until.toString());
      setCountdown(30);
      // Clear current OTP
      setOtp("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to resend code",
      );
    } finally {
      setIsResending(false);
    }
  };

  const isLoading = isVerifying || isResending;

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            Enter the verification code we sent to your email address:{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="otp-verification" className="text-sm font-medium">
                Verification code
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResend}
                disabled={isLoading || countdown > 0}
                className="gap-2 h-7 px-2 text-xs"
              >
                {isResending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
              </Button>
            </div>

            <div className="flex justify-center">
              <InputOTP
                id="otp-verification"
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                disabled={isLoading}
                pattern={REGEXP_ONLY_DIGITS}
                autoFocus
              >
                <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <p className="text-[0.8rem] text-muted-foreground">
              Don&apos;t share this code with anyone.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={isLoading || otp.length !== 6}
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Wrong email address?{" "}
            <Link
              href="/auth/register"
              className="underline underline-offset-4 hover:text-primary transition-colors"
            >
              Back to Sign Up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <Suspense
        fallback={
          <div className="flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <VerifyOtpContent />
      </Suspense>
    </main>
  );
}
