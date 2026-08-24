/**
 * AI 리포트 이미지 공유 카드 — 공통 타입
 *
 * 템플릿 컴포넌트는 순수 렌더 전용이다: `ShareCardData`만 받아 800px 고정폭 카드를 그린다.
 * 캡처(html2canvas)·클립보드 복사는 share-card-dialog가 담당한다.
 *
 * 템플릿 작성 규칙:
 * - 루트는 `<div className="tpl-XX">` 하나, 스타일은 바로 위 `<style>{CSS}</style>` 한 블록.
 * - 모든 CSS 선택자는 `.tpl-XX` 로 시작 (전역 오염 금지).
 * - 외부 리소스는 data.coverUrl 이미지 하나뿐. 질감·장식은 CSS로만.
 * - html2canvas 캡처 대상이므로 writing-mode(세로쓰기)·filter·mix-blend-mode·backdrop-filter 금지.
 */
import type { ComponentType } from "react";

export interface ShareCardData {
  title: string;
  author: string | null;
  /** 프록시(/api/image-proxy) 처리된 표지 URL. 표지가 없으면 null */
  coverUrl: string | null;
  totalPages: number | null;
  /** ISO 문자열 */
  startedAt: string | null;
  /** ISO 문자열 — 완독 이력이 없으면 null */
  completedAt: string | null;
  /** 시작~완독 경과일(양 끝 포함, 최소 1). 계산 불가 시 null */
  periodDays: number | null;
  /** 기록을 남긴 날 수 */
  readingDays: number;
  noteCount: number;
  /** 노트 타입별 개수 (quote/memo/transcription/progress/photo) */
  noteTypeCounts: Record<string, number>;
  /** 완독 이력 여부 (completedAt 존재) */
  isCompleted: boolean;
  /** 리포트 발행(생성) 시각 ISO */
  publishedAt: string;
  /** 책을 읽게 된 이유 (리포트 개요에서 추출). 없으면 null */
  readReason: string | null;
  /** 개요 섹션에서 메타데이터 라인을 제외한 서술 문장. 없으면 빈 문자열 */
  overview: string;
  /** 핵심 인사이트 (0개 이상 — 개수 가변) */
  insights: { title: string; body: string }[];
  /** 인상 깊은 구절 (0개 이상) */
  quotes: { text: string; page: string | null }[];
  /** 독자 본인의 기록 문장 (0개 이상) */
  thoughts: string[];
  /** 독서 여정 서술 (없으면 빈 문자열) */
  journey: string;
  /** 종합 요약 (마지막 질문 문장 제외, 없으면 빈 문자열) */
  summary: string;
  /** 종합 요약 끝의 질문 문장 (없으면 null) */
  closingQuestion: string | null;
}

/** 노트 타입 한글 라벨 (기록 분포 표기에 사용) */
export const SHARE_NOTE_TYPE_LABELS: Record<string, string> = {
  quote: "인용",
  memo: "메모",
  transcription: "필사",
  progress: "여정",
  photo: "사진",
};

export interface ShareCardTemplateDef {
  /** 템플릿 슬러그 (파일명·클래스와 일치: newspaper 등) */
  id: string;
  name: string;
  tagline: string;
  /** 사용하는 Google Fonts family 목록 — 다이얼로그가 온디맨드 로드 */
  fonts: string[];
  /** 캡처 배경색 (카드 지면 색과 동일하게) */
  captureBg: string;
  Component: ComponentType<{ data: ShareCardData }>;
}
