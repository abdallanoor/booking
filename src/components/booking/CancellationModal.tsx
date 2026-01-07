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
        toast.success("Booking cancelled successfully");
        handleClose();
      } else {
        toast.error(result.message || "Failed to cancel booking");
      }
    } catch (error) {
      // Extract error message if possible
      const msg =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isTooLate) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Cancellation Unavailable
            </DialogTitle>
            <DialogDescription>
              This booking cannot be cancelled because it is less than 48 hours
              until check-in ({format(checkIn, "PPP p")}).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            <p>
              According to our cancellation policy, cancellations must be made
              at least 48 hours before the scheduled check-in time.
            </p>
            <p className="mt-2 text-xs">
              Code: {hoursUntilCheckIn.toFixed(1)}h remaining
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {step === "policy" && (
          <>
            <DialogHeader>
              <DialogTitle>Cancel Booking</DialogTitle>
              <DialogDescription>
                Please review our cancellation policy before proceeding.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-muted p-4 rounded-md text-sm">
                <p className="font-semibold mb-2">
                  Policy: 48-Hour Free Cancellation
                </p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    You are cancelling more than 48 hours before check-in.
                  </li>
                  <li>
                    You are eligible for a refund according to the host&apos;s
                    policy.
                  </li>
                  <li>
                    Refunds may take 5-10 business days to appear on your
                    statement.
                  </li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                className="mr-auto"
              >
                Keep Booking
              </Button>
              <Button onClick={() => setStep("reason")}>
                Next: Select Reason
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "reason" && (
          <>
            <DialogHeader>
              <DialogTitle>Reason for Cancellation</DialogTitle>
              <DialogDescription>
                Please tell us why you are cancelling. This helps us improve.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="change_of_plans">
                      Change of plans
                    </SelectItem>
                    <SelectItem value="found_better_place">
                      Found a better place
                    </SelectItem>
                    <SelectItem value="financial_reasons">
                      Financial reasons
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {reason === "other" && (
                <div className="space-y-2">
                  <Label>Details (Optional)</Label>
                  <Textarea placeholder="Please provide more details..." />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep("policy")}>
                Back
              </Button>
              <Button onClick={() => setStep("confirm")} disabled={!reason}>
                Next
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Cancellation</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this booking? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <p className="text-sm text-muted-foreground">
                Check-in:{" "}
                <span className="font-medium text-foreground">
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
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Confirm Cancellation"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
