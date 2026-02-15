# Habitree 디자인 시스템 - 마이그레이션 체크리스트

> 기존 컴포넌트를 디자인 시스템 패턴으로 점진적으로 마이그레이션하기 위한 체크리스트입니다.

---

## 마이그레이션 원칙

1. **Zero Breaking Changes** - 기존 컴포넌트 무수정, 신규 패턴 병행
2. **점진적 채택** - 새 컴포넌트부터 적용, 기존은 선택적 마이그레이션
3. **V2 패턴** - 기존 유지 + V2 병행 → 검증 후 교체

---

## Step 1: Design Token 확장 ✅

- [x] `elevation` 토큰 추가 (shadow 스케일)
- [x] `radius` 토큰 추가 (border-radius 스케일)
- [x] `transition` 토큰 추가 (성능 최적화 전환)
- [x] `zIndex` 토큰 추가 (레이어 관리)
- [x] `typography.helper`, `typography.errorText`, `typography.link` 추가
- [x] `iconSizes.xl` 오타 수정 (`sm:w-10 sm:w-10` → `sm:w-10 sm:h-10`)

**영향 범위**: 0개 파일 (추가만)
**리스크**: 없음

---

## Step 2: Primitives 생성 ✅

- [x] `components/primitives/typography.tsx` - Heading, Text, TextLink
- [x] `components/primitives/layout.tsx` - Stack, Inline, Grid, Container
- [x] `components/primitives/feedback.tsx` - Spinner, FullPageSpinner
- [x] `components/primitives/index.ts` - barrel export

**영향 범위**: 0개 파일 (신규)
**리스크**: 없음

---

## Step 3: Patterns 생성 ✅

- [x] `components/patterns/card-container.tsx` - CardContainer, CardImageSlot
- [x] `components/patterns/list-container.tsx` - ListContainer
- [x] `components/patterns/form-helpers.tsx` - TextField, TextAreaField, SwitchField
- [x] `components/patterns/index.ts` - barrel export

**영향 범위**: 0개 파일 (신규)
**리스크**: 없음

---

## Step 4: 가장 간단한 카드부터 마이그레이션 테스트

- [ ] `BookshelfCard`를 CardContainer 패턴으로 마이그레이션
- [ ] 마이그레이션 전후 시각적 비교
- [ ] 모바일(375px), 태블릿(768px), 데스크톱(1024px) 확인
- [ ] Light/Dark/Forest 3개 테마 확인
- [ ] 호버/클릭/터치 인터랙션 확인

**대상 파일**: `components/bookshelves/bookshelf-card.tsx`
**리스크**: 낮음

---

## Step 5: 주요 카드 순차 마이그레이션

### BookCard
- [ ] `components/books/book-card.tsx` → CardContainer 패턴 적용
- [ ] 이미지 에러 핸들링 유지
- [ ] 관련 책 호버카드 유지
- [ ] 삭제 버튼 동작 확인
- [ ] 3개 뷰포트 + 3개 테마 확인

### NoteCard
- [ ] `components/notes/note-card.tsx` → CardContainer 패턴 적용
- [ ] progress 타입 컴팩트 레이아웃 유지
- [ ] horizontal 레이아웃 유지
- [ ] OCR 상태 배지 유지
- [ ] 삭제 다이얼로그 유지

### 기타 카드
- [ ] `group-card.tsx`
- [ ] `search-result-card.tsx`
- [ ] `share-note-card.tsx`
- [ ] `feature-request-card.tsx`
- [ ] `persona-card.tsx`

**리스크**: 중간 (각 카드별 고유 기능 유지 필요)

---

## Step 6: 폼 컴포넌트 FormHelpers 적용

### 우선순위 높음
- [ ] `note-form-new.tsx` (478줄) → TextField/TextAreaField 적용
- [ ] `note-edit-form.tsx` (451줄) → TextField/TextAreaField 적용

### 우선순위 보통
- [ ] 책 등록/수정 폼
- [ ] 그룹 생성/수정 폼
- [ ] 프로필 수정 폼

**주의사항**: `<FormProvider>` (= `<Form>`) 내부에서만 사용 가능

---

## Step 7: 리스트 패턴 적용

- [ ] 책 목록 → ListContainer 적용
- [ ] 노트 목록 → ListContainer 적용
- [ ] 검색 결과 → ListContainer 적용
- [ ] 그룹 목록 → ListContainer 적용

---

## Step 8: ESLint 규칙 추가 (선택)

- [ ] `text-[숫자px]` 사용 시 경고: "typography 토큰 사용 권장"
- [ ] `transition-all` 사용 시 경고: "transition 토큰 사용 권장 (성능)"

**레벨**: warn (에러가 아님)

---

## 검증 체크리스트 (각 마이그레이션 후)

### 기능 검증
- [ ] 해당 페이지 정상 동작
- [ ] 모바일 (375px) 레이아웃
- [ ] 태블릿 (768px) 레이아웃
- [ ] 데스크톱 (1024px) 레이아웃
- [ ] Light 테마
- [ ] Dark 테마
- [ ] Forest 테마

### 인터랙션 검증
- [ ] 호버 효과
- [ ] 클릭/터치 동작
- [ ] 44px 터치 타겟 유지
- [ ] 삭제 버튼 동작

### 성능 검증
- [ ] `next build` 성공
- [ ] 번들 크기 변화 5% 미만
