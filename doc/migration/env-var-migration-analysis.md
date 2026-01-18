# 환경 변수 설정 변경 분석 및 수정 가이드

**작성일:** 2026-01-18  
**변경 사항:** `.env.local`에서 `NEW_SUPABASE_*` 프리픽스를 제거하고 표준 변수명으로 변경  
**영향 범위:** 마이그레이션 스크립트 및 관련 문서

## 변경 사항 요약

### 이전 구조
```env
# old Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tpourpuxuqsorohlydug.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Supabase2_rebuild
NEW_SUPABASE_URL=https://pkdhhtfomhhuiirzurhs.supabase.co
NEW_SUPABASE_ANON_KEY=...
NEW_SUPABASE_SERVICE_ROLE_KEY=...
```

### 현재 구조
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

## 문제점 분석

### 1. 마이그레이션 스크립트 문제

현재 마이그레이션 스크립트들은 `NEW_SUPABASE_*` 변수를 참조하고 있습니다:

- `scripts/migrate-supabase-data.js`
- `scripts/migrate-supabase-storage.js`
- `scripts/verify-supabase-migration.js`

**문제:**
- 스크립트가 `NEW_SUPABASE_URL`과 `NEW_SUPABASE_SERVICE_ROLE_KEY`를 찾지 못함
- 현재 `.env.local`에는 표준 변수명만 있음

**해결 방법:**
1. 스크립트를 수정하여 표준 변수명도 지원하도록 변경
2. 또는 `.env.local`에 `NEW_SUPABASE_*` 변수 추가 (임시)

### 2. 애플리케이션 코드는 정상

애플리케이션 코드 (`lib/supabase/client.ts`, `lib/supabase/server.ts`)는 표준 변수명을 사용하므로 문제없습니다:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (일부 스크립트에서 사용)

## 수정 방안

### 방안 1: 스크립트 수정 (권장)

마이그레이션 스크립트를 수정하여 다음 우선순위로 환경 변수를 읽도록 변경:

1. **기존 프로젝트:**
   - `OLD_SUPABASE_URL` 또는 `old_NEXT_PUBLIC_SUPABASE_URL` 또는 `NEXT_PUBLIC_SUPABASE_URL` (이전 값)
   - `OLD_SUPABASE_SERVICE_ROLE_KEY` 또는 `old_SUPABASE_SERVICE_ROLE_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY` (이전 값)

2. **새 프로젝트:**
   - `NEW_SUPABASE_URL` 또는 `NEXT_PUBLIC_SUPABASE_URL` (현재 값)
   - `NEW_SUPABASE_SERVICE_ROLE_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY` (현재 값)

**주의:** 이 방법은 기존 프로젝트와 새 프로젝트를 구분하기 어려울 수 있습니다.

### 방안 2: `.env.local`에 임시 변수 추가 (간단)

마이그레이션 스크립트 실행 시에만 사용할 임시 변수를 추가:

```env
# 마이그레이션 스크립트용 (임시)
NEW_SUPABASE_URL=https://pkdhhtfomhhuiirzurhs.supabase.co
NEW_SUPABASE_SERVICE_ROLE_KEY=...
```

**장점:** 스크립트 수정 불필요  
**단점:** 변수 중복, 혼란 가능

### 방안 3: 스크립트에 명시적 파라미터 전달 (가장 명확)

스크립트를 수정하여 명령줄 인자로 프로젝트 정보를 받도록 변경:

```bash
node scripts/migrate-supabase-data.js \
  --old-url=https://tpourpuxuqsorohlydug.supabase.co \
  --old-key=... \
  --new-url=https://pkdhhtfomhhuiirzurhs.supabase.co \
  --new-key=...
```

**장점:** 가장 명확하고 유연함  
**단점:** 스크립트 수정 필요, 사용법 변경

## 권장 해결 방법

**방안 1 + 방안 2 조합**을 권장합니다:

