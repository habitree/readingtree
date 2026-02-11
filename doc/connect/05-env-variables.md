# 환경 변수 일람

연결 정보 단일 참고: [README](README.md)

---

## 공통 규칙

- **`NEXT_PUBLIC_*`**: 클라이언트(브라우저)에 노출됩니다. 빌드 시점에 코드에 삽입되므로 값 변경 시 재빌드 필요.
- **그 외**: 서버 전용. 클라이언트에 노출하면 안 됨.
- **비밀 값**: 이 문서에는 변수 이름·용도·설정 위치만 기재합니다. 실제 키/비밀번호는 문서에 넣지 않습니다.

---

## 일람표

| 변수 이름 | 용도 | 필수 | 사용처(요약) | 로컬 | Vercel | GitHub Secrets |
|-----------|------|------|--------------|------|--------|----------------|
| **Supabase** | | | | | | |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 필수 | lib/supabase/*, lib/utils/image.ts | .env.local | Environment Variables | `SUPABASE_URL`(빌드 시 동일 값 주입) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | 필수 | lib/supabase/* | .env.local | Environment Variables | `SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용, RLS 우회 | 필수 | lib/supabase/server.ts, admin.ts, 샘플/관리 기능 | .env.local | Environment Variables | `SUPABASE_SERVICE_ROLE_KEY` |
| **인증·앱 URL** | | | | | | |
| `NEXT_PUBLIC_KAKAO_APP_KEY` | 카카오 JavaScript 키(클라이언트/표시용) | 필수 | contexts/auth, 로그인 버튼, app/actions/admin.ts | .env.local | Environment Variables | `KAKAO_APP_KEY` |
| `NEXT_PUBLIC_APP_URL` | 앱 기준 URL(OAuth 리다이렉트 등) | 필수 | lib/utils/url.ts, app/actions/auth.ts, app/callback | .env.local | Environment Variables | `NEXT_PUBLIC_APP_URL` |
| **Naver** | | | | | | |
| `NAVER_CLIENT_ID` | 네이버 API Client ID | 필수 | lib/api/naver.ts, 도서 검색 | .env.local | Environment Variables | `NAVER_CLIENT_ID` |
| `NAVER_CLIENT_SECRET` | 네이버 API Client Secret | 필수 | lib/api/naver.ts | .env.local | Environment Variables | `NAVER_CLIENT_SECRET` |
| **Gemini / AI** | | | | | | |
| `GEMINI_API_KEY` | Gemini API 키 | 필수(AI 사용 시) | app/api/ai/chat, lib/ai/providers/gemini, ocr-correction, persona, settings | .env.local | Environment Variables | (워크플로에 없으면 Vercel만) |
| `OPENAI_API_KEY` | OpenAI API 키(선택) | 선택 | lib/ai/providers/openai, ocr-correction, settings | .env.local | Environment Variables | - |
| `ANTHROPIC_API_KEY` | Anthropic API 키(선택) | 선택 | lib/ai/providers/anthropic, ocr-correction | .env.local | Environment Variables | - |
| **도서·페이지 수** | | | | | | |
| `NL_SEOJI_CERT_KEY` | 국립중앙도서관 ISBN서지정보 API | 선택(권장) | lib/api/book-page-count.ts, app/actions/admin.ts | .env.local | Environment Variables | - |
| `ALADIN_TTB_KEY` | 알라딘 Open API | 선택(권장) | lib/api/book-page-count.ts, app/actions/admin.ts | .env.local | Environment Variables | - |
| `GOOGLE_BOOKS_API_KEY` | Google Books API | 선택 | lib/api/book-page-count.ts, app/actions/admin.ts | .env.local | Environment Variables | - |
| **OCR (Cloud Run)** | | | | | | |
| `CLOUD_RUN_OCR_URL` | Cloud Run OCR 서비스 URL | 선택(기본값 있음) | lib/api/cloud-run-ocr.ts, app/actions/admin.ts | .env.local | Environment Variables | - |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | 서비스 계정 JSON 문자열 | OCR 인증 시 | lib/api/cloud-run-ocr.ts, app/actions/admin.ts | .env.local | Environment Variables | `GOOGLE_SERVICE_ACCOUNT_JSON`(워크플로에서 사용) |
| `CLOUD_RUN_OCR_AUTH_TOKEN` | Cloud Run 정적 ID 토큰(하위 호환) | 선택 | lib/api/cloud-run-ocr.ts | .env.local | Environment Variables | - |
| **Vercel 자동 주입** | | | | | | |
| `VERCEL` | Vercel 환경 여부 | 자동 | lib/utils/url.ts, app/actions/auth.ts | - | 자동 | - |
| `VERCEL_ENV` | production / preview | 자동 | lib/utils/url.ts, app/actions/auth.ts | - | 자동 | - |
| `VERCEL_URL` | 배포 URL 호스트 | 자동 | lib/utils/url.ts | - | 자동 | - |
| `NEXT_PUBLIC_VERCEL_URL` | 빌드 타임 Vercel URL | 자동 | lib/utils/url.ts | - | 자동 | - |
| **기타** | | | | | | |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 측정 ID | 선택 | (GA4 연동 시) | .env.local | Environment Variables | - |
| `NEXT_PUBLIC_SAMPLE_USER_ID` | 샘플 사용자 UUID(관리자) | 선택 | app/actions/sample.ts, stats.ts | .env.local | Environment Variables | - |
| `GOOGLE_APPLICATION_CREDENTIALS` | 서비스 계정 파일 경로 | 선택 | app/api/ocr/process/route.ts | .env.local | - | - |

---

## GitHub Actions 빌드 시 주입 (deploy-production.yml 기준)

워크플로에서 `env:` 로 빌드에 넘기는 이름은 위 표의 "GitHub Secrets" 열과 동일합니다.  
Secrets 이름이 앱 변수와 다른 경우(예: `SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`로 매핑)는 워크플로에서 동일한 값으로 설정됩니다.

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- `GOOGLE_VISION_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON` (선택)
- `KAKAO_APP_KEY`, `NEXT_PUBLIC_APP_URL`

Vercel 배포용: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

---

## 발급·설정 위치 요약

- **Supabase**: Dashboard → Settings → API (URL, anon key, service_role key)
- **카카오**: [developers.kakao.com](https://developers.kakao.com/console/app) → 앱 → 앱 키 (JavaScript 키)
- **구글 OAuth**: Supabase Dashboard → Authentication → Providers → Google (Client ID/Secret은 Supabase에만 입력)
- **네이버**: [developers.naver.com](https://developers.naver.com/) → 애플리케이션 → Client ID/Secret
- **Gemini**: [Google AI Studio](https://aistudio.google.com/app/apikey) → API 키
- **국립중앙도서관**: [data.go.kr](https://www.data.go.kr/data/3078982/openapi.do) → 인증키
- **알라딘**: [알라딘 Open API](https://blog.aladin.co.kr/openapi/5353304)
- **Cloud Run OCR**: Google Cloud 서비스 계정 키(JSON) → `GOOGLE_SERVICE_ACCOUNT_KEY`에 문자열로 저장

자세한 연결 흐름은 [01-auth](01-auth.md), [02-data-supabase](02-data-supabase.md), [03-apis](03-apis.md), [04-deployment-vercel](04-deployment-vercel.md)을 참고하세요.
