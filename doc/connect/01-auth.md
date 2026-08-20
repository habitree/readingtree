# 로그인·인증 연결

연결 정보 단일 참고: [README](README.md) | 환경 변수: [05-env-variables](05-env-variables.md)

---

## 인증 방식

- **기반**: Supabase Auth
- **제공자**: **카카오(Kakao)**, **구글(Google)**. (이메일/비밀번호도 지원)

실제 로그인 발급·검증은 Supabase가 수행하며, 앱은 OAuth 리다이렉트와 콜백만 처리합니다.

---

## 코드 흐름

1. **로그인 시작**  
   - [app/actions/auth.ts](../../app/actions/auth.ts): `signInWithKakao()` 또는 `signInWithGoogle()`  
   - `getAppUrl()`로 base URL 계산 → `redirectTo = baseUrl + "/callback"`  
   - `supabase.auth.signInWithOAuth({ provider: "kakao" | "google", options: { redirectTo } })`  
   - 사용자를 Supabase(및 카카오/구글) 로그인 페이지로 리다이렉트

2. **콜백**  
   - [app/callback/route.ts](../../app/callback/route.ts): 쿼리에서 `code` 수신  
   - `supabase.auth.exchangeCodeForSession(code)` 로 세션 생성  
   - 세션은 쿠키에 저장되며, 이후 미들웨어에서 갱신

3. **앱 URL**  
   - [lib/utils/url.ts](../../lib/utils/url.ts): `getAppUrl()`  
   - 로컬 vs Vercel, Production vs Preview 구분하여 리다이렉트 URI의 base 결정

---

## 앱에서 쓰는 값

| 구분 | 변수 / 설정 | 용도 |
|------|-------------|------|
| 카카오 | `NEXT_PUBLIC_KAKAO_APP_KEY` | 카카오 JavaScript 키. 클라이언트·관리자 화면 표시용. **OAuth 발급/검증은 Supabase 대시보드에 설정한 카카오 앱 정보로 수행.** |
| 구글 | (앱 코드에는 없음) | 구글 Client ID/Secret은 **Supabase Dashboard** → Authentication → Providers → Google 에만 입력 |

---

## 설정 위치

### Supabase Dashboard

- **Authentication** → **Providers** → **Kakao**  
  - Redirect URL: `https://<NEXT_PUBLIC_APP_URL>/callback` (프로덕션/스테이징 도메인 반영)  
  - 카카오 REST API 키 등 (카카오 개발자 센터에서 앱 설정 후 입력)
- **Authentication** → **Providers** → **Google**  
  - Redirect URL: 동일하게 `https://<APP_URL>/callback`  
  - Google Client ID, Client Secret

### 카카오 개발자 센터

- [developers.kakao.com](https://developers.kakao.com/console/app) → 앱 선택 → **플랫폼** → Web  
  - 사이트 도메인: `https://<your-domain>` (리다이렉트 허용)
- **카카오 로그인** 활성화, Redirect URI에 `https://<project>.supabase.co/auth/v1/callback` 및 필요 시 앱 URL/callback 등록

### 앱 환경 변수

- `NEXT_PUBLIC_KAKAO_APP_KEY`: 카카오 JavaScript 키 (앱 키 메뉴에서 복사)
- `NEXT_PUBLIC_APP_URL`: 앱 기준 URL (예: 로컬 `http://localhost:3000`, 프로덕션 `https://readingtree.vercel.app`)

---

## 계정/앱 변경 시

1. **카카오 앱 변경**  
   - Supabase → Providers → Kakao: 새 앱의 REST API 키 등 반영  
   - 앱: `NEXT_PUBLIC_KAKAO_APP_KEY` 를 새 JavaScript 키로 변경  
   - 카카오 콘솔: Redirect URI·도메인을 새 도메인에 맞게 수정

2. **구글 프로젝트/앱 변경**  
   - Supabase → Providers → Google: 새 Client ID/Secret 반영  
   - 구글 Cloud Console: OAuth 동의 화면·승인된 리디렉션 URI에 Supabase 콜백 URL 유지

3. **도메인 변경**  
   - `NEXT_PUBLIC_APP_URL` 을 새 도메인으로 변경 (로컬·Vercel·GitHub Secrets)  
   - Supabase Redirect URL, 카카오/구글 Redirect URI를 새 도메인에 맞게 수정

자세한 카카오 앱 키 설정: [doc/archive/2026/question/authentication/kakao-app-key-guide.md](../archive/2026/question/authentication/kakao-app-key-guide.md)