1. 스크립트를 수정하여 표준 변수명도 지원
2. 마이그레이션 완료 전까지는 `.env.local`에 `NEW_SUPABASE_*` 변수 유지
3. 마이그레이션 완료 후 `NEW_SUPABASE_*` 변수 제거

## 수정이 필요한 파일

### 1. `scripts/migrate-supabase-data.js`

**현재 코드:**
```javascript
const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const OLD_SUPABASE_SERVICE_ROLE_KEY = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const NEW_SUPABASE_URL = process.env.NEW_SUPABASE_URL;
const NEW_SUPABASE_SERVICE_ROLE_KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;
```

**수정 후:**
```javascript
// 기존 프로젝트: old_ 프리픽스 또는 OLD_ 프리픽스 우선
const OLD_SUPABASE_URL = 
  process.env.OLD_SUPABASE_URL || 
  process.env.old_NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL; // 주의: 이건 새 프로젝트일 수도 있음

const OLD_SUPABASE_SERVICE_ROLE_KEY = 
  process.env.OLD_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.old_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY; // 주의: 이건 새 프로젝트일 수도 있음

// 새 프로젝트: NEW_ 프리픽스 우선, 없으면 표준 변수명
const NEW_SUPABASE_URL = 
  process.env.NEW_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const NEW_SUPABASE_SERVICE_ROLE_KEY = 
  process.env.NEW_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY;
```

**문제:** 기존 프로젝트와 새 프로젝트를 구분하기 어려움

**더 나은 방법:** 명시적으로 구분
```javascript
// 기존 프로젝트는 반드시 old_ 또는 OLD_ 프리픽스 사용
const OLD_SUPABASE_URL = 
  process.env.OLD_SUPABASE_URL || 
  process.env.old_NEXT_PUBLIC_SUPABASE_URL;

const OLD_SUPABASE_SERVICE_ROLE_KEY = 
  process.env.OLD_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.old_SUPABASE_SERVICE_ROLE_KEY;

// 새 프로젝트는 NEW_ 프리픽스 우선, 없으면 표준 변수명
const NEW_SUPABASE_URL = 
  process.env.NEW_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const NEW_SUPABASE_SERVICE_ROLE_KEY = 
  process.env.NEW_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY;
```

### 2. `scripts/migrate-supabase-storage.js`

동일한 수정 적용

### 3. `scripts/verify-supabase-migration.js`

동일한 수정 적용

## 즉시 조치 사항

### 옵션 A: `.env.local`에 임시 변수 추가 (빠른 해결)

`.env.local` 파일에 다음 추가:

```env
# 마이그레이션 스크립트용 (임시 - 마이그레이션 완료 후 제거)
NEW_SUPABASE_URL=https://pkdhhtfomhhuiirzurhs.supabase.co
NEW_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZGhodGZvbWhodWlpcnp1cmhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODYzOTY2MiwiZXhwIjoyMDg0MjE1NjYyfQ.JjYcVJqma1fHXB4SKg-HwchQLzuhaHJ2Yh4zjGksNJ4
```

### 옵션 B: 스크립트 수정 (권장)

스크립트를 수정하여 표준 변수명도 지원하도록 변경

## 체크리스트

- [ ] `.env.local` 구조 확인
  - [ ] `# old Supabase` 섹션에 `old_` 프리픽스 사용
  - [ ] `# Supabase2_rebuild` 섹션에 표준 변수명 사용
- [ ] 마이그레이션 스크립트 수정 또는 임시 변수 추가
- [ ] 애플리케이션 코드 확인 (표준 변수명 사용 중이므로 문제없음)
- [ ] Vercel 환경 변수 확인 (표준 변수명으로 설정되어 있는지)
- [ ] 마이그레이션 완료 후 임시 변수 제거

## 참고

- 애플리케이션 코드는 표준 변수명을 사용하므로 문제없습니다
- 마이그레이션 스크립트만 수정하면 됩니다
- 마이그레이션 완료 후에는 `NEW_SUPABASE_*` 변수가 필요 없습니다
