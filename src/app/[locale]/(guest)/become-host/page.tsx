"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "nextjs-toploader/app";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

export default function BecomeHostPage() {
  const t = useTranslations("become_host");
  const router = useRouter();
  const { user, becomeHost } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleBecomeHost = async () => {
    if (!user) {
      router.push("/auth/register");
      return;
    }

    try {
      setIsLoading(true);
      await becomeHost();
      toast.success(t("success"));
      router.push("/hosting");
    } catch (error) {
      console.error(error);
      toast.error(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-58px)] flex flex-col lg:flex-row items-stretch overflow-hidden">
      {/* Left / Text Side */}
      <div className="flex-1 flex flex-col justify-center px-6 py-16 lg:px-20 xl:px-32 bg-background z-10">
        <div className="max-w-2xl mx-auto lg:mx-0 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-semibold tracking-wide uppercase">
              {t("badge")}
            </span>
          </div>

          <h1 className="text-5xl max-md:rtl:text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 text-foreground leading-[1.1]">
            {t("headline")}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
            {t("description")}
          </p>

          <Button
            onClick={handleBecomeHost}
            size="lg"
            className="w-full sm:w-auto h-16 px-10 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            disabled={isLoading}
          >
            {isLoading ? t("setting_up") : t("cta")}
          </Button>
        </div>
      </div>

      {/* Right / Image Side */}
      <div className="flex-1 relative min-h-[50vh] lg:min-h-0 bg-muted max-lg:rounded-t-3xl lg:rounded-s-3xl overflow-hidden">
        <Image
          src="/home.webp"
          alt={t("image_alt")}
          fill
          priority
          unoptimized
          className="object-cover object-center max-lg:rounded-t-3xl lg:rounded-s-3xl shadow-2xl"
        />
      </div>
    </main>
  );
}
