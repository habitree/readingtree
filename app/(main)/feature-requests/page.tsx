import { Suspense } from "react";
import { Metadata } from "next";
import { FeatureRequestList } from "@/components/feature-requests";
import {
  getFeatureRequests,
  getUserVotedRequestIds,
} from "@/app/actions/feature-requests";
import type { FeatureRequestStatus } from "@/types/feature-request";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "기능 요청 | ReadTree",
  description: "원하는 기능을 요청하고 투표하세요",
};

interface PageProps {
  searchParams: Promise<{
    status?: FeatureRequestStatus;
    featureArea?: string;
    sortBy?: "vote_count" | "created_at";
    search?: string;
    page?: string;
  }>;
}

async function FeatureRequestListContent({
  searchParams,
}: {
  searchParams: Awaited<PageProps["searchParams"]>;
}) {
  const pageSize = 20;
  const currentPage = parseInt(searchParams.page || "1", 10);
  const offset = (currentPage - 1) * pageSize;

  const [{ data: requests, total }, votedRequestIds] = await Promise.all([
    getFeatureRequests({
      status: searchParams.status || undefined,
      featureArea: searchParams.featureArea || undefined,
      sortBy: searchParams.sortBy || "vote_count",
      search: searchParams.search,
      limit: pageSize,
      offset,
    }),
    getUserVotedRequestIds(),
  ]);

  return (
    <FeatureRequestList
      requests={requests}
      votedRequestIds={votedRequestIds}
      total={total}
      currentPage={currentPage}
      pageSize={pageSize}
      initialStatus={searchParams.status || ""}
      initialFeatureArea={searchParams.featureArea || ""}
      initialSortBy={searchParams.sortBy || "vote_count"}
      initialSearch={searchParams.search || ""}
    />
  );
}

export default async function FeatureRequestsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <PageHeader titleKey="featureRequests.pageTitle" descriptionKey="featureRequests.pageDesc" />

      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        }
      >
        <FeatureRequestListContent searchParams={resolvedParams} />
      </Suspense>
    </div>
  );
}
