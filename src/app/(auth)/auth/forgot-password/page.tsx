import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Booking Platform",
  description: "Reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <ForgotPasswordForm />
    </div>
  );
}
