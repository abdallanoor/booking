import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { callbackUrl } = await searchParams;
  const registerUrl = callbackUrl
    ? `/auth/register?callbackUrl=${encodeURIComponent(callbackUrl as string)}`
    : "/auth/register";

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href={registerUrl} className="font-medium underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
