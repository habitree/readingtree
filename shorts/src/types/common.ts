/**
 * 쇼츠 공통 타입 정의
 */

export interface BaseShortProps {
  seriesId: string;
  audioUrl?: string;
  bgmUrl?: string;
}

export interface BookData {
  id: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  publisher: string | null;
  totalPages: number | null;
}

export interface QuoteData {
  id: string;
  content: string;
  pageNumber: string | null;
  book: BookData;
  tags: string[] | null;
}

export type ShortsQueueStatus =
  | "pending"
  | "scripted"
  | "tts_done"
  | "rendered"
  | "published"
  | "failed";

export interface ShortsQueueItem {
  id: string;
  series: string;
  status: ShortsQueueStatus;
  inputData: Record<string, unknown>;
  scriptText: string | null;
  ttsAudioUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  metadata: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineContext {
  queueItem: ShortsQueueItem;
  workDir: string;
  series: string;
}
