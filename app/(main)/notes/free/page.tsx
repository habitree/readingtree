import { redirect } from "next/navigation";
import { getCachedCurrentUser } from "@/lib/cached";
import { getFreeNotes, getUserTagsWithCount } from "@/app/actions/notes";
import { FreeNotesPageClient } from "@/components/notes/free-notes-page-client";
import type { NoteType, SourceType } from "@/types/note";

interface FreeNotesPageProps {
  searchParams: Promise<{
    type?: string;
    source?: string;
  }>;
}

export default async function FreeNotesPage({ searchParams }: FreeNotesPageProps) {
  const user = await getCachedCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const type = resolvedParams.type as NoteType | undefined;
  const sourceType = resolvedParams.source as SourceType | undefined;

  const [notes, tags] = await Promise.all([
    getFreeNotes(type, sourceType, user).catch(() => []),
    getUserTagsWithCount(user).catch(() => []),
  ]);

  return (
    <FreeNotesPageClient
      initialNotes={notes}
      tags={tags}
      activeType={type}
      activeSource={sourceType}
    />
  );
}
