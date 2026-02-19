import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ExploreContent } from "@/components/explore/explore-content";
import { getPublicNotes } from "@/app/actions/explore";

export const metadata: Metadata = {
  title: "탐색 | ReadTree",
  description: "다른 독자들의 문장과 기록을 탐색해보세요",
};

export default async function ExplorePage() {
  const { notes, hasMore } = await getPublicNotes({ sortBy: "recent", page: 1 });

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="explore.pageTitle"
        descriptionKey="explore.pageDescription"
      />
      <ExploreContent initialNotes={notes} initialHasMore={hasMore} />
    </div>
  );
}
