"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GroupNoteCard } from "./group-note-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Loader2,
  Quote,
  Camera,
  FileText,
  ScanText,
  Filter,
  MessageSquareOff,
  PenLine,
  Share2,
} from "lucide-react";
import { getGroupBookNotes, unshareNoteFromGroup } from "@/app/actions/groups";
import { toast } from "sonner";
import type { NoteType } from "@/types/group";

interface GroupNoteFeedProps {
  groupId: string;
  bookId: string;
  currentUserId?: string;
  onShareClick?: () => void;
}

const noteTypeFilters: {
  type: NoteType | "all";
  label: string;
  icon: React.ElementType;
  color?: string;
}[] = [
  { type: "all", label: "전체", icon: Filter },
  { type: "quote", label: "인용구", icon: Quote, color: "text-amber-600" },
  { type: "memo", label: "메모", icon: FileText, color: "text-green-600" },
  { type: "photo", label: "사진", icon: Camera, color: "text-blue-600" },
  { type: "transcription", label: "필사", icon: ScanText, color: "text-purple-600" },
];

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function GroupNoteFeed({
  groupId,
  bookId,
  currentUserId,
  onShareClick,
}: GroupNoteFeedProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<NoteType | "all">("all");

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const options = activeFilter !== "all" ? { type: activeFilter } : undefined;
      const data = await getGroupBookNotes(groupId, bookId, options);
      setNotes(data);
    } catch (error) {
      console.error("기록 조회 오류:", error);
      toast.error("기록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [groupId, bookId, activeFilter]);

  const handleUnshare = async (noteId: string) => {
    try {
      await unshareNoteFromGroup(noteId, groupId);
      toast.success("공유가 해제되었습니다.");
      loadNotes();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "공유 해제에 실패했습니다."
      );
    }
  };

  const handleWriteNote = () => {
    router.push(`/notes/new?bookId=${bookId}&groupId=${groupId}`);
  };

  const activeFilterLabel = noteTypeFilters.find(
    (f) => f.type === activeFilter
  )?.label;

  return (
    <div className="space-y-4">
      {/* 필터 - 모바일에서 가로 스크롤 */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex items-center gap-2 pb-2">
          {noteTypeFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.type;
            return (
              <Button
                key={filter.type}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.type)}
                className={`shrink-0 ${
                  isActive ? "" : filter.color || ""
                }`}
              >
                <Icon className="mr-1.5 h-4 w-4" />
                {filter.label}
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>

      {/* 로딩 상태 */}
      {isLoading ? (
        <FeedSkeleton />
      ) : notes.length === 0 ? (
        /* 빈 상태 - 친근한 안내 */
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageSquareOff className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="font-semibold mb-2">
                {activeFilter === "all"
                  ? "아직 공유된 기록이 없어요"
                  : `공유된 ${activeFilterLabel} 기록이 없어요`}
              </h4>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                {activeFilter === "all"
                  ? "이 책에 대한 첫 번째 기록을 공유해보세요. 모임원들과 생각을 나눌 수 있어요."
                  : `다른 유형의 기록을 확인하거나, ${activeFilterLabel}을 작성해서 공유해보세요.`}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={onShareClick || (() => {})}>
                  <Share2 className="mr-2 h-4 w-4" />
                  내 기록 공유하기
                </Button>
                <Button variant="outline" onClick={handleWriteNote}>
                  <PenLine className="mr-2 h-4 w-4" />
                  기록 작성하기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* 기록 목록 */
        <div className="space-y-4">
          {notes.map((sharedNote, index) => (
            <div
              key={sharedNote.id}
              className="animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <GroupNoteCard
                note={sharedNote.notes}
                sharedAt={sharedNote.shared_at}
                currentUserId={currentUserId}
                onUnshare={handleUnshare}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
