import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { callbackUrl } = await searchParams;
  const loginUrl = callbackUrl
    ? `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl as string)}`
    : "/auth/login";

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={loginUrl} className="font-medium underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
