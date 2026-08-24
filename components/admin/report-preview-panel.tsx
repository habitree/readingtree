"use client";

/**
 * AI 리포트 양식 미리보기 패널
 * 실제 사용자에게 노출되는 업데이트된 리포트 양식 — 매거진 본문 + 이미지 공유 카드 5종 —
 * 을 샘플 데이터로 렌더링해 관리자가 확인한다. 설정 저장과 무관한 순수 뷰어.
 * (사용자 화면과 동일한 컴포넌트를 그대로 재사용한다 — 별도 모형 아님)
 */

import { useEffect, useMemo, useState } from "react";
import { ImageDown, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReadingReportMagazine } from "@/components/books/reading-report-magazine";
import { buildShareCardData } from "@/components/books/share-card/share-card-data";
import { ensureShareCardFonts } from "@/components/books/share-card/share-card-fonts";
import { SHARE_CARD_TEMPLATES } from "@/components/books/share-card/templates";
import { parseReportSections } from "@/lib/utils/report-parser";
import type { BookInfoForReport } from "@/types/ai/report";

/* ── 샘플 데이터 (고정) ───────────────────────────────────── */

const SAMPLE_BOOK: BookInfoForReport = {
  title: "아주 작은 습관의 힘",
  author: "제임스 클리어",
  coverImageUrl: null,
  startedAt: "2026-03-02T00:00:00.000Z",
  completedAt: "2026-03-28T00:00:00.000Z",
  status: "completed",
  currentPage: 360,
  totalPages: 360,
};

const SAMPLE_NOTE_COUNT = 12;
const SAMPLE_READING_DAYS = 9;
const SAMPLE_NOTE_TYPE_COUNTS: Record<string, number> = {
  quote: 5,
  memo: 4,
  transcription: 1,
  progress: 1,
  photo: 1,
};
const SAMPLE_GENERATED_AT = "2026-08-24T09:00:00.000Z";

const SAMPLE_REPORT_MD = `## 책 개요
- 제목: 아주 작은 습관의 힘
- 저자: 제임스 클리어
- 독서 기간: 2026.03.02 ~ 2026.03.28
- 읽는 이유: 흐트러진 아침 루틴을 다시 세우고 싶어서

습관이 목표가 아니라 정체성에서 시작된다는 관점으로 행동 변화의 과학을 풀어낸 책입니다. 한 달 동안 아침 시간에 조금씩 나눠 읽으며 기록을 남겼습니다.

## 핵심 인사이트
1. **작은 습관의 복리 효과** — 매일 1%의 개선이 1년 뒤 37배의 성장으로 돌아온다. 눈에 띄지 않는 반복이 결국 곡선을 만든다.
2. **환경 설계가 의지를 이긴다** — 좋은 습관은 마찰을 줄이고 나쁜 습관은 마찰을 늘리는 것, 즉 환경을 바꾸는 편이 의지력보다 훨씬 효과적이다.
3. **정체성 기반 습관** — "책을 읽어야 한다"가 아니라 "나는 읽는 사람이다"에서 출발할 때 습관이 오래 유지된다.

## 인상 깊은 구절
> "우리는 반복하는 것으로 만들어진다. 그러므로 탁월함은 행위가 아니라 습관이다." (p.23)

> "목표를 세우지 말고 시스템을 만들어라." (p.41)

## 나의 생각 정리
"아침 루틴을 '독서 10분'부터 다시 쌓기로 했다. 크기가 아니라 반복이 핵심이라는 말에 설득당했다."
"의지가 아니라 책상 위에 올려 둔 책 한 권이 나를 움직였다."

## 독서 여정
첫 주에는 개념 정리 위주로 읽다가, 둘째 주부터는 책의 제안을 실제 아침 루틴에 적용하며 읽는 속도가 붙었습니다. 마지막 주에는 앞서 남긴 기록을 되짚으며 완독했습니다.

## 종합 요약
습관은 정체성을 만드는 시스템이며, 변화는 크기가 아니라 방향과 반복에서 온다는 것이 이 책의 핵심입니다. 나는 내일 아침 어떤 1%를 바꿀 수 있을까?`;

/* ── 패널 ─────────────────────────────────────────────────── */

