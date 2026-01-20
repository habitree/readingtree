## Habitree Reading Hub v4.0.0 규칙 개요

이 문서는 `.cursor/rules/*.mdc` 에 정의된 **프로젝트 전역 규칙들을 한 눈에 볼 수 있도록 정리한 요약본**입니다.  
세부 내용은 각 섹션의 “원본 규칙 문서”를 참고하세요.

---

## 1. 전역 운영 규칙 (`rdrule.mdc`)

- **언어/문서 규칙**
  - 모든 대화 및 사용자 노출 텍스트는 **항상 한국어**로 작성한다.
  - 모든 문서는 **Markdown 형식**으로 작성하고, `doc` 폴더 하위에 **분류별 서브 폴더**를 만들어 저장한다.
  - 시스템 반영과 직접 관련이 없는 질문/자료 정리는 `doc/question` 하위에 별도 `*.md` 파일로 남긴다.
- **기술 스택**
  - Backend / Frontend 모두 **Next.js** 사용을 전제로 한다.
  - 배포는 **Vercel**을 기본 타깃으로 한다.
- **AI/LLM 사용**
  - LLM 호출이 필요한 경우 기본적으로 **Gemini API**를 사용한다.
  - 개발 관련 설명은 **비개발자도 이해할 수 있도록 친절하게** 작성한다.

> 📎 원본 규칙 문서: `.cursor/rules/rdrule.mdc`

---

## 2. 인증/세션 관리 규칙 (`auth_session_rule.mdc`)

- **단일 세션 기준**
  - 세션은 **서버 중심(SSR/쿠키 기반)** 으로만 관리한다.
  - 세션 읽기/검증은 **항상 서버에서만** 수행하고, 클라이언트는 **서버에서 넘겨준 정보만 표시**한다.
- **세션 읽기 표준**
  - `app/actions/auth.ts` 의 `getCurrentUser()` 가 **유일한 진입점**이다.
  - 서버에서 Supabase 클라이언트를 직접 만들어 `auth.getUser()` 를 호출하는 패턴은 **지양**하고, 가능하면 `getCurrentUser()` 를 사용한다.
  - 클라이언트 컴포넌트에서 `createClient().auth.getUser()` / `getSession()` 을 직접 호출하는 것은 **금지**된다.
- **세션 갱신**
  - `lib/supabase/middleware.ts` 에서 모든 요청마다 `getSession()` / `getUser()` 를 호출해 **자동으로 세션을 갱신**한다.
- **로그인/로그아웃**
  - 로그인/로그아웃은 **항상 Server Action** (`app/actions/auth.ts`) 을 통해 처리해야 한다.
  - 클라이언트에서 직접 `supabase.auth.signIn*`, `signOut()` 을 호출하지 않는다.
- **클라이언트 역할**
  - `AuthProvider` 는 서버에서 받은 `initialUser` 를 초기 상태로 사용하고,
  - `onAuthStateChange` 는 **서버 세션과 동기화 확인용 보조 수단**으로만 사용한다.

> 📎 원본 규칙 문서: `.cursor/rules/auth_session_rule.mdc`  
> 📎 상세 문서: `doc/governance/AUTH_SESSION_RULES.md`

---

## 3. DB / RLS 관리 규칙 (`db_rls_rule.mdc`)

- **핵심 사고 방지 포인트**
  - RLS 미적용으로 인한 **데이터 유출** 방지
  - 뒤늦은 RLS 적용으로 인한 **전역 401/빈 목록 문제** 방지
- **테이블 생성 시 필수 절차**
  1. `CREATE TABLE IF NOT EXISTS ...`
  2. 필요한 인덱스 생성 (`CREATE INDEX IF NOT EXISTS ...`)
  3. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
  4. `SELECT / INSERT / UPDATE / DELETE` **모든 RLS 정책을 즉시 작성**
- **소유자/식별자 규칙**
  - **소유자 판단**은 항상 `auth.uid()` 기준으로 한다.
  - 사용자 FK 는 반드시 `auth.users(id)` 를 참조하며, `users` 등 다른 사용자 테이블을 직접 참조하지 않는다.
  - 내부 식별자는 모두 **UUID** 를 사용하고, 새 테이블에서는 `gen_random_uuid()` 를 기본으로 사용한다.
- **정형화된 RLS 패턴**
  - 개인 소유 데이터: `USING (auth.uid() = user_id)` / `WITH CHECK (auth.uid() = user_id)`
  - 부분 공개 데이터(e.g. `notes`): `auth.uid() = user_id OR is_public = TRUE OR is_sample = TRUE`
  - 그룹 데이터: `groups` 테이블을 통해 리더/멤버/공개 여부를 판정하며, **자기 자신 테이블을 재귀적으로 참조하지 않는다.**
- **규칙 위반 시**
  - RLS 누락/불완전/잘못된 FK 등은 **마이그레이션 파일을 통해 즉시 수정**하고,  
    파일명은 `migration-YYYYMMDDHHmm__<테이블명>__<변경내용>.sql` 패턴을 따른다.

> 📎 원본 규칙 문서: `.cursor/rules/db_rls_rule.mdc`  
> 📎 상세 문서: `doc/database/DATA_MODEL.md`, `doc/database/schema.sql`

---

## 4. 데이터 모델 거버넌스 (`datarule.mdc`)

