# ReadTree 프리런칭 시스템 감사 보고서

> **감사일**: 2026-02-19
> **범위**: 아키텍처, 라우팅, 서버액션, DB, 인증, UX, 접근성, 성능, SEO
> **감사 방식**: 3개 병렬 에이전트 (241 컴포넌트, 47+ 라우트, 19 액션 파일, 15+ API 라우트)

---

## Executive Summary

ReadTree는 Next.js 15 + Supabase + Vercel 기반의 독서 기록/공유 플랫폼으로, 전반적으로 **프로덕션 수준**의 완성도를 갖추고 있습니다. 주요 P0/P1 이슈 수정 후 즉시 배포 가능합니다.

### 감사 점수
| 영역 | 점수 | 비고 |
|------|------|------|
| 아키텍처 | 9/10 | 레이어 분리 우수, 서버액션 패턴 일관 |
| 보안 | 8.5/10 | RLS 완벽, CSP/HSTS 적용, 입력 검증 일부 보강 필요 |
| 성능 | 8/10 | N+1 방지, Promise.all 활용, Rate limiting 적용 |
| UX/접근성 | 7.5/10 | 다크모드/반응형 우수, aria 속성 일부 보강 필요 |
| SEO | 6/10 | OG 이미지 우수, robots.txt/sitemap 미비 |

---

## 아키텍처 평가

### 강점
- **레이어 분리**: `components/ → hooks/ → app/actions/ → Supabase` 일관 적용
- **서버 중심 인증**: `getCurrentUser()` 패턴 전체 적용, 클라이언트 직접 getUser 없음
- **상태 관리**: Zustand 2개 스토어로 깔끔하게 분리 (navigation, mobile-note-sheet)
- **TypeScript strict 모드**: 전체 코드베이스 타입 안전
- **66개 마이그레이션**: 일관된 명명 규칙 (YYYYMMDDHHmm__기능__내용)
- **서버액션 입력 검증**: UUID, 길이, 태그 수 등 체계적 검증

### 약점
- 일부 서버액션에서 이메일 검증이 `includes("@")` 수준으로 약함
- 에러 바운더리가 인증 페이지 그룹에 없음

---

## 보안 감사 결과

### 적용된 보안 조치
- ✅ RLS 정책: `auth.uid() = user_id` 패턴 완벽 적용
- ✅ Rate limiting: upload 30/min, search 60/min
- ✅ 보안 헤더: CSP, HSTS, X-Frame DENY, X-Content-Type-Options
- ✅ CORS 제한: 허용된 오리진만 접근
- ✅ 서버액션 인증 검증: 모든 데이터 변경 액션에 getCurrentUser() 확인

### 보안 개선 필요 사항
| 우선순위 | 항목 | 현재 | 개선 |
|----------|------|------|------|
| P2 | 이메일 검증 | `includes("@")` | 정규식 검증 |
| P2 | 로그인 비밀번호 길이 | `length < 1` | `length < 6` |

---

## 성능 분석

### 적용된 최적화
- ✅ N+1 쿼리 방지: Promise.all 패턴 일관 적용
- ✅ React cache(): `getCachedCurrentUser()` 활용
- ✅ 이미지 최적화: Next.js Image 컴포넌트 + 프록시
- ✅ 번들 최적화: dynamic import (html2canvas 등)
- ✅ 폰트 최적화: `display: swap`, 프리로드

### 개선 가능 항목
- P3: 불필요한 console.log 프로덕션 빌드에서 제거
- P3: 일부 하드코딩 상수를 design-tokens로 이전

---

## UX/접근성 검토

### 강점
- ✅ 다크모드 + 반응형 디자인 전체 적용
- ✅ 모바일 FAB 기록 버튼 (이어읽기 원탭)
- ✅ 게스트 사용자 샘플 데이터 제공
- ✅ i18n 다국어 지원 (한국어/영어)

### 접근성 개선 필요
| 우선순위 | 항목 | 설명 |
|----------|------|------|
| P3 | ExpandableText | `aria-expanded` 속성 누락 |
| P3 | 모바일 FAB | `focus:ring-2` 포커스 링 누락 |
| P3 | 다크모드 대비 | `text-slate-600` → 다크모드에서 가독성 저하 |

---

## SEO 분석

### 적용된 SEO
- ✅ OG 이미지 동적 생성 + 폴백
- ✅ 메타데이터: title, description, keywords
- ✅ 구조화된 URL 패턴: `/share/notes/[id]`, `/share/bookshelves/[id]`

### SEO 개선 필요 (P0)
- ❌ robots.txt 미생성
- ❌ sitemap.xml 미생성

---

## 발견된 이슈 목록

### P0 (배포 필수)
1. `app/robots.ts` 미존재 → 검색엔진 크롤링 안내 없음
2. `app/sitemap.ts` 미존재 → 검색엔진 페이지 발견 어려움

### P1 (높은 우선순위)
3. 공유 다이얼로그 카드 캡처 race condition (isCapturing이 state 기반)
4. 공유 다이얼로그 useEffect cleanup 미비 (unmount 후 setState 가능)
5. Canvas 메모리 정리 누락 (캡처 후 참조 해제 없음)

### P2 (중간 우선순위)
6. 로그인 비밀번호 검증 `length < 1` (최소 6자 권장)
7. 이메일 검증 `includes("@")` (정규식 권장)
8. 인증 페이지 에러 바운더리 없음

### P3 (낮은 우선순위)
9. ExpandableText aria-expanded 누락
10. 모바일 FAB focus ring 누락
11. 하드코딩 상수 (share-note-card 내 색상/너비)
12. 프로덕션 console.log 잔존

---

## 배포 체크리스트

- [ ] P0: robots.ts 생성
- [ ] P0: sitemap.ts 생성
- [ ] P1: 공유 다이얼로그 race condition 수정
- [ ] P1: useEffect cleanup 수정
- [ ] P1: Canvas 메모리 정리
- [ ] P2: Auth 입력 검증 강화
- [ ] P2: Auth 에러 바운더리 추가
- [ ] P3: 접근성 개선
- [ ] P3: console.log 정리
- [ ] 최종 빌드 확인: `npm run build`
- [ ] SEO 검증: `/robots.txt`, `/sitemap.xml`
- [ ] 기능 테스트: 공유 카드 캡처, 인증 플로우
