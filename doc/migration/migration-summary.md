# Supabase 마이그레이션 요약

**작성일:** 2026-01-18  
**프로젝트:** Habitree Reading Hub v4.0.0

## 완료된 작업

### 1. 프로젝트 메타데이터 업데이트 ✅
- `package.json`의 repository URL 업데이트: `https://github.com/habitree/readingtree.git`
- `README.md`의 클론 명령어 URL 업데이트

### 2. 스키마 수정 ✅
- `schema.sql`에 `completed_dates` 컬럼 추가
- 마이그레이션 파일 생성: `migration-202601180000__user_books__add_completed_dates.sql`

### 3. 데이터 이관 시도 ✅
- 데이터베이스 데이터 이관 실행 (일부 오류 발생, 재실행 필요)
- Storage 파일 이관 진행 (510개 파일, 일부 완료)

## 확인된 설정 정보

### GitHub
- ✅ 새 저장소 연결: `https://github.com/habitree/readingtree.git`

### Supabase
- **기존 프로젝트:** `https://tpourpuxuqsorohlydug.supabase.co`
- **새 프로젝트:** `https://pkdhhtfomhhuiirzurhs.supabase.co`

### Vercel
- ✅ 배포 URL: `https://readingtree-i2zd5zgdx-cdhrichs-projects.vercel.app`
- ✅ GitHub 연결 완료

## 발생한 문제

### 1. `user_books` 테이블의 `completed_dates` 컬럼 누락
- **상태:** 해결됨 (스키마 수정 및 마이그레이션 파일 생성)
- **다음 단계:** 새 Supabase 프로젝트에서 마이그레이션 파일 실행 필요

### 2. `users` 테이블 이관 불가
- **원인:** `auth.users` 참조로 인한 자동 이관 불가
- **해결:** 사용자가 새 프로젝트에서 직접 로그인하면 자동 생성

### 3. `books` 테이블 조회 오류
- **상태:** 재실행 필요

### 4. Storage 파일 이관 타임아웃
- **상태:** 일부 완료, 재실행 필요

## 다음 단계

자세한 내용은 다음 문서를 참조하세요:

1. **마이그레이션 진행 상황:** [`migration-status.md`](./migration-status.md)
2. **다음 단계 가이드:** [`next-steps.md`](./next-steps.md)

## 중요 사항

1. **먼저 해야 할 작업:** 새 Supabase 프로젝트에 `completed_dates` 컬럼 추가
2. **데이터 이관 재실행:** 컬럼 추가 후 데이터 이관 스크립트 재실행
3. **환경 변수 업데이트:** 로컬 및 배포 환경 변수 업데이트
4. **OAuth 설정:** 카카오/구글 개발자 센터 Redirect URL 업데이트

## 참고 문서

- 상세 마이그레이션 가이드: [`supabase-migration-guide.md`](./supabase-migration-guide.md)
- 단계별 실행 가이드: [`migration-step-by-step.md`](./migration-step-by-step.md)
- 관리자 설정 가이드: [`admin-setup-guide.md`](./admin-setup-guide.md)
