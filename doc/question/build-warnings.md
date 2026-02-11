# 빌드/실행 시 경고 정리

개발 서버 또는 빌드 시 자주 보이는 경고와 대응을 정리합니다.

---

## 1. Git submodules

### 메시지 예

```
Warning: Failed to fetch one or more git submodules
```

### 원인

- 이 프로젝트 루트에는 `.gitmodules` 파일이 **없습니다**.
- 상위 저장소에서 서브모듈을 참조하거나, Cursor/Vercel 등 호스트가 서브모듈을 자동으로 fetch 하려다 실패할 때 나올 수 있습니다.

### 대응

- **이 프로젝트만 클론**한 경우: 서브모듈을 쓰지 않으면 무시해도 됩니다.
- **서브모듈을 쓰는 경우**: 해당 저장소 URL·권한이 맞는지 확인하고, 필요 시 `git submodule update --init` 수동 실행.
- Cursor/Vercel에서만 나오면: 해당 환경의 Git/서브모듈 설정 확인.

---

## 2. middleware → proxy (Next.js 16+)

### 메시지 예

```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
```

### 원인

- Next.js 16부터 루트의 `middleware.ts` 규칙이 **deprecated** 되고, 같은 동작을 하는 **`proxy.ts`** 로 이름이 바뀌었습니다.
- 동작은 동일하고, 파일·함수 이름만 변경된 것입니다.

### 이 프로젝트에서의 대응

- **적용 완료**: 루트의 `middleware.ts` 를 제거하고 `proxy.ts` 로 대체했습니다.
  - `export async function middleware(...)` → `export async function proxy(...)`
  - `config.matcher` 등 설정은 그대로 유지.
- Supabase 세션 갱신 로직은 `lib/supabase/middleware.ts` 의 `updateSession()` 을 그대로 사용하며, `proxy.ts` 가 이를 호출합니다.

### 참고

- 공식 마이그레이션: [Renaming Middleware to Proxy](https://nextjs.org/docs/messages/middleware-to-proxy)
- Codemod: `npx @next/codemod@canary middleware-to-proxy`

---

## 3. Edge runtime과 정적 생성 비활성화

### 메시지 예

```
⚠ Using edge runtime on a page currently disables static generation for that page
```

### 원인

- `app/opengraph-image.tsx`, `app/twitter-image.tsx` 에서 `export const runtime = "edge"` 를 사용하고 있습니다.
- 이 파일들은 **동적 OG/Twitter 카드 이미지**를 생성하는 특수 라우트로, Next.js ImageResponse API 사용 시 Edge에서 실행되는 것이 일반적입니다.
- Edge를 쓰는 라우트는 **정적 생성(SSG)** 이 되지 않고, 요청 시마다 실행됩니다.

### 대응

- **의도된 동작**입니다. OG/Twitter 이미지를 path/쿼리 등에 따라 다르게 만들려면 동적 실행이 필요하므로, 이 경고는 무시해도 됩니다.
- 정적 OG 이미지만 필요하다면 `runtime = "edge"` 를 제거하고 정적 파일로 두는 선택도 있으나, 현재처럼 동적 생성이 목적이면 유지하는 것이 맞습니다.

---

## 요약

| 경고 | 대응 |
|------|------|
| Failed to fetch git submodules | 이 프로젝트에 서브모듈이 없으면 무시. 있으면 URL/권한 및 `git submodule update --init` 확인. |
| middleware deprecated, use proxy | `middleware.ts` → `proxy.ts` 로 마이그레이션 완료. |
| Edge runtime disables static generation | opengraph-image / twitter-image 용도로는 정상. 무시 가능. |
