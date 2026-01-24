import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getNotes } from "@/app/actions/notes";
import { getCurrentUser } from "@/app/actions/auth";
import { RecentNotes } from "../recent-notes";
import { FileText } from "lucide-react";
import type { NoteWithBook } from "@/types/note";

/**
 * 최근 기록 섹션 (Streaming SSR)
 */
export async function RecentNotesSection() {
  const user = await getCurrentUser();
  const notes = await getNotes(undefined, undefined, user);
  const recentNotes = (notes as NoteWithBook[]).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="mb-2">최근 기록</CardTitle>
            <CardDescription>최근 작성한 기록 5개</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {recentNotes.length > 0 ? (
          <RecentNotes notes={recentNotes} />
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground leading-relaxed">
              기록이 없습니다. 첫 번째 기록을 작성해보세요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
