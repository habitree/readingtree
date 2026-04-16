# Habitree 서비스 사이트맵 & 그래픽 개선 기획서

**작성일:** 2026-04-14  
**프로젝트:** Habitree Reading Hub v4.0.0  
**관련 Figma:** 아래 링크 참조

---

## 1. Figma 다이어그램

| 다이어그램 | 설명 | 링크 |
|-----------|------|------|
| 전체 사이트맵 | 64개 라우트 - Auth/Main/Public 3그룹 | [FigJam](https://www.figma.com/online-whiteboard/create-diagram/25dc905f-a322-415c-8305-49e8a8dc7514?utm_source=other&utm_content=edit_in_figjam) |
| 네비게이션 구조 | Desktop Sidebar vs Mobile Bottom Nav 비교 | [FigJam](https://www.figma.com/online-whiteboard/create-diagram/9184f3cb-6984-454a-848c-59e9c2542525?utm_source=other&utm_content=edit_in_figjam) |
| UI 개선 로드맵 | P0~P3 우선순위별 17개 개선 항목 | [FigJam](https://www.figma.com/online-whiteboard/create-diagram/340d43d0-e81f-4caa-88c7-039b143d9322?utm_source=other&utm_content=edit_in_figjam) |

---

## 2. 전체 메뉴 구조

### 2-1. 라우트 요약

| 영역 | 라우트 수 | 주요 기능 |
|------|----------|----------|
| 인증 (Auth) | 7 | 로그인, 회원가입, 이메일 인증, 온보딩 3단계 |
| 코어 (Books/Notes) | 15 | 서재, 책장, 노트 CRUD, 자유노트, 검색, 일괄등록 |
| 소셜 (Groups) | 6 | 독서모임 생성/참여, 모임 내 도서/노트, 초대 |
| 분석 (Stats/Persona) | 3 | 통계, 페르소나, 타임라인 |
| AI/포인트 | 2 | AI 챗봇, 포인트/게이미피케이션 |
| 커뮤니티 | 4 | 기능요청 CRUD, 투표 |
| 관리자 | 9 | 사용자/AI/OCR/OG/리포트/API/트래킹 관리 |
| 공개/공유 | 8 | 약관, 개인정보, 공유 링크 3종, 랜딩, 구독, 결제 |
| **총계** | **~64** | |

### 2-2. Desktop 사이드바 메뉴

**Primary (항상 표시)**
1. 홈 `/`
2. 내 서재 `/books`
3. 빠른 기록 (FAB 액션)
4. 내 노트 `/notes`
5. 프로필 `/profile`

**책장 트리** - 사용자 책장 동적 트리 (로그인 시)

**더보기 (접기/펼치기)**
1. 독서모임 `/groups`
2. 통계/페르소나 `/stats`
3. AI 챗 `/chat`
4. 포인트 `/points`
5. 기능 요청 `/feature-requests`
6. 관리자 `/admin` (admin only)

### 2-3. Mobile 하단 네비게이션

**Bottom Bar (5 항목)**
1. 홈
2. 서재
3. +기록 (FAB, 중앙 강조)
4. 노트
5. 음악

**더보기 Sheet 메뉴**
- 프로필, 독서모임, 통계, AI 챗, 기능 요청
- 다크모드 토글, 언어 선택

### 2-4. Header (공통)
- 로고 (모바일)
- 음악 토글
- 언어 선택
- 테마 토글 (Light/Dark/Forest)
- 프로필 아바타 드롭다운

---

## 3. 그래픽 개선 기획

### P0 - Critical (즉시 개선)

| # | 항목 | 현황 | 개선안 | 대상 파일 |
|---|------|------|--------|----------|
| 1 | Empty State 일러스트 | 아이콘 + 텍스트만 | 화면별 맞춤 SVG 일러스트 | `components/ui/empty-state.tsx`, `public/images/` |
| 2 | Forest 테마 대비율 | 일부 텍스트/배경 WCAG AA 미달 가능 | 모든 조합 4.5:1 이상 보장 | `app/globals.css` |
| 3 | 다크모드 Border | 카드 border 배경과 구분 어려움 | 다크모드 전용 border 밝기 조정 | `app/globals.css` |

### P1 - High (단기 개선)

| # | 항목 | 현황 | 개선안 | 대상 파일 |
|---|------|------|--------|----------|
| 4 | Book Card 인터랙션 | hover 시 shadow만 | scale-up + 커버 이미지 확대 | `components/books/book-card.tsx` |
| 5 | Note Card 차별화 | 모든 노트 동일 스타일 | 유형별 좌측 색상 bar + 아이콘 배지 | `components/notes/note-card.tsx` |
| 6 | 한국어 폰트 웨이트 | SemiBold만 로드 | Regular/Medium/Bold 추가 | `public/fonts/`, `tailwind.config.ts` |
| 7 | Skeleton 일관성 | 페이지마다 다른 패턴 | 공통 skeleton 패턴 라이브러리 | `components/ui/skeletons.tsx` |
| 8 | 모바일 Toast 위치 | Header와 겹침 가능 | bottom-nav 위로 조정 | `components/ui/sonner.tsx` |

### P2 - Medium (중기 개선)

| # | 항목 | 현황 | 개선안 |
|---|------|------|--------|
| 9 | 페이지 전환 애니메이션 | 하드 전환 | framer-motion fade/slide |
| 10 | 독서 진행률 애니메이션 | 정적 프로그레스 바 | 카운트업 + 파티클 효과 |
| 11 | 커스텀 일러스트 세트 | lucide 아이콘만 | 브랜드 일러스트 (나무, 책, 독서 테마) |
| 12 | 온보딩 비주얼 | 텍스트 기반 | 단계별 일러스트 + 인디케이터 |
| 13 | Reading Tree 폴리싱 | webp 이미지 기반 | SVG + 테마 대응 + 인터랙티브 |
| 14 | 업적 배지 디자인 | 기본 형태 | 레벨별 메탈릭/발광 효과 |

### P3 - Nice to Have (장기)

| # | 항목 | 개선안 |
|---|------|--------|
| 15 | 랜딩 페이지 고도화 | Hero 모션 + 스크롤 reveal + Social proof 캐러셀 |
| 16 | Glassmorphism | 프리미엄/이벤트 카드에 glass 효과 |
| 17 | 음악 플레이어 시각화 | 재생 중 파형 시각화 + 테마 색상 매칭 |

---

## 4. Note Card 차별화 상세 스펙

```
일반 노트 (book note)    → 좌측 border: forest-500   아이콘: BookOpen
자유 노트 (free note)    → 좌측 border: purple-500   아이콘: PenLine
OCR 노트 (ocr note)     → 좌측 border: blue-500     아이콘: Camera
사진 노트 (photo note)  → 좌측 border: emerald-500  아이콘: Image
```

---

## 5. 검증 방법

| 항목 | 방법 |
|------|------|
| 대비율 | Chrome Lighthouse 접근성 감사 |
| 다크모드 | 각 테마에서 카드 목록 육안 검증 |
| 애니메이션 | `prefers-reduced-motion` 동작 확인 |
| 모바일 | Playwright 모바일 뷰포트 스크린샷 |
| 일러스트 | Figma 디자인 → SVG export → `public/images/` |

---

## 6. 기존 문서 참조

- 디자인 가이드라인: `doc/design/DESIGN_GUIDELINES.md`
- UX/UI 개선 (적용완료): `doc/design/ux-ui-improvements.md`
- 컴포넌트 카탈로그: `doc/design/COMPONENT_CATALOG.md`
- 모바일 최적화: `doc/design/mobile-optimization.md`
- 디자인 토큰: `lib/design-tokens.ts`
