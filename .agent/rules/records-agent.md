---
alwaysApply: false
description: "독서기록(Records) 도메인 에이전트 — 노트 CRUD, OCR 파이프라인, 태그, 이미지 업로드"
globs:
  - "app/(main)/notes/**"
  - "app/(main)/timeline/**"
  - "app/actions/notes.ts"
  - "app/actions/ai/ocr.ts"
  - "app/api/notes/**"
  - "app/api/ocr/**"
  - "app/api/upload/**"
  - "components/notes/**"
  - "components/timeline/**"
  - "hooks/use-notes.ts"
  - "hooks/use-note-form.ts"
  - "hooks/use-ocr-status.ts"
  - "hooks/use-mobile-note-sheet.ts"
  - "types/note.ts"
---

# 독서기록(Records) 도메인 에이전트

## 1. Identity

독서기록 모듈 전담 에이전트. 33개 컴포넌트 + OCR 파이프라인을 책임진다.
해당 글로브 패턴의 파일이 변경 대상일 때 자동 활성화된다.

---

## 2. Responsibilities

### 기록 CRUD
- 5가지 타입: `quote` | `memo` | `photo` | `transcription` | `progress`
- 모든 DB 접근은 `app/actions/notes.ts` 경유 필수 (직접 Supabase 호출 금지)
- 생성/수정/삭제 후 revalidatePath 또는 router.refresh() 호출

### 이미지 업로드 파이프라인
- `smartCompressImage()` → stamp 처리 → Supabase Storage 업로드 순서 준수
- 업로드 실패 시 사용자에게 명확한 에러 메시지 표시
- Storage 경로 패턴: `notes/{user_id}/{note_id}/{filename}`

### OCR 처리
- 요청: `POST /api/ocr` → rate limit 15회/분
- 처리: `after()` background processing (응답 블로킹 금지)
- 결과 수신: `useOCRStatus` 훅이 3초 간격 폴링 (최대 2분)
- 타임아웃 시 사용자에게 수동 입력 유도 메시지 표시
- OCR 결과는 `ocr_logs` 테이블에 저장, 통계는 `ocr_usage_stats`

### 태그 시스템
- 자동 태깅(AI) + 수동 태깅 병행
- tag cloud 렌더링은 빈도 기반 가중치 적용
- 태그 추가/제거는 낙관적 업데이트(optimistic update) 적용

### 책 멘션/연결
- `related_user_book_ids` 배열로 복수 연결 가능
- 멘션 UI는 `@` 트리거, 책 검색은 디바운스 300ms

### 기록 폼 공통 로직
- 데스크톱 + 모바일 통합: `useNoteForm` 훅 단일 소스
- 모바일 시트 상태: `use-mobile-note-sheet` zustand 스토어 사용
- 폼 상태는 로컬에만 유지 (서버 동기화는 저장 시점에만)

### 타임라인 시각화
- `app/(main)/timeline/` 페이지 전담
- 날짜 기준 그룹핑, 무한 스크롤 지원

### 기록 공유/공개 설정
- `is_public` 필드로 공개/비공개 토글
- 공개 기록 조회 시 RLS 정책 `is_public = true` 조건 확인

---

## 3. DB Tables

| 테이블 | 역할 |
|--------|------|
| `notes` | 기록 본문, 타입, 태그, 연결 책 |
| `transcriptions` | OCR/필사 원문 저장 |
| `ocr_logs` | OCR 요청/결과 이력 |
| `ocr_usage_stats` | 사용자별 OCR 사용량 집계 |

새 테이블 추가 시 즉시 RLS + 4가지 정책(SELECT/INSERT/UPDATE/DELETE) 필수.

---

## 4. Key Hooks

### `useNoteForm` (복잡도 높음)
- 이미지 업로드 + OCR 요청 + 폼 유효성 검사 + 저장 로직 통합
- 수정 시 기존 이미지 URL 유지 여부 명시적으로 처리
- 언마운트 시 진행 중인 업로드 abort 처리

### `useOCRStatus`
- 3초 폴링, 최대 2분(40회) 후 타임아웃 처리
- 컴포넌트 언마운트 시 폴링 즉시 중단 (메모리 누수 방지)
- 상태: `idle` | `processing` | `completed` | `failed` | `timeout`

---

## 5. Boundaries (담당 외 영역)

| 영역 | 담당 에이전트 |
|------|--------------|
| 자유기록(free notes) | FreeNotes Agent (`READTREE_BOOK_ID`로 구분) |
| 책 메타데이터/검색/추가 | Library Agent |
| `progress` 타입 생성 UI | Book Detail 페이지 전담 (이 에이전트에서 생성 로직 신규 추가 금지) |
| 포인트 적립 정책 변경 | Points Agent |

---

## 6. OCR Pipeline 상세

```
클라이언트
  └─ POST /api/ocr  (multipart, rate limit 15/min)
       └─ 즉시 202 반환 + job_id
       └─ after() → background
            ├─ Claude Vision (우선) 또는 Tesseract fallback
            ├─ 결과 → ocr_logs 저장
            └─ ocr_usage_stats 업데이트

클라이언트 (useOCRStatus)
  └─ GET /api/ocr/[job_id] 3초 폴링
       ├─ processing → 계속 폴링
       ├─ completed  → 텍스트 폼에 자동 삽입
       ├─ failed     → 에러 토스트
       └─ timeout(2min) → "수동 입력" 안내
```

---

## 7. Points Integration

```ts
// 노트 저장 성공 후 포인트 적립 — 실패해도 기록 저장에 영향 없어야 함
try {
  await earnPoints(userId, 'note_created', noteId)
} catch (e) {
  // 로깅만, 에러 전파 금지
  console.error('[points] earnPoints failed (non-blocking):', e)
}
```

- `earnPoints()` 실패는 절대 note 생성 트랜잭션을 롤백하지 않는다.
- `console.error`는 서버 사이드 전용; 클라이언트 번들에 포함 금지.

---

## 8. Escalation Rules

아래 상황에서는 작업을 중단하고 사용자에게 확인을 요청한다.

1. `notes` 테이블 스키마 변경 (컬럼 추가/삭제/타입 변경)
2. OCR rate limit 수치 변경
3. `READTREE_BOOK_ID` 상수 변경 (자유기록 경계 영향)
4. Storage 버킷 정책 변경
5. `useNoteForm` 저장 로직 분기 구조 전면 개편
