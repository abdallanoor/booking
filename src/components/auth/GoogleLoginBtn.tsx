"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface GoogleLoginBtnProps {
  disabled?: boolean;
  callbackUrl?: string;
}

export function GoogleLoginBtn({
  disabled,
  callbackUrl = "/",
}: GoogleLoginBtnProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Redirect to Google OAuth - same tab, no popup
    // Pass callbackUrl to the redirect route
    const redirectUrl = `/api/auth/google/redirect?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    window.location.href = redirectUrl;
  };

  const isDisabled = disabled || isLoading;

  return (
    <Button
      variant="outline"
      type="button"
      size="lg"
      className="w-full flex items-center gap-2"
      onClick={handleGoogleLogin}
      disabled={isDisabled}
    >
      <Image src="/google.svg" alt="Google" width={20} height={20} />
      Continue with Google
    </Button>
  );
}
