"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getImageUrl, getProxiedImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { parseNoteContentFields, getNoteTypeLabel } from "@/lib/utils/note";
import type { NoteWithBook } from "@/types/note";
import { Quote, BookOpen, Calendar, ChevronDown, ChevronUp, Trees, TrendingUp, Sparkles, Link2, ImageOff, Youtube, Instagram, Globe, FileText as FileTextIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/notes/image-lightbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookLinkRenderer } from "@/components/notes/book-link-renderer";
import { BookTitle } from "@/components/books/book-title";
import { READTREE_BOOK_ID } from "@/lib/constants/readtree";
import type { ComponentType } from "react";

const SOURCE_ICON_CONFIG: Record<string, { icon: ComponentType<{ className?: string }>; color: string; bg: string }> = {
    youtube:   { icon: Youtube,       color: "text-red-500",   bg: "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/30" },
    instagram: { icon: Instagram,     color: "text-pink-500",  bg: "bg-pink-50 dark:bg-pink-950/30 border-pink-100 dark:border-pink-900/30" },
    article:   { icon: FileTextIcon,  color: "text-blue-500",  bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/30" },
    other:     { icon: Globe,         color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700" },
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
    youtube: "유튜브",
    instagram: "인스타그램",
    article: "아티클",
    other: "기타",
};

function FreeNoteIconBox({ sourceType, className }: { sourceType: string | null; className?: string }) {
    const config = SOURCE_ICON_CONFIG[(sourceType ?? "")] ?? SOURCE_ICON_CONFIG.other;
    const Icon = config.icon;
    return (
        <div className={cn("flex items-center justify-center rounded-sm shadow-md border", config.bg, className)}>
            <Icon className={cn("w-6 h-6", config.color)} />
        </div>
    );
}

export interface RelatedBookInfo {
    id: string; // user_books.id
    title: string;
    author: string | null;
    coverImageUrl: string | null;
}

interface ShareNoteCardProps {
    note: NoteWithBook;
    className?: string;
    isPublicView?: boolean;
    hideActions?: boolean; // 캡처 시 버튼 숨김용
    showTimestamp?: boolean; // 타임스탬프 표시 여부
    fixedHorizontal?: boolean; // 강제 가로 레이아웃 (캡처용)
    includeBranding?: boolean; // 브랜딩(로고/URL) 표시 여부
    user?: {
        id: string;
        name: string;
        avatar_url: string | null;
    } | null; // 사용자 정보
    relatedBooks?: RelatedBookInfo[]; // 연결된 책 정보
}

/**
 * 텍스트 더보기 제어를 위한 서브 컴포넌트
 */
function ExpandableText({
    text,
    limit = 180,
    className,
    hideActions = false
}: {
    text: string;
    limit?: number;
    className?: string;
    hideActions?: boolean;
}) {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const shouldTruncate = text.length > limit;

    // [UPDATE] 캡처 시(hideActions=true)에도 확장하지 않고 limit 내에서 유지하여 카드 사이즈 고정
    const displayText = isExpanded ? text : (text.length > limit ? text.slice(0, limit) + "..." : text);

    return (
        <div className={cn("relative group", className)}>
            <p className="whitespace-pre-wrap transition-all duration-300">
                <BookLinkRenderer text={displayText} />
            </p>
            {shouldTruncate && !hideActions && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-expanded={isExpanded}
                    className="h-6 px-2 mt-1 text-[10px] font-bold text-forest-600 hover:bg-forest-50 gap-1 transition-all"
                >
                    {isExpanded ? (
                        <>{t("share.collapse")} <ChevronUp className="w-3 h-3" /></>
                    ) : (
                        <>{t("share.expand")} <ChevronDown className="w-3 h-3" /></>
                    )}
                </Button>
            )}
        </div>
    );
}

/**
 * AI 텍스트 인식 섹션 - 접이식 UI
 * 기본 접힌 상태로 시작, 사용자가 펼쳐서 확인 가능
 * PC/모바일 반응형 지원 - 카드 하단 전체 너비 사용
 */
function CollapsibleAiSection({
    text,
    hideActions = false
}: {
    text: string;
    hideActions?: boolean;
}) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    // PC에서는 더 긴 미리보기, 모바일은 짧게
    const getPreviewText = () => {
        const firstLine = text.split('\n')[0];
        const maxLength = 150;
        if (firstLine.length <= maxLength) return firstLine;
        return firstLine.slice(0, maxLength).trim() + "...";
    };
    const previewText = getPreviewText();

    return (
        <div className="px-6 py-4 md:px-10 md:py-5 bg-slate-50/50 dark:bg-slate-900/30">
            {/* 헤더 - 클릭 가능 */}
            <button
                onClick={() => !hideActions && setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between gap-4 group transition-colors rounded-lg py-1",
                    !hideActions && "cursor-pointer"
                )}
                disabled={hideActions}
            >
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-forest-500/10 dark:bg-forest-500/20 rounded-lg">
                        <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-forest-600 dark:text-forest-400" />
                    </div>
                    <span className="text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("share.aiTextRecognition")}
                    </span>
                </div>
                {!hideActions && (
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-[11px] font-semibold transition-all",
                        isOpen
                            ? "bg-forest-100 dark:bg-forest-900/50 text-forest-700 dark:text-forest-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-forest-100 dark:group-hover:bg-forest-900/50 group-hover:text-forest-700 dark:group-hover:text-forest-300"
                    )}>
                        <span>{isOpen ? t("share.collapse") : t("share.expand")}</span>
                        {isOpen ? (
                            <ChevronUp className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        ) : (
                            <ChevronDown className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        )}
                    </div>
                )}
            </button>

            {/* 접힌 상태일 때 미리보기 텍스트 */}
            {!isOpen && !hideActions && (
                <p className="mt-3 text-[12px] md:text-[13px] text-slate-400 dark:text-slate-500 leading-relaxed line-clamp-1 md:line-clamp-2">
                    {previewText}
                </p>
            )}

            {/* 펼쳐진 콘텐츠 영역 - 전체 너비 활용 */}
            <div className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isOpen || hideActions ? "max-h-[1000px] opacity-100 mt-4" : "max-h-0 opacity-0 mt-0"
            )}>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-[13px] md:text-sm lg:text-base leading-relaxed md:leading-loose text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {text}
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * 날짜를 YYYY.MM.DD 형식으로 변환
 */
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
};

