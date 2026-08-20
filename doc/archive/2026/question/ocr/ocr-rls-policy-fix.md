# OCR 통계/로그 RLS 정책 오류 해결 가이드

**작성일:** 2026년 1월 15일  
**문제:** OCR 통계/로그 기록 시 RLS 정책 위반 오류  
**오류 코드:** `42501: new row violates row-level security policy`

---

## 🔍 문제 분석

### 발견된 오류

로그에서 확인된 오류:
```
[OCR Stats] 통계 생성 오류: {
  code: '42501',
  details: null,
  hint: null,
  message: 'new row violates row-level security policy for table "ocr_usage_stats"'
}

[OCR Logs] 로그 기록 오류: {
  code: '42501',
  details: null,
  hint: null,
  message: 'new row violates row-level security policy for table "ocr_logs"'
}
```

### 원인

1. **RLS 활성화됨**: `ocr_usage_stats`와 `ocr_logs` 테이블에 RLS가 활성화되어 있음
2. **INSERT/UPDATE 정책 없음**: 기존 마이그레이션 파일에는 SELECT 정책만 있고, INSERT/UPDATE 정책이 없음
3. **서버 액션에서 INSERT 시도**: `app/actions/ocr.ts`의 `recordOcrSuccess()`와 `recordOcrFailure()` 함수에서 INSERT 시도
4. **RLS 정책 위반**: 정책이 없으면 INSERT/UPDATE가 차단됨

### 영향

- ✅ **OCR 처리 자체는 성공**: 텍스트 추출 및 저장은 정상 작동
- ❌ **통계 기록 실패**: 사용자별 OCR 사용 통계가 기록되지 않음
- ❌ **로그 기록 실패**: OCR 처리 상세 로그가 기록되지 않음
- ⚠️ **기능 영향**: 통계/로그 기능은 작동하지 않지만, OCR 처리 기능은 정상 작동

---

## ✅ 해결 방법

### 1단계: 마이그레이션 파일 실행

**파일 위치:**
- `doc/database/migration-202601151227__ocr__fix_rls_insert_update_policies.sql`

**실행 방법:**

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **SQL Editor 이동**
   - 좌측 메뉴에서 "SQL Editor" 클릭

3. **마이그레이션 파일 내용 복사**
   - `doc/database/migration-202601151227__ocr__fix_rls_insert_update_policies.sql` 파일 열기
   - 전체 내용 복사

4. **SQL Editor에 붙여넣기 및 실행**
   - "New query" 클릭
   - 복사한 SQL 붙여넣기
   - "Run" 버튼 클릭

5. **실행 결과 확인**
   - "Success. No rows returned" 메시지 확인
   - 오류가 없으면 정상 실행됨

---

### 2단계: 정책 확인

**실행 후 확인:**

```sql
-- ocr_usage_stats 테이블 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'ocr_usage_stats'
ORDER BY policyname;

-- ocr_logs 테이블 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'ocr_logs'
ORDER BY policyname;
```

**예상 결과:**

**ocr_usage_stats:**
- `Admins can view OCR usage stats` (SELECT, 관리자만)
- `Users can insert own OCR usage stats` (INSERT, 자신의 데이터만)
- `Users can update own OCR usage stats` (UPDATE, 자신의 데이터만)

**ocr_logs:**
- `Admins can view OCR logs` (SELECT, 관리자만)
- `Users can insert own OCR logs` (INSERT, 자신의 데이터만)

---

### 3단계: 테스트

**OCR 기능 테스트:**

1. **기록 생성 및 이미지 업로드**
   - 필사 이미지 업로드
   - OCR 처리 시작

2. **Vercel Functions 로그 확인**
   - Deployments → Functions → `/api/ocr/process` 로그 확인
   - 다음 로그가 나타나야 함:
     ```
     [OCR Process] 성공 통계 기록 완료: userId=...
     ```
   - 오류 메시지가 없어야 함

3. **관리자 페이지에서 통계 확인** (선택)
   - `/admin/api-info` 페이지 접속
   - OCR 통계 확인 (관리자만 조회 가능)

---

## 📋 추가된 RLS 정책

### ocr_usage_stats 테이블

**INSERT 정책:**
```sql
CREATE POLICY "Users can insert own OCR usage stats"
    ON ocr_usage_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```
- 사용자가 자신의 통계를 생성할 수 있음
- `user_id = auth.uid()` 패턴 사용

**UPDATE 정책:**
```sql
CREATE POLICY "Users can update own OCR usage stats"
    ON ocr_usage_stats FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```
- 사용자가 자신의 통계를 수정할 수 있음
- `user_id = auth.uid()` 패턴 사용

### ocr_logs 테이블

**INSERT 정책:**
```sql
CREATE POLICY "Users can insert own OCR logs"
    ON ocr_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```
- 사용자가 자신의 로그를 생성할 수 있음
- `user_id = auth.uid()` 패턴 사용

---

## 🔍 문제 해결 확인

### 정상 작동 시 로그

**성공적인 경우:**
```
[OCR Process] 처리 완료: noteId=..., 소요시간=...ms
[OCR Process] 성공 통계 기록 완료: userId=...
```

**오류가 없는 경우:**
- `[OCR Stats] 통계 생성 오류` 메시지 없음
- `[OCR Logs] 로그 기록 오류` 메시지 없음

### 여전히 오류가 발생하는 경우

**확인 사항:**

1. **마이그레이션 파일 실행 확인**
   - SQL Editor에서 정책이 생성되었는지 확인
   - 위의 "정책 확인" SQL 실행

2. **RLS 활성화 상태 확인**
   ```sql
   SELECT tablename, rowsecurity as rls_enabled
   FROM pg_tables
   WHERE schemaname = 'public' 
     AND tablename IN ('ocr_usage_stats', 'ocr_logs');
   ```
   - `rls_enabled`가 `true`여야 함

3. **인증 확인**
   - 서버 액션에서 `auth.uid()`가 올바르게 반환되는지 확인
   - Vercel Functions 로그에서 `userId` 확인

---

## 📝 요약

### 문제
- OCR 통계/로그 기록 시 RLS 정책 위반 오류 발생
- INSERT/UPDATE 정책이 없어서 서버 액션에서 기록 실패

### 해결
- `ocr_usage_stats` 테이블에 INSERT/UPDATE 정책 추가
- `ocr_logs` 테이블에 INSERT 정책 추가
- 사용자가 자신의 데이터만 INSERT/UPDATE할 수 있도록 제한

### 영향
- ✅ OCR 처리 기능은 정상 작동 (이미 성공)
- ✅ 통계/로그 기록 기능 정상 작동 (수정 후)
- ✅ 보안 유지 (사용자는 자신의 데이터만 기록 가능)

---

**이 문서는 OCR 통계/로그 RLS 정책 오류 해결 가이드입니다.**
