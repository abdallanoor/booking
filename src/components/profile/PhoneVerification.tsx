"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  Phone,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface PhoneVerificationProps {
  currentPhone?: string;
  onVerified: (phone: string) => void;
}

type Step = "display" | "input" | "otp";

export function PhoneVerification({
  currentPhone,
  onVerified,
}: PhoneVerificationProps) {
  const [step, setStep] = useState<Step>(currentPhone ? "display" : "input");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\s/g, "");
    if (!cleaned) {
      toast.error("Please enter a phone number");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/phone/send-otp", { phone: cleaned });
      toast.success("Verification code sent!");
      setStep("otp");
      setCountdown(30);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send code",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;

    const cleaned = phone.replace(/\s/g, "");
    setLoading(true);
    try {
      await apiClient.post("/phone/verify-otp", { phone: cleaned, code: otp });
      toast.success("Phone number verified!");
      onVerified(cleaned);
      setStep("display");
      setOtp("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Invalid verification code",
      );
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      const cleaned = phone.replace(/\s/g, "");
      await apiClient.post("/phone/send-otp", { phone: cleaned });
      toast.success("New verification code sent!");
      setCountdown(30);
      setOtp("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to resend code",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = () => {
    setStep("input");
    setPhone("");
    setOtp("");
    setCountdown(0);
  };

  // -- Verified phone display --
  if (step === "display" && currentPhone) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Phone Number</Label>
          <div className="flex items-center gap-1 text-xs font-bold text-green-600 tracking-tight">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </div>
        </div>
        <div className="relative group">
          <Phone className="absolute left-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground" />
          <Input
            value={currentPhone}
            readOnly
            disabled
            className="pl-9 bg-secondary/5 border-dashed border-muted-foreground/20 cursor-not-allowed"
          />
        </div>
      </div>
    );
  }

  // -- Phone input step --
  if (step === "input") {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Phone Number</Label>
        <div className="flex gap-2">
          <div className="relative group flex-1">
            <Phone className="absolute left-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-9"
              placeholder="+201234567890"
              disabled={loading}
            />
          </div>
          <Button
            type="button"
            onClick={handleSendOtp}
            disabled={loading || !phone.trim()}
            size="default"
            className="shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
          </Button>
        </div>
        <p className="text-[0.75rem] text-muted-foreground">
          Enter your number in international format (e.g. +201234567890)
        </p>
      </div>
    );
  }

  // -- OTP verification step --
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Verification Code</Label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setStep("input");
              setOtp("");
            }}
            disabled={loading}
            className="h-7 px-2 text-xs gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={loading || countdown > 0}
            className="h-7 px-2 text-xs gap-1"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            {countdown > 0 ? `${countdown}s` : "Resend"}
          </Button>
        </div>
      </div>

      <p className="text-[0.8rem] text-muted-foreground">
        Enter the 6-digit code sent to{" "}
        <span className="font-medium text-foreground">{phone}</span>
      </p>

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={(value) => setOtp(value)}
          disabled={loading}
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

      <Button
        type="button"
        onClick={handleVerifyOtp}
        disabled={loading || otp.length !== 6}
        className={cn("w-full", loading && "opacity-70")}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify Phone Number"
        )}
      </Button>
    </div>
  );
}
