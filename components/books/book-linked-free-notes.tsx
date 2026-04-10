"use client";

import Link from "next/link";
import { Quote, PenLine, ImageIcon, Mic, FileText, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NoteWithBook } from "@/types/note";
import type { NoteType } from "@/types/note";
import { parseNoteContentFields } from "@/lib/utils/note";

interface BookLinkedFreeNotesProps {
  linkedNotes: NoteWithBook[];
}

const NOTE_TYPE_ICON: Record<NoteType, React.ReactNode> = {
  quote: <Quote className="w-3.5 h-3.5" />,
  memo: <PenLine className="w-3.5 h-3.5" />,
  photo: <ImageIcon className="w-3.5 h-3.5" />,
  transcription: <Mic className="w-3.5 h-3.5" />,
  progress: <FileText className="w-3.5 h-3.5" />,
};

export function BookLinkedFreeNotes({ linkedNotes }: BookLinkedFreeNotesProps) {
  if (linkedNotes.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>연결된 자유기록</span>
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{linkedNotes.length}</span>
        </div>
        <Link href="/notes/free" className="text-xs text-primary hover:underline">
          자유기록 보기 →
        </Link>
      </div>
      <div className="space-y-2">
        {linkedNotes.slice(0, 3).map((note) => (
          <div
            key={note.id}
            className="flex items-start gap-2.5 p-3 rounded-lg border bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-800/30"
          >
            <div className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400">
              {NOTE_TYPE_ICON[note.type] ?? <PenLine className="w-3.5 h-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              {note.content && (() => {
                const { quote, memo } = parseNoteContentFields(note.content);
                const display = [quote, memo].filter(Boolean).join(" — ") || note.content;
                return (
                  <p className="text-sm leading-relaxed line-clamp-2 text-foreground/80">
                    {display}
                  </p>
                );
              })()}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {(note.tags ?? []).slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-0">
                    #{tag}
                  </Badge>
                ))}
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {new Date(note.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        {linkedNotes.length > 3 && (
          <Link href="/notes/free" className="block text-xs text-center text-muted-foreground hover:text-primary py-1">
            +{linkedNotes.length - 3}개 더 보기
          </Link>
        )}
      </div>
    </div>
  );
}
