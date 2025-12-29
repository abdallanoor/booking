import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import NextTopLoader from "nextjs-toploader";

export const metadata: Metadata = {
  title: "Booking Platform",
  description: "Book unique homes and experiences around the world",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <NextTopLoader color="var(--primary)" showSpinner={false} height={2} />
        <AuthProvider>
          <ThemeProvider>
            <GoogleOAuthProvider
              clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
            >
              {children}
              <Toaster />
            </GoogleOAuthProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
