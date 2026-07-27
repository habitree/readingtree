"use client";

/**
 * RecordViewSheet — 통합 기록 "보기" 시트 (열람 우선 개편)
 *
 * 기존에는 피드 카드를 탭하면 곧바로 편집 화면이 떴다. 과거 기록을 "확인하고
 * 공유"하는 흐름이 먼저 오도록, 카드 탭 → 이 읽기 전용 시트 → (필요시) 편집으로
 * 바꾼다. 종류(시간·진행·스탬프·상세)에 상관없이 같은 골격을 쓰고 있는 슬롯만
 * 보여주는 규칙은 카드와 동일하다.
 *
 * 공유는 앱의 기존 공유 자산을 그대로 재사용한다(신규 공개 라우트 없음).
 *  - note 기록      → `/share/notes/{noteId}`          (비공개면 공개 전환 후 공유)
 *  - reading_log    → `/share/reading-time/{userBookId}` (책 단위 독서기록 공개 페이지)
 * 채널 동작(링크복사·카카오·X·네이티브)은 `lib/share/share-channels`를 사용해
 * 결산·완독·책장 공유와 동일하게 맞춘다.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Check,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/date";
import { formatDuration } from "@/lib/utils/duration";
import { getImageUrl } from "@/lib/utils/image";
import { getAppUrl } from "@/lib/utils/url";
import { isMobile } from "@/lib/utils/device";
import { computeProgressPercent } from "@/lib/reading/progress";
import {
  buildShareUrl,
  copyShareLink,
  isKakaoShareAvailable,
  isNativeShareAvailable,
  shareViaKakao,
  shareViaNative,
  shareViaX,
  type ShareContext,
} from "@/lib/share/share-channels";
import { updateNote } from "@/app/actions/notes";
import { useAuth } from "@/contexts/auth-context";
import { NoteContentViewer } from "@/components/notes/note-content-viewer";
import { getKindIcon, getKindStyle, TONE } from "./unified-record-card";
import type { UnifiedRecord } from "@/types/unified-record";

interface RecordViewSheetProps {
  record: UnifiedRecord | null;
  onClose: () => void;
  onEdit: (record: UnifiedRecord) => void;
  onDelete?: (record: UnifiedRecord) => void;
  onOpenLightbox?: (urls: string[], alt: string) => void;
}

/** 이 기록으로 만들 수 있는 공유 컨텍스트 — 없으면 공유 불가(책 없는 시간 기록 등) */
function buildRecordShareContext(record: UnifiedRecord): ShareContext | null {
  const bookLabel = record.book.title ? `《${record.book.title}》` : "독서";

  if (record.source === "note") {
    const { label } = getKindStyle(record);
    const description =
      record.title ||
      record.memo ||
      record.transcriptionText ||
      `${bookLabel} ${label} 기록`;
    return {
      kind: "note",
      id: record.sourceId,
      title: `${bookLabel} 독서 기록`,
      description,
      path: `/share/notes/${record.sourceId}`,
      ctaLabel: "기록 보러가기",
    };
  }

  const userBookId = record.book.userBookId;
  if (!userBookId) return null;

  const parts: string[] = [];
  if (record.durationSeconds) parts.push(formatDuration(record.durationSeconds));
  if (record.startPage != null && record.endPage != null) {
    parts.push(`p.${record.startPage}→${record.endPage}`);
  }
  if (record.memo) parts.push(record.memo);

  return {
    kind: "reading_time",
    id: userBookId,
    title: `${bookLabel} 독서 기록`,
    description: parts.length > 0 ? parts.join(" · ") : `${bookLabel}를 읽고 있어요`,
    path: `/share/reading-time/${userBookId}`,
    ctaLabel: "독서 기록 보러가기",
  };
}

