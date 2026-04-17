"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Check,
  Download,
  Gift,
  Link as LinkIcon,
  Loader2,
  Sparkles,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { notify } from "@/lib/toast";
import {
  copyShareLink,
  isKakaoShareAvailable,
  isNativeShareAvailable,
  shareViaKakao,
  shareViaNative,
  shareViaX,
  type ShareContext,
} from "@/lib/share/share-channels";
import { recordShareEvent } from "@/app/actions/tracking";

export interface CompletionCelebrationCardProps {
  userBookId: string;
  bookTitle: string;
  bookAuthor?: string | null;
  bookCoverUrl?: string | null;
  /** 이번 완독까지 포함한 누적 회독 횟수 */
  totalReadCount: number;
  onClose: () => void;
}

/**
 * 완독 직후 노출되는 축하 카드.
 * Stage 2 confetti 이후 사용자가 SNS로 공유하고 레퍼럴을 유도하는 진입점.
 */
export function CompletionCelebrationCard({
  userBookId,
  bookTitle,
  bookAuthor,
  bookCoverUrl,
  totalReadCount,
  onClose,
}: CompletionCelebrationCardProps) {
  const { user } = useAuth();
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [kakaoShared, setKakaoShared] = useState(false);
  const [kakaoAvailable, setKakaoAvailable] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [busy, setBusy] = useState<"link" | "kakao" | "x" | "native" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setBaseUrl(window.location.origin);
    setKakaoAvailable(isKakaoShareAvailable());
    setNativeAvailable(isNativeShareAvailable());
  }, []);

  const context: ShareContext = {
    kind: "completion",
    id: userBookId,
    title:
      totalReadCount > 1
        ? `${bookTitle} — ${totalReadCount}회독 완독!`
        : `${bookTitle} 완독했어요`,
    description: bookAuthor
      ? `${bookAuthor}의 책을 다 읽었어요. 나의 독서 기록도 ReadTree에서 시작해보세요.`
      : "오늘 한 권의 책을 다 읽었어요. 나의 독서 기록도 ReadTree에서 시작해보세요.",
    path: `/share/completions/${userBookId}`,
    ctaLabel: "완독 카드 보기",
  };

  const handleCopyLink = async () => {
    if (!baseUrl) return;
    setBusy("link");
    try {
      const url = buildUrlLocal(baseUrl, context, user?.id);
      const ok = await copyShareLink(url);
      if (ok) {
        setLinkCopied(true);
        notify.success("링크를 복사했어요", {
          description: "친구에게 붙여넣어 보세요.",
        });
        recordShareEvent("completion", userBookId, "copy_link").catch(() => null);
        setTimeout(() => setLinkCopied(false), 2400);
      } else {
        notify.error("링크 복사에 실패했어요");
      }
    } finally {
      setBusy(null);
    }
  };

  const handleKakao = async () => {
    if (!baseUrl) return;
    setBusy("kakao");
    try {
      const ok = await shareViaKakao({ baseUrl, context, referrerUserId: user?.id });
      if (ok) {
        setKakaoShared(true);
        notify.success("카카오톡 공유창을 열었어요");
        recordShareEvent("completion", userBookId, "kakao").catch(() => null);
        setTimeout(() => setKakaoShared(false), 2400);
      } else {
        notify.error("카카오 공유를 사용할 수 없어요", {
          description: "잠시 후 다시 시도해주세요.",
        });
      }
    } finally {
      setBusy(null);
    }
  };

  const handleX = () => {
    if (!baseUrl) return;
    setBusy("x");
    try {
      shareViaX({ baseUrl, context, referrerUserId: user?.id });
      recordShareEvent("completion", userBookId, "x").catch(() => null);
    } finally {
      setBusy(null);
    }
  };

  const handleNative = async () => {
    if (!baseUrl) return;
    setBusy("native");
    try {
      const ok = await shareViaNative({ baseUrl, context, referrerUserId: user?.id });
      if (ok) recordShareEvent("completion", userBookId, "native").catch(() => null);
    } finally {
      setBusy(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="flex flex-col"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-amber-500 p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <Trophy className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider opacity-90">
              <Sparkles className="h-3 w-3" />
              <span>완독 축하</span>
            </div>
            <h2 className="text-xl font-bold">
              {totalReadCount > 1 ? `${totalReadCount}회독 완독!` : "첫 완독을 축하해요"}
            </h2>
          </div>
        </div>
      </div>

      <div className="flex gap-3 p-4 border-x border-b border-slate-200 dark:border-slate-800 rounded-b-2xl bg-white dark:bg-slate-950">
        {bookCoverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bookCoverUrl}
            alt={bookTitle}
            className="h-20 w-14 rounded-md border border-slate-200 object-cover shadow-sm dark:border-slate-700"
          />
        ) : (
          <div className="flex h-20 w-14 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-900">
            표지 없음
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold text-foreground">
            {bookTitle}
          </p>
          {bookAuthor && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {bookAuthor}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            완독일:{" "}
            <span className="font-medium text-foreground">
              {new Date().toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">친구에게 공유하기</p>
        <div
          className={cn(
            "grid gap-2",
            kakaoAvailable ? "grid-cols-3" : "grid-cols-2",
          )}
        >
          <Button
            variant={linkCopied ? "success" : "outline"}
            size="sm"
            className="h-10 gap-1.5"
            onClick={handleCopyLink}
            disabled={busy !== null}
          >
            {busy === "link" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : linkCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <LinkIcon className="h-4 w-4" />
            )}
            <span className="text-xs">{linkCopied ? "복사됨" : "링크"}</span>
          </Button>

          {kakaoAvailable && (
            <Button
              variant={kakaoShared ? "success" : "kakao"}
              size="sm"
              className="h-10 gap-1.5"
              onClick={handleKakao}
              disabled={busy !== null}
            >
              {busy === "kakao" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : kakaoShared ? (
                <Check className="h-4 w-4" />
              ) : (
                <KakaoIcon />
              )}
              <span className="text-xs">{kakaoShared ? "열림" : "카카오"}</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-1.5"
            onClick={handleX}
            disabled={busy !== null}
          >
            {busy === "x" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XIcon />
            )}
            <span className="text-xs">X</span>
          </Button>
        </div>

        {nativeAvailable && !kakaoAvailable && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-full gap-1.5"
            onClick={handleNative}
            disabled={busy !== null}
          >
            {busy === "native" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="text-xs">기기 공유 메뉴 열기</span>
          </Button>
        )}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
        <Gift className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 text-left">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
            친구가 가입하면 최대 +300P
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-amber-800/80 dark:text-amber-200/80">
            가입 +100P, 첫 책 등록 +100P, 첫 기록 작성 +100P 단계별로 지급돼요.
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          닫기
        </Button>
        <Button asChild className="flex-1">
          <Link href={`/books/${userBookId}/report`}>AI 리포트 생성</Link>
        </Button>
      </div>
    </motion.div>
  );
}

function buildUrlLocal(
  baseUrl: string,
  context: ShareContext,
  referrerUserId?: string | null,
): string {
  const url = new URL(
    context.path,
    baseUrl.endsWith("/") ? baseUrl : baseUrl + "/",
  );
  if (referrerUserId) {
    url.searchParams.set("ref", referrerUserId);
    url.searchParams.set("src", context.kind);
  }
  return url.toString();
}

function KakaoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 0C4.03 0 0 3.27 0 7.3c0 2.55 1.7 4.8 4.25 6.05L3.5 17.5l4.5-2.45c.5.05 1 .1 1.5.1 4.97 0 9-3.27 9-7.3S13.97 0 9 0z"
        fill="currentColor"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18.244 2H21.552L14.325 10.26L22.828 21.5H16.17L10.955 14.692L4.984 21.5H1.676L9.406 12.667L1.252 2H8.084L12.793 8.228L18.244 2ZM17.083 19.522H18.916L7.084 3.87H5.116L17.083 19.522Z"
        fill="currentColor"
      />
    </svg>
  );
}