- **단일 기준 문서**
  - 모든 데이터 구조(테이블/컬럼/관계/RLS 의도)는 **`doc/database/DATA_MODEL.md` 한 곳에만** 정의한다.
- **레이어 분리와 타입 안정성**
  - 컴포넌트는 **UI와 입력 처리만** 담당하고, DB 접근은 `app/actions/**` 에서만 수행한다.
  - UI 레이어에서 **테이블명/컬럼명/권한 판정 로직**을 직접 다루지 않는다.
  - Supabase 쿼리 결과에는 항상 `Database["public"]["Tables"]["..."]["Row"]` 타입을 명시한다.
- **스키마 변경 플로우**
  1. `DATA_MODEL.md` 에 변경 사항(테이블/컬럼/관계/RLS 의도)을 먼저 반영
  2. `doc/database/` 아래에 Idempotent한 **SQL 마이그레이션 파일** 작성
  3. 필요 시 `schema.sql` 업데이트
- **데이터 무결성**
  - 한 도메인 개념은 **단일 테이블**로만 표현한다(중복 테이블 금지).
  - 소유자는 항상 `auth.uid()` / `group_members` 기준으로 판단하며, UI에서 임의로 판단하지 않는다.
- **문서화 & 체크리스트**
  - 데이터 관련 기능을 추가/수정할 때
    - 수정된 코드 파일 목록
    - 갱신된 `DATA_MODEL.md` 섹션
    - 생성된 마이그레이션 파일 목록
    를 함께 기록해야 작업 완료로 본다.

> 📎 원본 규칙 문서: `.cursor/rules/datarule.mdc`  
> 📎 관련 문서: `doc/database/DATA_MODEL.md`

---

## 5. UI / 데이터 접근 레이어 분리 규칙 (`ui_datarule.mdc`)

- **레이어 정의**
  - **UI 레이어**: `components/**`, `hooks/**`, `contexts/**`, `app/**`
    - 화면 렌더링, 입력 처리, 로딩/에러 상태 표시
    - **Supabase 쿼리 직접 실행 금지**, DB 구조/권한 판정 로직 노출 금지
  - **데이터 접근 레이어**: `app/actions/**`
    - Supabase 쿼리 실행, 타입 명시, 에러 처리
    - React 훅/브라우저 API 사용 금지
  - **lib 레이어**: `lib/**`
    - 클라이언트 생성, 유틸, 형식 검증만 수행
    - 실제 쿼리 함수는 작성하지 않고 `app/actions` 로 위임
  - **app/api 레이어**: `app/api/**`
    - HTTP 처리, Rate limit, 외부 API 연동
    - DB 쿼리는 **반드시 `app/actions` 를 통해 간접 호출**
    - 예외: Supabase Storage 업로드/다운로드는 직접 호출 허용
- **데이터 흐름 표준**
  - UI → `hooks/` → `app/actions/` → Supabase
  - API → `app/api/**` → `app/actions/` → Supabase
- **위반 시 조치**
  - 컴포넌트/`app/api`/`lib` 에서 발견된 직접 쿼리는 모두 `app/actions` 로 이전하고,
  - 점진적으로 기존 코드도 이 구조로 맞춰간다.

> 📎 원본 규칙 문서: `.cursor/rules/ui_datarule.mdc`  
> 📎 상세 문서: `doc/governance/UI_DATA_ACCESS_RULES.md`

---

## 6. 마이그레이션 관리 규칙 (`migration_rule.mdc`)

- **목적**
  - 콘솔에서 즉흥적으로 스키마를 변경하는 것을 방지하고,  
    **모든 변경을 재현 가능한 마이그레이션 파일로 남기는 것**이 목표이다.
- **핵심 원칙**
  - 모든 스키마 변경은 `doc/database/` 아래 **마이그레이션 파일**로 기록한다.
  - 파일명은 `migration-YYYYMMDDHHmm__<기능명>__<변경내용>.sql` 형식을 따른다.
  - 마이그레이션 내용은 **항상 Idempotent** 하게 작성한다.
- **기록 대상**
  - 테이블/컬럼/인덱스/제약조건/함수/트리거/RLS 정책의 생성·변경·삭제
  - RLS 활성화/정책 추가·수정·삭제
- **작성 규칙**
  - `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`,  
    `DROP POLICY IF EXISTS`, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` 등 사용
  - 파일 상단에 변경 요약/영향 테이블/작성 일시를 주석으로 남긴다.
- **문서화**
  - 스키마 변경 시 `DATA_MODEL.md` 와 `schema.sql` 을 함께 갱신하고,
  - 변경 로그(날짜, 내용, 영향 테이블, 마이그레이션 파일명)를 남긴다.

> 📎 원본 규칙 문서: `.cursor/rules/migration_rule.mdc`  
> 📎 관련 문서: `doc/database/DATA_MODEL.md`, `doc/database/README.md`

---

## 7. 이 문서를 사용하는 방법

- 새로운 기능을 설계하거나 코드를 작성하기 전에,
  - **1–6번 섹션을 빠르게 훑어보면서** 현재 작업이 어떤 규칙에 영향을 받는지 체크합니다.
- 규칙을 위반하는 코드/스키마를 발견하면,
  - 이 문서를 통해 **어느 규칙이 어긋났는지**를 먼저 파악하고,
  - 세부 수정 방법은 각 “원본 규칙 문서” 또는 `doc/governance/*`, `doc/database/*` 문서를 참고합니다.

