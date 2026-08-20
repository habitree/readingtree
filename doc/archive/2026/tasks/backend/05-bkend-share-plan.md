# TASK-05: 공유 백엔드

**작업 ID:** TASK-05  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 1일  
**의존성:** TASK-00, TASK-03  
**다음 작업:** 없음

---

## 작업 개요

공유 관련 API Routes를 검증하고 개선합니다. 카드뉴스 이미지 생성 및 공유 페이지를 포함합니다.

---

## 작업 범위

### 포함 사항
- ✅ `app/api/share/card/route.tsx` 검증 및 개선
- ✅ `app/share/notes/[id]/page.tsx` 검증 및 개선
- ✅ `lib/templates/card-news-templates.ts` 검증 및 개선
- ✅ 프론트엔드 연동 확인

### 제외 사항
- ❌ 프론트엔드 공유 UI (이미 구현됨)

---

## 상세 작업 목록

### 1. 카드뉴스 생성 API Route 검증 및 개선

**파일:** `app/api/share/card/route.tsx`

**기능:**
- 카드뉴스 이미지 생성 (@vercel/og)
- 템플릿 선택
- Edge Runtime 최적화

**확인 사항:**
- @vercel/og 사용 확인
- Edge Runtime 설정 확인
- 템플릿 적용 확인
- 기록 조회 권한 확인

### 2. 공유 페이지 검증 및 개선

**파일:** `app/share/notes/[id]/page.tsx`

**기능:**
- 공유된 기록 조회
- Open Graph 메타 태그
- Twitter Card 메타 태그

**확인 사항:**
- 공개 기록만 조회 가능 확인
- 메타 태그 설정 확인
- `getAppUrl()` 사용 확인

### 3. 카드뉴스 템플릿 검증 및 개선

**파일:** `lib/templates/card-news-templates.ts`

**기능:**
- 카드뉴스 템플릿 정의

**확인 사항:**
- 템플릿 구조 확인
- 템플릿 ID 확인

---

## 프론트엔드 연동 확인

### 연동 페이지
- `app/share/notes/[id]/page.tsx`
  - 공유된 기록 조회

### 연동 컴포넌트
- `components/share/card-news-generator.tsx`
  - 카드뉴스 생성
- `components/share/share-buttons.tsx`
  - 공유 버튼

---

## 개발 프롬프트

```
@doc/software_design.md (6.1.1 섹션) @doc/tasks/front/07-task-share-plan.md 참고하여 
공유 백엔드를 검증하고 개선해주세요.

작업 내용:
1. app/api/share/card/route.tsx 파일 검증 및 개선:
   - @vercel/og 사용 확인
   - Edge Runtime 설정 확인 (export const runtime = "edge")
   - 기록 조회 권한 확인 (공개 기록만)
   - 템플릿 적용 확인
   - React.createElement 사용 확인 (JSX 호환성)

2. app/share/notes/[id]/page.tsx 파일 검증 및 개선:
   - 공개 기록만 조회 가능 확인 (is_public = TRUE)
   - Open Graph 메타 태그 설정 확인
   - Twitter Card 메타 태그 설정 확인
   - getAppUrl() 사용 확인 (Vercel 호환성)

3. lib/templates/card-news-templates.ts 파일 검증 및 개선:
   - 템플릿 구조 확인
   - 템플릿 ID 확인

4. 프론트엔드 연동 확인:
   - 공유 페이지에서 기록 조회 확인
   - 카드뉴스 생성 확인
   - 에러 처리 및 로딩 상태 확인
```

---

## 참고 문서

### 필수 참고 문서
- `doc/software_design.md` (6.1.1 섹션)
  - API 엔드포인트 설계
- `doc/tasks/front/07-task-share-plan.md`
  - 프론트엔드 공유 구현 상세

### 관련 프론트엔드 파일
- `app/share/notes/[id]/page.tsx`
- `components/share/card-news-generator.tsx`
- `components/share/share-buttons.tsx`

---

## 검증 체크리스트

