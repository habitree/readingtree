# TASK-07: 공유 기능

**작업 ID:** TASK-07  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 3일  
**의존성:** TASK-01, TASK-02, TASK-03, TASK-05  
**다음 작업:** 없음

---

## 작업 개요

카드뉴스 생성, 템플릿 선택, SNS 공유, 공유 링크 생성 기능을 구현합니다.

---

## 작업 범위

### 포함 사항
- ✅ 카드뉴스 생성
- ✅ 템플릿 선택
- ✅ 인스타그램 공유
- ✅ 카카오톡 공유
- ✅ 공유 링크 생성
- ✅ 공유 페이지

### 제외 사항
- ❌ 기록 작성/수정 (TASK-05)
- ❌ 검색 기능 (TASK-06)

---

## 상세 작업 목록

### 1. 카드뉴스 생성 컴포넌트

**파일:**
- `components/share/card-news-generator.tsx` - 카드뉴스 생성기

**기능:**
- 템플릿 선택
- 미리보기
- 이미지 생성
- 다운로드

### 2. 공유 버튼 컴포넌트

**파일:**
- `components/share/share-buttons.tsx` - 공유 버튼

**기능:**
- 인스타그램 공유
- 카카오톡 공유
- 링크 복사

### 3. 공유 API

**파일:**
- `app/api/share/card/route.ts` - 카드뉴스 생성 API

**기능:**
- 이미지 생성 (@vercel/og 또는 Canvas API)
- 템플릿 적용
- 이미지 반환

### 4. 공유 페이지

**파일:**
- `app/share/notes/[id]/page.tsx` - 공유된 기록 조회

**기능:**
- 공개 기록 조회
- Open Graph 메타 태그
- 공유 미리보기

---

## 파일 구조

```
app/
├── api/
│   └── share/
│       └── card/
│           └── route.ts
└── share/
    └── notes/
        └── [id]/
            └── page.tsx

components/
└── share/
    ├── card-news-generator.tsx
    └── share-buttons.tsx
```

---

## API 인터페이스

### API Routes

```typescript
// app/api/share/card/route.ts
export async function POST(request: Request) {
  const { noteId, templateId } = await request.json();
  // 카드뉴스 이미지 생성
  // 반환: 이미지 URL 또는 Blob
}
```

---

## 사용자 스토리 매핑

- US-024: 카드뉴스 생성
- US-025: 카드뉴스 템플릿 선택
- US-026: 인스타그램 공유
- US-027: 카카오톡 공유
- US-028: 공유 링크 생성

---

## 검증 체크리스트

- [x] 카드뉴스 생성이 정상 작동함
- [x] 템플릿 선택이 정상 작동함
- [x] 인스타그램 공유가 정상 작동함
- [x] 카카오톡 공유가 정상 작동함
- [x] 공유 링크 복사가 정상 작동함
- [x] 공유 페이지가 정상 작동함
- [x] Open Graph 메타 태그가 정상 작동함

---

## 개발 프롬프트

```
다음 문서들을 참고하여 공유 기능을 구현해주세요.

참고 문서:
- doc/user_stories.md (US-024~US-028)
- doc/software_design.md (6.1.1 API 라우트 구조)
- doc/Habitree-Reading-Hub-PRD.md (4.1.5 공유 기능)

작업 내용:
1. 카드뉴스 생성 컴포넌트 구현:
   - 템플릿 선택 UI
   - 미리보기
   - 이미지 생성 요청
2. 공유 버튼 컴포넌트 구현:
   - 인스타그램 공유 (Web Share API 또는 다운로드)
   - 카카오톡 공유 (Kakao SDK)
   - 링크 복사 (Clipboard API)
3. 카드뉴스 생성 API 구현:
   - @vercel/og 또는 Canvas API 사용
   - 템플릿 적용
   - 이미지 크기: 1080x1080
4. 공유 페이지 구현:
   - 공개 기록 조회
   - Open Graph 메타 태그 설정

주의사항:
- 카드뉴스는 서버 사이드에서 생성
- @vercel/og는 Edge Runtime에서만 작동
- 이미지 크기: 1080x1080 (인스타그램 정사각형)
- 템플릿은 JSON 형식으로 관리
- 공유 링크: {domain}/share/notes/{note_id}
- Open Graph 메타 태그 필수

완료 후:
- 각 함수에 JSDoc 주석 추가
- 에러 처리 로직 추가
```

---

## 참고 문서

### 필수 참고
- [user_stories.md](../../user_stories.md) - US-024~US-028
- [software_design.md](../../software_design.md) - 6.1.1 API 라우트
- [Habitree-Reading-Hub-PRD.md](../../Habitree-Reading-Hub-PRD.md) - 4.1.5 공유 기능

### 추가 참고
- [Vercel OG Image Generation](https://vercel.com/docs/concepts/functions/edge-functions/og-image-generation)
- [Kakao JavaScript SDK](https://developers.kakao.com/docs/latest/ko/getting-started/sdk-js)

---

**문서 끝**

