import { Suspense } from "react";
import HostQuestionsClient from "@/app/(host)/hosting/listings/[id]/questions/HostQuestionsClient";
import { getHostListingQuestions } from "@/services/questions.server";
import { getListing } from "@/services/listings.service";
import { Skeleton } from "@/components/ui/skeleton";

interface HostQuestionsPageProps {
  params: Promise<{ id: string }>;
}

export default async function HostQuestionsPage({
  params,
}: HostQuestionsPageProps) {
  const { id } = await params;
  const questions = await getHostListingQuestions(id);
  const listing = await getListing(id);

  return (
    <Suspense fallback={<QuestionsSkeleton />}>
      <HostQuestionsClient
        initialQuestions={questions}
        listingId={id}
        listingTitle={listing.title}
      />
    </Suspense>
  );
}

function QuestionsSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
