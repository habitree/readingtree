# Supabase 마이그레이션 단계별 실행 가이드

**작성일:** 2026년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**최종 업데이트:** 2026-01-17

> **💡 참고**: 이 문서는 빠른 참조용 체크리스트입니다. 상세한 설명은 [`supabase-migration-guide.md`](./supabase-migration-guide.md)를 참조하세요.

---

## 현재 진행 상황

✅ **완료된 작업**:
- [x] 새 Supabase 프로젝트 생성
- [x] 환경 변수 설정 (`.env.local`)
- [x] 스키마 이관 완료 (`schema.sql` 실행 완료)

📋 **다음 단계**:
- [ ] 데이터베이스 데이터 이관
- [ ] Storage 파일 이관
- [ ] 관리자 계정 설정
- [ ] OAuth 설정
- [ ] 환경 변수 업데이트 및 배포

---

## 빠른 체크리스트

### 사전 준비
- [ ] 새 Supabase 프로젝트 생성
- [ ] 환경 변수 설정 (`.env.local`)
  - [ ] `OLD_SUPABASE_URL` 또는 `NEXT_PUBLIC_SUPABASE_URL` 설정
  - [ ] `OLD_SUPABASE_SERVICE_ROLE_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY` 설정
  - [ ] `NEW_SUPABASE_URL` 설정
  - [ ] `NEW_SUPABASE_SERVICE_ROLE_KEY` 설정
- [ ] 스키마 이관 완료 (`schema.sql` 실행)
- [ ] Storage 버킷 생성 (`images` 버킷)
- [ ] Storage RLS 정책 설정

### 데이터 이관
- [ ] 데이터베이스 데이터 이관 (`node scripts/migrate-supabase-data.js`)
- [ ] Storage 파일 이관 (`node scripts/migrate-supabase-storage.js`)
- [ ] 데이터 검증 (`node scripts/verify-supabase-migration.js`)

### 설정 및 배포
- [ ] 관리자 계정 설정 (필수)
- [ ] Kakao OAuth 설정
- [ ] Google OAuth 설정
- [ ] 카카오 개발자 센터 Redirect URL 업데이트
- [ ] Google Cloud Console Redirect URL 업데이트
- [ ] 로컬 환경 변수 업데이트
- [ ] Vercel 환경 변수 업데이트
- [ ] GitHub Actions Secrets 업데이트

### 최종 테스트
- [ ] 로컬 환경 테스트
- [ ] 프로덕션 환경 테스트

---

## 단계별 실행 명령어

### 1. 환경 변수 확인

```powershell
# 프로젝트 루트로 이동
cd C:\Users\N100274\OneDrive\2.PJT\readingtree_v4.0.0

# .env.local 파일 확인
Get-Content .env.local
```

### 2. 데이터베이스 데이터 이관

```powershell
# 데이터 이관 스크립트 실행
node scripts/migrate-supabase-data.js
```

**예상 소요 시간**: 레코드당 약 0.1초 (1000개 레코드 = 약 1-2분)

### 3. Storage 파일 이관

```powershell
# Storage 파일 이관 스크립트 실행
node scripts/migrate-supabase-storage.js
```

**예상 소요 시간**: 파일당 약 0.05초 (100개 파일 = 약 5-10분)

### 4. 데이터 검증

```powershell
# 검증 스크립트 실행
node scripts/verify-supabase-migration.js
```

### 5. 관리자 계정 설정

**SQL Editor에서 실행**:

```sql
-- 관리자로 설정
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'cdhnaya@kakao.com';

-- 설정 확인
SELECT id, email, name, is_admin 
FROM users 
WHERE is_admin = TRUE;
```

> **자세한 내용**: [`admin-setup-guide.md`](./admin-setup-guide.md) 참조

---

## 문제 해결 FAQ

### Q1: 데이터 이관 중 오류 발생

**증상**: 특정 테이블 이관 실패

**해결**:
1. 에러 메시지 확인
2. 해당 테이블의 RLS 정책 확인
3. 스크립트 재실행 (중복 데이터는 자동 건너뜀)

**자세한 내용**: [`supabase-migration-guide.md`](./supabase-migration-guide.md)의 "5. 문제 해결" 섹션 참조

### Q2: Storage 파일 이관 실패

**증상**: 일부 파일 업로드 실패

**해결**:
1. 실패한 파일 경로 확인
2. 파일 크기 확인 (5MB 제한)
3. 수동으로 해당 파일만 재업로드

### Q3: 관리자 페이지 접근 불가

**증상**: 관리자로 설정했지만 `/admin` 페이지에 접근할 수 없음

**해결**:
1. `is_admin` 컬럼 확인:
   ```sql
   SELECT email, is_admin FROM users WHERE email = 'your-email@example.com';
   ```
2. 관리자로 설정:
   ```sql
   UPDATE users SET is_admin = TRUE WHERE email = 'your-email@example.com';
   ```
3. 세션 갱신:
   - 브라우저에서 로그아웃 후 다시 로그인
   - 개발 서버 재시작 (`npm run dev`)
   - 브라우저 캐시 클리어

**자세한 내용**: [`admin-setup-guide.md`](./admin-setup-guide.md) 참조

### Q4: OAuth 로그인 실패

**증상**: 새 프로젝트에서 로그인 불가

**해결**:
1. OAuth Provider 설정 확인 (Supabase Dashboard)
2. Redirect URL이 정확한지 확인
3. 카카오/구글 개발자 센터에 새 URL 등록 확인

---

## 주요 참고 문서

- **종합 가이드**: [`supabase-migration-guide.md`](./supabase-migration-guide.md)
- **관리자 설정**: [`admin-setup-guide.md`](./admin-setup-guide.md)
- **스키마 파일**: `doc/database/schema.sql`
- **이관 스크립트**:
  - `scripts/migrate-supabase-data.js`
  - `scripts/migrate-supabase-storage.js`
  - `scripts/verify-supabase-migration.js`

---

## 완료 기준

마이그레이션이 완료되었다고 판단할 수 있는 기준:

- ✅ 모든 테이블 데이터 이관 완료
- ✅ Storage 파일 이관 완료
- ✅ 관리자 계정 설정 완료
- ✅ OAuth 로그인 정상 작동
- ✅ 로컬 환경 테스트 통과
- ✅ 프로덕션 환경 테스트 통과

---

**이 가이드를 따라 단계별로 진행하면 안전하게 마이그레이션을 완료할 수 있습니다.**
