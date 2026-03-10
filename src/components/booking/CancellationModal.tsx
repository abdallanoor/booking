"use client";

import { useState } from "react";
import { format, differenceInHours } from "date-fns";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cancelBookingAction } from "@/actions";
import { useTranslations } from "next-intl";

interface CancellationModalProps {
  bookingId: string;
  checkInDate: string | Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancellationModal({
  bookingId,
  checkInDate,
  open,
  onOpenChange,
}: CancellationModalProps) {
  const t = useTranslations("bookings");
  const [step, setStep] = useState<"policy" | "reason" | "confirm">("policy");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkIn = new Date(checkInDate);
  const now = new Date();
  const hoursUntilCheckIn = differenceInHours(checkIn, now);
  const isTooLate = hoursUntilCheckIn < 48;

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after transition
    setTimeout(() => {
      setStep("policy");
      setReason("");
    }, 300);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await cancelBookingAction(bookingId);
      if (result.success || result.data) {
        toast.success(t("cancel_success"));
        handleClose();
      } else {
        toast.error(result.message || t("cancel_failed"));
      }
    } catch (error) {
      // Extract error message if possible
      const msg =
        error instanceof Error ? error.message : t("unexpected_error");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {step === "policy" && (
          <>
            <DialogHeader className="text-start">
              <DialogTitle>{t("title_cancel")}</DialogTitle>
              <DialogDescription>{t("review_policy")}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 text-start">
              {isTooLate ? (
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-md text-sm">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <p className="font-semibold text-destructive">
                      {t("no_refund")}
                    </p>
                  </div>
                  <ul className="list-disc ps-5 space-y-1 text-muted-foreground">
                    <li>
                      {t("cancelling_48h_less", {
                        time: format(checkIn, "PPP p"),
                      })}
                    </li>
                    <li className="font-semibold text-destructive">
                      {t("no_refund_issued")}
                    </li>
                    <li>{t("cancellation_rule")}</li>
                    <li>
                      {t("time_remaining", {
                        hours: hoursUntilCheckIn.toFixed(1),
                      })}
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="bg-muted p-4 rounded-md text-sm">
                  <p className="font-semibold mb-2">{t("policy_48h")}</p>
                  <ul className="list-disc ps-5 space-y-1 text-muted-foreground">
                    <li>{t("cancelling_48h_more")}</li>
                    <li>{t("eligible_refund")}</li>
                    <li>{t("refund_time")}</li>
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                className="ms-auto"
              >
                {t("keep_booking")}
              </Button>
              <Button onClick={() => setStep("reason")}>
                {t("next_reason")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "reason" && (
          <>
            <DialogHeader className="text-start">
              <DialogTitle>{t("title_reason")}</DialogTitle>
              <DialogDescription>{t("why_cancelling")}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 text-start">
              <div className="space-y-2">
                <Label>{t("reason")}</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_reason")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="change_of_plans">
                      {t("change_plans")}
                    </SelectItem>
                    <SelectItem value="found_better_place">
                      {t("better_place")}
                    </SelectItem>
                    <SelectItem value="financial_reasons">
                      {t("financial")}
                    </SelectItem>
                    <SelectItem value="other">{t("other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {reason === "other" && (
                <div className="space-y-2">
                  <Label>{t("details_optional")}</Label>
                  <Textarea
                    placeholder={t("provide_details")}
                    className="text-start"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep("policy")}>
                {t("back")}
              </Button>
              <Button onClick={() => setStep("confirm")} disabled={!reason}>
                {t("next")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "confirm" && (
          <>
            <DialogHeader className="text-start">
              <DialogTitle>{t("title_confirm")}</DialogTitle>
              <DialogDescription>{t("are_you_sure")}</DialogDescription>
            </DialogHeader>

            <div className="py-2 text-start">
              <p className="text-sm text-muted-foreground flexitems-center gap-1">
                {t("check_in_date")}:{" "}
                <span className="font-medium text-foreground mx-1" dir="ltr">
                  {format(checkIn, "PPP")}
                </span>
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("reason")}
                disabled={isSubmitting}
              >
                {t("back")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
                    {t("cancelling")}
                  </>
                ) : (
                  t("confirm_cancellation")
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
