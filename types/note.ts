/**
 * 기록 관련 타입 정의
 */

export type NoteType = "quote" | "photo" | "memo" | "transcription" | "progress";

export type SourceType = "book" | "youtube" | "instagram" | "article" | "other";

export interface Note {
  id: string;
  user_id: string;
  book_id: string | null;
  title: string | null;
  type: NoteType;
  content: string | null;
  image_url: string | null;
  page_number: string | null;
  is_public: boolean;
  tags: string[] | null;
  related_user_book_ids: string[] | null;
  source_type: SourceType | null;
  source_label: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteWithBook extends Note {
  book?: {
    id: string;
    title: string;
    author: string | null;
    cover_image_url: string | null;
  };
  user_books?: {
    id: string;
    reading_reason: string | null;
    status: string;
  } | Array<{
    id: string;
    reading_reason: string | null;
    status: string;
  }>;
  /** 필사(transcription) 타입 기록의 OCR 텍스트 데이터 */
  transcription?: {
    extracted_text: string; // GPT 보정된 OCR 텍스트
    raw_extracted_text: string | null; // 원본 OCR 텍스트
    status: OCRStatus; // OCR 처리 상태
  };
}

export interface CreateNoteInput {
  book_id?: string;
  title?: string;
  type?: NoteType; // 업로드 타입이 있을 때만 필요
  content?: string; // 기존 content 필드 (하위 호환성)
  quote_content?: string; // 인상깊은 구절
  memo_content?: string; // 내 생각
  image_url?: string;
  upload_type?: "photo" | "transcription"; // 사진 또는 필사
  page_number?: string;
  is_public?: boolean; // 기본값: true (공개)
  tags?: string[];
  related_user_book_ids?: string[]; // 연결된 다른 책들의 user_books.id 배열
  source_type?: SourceType;
  source_label?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string; // 기존 content 필드 (하위 호환성)
  quote_content?: string; // 인상깊은 구절
  memo_content?: string; // 내 생각
  image_url?: string;
  upload_type?: "photo" | "transcription"; // 사진 또는 필사
  page_number?: string;
  is_public?: boolean;
  tags?: string[];
  related_user_book_ids?: string[]; // 연결된 다른 책들의 user_books.id 배열
}

/**
 * 필사 OCR 데이터 타입 정의
 */
export type OCRStatus = "processing" | "completed" | "failed";

export interface Transcription {
  id: string;
  note_id: string;
  extracted_text: string; // OCR로 추출된 원본 텍스트
  quote_content: string | null; // 책 구절 (사용자가 편집 가능)
  memo_content: string | null; // 사용자의 생각 (사용자가 추가 가능)
  status: OCRStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateTranscriptionInput {
  note_id: string;
  extracted_text: string;
  quote_content?: string;
  memo_content?: string;
  status?: OCRStatus;
}

export interface UpdateTranscriptionInput {
  quote_content?: string;
  memo_content?: string;
  status?: OCRStatus;
}

