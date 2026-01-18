# 환경 변수 설정 변경 수정 완료 요약

**작성일:** 2026-01-18  
**변경 사항:** `.env.local`에서 표준 변수명 사용으로 변경  
**수정 완료:** ✅

## 변경 사항

### `.env.local` 구조 변경

**이전:**
```env
# old Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tpourpuxuqsorohlydug.supabase.co
...

# Supabase2_rebuild
NEW_SUPABASE_URL=https://pkdhhtfomhhuiirzurhs.supabase.co
NEW_SUPABASE_ANON_KEY=...
NEW_SUPABASE_SERVICE_ROLE_KEY=...
```

**현재:**
```env
# old Supabase
old_NEXT_PUBLIC_SUPABASE_URL=https://tpourpuxuqsorohlydug.supabase.co
old_NEXT_PUBLIC_SUPABASE_ANON_KEY=...
old_SUPABASE_SERVICE_ROLE_KEY=...

# Supabase2_rebuild
NEXT_PUBLIC_SUPABASE_URL=https://pkdhhtfomhhuiirzurhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 수정 완료된 파일

### 1. 마이그레이션 스크립트

#### ✅ `scripts/migrate-supabase-data.js`
- 기존 프로젝트: `old_` 프리픽스 또는 `OLD_` 프리픽스 지원
- 새 프로젝트: `NEW_` 프리픽스 우선, 없으면 표준 변수명 사용

#### ✅ `scripts/migrate-supabase-storage.js`
- 동일한 수정 적용

#### ✅ `scripts/verify-supabase-migration.js`
- 동일한 수정 적용

### 2. 애플리케이션 코드

#### ✅ `lib/supabase/client.ts`
- 표준 변수명 사용 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- 문제없음

#### ✅ `lib/supabase/server.ts`
- 표준 변수명 사용
- 문제없음

### 3. 기타 스크립트

#### ✅ `scripts/update-description-summary.js`
- 표준 변수명 사용 (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- 문제없음

#### ✅ `scripts/cleanup-and-update-notion-books.js`
- 표준 변수명 사용
- 문제없음

#### ✅ `scripts/migrate-notion-to-supabase.js`
- 표준 변수명 사용
- 문제없음

## 환경 변수 우선순위

### 기존 프로젝트 (마이그레이션 스크립트용)

1. `OLD_SUPABASE_URL` / `OLD_SUPABASE_SERVICE_ROLE_KEY`
2. `old_NEXT_PUBLIC_SUPABASE_URL` / `old_SUPABASE_SERVICE_ROLE_KEY`

### 새 프로젝트 (애플리케이션 및 마이그레이션 스크립트)

1. `NEW_SUPABASE_URL` / `NEW_SUPABASE_SERVICE_ROLE_KEY` (마이그레이션 스크립트용)
2. `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (표준 변수명)

## 확인 사항

### ✅ 애플리케이션 코드
- 모든 애플리케이션 코드는 표준 변수명을 사용하므로 문제없습니다
- `lib/supabase/client.ts`, `lib/supabase/server.ts` 확인 완료

### ✅ 마이그레이션 스크립트
- 모든 마이그레이션 스크립트가 새로운 환경 변수 구조를 지원하도록 수정 완료
- `old_` 프리픽스와 표준 변수명 모두 지원

### ⚠️ Vercel 환경 변수
- Vercel에도 표준 변수명으로 설정되어 있는지 확인 필요
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (필요한 경우)
- `NEXT_PUBLIC_APP_URL`

## 사용 방법

### 마이그레이션 스크립트 실행

현재 `.env.local` 구조로 마이그레이션 스크립트를 실행할 수 있습니다:

```bash
# 데이터 이관
node scripts/migrate-supabase-data.js

# Storage 이관
node scripts/migrate-supabase-storage.js

# 검증
node scripts/verify-supabase-migration.js
```

스크립트는 다음 우선순위로 환경 변수를 읽습니다:

**기존 프로젝트:**
- `old_NEXT_PUBLIC_SUPABASE_URL` (`.env.local`의 `# old Supabase` 섹션)
- `old_SUPABASE_SERVICE_ROLE_KEY` (`.env.local`의 `# old Supabase` 섹션)

**새 프로젝트:**
- `NEXT_PUBLIC_SUPABASE_URL` (`.env.local`의 `# Supabase2_rebuild` 섹션)
- `SUPABASE_SERVICE_ROLE_KEY` (`.env.local`의 `# Supabase2_rebuild` 섹션)

## 체크리스트

- [x] `scripts/migrate-supabase-data.js` 수정 완료
- [x] `scripts/migrate-supabase-storage.js` 수정 완료
- [x] `scripts/verify-supabase-migration.js` 수정 완료
- [x] 애플리케이션 코드 확인 완료 (문제없음)
- [ ] Vercel 환경 변수 확인 (표준 변수명으로 설정되어 있는지)
- [ ] 마이그레이션 스크립트 테스트 (선택사항)

## 참고

- 애플리케이션 코드는 표준 변수명을 사용하므로 변경 불필요
- 마이그레이션 스크립트만 수정하여 새로운 환경 변수 구조를 지원하도록 변경
- 마이그레이션 완료 후에는 `old_` 프리픽스 변수는 제거해도 됩니다
