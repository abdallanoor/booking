import { LoadingDots } from "@/components/ui/loading-dots";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <LoadingDots />
    </div>
  );
}
