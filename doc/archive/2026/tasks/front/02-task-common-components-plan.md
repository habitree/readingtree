# TASK-02: 공통 컴포넌트 및 레이아웃

**작업 ID:** TASK-02  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 2일  
**의존성:** TASK-01  
**다음 작업:** 모든 기능 작업

---

## 작업 개요

모든 페이지에서 공통으로 사용되는 레이아웃 컴포넌트, UI 컴포넌트, 유틸리티 함수, 타입 정의를 구현합니다. 이 작업의 결과물은 다른 모든 작업에서 사용되므로 가장 먼저 완료되어야 합니다.

---

## 작업 범위

### 포함 사항
- ✅ 레이아웃 컴포넌트 (Header, Sidebar, Mobile Nav, Footer)
- ✅ 공통 UI 컴포넌트 (shadcn/ui 기반)
- ✅ 유틸리티 함수 (cn, date, image 등)
- ✅ TypeScript 타입 정의 (database, book, note, group)
- ✅ 전역 스타일 및 테마 설정
- ✅ 루트 레이아웃 및 에러 페이지

### 제외 사항
- ❌ 실제 페이지 구현 (각 기능 작업에서)
- ❌ 인증 로직 (TASK-03)
- ❌ 데이터 fetching (각 기능 작업에서)

---

## 상세 작업 목록

### 1. shadcn/ui 컴포넌트 설치

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add separator
```

### 2. 레이아웃 컴포넌트 구현

**파일:**
- `components/layout/header.tsx`
- `components/layout/sidebar.tsx`
- `components/layout/mobile-nav.tsx`
- `components/layout/footer.tsx`

**기능:**
- Header: 로고, 검색, 알림, 프로필 메뉴
- Sidebar: 네비게이션 메뉴 (홈, 서재, 기록, 검색, 타임라인, 모임, 프로필)
- Mobile Nav: 모바일용 하단 네비게이션
- Footer: 푸터 정보

### 3. 유틸리티 함수 구현

**파일:**
- `lib/utils/cn.ts` - className 병합 유틸리티
- `lib/utils/date.ts` - 날짜 포맷팅 함수
- `lib/utils/image.ts` - 이미지 처리 함수

### 4. 타입 정의

**파일:**
- `types/database.ts` - Supabase 타입 (generate-types로 생성)
- `types/book.ts` - 책 관련 타입
- `types/note.ts` - 기록 관련 타입
- `types/group.ts` - 모임 관련 타입
- `types/user.ts` - 사용자 관련 타입

### 5. 루트 레이아웃 및 전역 스타일

**파일:**
- `app/layout.tsx` - 루트 레이아웃
- `app/globals.css` - 전역 스타일
- `app/error.tsx` - 에러 페이지
- `app/loading.tsx` - 로딩 페이지

### 6. 메인 레이아웃

**파일:**
- `app/(main)/layout.tsx` - 사이드바 포함 레이아웃

---

## 파일 구조

```
components/
├── layout/
│   ├── header.tsx
│   ├── sidebar.tsx
│   ├── mobile-nav.tsx
│   └── footer.tsx
└── ui/                    # shadcn/ui 컴포넌트들
    ├── button.tsx
    ├── card.tsx
    └── ...

lib/
└── utils/
    ├── cn.ts
    ├── date.ts
    └── image.ts

types/
├── database.ts
├── book.ts
├── note.ts
├── group.ts
└── user.ts

app/
├── layout.tsx
├── globals.css
├── error.tsx
├── loading.tsx
└── (main)/
    └── layout.tsx
```

---

## 컴포넌트 인터페이스

### Header

```typescript
// components/layout/header.tsx
export function Header() {
  // 로고, 검색, 알림, 프로필 메뉴
}
```

### Sidebar

```typescript
// components/layout/sidebar.tsx
interface SidebarItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: number;
}

export function Sidebar() {
  // 네비게이션 메뉴
}
```

### Mobile Nav

```typescript
// components/layout/mobile-nav.tsx
export function MobileNav() {
  // 모바일 하단 네비게이션
}
```

---

## 타입 정의 예시

### Book

```typescript
// types/book.ts
export interface Book {
  id: string;
  isbn?: string;
  title: string;
  author?: string;
  publisher?: string;
  published_date?: string;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  status: 'reading' | 'completed' | 'paused';
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
```

### Note

```typescript
// types/note.ts
export type NoteType = 'quote' | 'photo' | 'memo' | 'transcription';

export interface Note {
  id: string;
  user_id: string;
  book_id: string;
  type: NoteType;
  content?: string;
  image_url?: string;
  page_number?: number;
  is_public: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}
```

---

## 검증 체크리스트

- [ ] 모든 레이아웃 컴포넌트가 정상 렌더링됨
- [ ] 반응형 디자인이 정상 작동함 (데스크톱/태블릿/모바일)
- [ ] shadcn/ui 컴포넌트가 정상 작동함
- [ ] 타입 정의가 완료되고 export됨
- [ ] 유틸리티 함수가 정상 작동함
- [ ] 루트 레이아웃이 정상 작동함
- [ ] 에러 페이지가 정상 작동함

---

## 개발 프롬프트

```
다음 문서들을 참고하여 공통 컴포넌트 및 레이아웃을 구현해주세요.

참고 문서:
- doc/software_design.md (5.1 폴더 구조, 5.2 UI/UX 설계)
- doc/Habitree-Reading-Hub-PRD.md (전체 요구사항)
- doc/user_stories.md (사용자 스토리)

작업 내용:
1. shadcn/ui 컴포넌트 설치 (button, card, dialog, input 등)
2. 레이아웃 컴포넌트 구현:
   - Header: 로고, 검색, 알림, 프로필 메뉴
   - Sidebar: 네비게이션 메뉴 (software_design.md 5.2.2 참고)
   - Mobile Nav: 모바일 하단 네비게이션
   - Footer: 푸터 정보
3. 유틸리티 함수 구현 (cn, date, image)
4. 타입 정의 (book, note, group, user)
5. 루트 레이아웃 및 전역 스타일
6. 메인 레이아웃 (사이드바 포함)

주의사항:
- software_design.md의 폴더 구조를 정확히 따를 것
- 반응형 디자인 고려 (데스크톱/태블릿/모바일)
- Sidebar 아이템은 software_design.md 5.2.2 참고
- 타입은 Supabase 스키마와 일치시킬 것
- 모든 컴포넌트는 재사용 가능하도록 설계할 것

완료 후:
- 각 컴포넌트에 JSDoc 주석 추가
- 타입 정의 문서화
```

---

## 참고 문서

### 필수 참고
- [software_design.md](../../software_design.md) - 5.1 폴더 구조, 5.2 UI/UX 설계
- [Habitree-Reading-Hub-PRD.md](../../Habitree-Reading-Hub-PRD.md) - 7. 데이터 모델
- [user_stories.md](../../user_stories.md) - 사용자 스토리

### 추가 참고
- [shadcn/ui 문서](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)

---

**문서 끝**

