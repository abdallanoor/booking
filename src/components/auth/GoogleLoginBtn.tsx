"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { useRouter } from "nextjs-toploader/app";

export function GoogleLoginBtn() {
  const { refreshUser } = useAuth();
  const router = useRouter();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: tokenResponse.access_token,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Google login failed");
        }

        toast.success("Logged in successfully");
        await refreshUser();
        router.push("/");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Google login failed"
        );
      }
    },
    onError: () => {
      toast.error("Google login failed");
    },
  });

  return (
    <Button
      variant="outline"
      type="button"
      size="lg"
      className="w-full flex items-center gap-2"
      onClick={() => handleGoogleLogin()}
    >
      <Image
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        alt="Google"
        width={20}
        height={20}
      />
      Continue with Google
    </Button>
  );
}
