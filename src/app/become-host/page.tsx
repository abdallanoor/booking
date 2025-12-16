"use client";

import { ClientLayout } from "@/components/layout/ClientLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "nextjs-toploader/app";

export default function BecomeHostPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleBecomeHost = () => {
    if (!user) {
      router.push("/auth/register");
    } else {
      router.push("/auth/register");
    }
  };

  return (
    <ClientLayout>
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold mb-4">Become a Host</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Start earning by sharing your space with travelers
          </p>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Why host on our platform?</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>✓ Reach millions of travelers worldwide</li>
                <li>✓ Set your own prices and availability</li>
                <li>✓ Get paid securely</li>
                <li>✓ Full support and protection</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">How it works</h3>
              <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                <li>Create a host account</li>
                <li>List your property with photos and details</li>
                <li>Set your price and availability</li>
                <li>Welcome guests and start earning</li>
              </ol>
            </div>

            <Button onClick={handleBecomeHost} className="w-full" size="lg">
              Get Started
            </Button>

            {user && user.role === "Guest" && (
              <p className="text-sm text-center text-muted-foreground">
                Note: You&apos;ll need to create a new account with the Host
                role
              </p>
            )}
          </div>
        </div>
      </main>
    </ClientLayout>
  );
}
