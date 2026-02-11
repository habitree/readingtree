# 데이터 연결 (Supabase)

연결 정보 단일 참고: [README](README.md) | 환경 변수: [05-env-variables](05-env-variables.md)

---

## 역할

- **DB**: PostgreSQL (사용자·책·노트·서재·그룹 등 모든 데이터)
- **Auth**: 로그인·세션 (카카오/구글 OAuth 포함)
- **Storage**: 파일 업로드/다운로드

모든 사용자 데이터와 인증은 Supabase를 통해 이루어집니다.

---

## 환경 변수

| 변수 | 용도 | 사용처 |
|------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | [lib/supabase/client.ts](../../lib/supabase/client.ts), [lib/supabase/server.ts](../../lib/supabase/server.ts), [lib/supabase/admin.ts](../../lib/supabase/admin.ts), [lib/supabase/middleware.ts](../../lib/supabase/middleware.ts), [lib/utils/image.ts](../../lib/utils/image.ts) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Key (공개 키) | client, server, middleware. 일반 쿼리·RLS 적용 |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key (서버 전용) | [lib/supabase/server.ts](../../lib/supabase/server.ts) createAdminSupabaseClient, [lib/supabase/admin.ts](../../lib/supabase/admin.ts). 샘플 데이터·RLS 우회·관리 기능 |

---

## 설정 위치

- **Supabase Dashboard** → **Settings** → **API**  
  - Project URL → `NEXT_PUBLIC_SUPABASE_URL`  
  - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
  - service_role (비공개) → `SUPABASE_SERVICE_ROLE_KEY`
- **로컬**: `.env.local` 에 위 세 변수 설정
- **Vercel**: 프로젝트 → Settings → Environment Variables (Production/Preview)
- **GitHub Actions**: Repository → Settings → Secrets and variables → Actions. 워크플로에서 `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 로 빌드 시 주입

---

## 연결 확인

- 앱에서 로그인 후 데이터 조회(서재·노트 등)가 되는지 확인
- Supabase Dashboard → Table Editor / SQL Editor에서 데이터·로그 확인
- 로그인 실패 시 Authentication → Logs 확인

---

## 프로젝트/계정 변경 시

1. 새 Supabase 프로젝트 생성 후 Settings → API에서 URL, anon key, service_role key 복사
2. **로컬**: `.env.local` 의 세 변수 모두 교체
3. **Vercel**: Environment Variables 에서 세 변수 업데이트 후 재배포
4. **GitHub Actions**: Secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 업데이트
5. 기존 DB 데이터가 필요하면 마이그레이션/덤프 이관 검토
