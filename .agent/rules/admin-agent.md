---
alwaysApply: false
description: "관리자(Admin) 플랫폼 에이전트 — 시스템 통계, OCR 배치, API 관리, 기능 요청"
globs:
  - "app/(main)/admin/**"
  - "app/(main)/feature-requests/**"
  - "app/actions/admin/**"
  - "app/actions/feature-requests.ts"
  - "app/api/admin/**"
  - "components/admin/**"
  - "components/feature-requests/**"
---

# 관리자(Admin) 플랫폼 에이전트

## 1. Identity

관리자 전담 에이전트. 6개 핵심 컴포넌트 + api-info 13개 서브컴포넌트를 담당.

## 2. Responsibilities

- **시스템 통계 대시보드**: 전체 사용자 수, 기록 수, 활동 지표 조회
- **OCR 배치 처리**: `batch-ocr-button`, `batch-ocr-progress-dialog` — 배치 실행 및 보정 설정 관리
- **AI 모델/프롬프트 설정**: 모델 선택, 프롬프트 템플릿 편집
- **커스텀 API 서비스 관리**: `custom_api_services` 테이블 CRUD
- **기능 요청 게시판**: 관리자 응답, 핀 고정, 상태 변경 (open / in-progress / done / rejected)
- **이미지 정리**: `cleanup-images` 배치 작업
- **API 정보 대시보드**: `bento-grid`, `connection-graph`, `service-card` 서브컴포넌트

## 3. Admin Check

```ts
// 관리자 여부 확인 — isAdmin()은 auth.ts에 정의
import { isAdmin } from '@/app/actions/auth'

// 관리자 액션 래퍼 — requireAdmin()은 _shared.ts에 정의
import { requireAdmin } from '@/app/actions/admin/_shared'
```

모든 관리자 액션은 `requireAdmin()` (내부에서 `isAdmin()` 호출)로 검증 후 실행. 미인증 시 즉시 에러 반환.

## 4. Action Structure

| 파일 | 역할 |
|------|------|
| `app/actions/admin/index.ts` | 진입점, re-export |
| `app/actions/admin/stats.ts` | 통계 쿼리 |
| `app/actions/admin/ocr.ts` | OCR 배치 및 보정 설정 |
| `app/actions/admin/custom-api-services.ts` | API 서비스 CRUD |
| `app/actions/admin/_shared.ts` | `requireAdmin()` 권한 검증 (내부에서 `auth.ts`의 `isAdmin()` 호출) |
| `app/actions/feature-requests.ts` | 기능 요청 CRUD + 투표 |

## 5. DB Tables

- `custom_api_services` — 커스텀 API 서비스 등록 정보
- `ocr_correction_settings` — OCR 보정 규칙 설정
- `feature_requests` — 기능 요청 게시글
- `feature_request_votes` — 투표 기록
- `feature_request_comments` — 댓글

## 6. Boundaries

- 모든 모듈 **읽기 접근 가능** (관리 목적 통계/조회)
- 다른 도메인 비즈니스 로직 **수정 금지** (books, notes, groups 등)
- RLS: 관리자 테이블도 RLS 적용, `auth.uid()` 검증 필수

## 7. Escalation

보안 관련 관리자 권한 변경(이메일 교체, 권한 로직 수정)은 반드시 사용자 확인 후 진행.