export function RecordViewSheet({
  record,
  onClose,
  onEdit,
  onDelete,
  onOpenLightbox,
}: RecordViewSheetProps) {
  const { user: currentUser } = useAuth();
  const [didCopy, setDidCopy] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  // 비공개 노트를 공유 시 공개로 전환한 경우, 시트가 열려 있는 동안만 낙관적으로 기억
  const [publishedIds, setPublishedIds] = useState<string[]>([]);

  if (!record) return null;

  const Icon = getKindIcon(record);
  const { label: kindLabel, tone } = getKindStyle(record);
  const toneStyle = TONE[tone];

  const durationLabel =
    record.durationSeconds && record.durationSeconds > 0
      ? formatDuration(record.durationSeconds)
      : null;

  const pagesLabel =
    record.startPage != null && record.endPage != null
      ? `p.${record.startPage} → p.${record.endPage}`
      : record.pageLabel
        ? `p.${record.pageLabel}`
        : null;

  const progressPercent = (() => {
    const page = record.endPage ?? (record.pageLabel ? parseInt(record.pageLabel, 10) : NaN);
    if (!Number.isFinite(page)) return null;
    return computeProgressPercent(page, record.book.totalPages);
  })();

  const shareContext = buildRecordShareContext(record);
  const isNotePrivate =
    record.source === "note" &&
    record.isPublic === false &&
    !publishedIds.includes(record.sourceId);

  /** 비공개 노트는 공유 직전 공개로 전환 (결산 공유의 ensurePublic 과 동일 패턴) */
  const ensureShareable = async (): Promise<boolean> => {
    if (!isNotePrivate) return true;
    setIsPublishing(true);
    try {
      await updateNote(record.sourceId, { is_public: true });
      setPublishedIds((prev) => [...prev, record.sourceId]);
      toast.success("이 기록을 공개로 바꿨어요. 링크를 받은 사람이 볼 수 있어요.");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "공개 전환에 실패했어요.");
      return false;
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareContext) return;
    if (!(await ensureShareable())) return;
    const url = buildShareUrl(getAppUrl(), shareContext, currentUser?.id ?? null);
    const ok = await copyShareLink(url);
    if (ok) {
      setDidCopy(true);
      toast.success("공유 링크를 복사했어요.");
      setTimeout(() => setDidCopy(false), 2000);
    } else {
      toast.error("링크 복사에 실패했어요.");
    }
  };

  const handleKakao = async () => {
    if (!shareContext) return;
    if (!(await ensureShareable())) return;
    const ok = await shareViaKakao({
      baseUrl: getAppUrl(),
      context: shareContext,
      referrerUserId: currentUser?.id ?? null,
    });
    if (!ok) toast.error("카카오톡 공유를 사용할 수 없어요.");
  };

  const handleX = async () => {
    if (!shareContext) return;
    if (!(await ensureShareable())) return;
    shareViaX({
      baseUrl: getAppUrl(),
      context: shareContext,
      referrerUserId: currentUser?.id ?? null,
    });
  };

  const handleNative = async () => {
    if (!shareContext) return;
    if (!(await ensureShareable())) return;
    await shareViaNative({
      baseUrl: getAppUrl(),
      context: shareContext,
      referrerUserId: currentUser?.id ?? null,
    });
  };

  // PC의 navigator.share 는 실패 사례가 있어 모바일에서만 네이티브 공유 노출
  const showNative = isNativeShareAvailable() && isMobile();
  const showKakao = isKakaoShareAvailable();
  const noteDetailHref =
    record.editTarget.kind === "note" ? `/notes/${record.editTarget.noteId}` : null;

  return (
    <Sheet
      open={!!record}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[95dvh] overflow-y-auto p-0 sm:max-w-2xl sm:mx-auto"
      >
        <div className="px-4 py-4 sm:px-6">
          <SheetHeader className="text-left pb-3">
            <SheetTitle className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset",
                  toneStyle.chip,
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              {kindLabel} 기록
            </SheetTitle>
            <SheetDescription suppressHydrationWarning>
              {formatDateTime(record.createdAt)}
            </SheetDescription>
          </SheetHeader>

          {/* 책 */}
          {record.book.title && (
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
              {record.book.coverImageUrl ? (
                <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image
                    src={getImageUrl(record.book.coverImageUrl)}
                    alt={record.book.title}
                    fill
                    sizes="40px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{record.book.title}</p>
                {record.book.author && (
                  <p className="truncate text-xs text-muted-foreground">{record.book.author}</p>
                )}
              </div>
              {record.book.userBookId && (
                <Button variant="ghost" size="sm" asChild className="ml-auto shrink-0 h-8 px-2">
                  <Link href={`/books/${record.book.userBookId}`}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="sr-only">책 상세로 이동</span>
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* 지표 — 있는 것만 */}
          {(durationLabel || pagesLabel || progressPercent != null) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border/60 px-4 py-3">
              {durationLabel && (
                <div>
                  <p className="text-[11px] text-muted-foreground">읽은 시간</p>
                  <p className="text-base font-semibold tabular-nums">{durationLabel}</p>
                </div>
              )}
              {pagesLabel && (
                <div>
                  <p className="text-[11px] text-muted-foreground">페이지</p>
                  <p className="text-base font-semibold tabular-nums">{pagesLabel}</p>
                </div>
              )}
              {progressPercent != null && (
                <div>
                  <p className="text-[11px] text-muted-foreground">진행률</p>
                  <p className="text-base font-semibold tabular-nums">{progressPercent}%</p>
                </div>
              )}
            </div>
          )}

          {/* 제목 */}
          {record.title && (
            <h3 className="mt-4 text-base font-semibold leading-snug">{record.title}</h3>
          )}

          {/* 내용 — 상세(구절·생각) / 필사 OCR / 메모 */}
          {record.content && (
            <div className="mt-3">
              <NoteContentViewer content={record.content} pageNumber={null} />
            </div>
          )}

          {record.transcriptionText && (
            <div className="mt-3 rounded-lg bg-muted/40 p-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {record.transcriptionText}
              </p>
            </div>
          )}

          {record.memo && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">메모</span>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {record.memo}
                </p>
              </div>
            </div>
          )}

          {/* 사진 */}
          {record.imageUrls.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {record.imageUrls.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() =>
                    onOpenLightbox?.(
                      record.imageUrls,
                      record.book.title ? `${record.book.title} 사진` : "기록 사진",
                    )
                  }
                  className="relative aspect-square overflow-hidden rounded-lg bg-neutral-900 transition-transform active:scale-95"
                  aria-label={`사진 ${i + 1} 크게 보기`}
                >
                  <Image
                    src={getImageUrl(url)}
                    alt={`기록 사진 ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 33vw, 200px"
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}

          {/* 북마크 */}
          {record.bookmarkText && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              {record.bookmarkText}
            </p>
          )}

          {/* 공유 — 앱 공통 공유 채널 재사용 */}
          <div className="mt-5 border-t border-border/60 pt-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Share2 className="h-3.5 w-3.5" />
              공유
            </div>
            {shareContext ? (
              <>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    disabled={isPublishing}
                    className="h-9"
                  >
                    {isPublishing ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : didCopy ? (
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                    ) : (
                      <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {didCopy ? "복사됨" : "링크 복사"}
                  </Button>
                  {showKakao && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleKakao}
                      disabled={isPublishing}
                      className="h-9"
                    >
                      카카오톡
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleX}
                    disabled={isPublishing}
                    className="h-9"
                  >
                    X
                  </Button>
                  {showNative && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNative}
                      disabled={isPublishing}
                      className="h-9"
                    >
                      <Share2 className="mr-1.5 h-3.5 w-3.5" />
                      더보기
                    </Button>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {isNotePrivate
                    ? "지금은 비공개예요. 공유하면 공개로 바뀌어 링크를 받은 사람이 볼 수 있어요."
                    : record.source === "note"
                      ? "링크를 받은 사람은 로그인 없이 이 기록을 볼 수 있어요."
                      : "이 책의 독서 기록 페이지를 로그인 없이 볼 수 있는 링크예요."}
                </p>
              </>
            ) : (
              <p className="mt-2 text-[11px] text-muted-foreground">
                책이 연결되지 않은 기록이라 공유 링크를 만들 수 없어요.
              </p>
            )}
          </div>

          {/* 액션 */}
          <div className="mt-4 flex items-center gap-2 pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              className="h-9 flex-1"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              편집
            </Button>
            {noteDetailHref && (
              <Button variant="ghost" size="sm" asChild className="h-9">
                <Link href={noteDetailHref}>전체 보기</Link>
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClose();
                  onDelete(record);
                }}
                className="h-9 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                aria-label="기록 삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