### 공유 기능
- [x] 카드뉴스 이미지 생성이 정상 작동하는지 확인
  - ✅ @vercel/og의 ImageResponse 사용
  - ✅ Edge Runtime 설정 (export const runtime = "edge")
  - ✅ React.createElement 사용 (JSX 호환성)
  - ✅ 1080x1080 이미지 크기 생성
  - ✅ 템플릿 적용 확인
- [x] 템플릿 선택이 정상 작동하는지 확인
  - ✅ lib/templates/card-news-templates.ts에 6개 템플릿 정의
  - ✅ getTemplateById() 함수로 템플릿 조회
  - ✅ 템플릿 ID: minimal, dark, warm, cool, elegant, vibrant
  - ✅ 각 템플릿에 backgroundColor, textColor, accentColor, fontFamily 설정
- [x] 공유 페이지에서 기록 조회가 정상 작동하는지 확인
  - ✅ app/share/notes/[id]/page.tsx에서 기록 조회
  - ✅ Supabase 쿼리로 기록 및 책 정보 조회
  - ✅ 에러 처리 및 notFound() 사용
- [x] 공개 기록만 조회 가능 확인
  - ✅ app/api/share/card/route.tsx에서 is_public = true 필터 추가
  - ✅ app/share/notes/[id]/page.tsx에서 is_public = true 필터 사용
  - ✅ RLS 정책과 함께 작동하여 공개 기록만 조회 가능
  - ✅ 공개되지 않은 기록은 404 반환
- [x] Open Graph 메타 태그 확인
  - ✅ generateMetadata() 함수에서 Open Graph 설정
  - ✅ title, description, type, url, images 설정
  - ✅ 카드뉴스 이미지를 og:image로 사용
  - ✅ siteName 설정
- [x] Twitter Card 메타 태그 확인
  - ✅ generateMetadata() 함수에서 Twitter Card 설정
  - ✅ card: "summary_large_image" 설정
  - ✅ title, description, images 설정
  - ✅ 카드뉴스 이미지 사용

### 보안 및 안전성
- [x] 공개 기록만 조회 가능 확인
  - ✅ API Route에서 is_public = true 필터 적용
  - ✅ 공유 페이지에서 is_public = true 필터 적용
  - ✅ RLS 정책 준수 (auth.uid() = user_id OR is_public = TRUE)
- [x] Edge Runtime 설정 확인
  - ✅ export const runtime = "edge" 설정
  - ✅ @vercel/og는 Edge Runtime에서만 작동

### 에러 처리
- [x] 공유 에러 시 적절한 에러 메시지 표시
  - ✅ try-catch로 에러 처리
  - ✅ 404: "기록을 찾을 수 없거나 공개되지 않은 기록입니다."
  - ✅ 500: 에러 메시지 반환
- [x] 예외 상황 처리 확인
  - ✅ noteId 파라미터 누락 시 400 반환
  - ✅ 기록을 찾을 수 없을 때 404 반환
  - ✅ 공개되지 않은 기록 접근 시 404 반환
  - ✅ 이미지 생성 실패 시 500 반환

### 프론트엔드 연동
- [x] 공유 페이지에서 기록 조회 확인
  - ✅ app/share/notes/[id]/page.tsx에서 기록 조회
  - ✅ 공개 기록만 조회 가능
  - ✅ 기록 상세 정보 표시
  - ✅ ShareButtons 컴포넌트 연동
- [x] 카드뉴스 생성 확인
  - ✅ components/share/card-news-generator.tsx에서 템플릿 선택
  - ✅ /api/share/card 엔드포인트 호출
  - ✅ 이미지 미리보기 및 다운로드 기능
  - ✅ 에러 처리 및 로딩 상태 표시
- [x] 에러 처리 및 로딩 상태 확인
  - ✅ card-news-generator.tsx에서 isGenerating 상태 관리
  - ✅ toast를 사용한 에러/성공 메시지 표시
  - ✅ share-buttons.tsx에서 공유 기능 에러 처리

### 개선 사항
- ✅ 공개 기록만 조회하도록 API Route 수정
- ✅ 에러 메시지 개선 (공개되지 않은 기록 명시)
- ✅ Open Graph 및 Twitter Card 메타 태그 완전 구현
- ✅ getAppUrl() 함수 사용으로 Vercel 호환성 확보

---

**문서 끝**