/**
 * 날짜와 시간을 YYYY.MM.DD HH:mm 형식으로 변환
 */
const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}.${m}.${d} ${hh}:${mm}`;
};

/**
 * 사용자 피드백 가이드 기반 고도화된 독서 기록 카드
 * - [v4.0] 모든 케이스(이미지 유/무)에 대해 '좌우 분할' 단일 레이아웃 적용
 * - 표준 너비: max-w-[960px]
 */
export function ShareNoteCard({ note, className, isPublicView = false, hideActions = false, showTimestamp = true, fixedHorizontal = false, includeBranding = true, user, relatedBooks }: ShareNoteCardProps) {
    const { t } = useTranslation();
    const [imgError, setImgError] = useState(false);
    const handleImgError = useCallback(() => setImgError(true), []);

    // [데이터 매핑 수정] Supabase 쿼리 결과인 'books' 필드와 'book' 필드 모두를 지원하도록 정규화
    const book = note.book || (note as any).books;
    const isReadtreeNote = note.book_id === READTREE_BOOK_ID;

    const { quote, memo } = parseNoteContentFields(note.content);
    const hasQuote = quote && quote.trim().length > 0;
    // 필사 타입의 AI 분석 텍스트 (하단에 별도 표시)
    const aiAnalysisText = note.type === "transcription" ? note.transcription?.extracted_text : null;
    const hasAiAnalysis = !!aiAnalysisText;
    const hasMemo = memo && memo.trim().length > 0;
    const hasImage = !!note.image_url && isValidImageUrl(note.image_url);
    const typeLabel = getNoteTypeLabel(note.type, hasImage);
    const formattedDate = formatDate(note.created_at);
    const isProgressType = note.type === "progress";

    // 공통 푸터 (ReadTree 로고 + 브랜딩 URL)
    const FooterLogo = () => (
        <div className="flex items-center justify-between w-full overflow-visible">
            <div className="flex items-center gap-2 whitespace-nowrap overflow-visible">
                <div className="w-8 h-8 bg-forest-600 dark:bg-forest-500 rounded-lg flex items-center justify-center shadow-md shadow-forest-200 dark:shadow-forest-900/20 transition-transform hover:scale-105 shrink-0">
                    <Trees className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col justify-center gap-0 overflow-visible h-8">
                    <div className="block h-[18px] leading-[18px] overflow-visible">
                        <span className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100 italic">
                            ReadTree
                        </span>
                    </div>
                    <div className="block h-[12px] leading-[12px] overflow-visible">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                            Your Intelligence Forest
                        </span>
                    </div>
                </div>
            </div>
            <span className="text-[10px] font-semibold text-slate-300 dark:text-slate-600 tracking-wide">
                readingtree.app
            </span>
        </div>
    );

    // 진행 기록 타입: 컴팩트한 특별 레이아웃
    if (isProgressType) {
        return (
            <Card className={cn("overflow-hidden border-none shadow-xl bg-white dark:bg-slate-950 w-full max-w-[600px] mx-auto", className)}>
                <CardContent className="p-0">
                    <div className="flex flex-col">
                        {/* 상단: 책 정보 + 진행 상태 */}
                        <div className="bg-gradient-to-br from-forest-50 to-emerald-50 dark:from-forest-950 dark:to-emerald-950 p-6">
                            <div className="flex items-start gap-4">
                                {/* 책 표지 / 자유 기록 아이콘 */}
                                {isReadtreeNote ? (
                                    <FreeNoteIconBox sourceType={note.source_type} className="w-20 h-28 shrink-0" />
                                ) : hideActions ? (
                                    <div className="relative w-20 h-28 shrink-0 shadow-lg rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                        <img
                                            src={getProxiedImageUrl(book?.cover_image_url || "")}
                                            alt={book?.title || "책 표지"}
                                            className="absolute inset-0 w-full h-full object-cover"
                                            crossOrigin="anonymous"
                                        />
                                    </div>
                                ) : (
                                    <ImageLightbox src={book?.cover_image_url || ""} alt={book?.title || "책 표지"}>
                                        <div className="relative w-20 h-28 shrink-0 shadow-lg rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                            <Image
                                                src={getImageUrl(book?.cover_image_url || "")}
                                                alt={book?.title || "책 표지"}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                                priority={true}
                                            />
                                        </div>
                                    </ImageLightbox>
                                )}

                                {/* 출처 / 책 정보 */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight mb-1">
                                        <BookTitle
                                            title={isReadtreeNote ? (note.source_label || t("notes.freeNote")) : (book?.title || t("share.noTitle"))}
                                            mainTitleClassName="text-slate-900 dark:text-slate-100"
                                            subtitleClassName="text-slate-500 dark:text-slate-400 text-sm font-normal block mt-0.5"
                                        />
                                    </h3>
                                    {isReadtreeNote ? (
                                        note.source_type && (
                                            <p className="text-xs text-slate-400 font-medium mb-3">
                                                {SOURCE_TYPE_LABELS[note.source_type] ?? SOURCE_TYPE_LABELS.other}
                                            </p>
                                        )
                                    ) : (
                                    <p className="text-sm text-forest-700 dark:text-forest-400 font-medium mb-3">
                                        {book?.author || t("share.unknownAuthor")}
                                    </p>
                                    )}

                                    {/* 진행 정보 강조 */}
                                    <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
                                        <TrendingUp className="w-5 h-5 text-forest-500" />
                                        <div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{t("share.readPage")}</div>
                                            <div className="text-xl font-bold text-forest-600 dark:text-forest-400">
                                                {note.page_number || 0}
                                                <span className="text-sm font-normal text-slate-400 ml-1">{t("share.pageUnit")}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 메모 (있는 경우) + 연결된 책 + 푸터 */}
                        <div className="p-6 space-y-4">
                            {hasMemo && (
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {memo}
                                    </p>
                                </div>
                            )}

                            {/* 연결된 책 */}
                            {relatedBooks && relatedBooks.length > 0 && (
                                <RelatedBooksSection books={relatedBooks} hideActions={hideActions} />
                            )}

                            {/* 푸터: 날짜 + 로고 + 사용자 */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span suppressHydrationWarning>{formattedDate}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {includeBranding && <FooterLogo />}
                                    {user && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <span>by</span>
                                            <span className="font-medium text-slate-700 dark:text-slate-300">
                                                {user.name || t("share.anonymous")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950 w-full max-w-[960px] mx-auto", className)}>
            <CardContent className="p-0">
                <div className={cn("flex", fixedHorizontal ? "flex-row" : "flex-col md:flex-row min-h-[560px]")}>
                    {/* 좌측 섹션: 이미지 유무에 따라 너비 조정 (이미지 없음 -> 50%, 이미지 있음 -> 400px) */}
                    <div className={cn(
                        "bg-slate-50 dark:bg-slate-900/50 p-6 md:p-10 flex flex-col border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 transition-all duration-300",
                        fixedHorizontal
                            ? (hasImage ? "w-[400px]" : "w-1/2")
                            : (hasImage ? "w-full md:w-[400px]" : "w-full md:w-1/2")
                    )}>
                        {/* 상단: 책 정보 요약 (항상 표시) */}
                        <div className="flex items-start gap-4 mb-8">
                            {isReadtreeNote ? (
                                // 자유 기록: 출처 아이콘 표시
                                <FreeNoteIconBox sourceType={note.source_type} className="w-16 h-24 shrink-0 aspect-[2/3]" />
                            ) : hideActions ? (
                                // 캡처 시: html2canvas 호환을 위해 일반 img 태그 사용
                                <div className="relative w-16 h-24 shrink-0 shadow-md rounded-sm overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-[2/3]">
                                    <img
                                        src={getProxiedImageUrl(book?.cover_image_url || "")}
                                        alt={book?.title || "책 표지"}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                    />
                                </div>
                            ) : (
                                // 일반 화면: ImageLightbox 사용
                                <ImageLightbox src={book?.cover_image_url || ""} alt={book?.title || "책 표지"}>
                                    <div className="relative w-16 h-24 shrink-0 shadow-md rounded-sm overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-[2/3]">
                                        <Image
                                            src={getImageUrl(book?.cover_image_url || "")}
                                            alt={book?.title || "책 표지"}
                                            fill
                                            className="object-cover"
                                            sizes="64px"
                                            priority={true}
                                        />
                                    </div>
                                </ImageLightbox>
                            )}
                            <div className="flex-1 min-w-0 pt-0.5">
                                <h3 className="font-black text-lg text-slate-900 dark:text-slate-100 leading-[1.3] tracking-tight break-keep">
                                    <BookTitle
                                        title={isReadtreeNote ? (note.source_label || t("notes.freeNote")) : (book?.title || t("share.noTitle"))}
                                        mainTitleClassName="text-slate-900 dark:text-slate-100"
                                        subtitleClassName="text-slate-600 dark:text-slate-400 text-sm font-normal block mt-1"
                                    />
                                </h3>
                                {isReadtreeNote ? (
                                    note.source_type && (
                                        <p className="text-xs text-slate-400 font-medium mt-1.5">
                                            {SOURCE_TYPE_LABELS[note.source_type] ?? SOURCE_TYPE_LABELS.other}
                                        </p>
                                    )
                                ) : (
                                <p className="text-sm text-forest-700 font-bold mt-2">
                                    {book?.author || t("share.unknownAuthor")}
                                </p>
                                )}
                                {note.page_number && (
                                    <div className="h-4 leading-4 mt-2 overflow-visible">
                                        <BookOpen className="w-3 h-3 text-forest-400 shrink-0 inline-block align-middle mr-1.5" />
                                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest inline-block align-middle">
                                            {note.page_number}P Record
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 메인 비주얼 영역: 이미지 있을 때 → 사용자 이미지, 없을 때 → 인상 깊은 구절 */}
                        <div className="flex-1 flex flex-col justify-center">
                            {hasImage ? (
                                // [Case A] 이미지 있음: 사진을 꽉 차게 보여줌 (비율 개선)
                                <div className="flex flex-col h-full w-full">
                                    {hideActions ? (
                                        // 캡처 시: html2canvas 호환을 위해 일반 img 태그 사용
                                        <div className="relative w-full flex-1 min-h-[350px] rounded-xl overflow-hidden shadow-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                            {isValidImageUrl(note.image_url!) && !imgError ? (
                                                <img
                                                    src={getProxiedImageUrl(note.image_url!)}
                                                    alt="Captured Moment"
                                                    className="absolute inset-0 w-full h-full object-contain"
                                                    crossOrigin="anonymous"
                                                    onError={handleImgError}
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                                    <ImageOff className="h-10 w-10 mb-2 text-slate-400" />
                                                    <p className="text-sm font-medium">{t("share.imageLoadError")}</p>
                                                </div>
                                            )}
                                            {showTimestamp && (
                                                <div className="absolute bottom-3 left-3 z-20">
                                                    <p className="text-[11px] font-bold text-white drop-shadow-md bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full" suppressHydrationWarning>
                                                        {formatDateTime(note.created_at)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // 일반 화면
                                        <ImageLightbox src={note.image_url!} alt="Captured Moment">
                                            <div className="relative w-full flex-1 min-h-[350px] rounded-xl overflow-hidden shadow-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group cursor-zoom-in">
                                                {isValidImageUrl(note.image_url!) && !imgError ? (
                                                    <Image
                                                        src={getImageUrl(note.image_url!)}
                                                        alt="Captured Moment"
                                                        fill
                                                        className="object-contain transition-transform duration-500 group-hover:scale-105"
                                                        sizes="(max-width: 768px) 100vw, 400px"
                                                        priority={true}
                                                        unoptimized={true}
                                                        onError={handleImgError}
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                                        <ImageOff className="h-10 w-10 mb-2 text-slate-400" />
                                                        <p className="text-sm font-medium">{t("share.imageLoadError")}</p>
                                                    </div>
                                                )}
                                                {showTimestamp && (
                                                    <div className="absolute bottom-3 left-3 z-20">
                                                        <p className="text-[11px] font-bold text-white drop-shadow-md bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full" suppressHydrationWarning>
                                                            {formatDateTime(note.created_at)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </ImageLightbox>
                                    )}
                                    <div className="mt-4 text-center">
                                        <p className="text-[11px] font-black tracking-[0.4em] text-slate-300 dark:text-slate-600 uppercase">
                                            Captured Moment
                                        </p>
                                    </div>
                                </div>
                            ) : hasQuote ? (
                                // [Case B] 이미지 없음: 인용구를 위한 타이포그래피 중심 디자인 (여백 확보, 배경 제거)
                                <div className="flex-1 flex flex-col justify-center py-4 relative">
                                    {/* 장식용 따옴표 아이콘 (배경이 아닌 텍스트 장식 요소로 배치) */}
                                    <div className="mb-4">
                                        <Quote className="w-10 h-10 md:w-12 md:h-12 text-forest-500 fill-forest-100 dark:fill-forest-900/30 dark:text-forest-400 opacity-100" />
                                    </div>

                                    <div className="relative z-10 pl-2">
                                        <ExpandableText
                                            text={`"${quote}"`}
                                            className="text-2xl md:text-3xl font-semibold leading-relaxed text-slate-800 dark:text-slate-100 tracking-tight"
                                            limit={400} // 더 많은 텍스트 표시
                                            hideActions={hideActions}
                                        />
                                    </div>

                                    {/* 하단 장식 바 */}
                                    <div className="mt-8 h-1.5 w-20 bg-forest-500 rounded-full opacity-80" />
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* 우측 섹션: 기록 감상 (Reflection) */}
                    <div className="flex-1 p-8 md:p-12 flex flex-col relative bg-white dark:bg-slate-950">
                        {/* 배경 장식 요소 - 은은하게 */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 dark:bg-slate-900/30 rounded-bl-[100px] -z-0 pointer-events-none" />

                        <div className="relative z-10 flex-1 flex flex-col h-full">
                            {/* 헤더: 타입 & 날짜 */}
                            <div className="flex justify-between items-center mb-10 pb-4 border-b border-slate-100 dark:border-slate-800 overflow-visible h-10">
                                <Badge variant="outline" className="px-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 overflow-visible min-w-fit h-6 py-0 flex items-center justify-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap leading-[24px] h-6 block">
                                        {typeLabel}
                                    </span>
                                </Badge>
                                <div className="h-6 leading-6 overflow-visible">
                                    <Calendar className="w-3.5 h-3.5 text-forest-500 shrink-0 inline-block align-middle mr-2" />
                                    <span className="text-xs font-bold text-slate-400 whitespace-nowrap inline-block align-middle" suppressHydrationWarning>
                                        {formattedDate}
                                    </span>
                                </div>
                            </div>

                            {/* 컨텐츠: 감상 (Reflection) */}
                            <div className="flex-1">
                                {/* 이미지 있을 때만 인용구 표시 (왼쪽에 이미지가 있으므로) */}
                                {hasImage && hasQuote && (
                                    <div className="mb-8 relative">
                                        {/* 아이콘 추가 (작은 사이즈) */}
                                        <div className="mb-3">
                                            <Quote className="w-8 h-8 text-forest-500 fill-forest-100 dark:fill-forest-900/30 dark:text-forest-400 opacity-100" />
                                        </div>
                                        <ExpandableText
                                            text={`"${quote}"`}
                                            className="text-lg md:text-xl font-bold leading-relaxed text-slate-800 dark:text-slate-100 tracking-tight"
                                            limit={180}
                                            hideActions={hideActions}
                                        />
                                    </div>
                                )}

                                {/* 내 생각 (Reflection) Main */}
                                {hasMemo && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2 overflow-visible h-6 leading-6">
                                            <span className="h-px w-6 bg-forest-500 shrink-0 inline-block align-middle"></span>
                                            <span className={cn(
                                                "font-black text-forest-500 uppercase tracking-widest whitespace-nowrap inline-block align-middle",
                                                hasImage ? "text-xs" : "text-sm md:text-base"
                                            )}>My Reflection</span>
                                        </div>
                                        <ExpandableText
                                            text={memo}
                                            className={cn(
                                                "leading-loose text-slate-600 dark:text-slate-300 font-medium whitespace-pre-line",
                                                hasImage ? "text-base" : "text-lg md:text-xl" // 이미지 없을 때 조금 더 크게
                                            )}
                                            limit={hasImage ? 250 : 500}
                                            hideActions={hideActions}
                                        />
                                    </div>
                                )}

                            </div>

                            {/* 푸터: 사용자 & 로고 */}
                            <div className="mt-auto pt-10 flex items-end justify-between gap-4">
                                {includeBranding ? <FooterLogo /> : <div />}
                                <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 pr-4 pl-1 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                                    {/* 캡처 모드(hideActions) 확인 */}
                                    {hideActions ? (
                                        <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm bg-slate-100">
                                            {user?.avatar_url ? (
                                                <img
                                                    src={getProxiedImageUrl(user.avatar_url)}
                                                    alt={user.name || "사용자"}
                                                    className="h-full w-full object-cover"
                                                    crossOrigin="anonymous"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-forest-100 text-forest-700 text-[10px] font-bold">
                                                    {user?.name?.[0]?.toUpperCase() || "N"}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <Avatar className="h-8 w-8 shrink-0 border-2 border-white dark:border-slate-800 shadow-sm">
                                            <AvatarImage
                                                src={user?.avatar_url ? getProxiedImageUrl(user.avatar_url) : undefined}
                                                crossOrigin="anonymous"
                                                alt={user?.name || "사용자"}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="bg-forest-100 text-forest-700 text-[10px] font-bold">
                                                {user?.name?.[0]?.toUpperCase() || "NB"}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}

                                    <div className="flex flex-col justify-center min-w-0 gap-0 overflow-visible h-10">
                                        <div className="block h-[14px] leading-[14px] overflow-visible">
                                            <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                                                Record by
                                            </span>
                                        </div>
                                        <div className="block h-[18px] leading-[18px] overflow-visible">
                                            <span className={cn(
                                                "font-bold text-slate-700 dark:text-slate-200 text-xs whitespace-nowrap",
                                                !hideActions && "truncate max-w-[100px]"
                                            )}>
                                                {user?.name || t("share.anonymous")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 연결된 책 - 카드 하단 전체 너비로 표시 */}
                {relatedBooks && relatedBooks.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 md:px-10 md:py-5">
                        <RelatedBooksSection books={relatedBooks} hideActions={hideActions} />
                    </div>
                )}

                {/* AI 텍스트 인식 - 카드 하단 전체 너비로 표시 */}
                {hasAiAnalysis && (
                    <div className="border-t border-slate-100 dark:border-slate-800">
                        <CollapsibleAiSection
                            text={aiAnalysisText!}
                            hideActions={hideActions}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * 연결된 책 섹션 - 카드 내부에 표시
 * 캡처 모드에서도 정상 렌더링 (img 태그 사용)
 */
function RelatedBooksSection({
    books,
    hideActions = false,
}: {
    books: RelatedBookInfo[];
    hideActions?: boolean;
}) {
    const { t } = useTranslation();
    return (
        <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {t("share.relatedBooks")}
                </span>
                <span className="text-[10px] text-slate-300 font-medium">{books.length}</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {books.map((book) => (
                    <div
                        key={book.id}
                        className="flex items-center gap-2.5 shrink-0 px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"
                    >
                        {hideActions ? (
                            <div className="relative w-7 h-10 shrink-0 rounded overflow-hidden bg-slate-200 dark:bg-slate-700">
                                <img
                                    src={getProxiedImageUrl(book.coverImageUrl || "")}
                                    alt={book.title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                />
                            </div>
                        ) : (
                            <div className="relative w-7 h-10 shrink-0 rounded overflow-hidden bg-slate-200 dark:bg-slate-700">
                                <Image
                                    src={getImageUrl(book.coverImageUrl || "")}
                                    alt={book.title}
                                    fill
                                    className="object-cover"
                                    sizes="28px"
                                />
                            </div>
                        )}
                        <div className="min-w-0 max-w-[140px]">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate leading-relaxed">
                                {book.title}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
