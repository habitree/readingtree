import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCachedCurrentUser } from "@/lib/cached";
import { getUserTagsWithCount } from "@/app/actions/notes";
import { TagCloud } from "@/components/tags/tag-cloud";
import { PageHeader } from "@/components/layout/page-header";
import { Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "태그 | ReadTree",
  description: "태그별로 독서 기록을 탐색하세요",
};

export default async function TagsPage() {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  const tags = await getUserTagsWithCount(user);

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="notes.tagsTitle"
        descriptionKey="notes.tagsDescription"
      />

      {tags.length > 0 ? (
        <TagCloud tags={tags} />
      ) : (
        <div className="text-center py-16 space-y-3">
          <Tag className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            아직 태그가 없습니다. 기록에 태그를 추가해보세요.
          </p>
        </div>
      )}
    </div>
  );
}