export function ReportPreviewPanel() {
  const [view, setView] = useState<"card" | "magazine">("card");
  const [templateId, setTemplateId] = useState(SHARE_CARD_TEMPLATES[0].id);
  // 탭 콘텐츠는 지연 마운트되므로 callback ref로 실제 노드를 잡아 축소 배율을 계산한다
  const [previewWrap, setPreviewWrap] = useState<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(0.8);

  const selected =
    SHARE_CARD_TEMPLATES.find((t) => t.id === templateId) ?? SHARE_CARD_TEMPLATES[0];

  const cardData = useMemo(
    () =>
      buildShareCardData({
        reportMarkdown: SAMPLE_REPORT_MD,
        bookInfo: SAMPLE_BOOK,
        noteCount: SAMPLE_NOTE_COUNT,
        noteTypeCounts: SAMPLE_NOTE_TYPE_COUNTS,
        readingDays: SAMPLE_READING_DAYS,
        generatedAt: SAMPLE_GENERATED_AT,
      }),
    []
  );

  const sections = useMemo(() => parseReportSections(SAMPLE_REPORT_MD), []);

  // 선택된 카드 템플릿의 서체 온디맨드 로드
  useEffect(() => {
    if (view === "card") ensureShareCardFonts(selected.fonts);
  }, [view, selected]);

  // 미리보기 축소 배율 (컨테이너 폭 / 800)
  useEffect(() => {
    if (!previewWrap) return;
    const update = () => setPreviewScale(Math.min(1, previewWrap.clientWidth / 800));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(previewWrap);
    return () => observer.disconnect();
  }, [previewWrap]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          샘플 데이터 기준 렌더링 — 실제 사용자 화면과 동일한 컴포넌트를 사용합니다.
        </p>
        <div className="flex gap-1 bg-muted rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setView("card")}
            className={cn(
              "px-3 py-1 rounded text-xs transition-colors inline-flex items-center gap-1.5",
              view === "card"
                ? "bg-background shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ImageDown className="h-3.5 w-3.5" />
            이미지 카드 5종
          </button>
          <button
            type="button"
            onClick={() => setView("magazine")}
            className={cn(
              "px-3 py-1 rounded text-xs transition-colors inline-flex items-center gap-1.5",
              view === "magazine"
                ? "bg-background shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Newspaper className="h-3.5 w-3.5" />
            리포트 본문
          </button>
        </div>
      </div>

      {view === "card" ? (
        <>
          {/* 템플릿 선택 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {SHARE_CARD_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                className={cn(
                  "rounded-md border p-2 text-left transition-colors",
                  t.id === selected.id
                    ? "border-primary ring-1 ring-primary bg-primary/5"
                    : "hover:bg-muted/60"
                )}
              >
                <span
                  className="block h-1.5 w-6 rounded-full mb-1.5"
                  style={{ backgroundColor: t.captureBg }}
                  aria-hidden
                />
                <span className="block text-xs font-medium leading-tight">{t.name}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground -mt-2">{selected.tagline}</p>

          {/* 카드 미리보기 (축소) */}
          <div
            ref={setPreviewWrap}
            className="rounded-lg border bg-muted/30 overflow-auto flex justify-center"
          >
            <div style={{ zoom: previewScale, width: 800, maxWidth: "none", flexShrink: 0 }}>
              <selected.Component data={cardData} />
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <ReadingReportMagazine
            bookTitle={SAMPLE_BOOK.title}
            author={SAMPLE_BOOK.author}
            coverImageUrl={SAMPLE_BOOK.coverImageUrl}
            startedAt={SAMPLE_BOOK.startedAt}
            completedAt={SAMPLE_BOOK.completedAt}
            status={SAMPLE_BOOK.status}
            totalPages={SAMPLE_BOOK.totalPages}
            noteCount={SAMPLE_NOTE_COUNT}
            noteTypeCounts={SAMPLE_NOTE_TYPE_COUNTS}
            readingDays={SAMPLE_READING_DAYS}
            bookOrdinal={4}
            publishedAt={SAMPLE_GENERATED_AT}
            sections={sections}
          />
        </div>
      )}
    </div>
  );
}
