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
import { useTranslations } from "next-intl";

interface PhoneVerificationProps {
  currentPhone?: string;
  onVerified: (phone: string) => void;
}

type Step = "display" | "input" | "otp";

export function PhoneVerification({
  currentPhone,
  onVerified,
}: PhoneVerificationProps) {
  const t = useTranslations("phone_verification");
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
      toast.error(t("enter_phone"));
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/user/phone/send-otp", { phone: cleaned });
      toast.success(t("otp_sent"));
      setStep("otp");
      setCountdown(60);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("otp_send_failed"),
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
      await apiClient.post("/user/phone/verify-otp", {
        phone: cleaned,
        code: otp,
      });
      toast.success(t("phone_verified"));
      onVerified(cleaned);
      setStep("display");
      setOtp("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("otp_invalid"));
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
      await apiClient.post("/user/phone/send-otp", { phone: cleaned });
      toast.success(t("otp_resent"));
      setCountdown(60);
      setOtp("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("otp_resend_failed"),
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
      <div className="space-y-2 text-start">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{t("phone_number")}</Label>
          <div className="flex items-center gap-1 text-xs font-bold text-green-600 tracking-tight">
            <CheckCircle2 className="h-3 w-3" />
            {t("verified")}
          </div>
        </div>
        <div className="relative group">
          <Phone className="absolute start-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground" />
          <Input
            value={currentPhone}
            readOnly
            disabled
            dir="ltr"
            className="pl-9 rtl:pr-9 rtl:pl-3 bg-secondary/5 border-dashed border-muted-foreground/20 cursor-not-allowed text-left rtl:text-right text-foreground/70"
          />
        </div>
      </div>
    );
  }

  // -- Phone input step --
  if (step === "input") {
    return (
      <div className="space-y-2 text-start">
        <Label className="text-sm font-medium">{t("phone_number")}</Label>
        <div className="relative group">
          <Phone className="absolute start-3 top-2/4 -translate-y-2/4 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="pl-9 pr-20 rtl:pl-20 rtl:pr-9 text-left rtl:text-right"
            placeholder="+201234567890"
            dir="ltr"
            disabled={loading}
          />
          <Button
            type="button"
            onClick={handleSendOtp}
            disabled={loading || !phone.trim()}
            size="sm"
            className="absolute end-2 top-2/4 -translate-y-2/4 h-7 px-3 text-xs font-semibold"
          >
            {loading ? t("verifying") : t("verify")}
          </Button>
        </div>
        <p className="text-[0.75rem] text-muted-foreground text-start">
          {t.rich("phone_format_desc", {
            dir: (chunks) => <span dir="ltr">{chunks}</span>,
          })}
        </p>
      </div>
    );
  }

  // -- OTP verification step --
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-start">
        <Label className="text-sm font-medium">{t("verification_code")}</Label>
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
            <ArrowLeft className="h-3 w-3 rtl:rotate-180" />
            {t("back")}
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
            {countdown > 0 ? `${countdown}s` : t("resend")}
          </Button>
        </div>
      </div>

      <p className="text-[0.8rem] text-muted-foreground text-start">
        {t("code_sent_to")}
        <span className="font-medium text-foreground text-end" dir="ltr">
          {phone}
        </span>
      </p>

      <div className="flex justify-center" dir="ltr">
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
        {loading ? t("verifying_full") : t("verify_phone")}
      </Button>
    </div>
  );
}
