# 연결 확인 및 계정/설정 변경 체크리스트

연결 정보 단일 참고: [README](README.md)

---

## 연결 확인 체크리스트

현재 연결이 제대로 되어 있는지 확인할 때 아래를 순서대로 점검하세요.

| 항목 | 확인 방법 | 참고 문서 |
|------|-----------|-----------|
| 로그인 (카카오) | 앱 로그인 화면에서 카카오 로그인 클릭 → 카카오 → 앱으로 복귀 후 세션 유지 | [01-auth](01-auth.md) |
| 로그인 (구글) | 구글 로그인 클릭 → 구글 → 앱으로 복귀 후 세션 유지 | [01-auth](01-auth.md) |
| DB 조회 | 로그인 후 서재·노트·타임라인 등 데이터가 보이는지 | [02-data-supabase](02-data-supabase.md) |
| 책 검색 (Naver) | 내 서재 등에서 책 검색 시 결과 노출 | [03-apis](03-apis.md) |
| OCR | 노트에서 이미지 업로드 후 텍스트 추출 동작 | [03-apis](03-apis.md) |
| AI 채팅 (Gemini) | AI 도우미 등 채팅 요청 시 응답 생성 | [03-apis](03-apis.md) |
| 배포 | GitHub push 후 Actions 성공, Vercel 배포 완료, 배포 URL 접속 정상 | [04-deployment-vercel](04-deployment-vercel.md) |

---

## 계정/키/도메인 변경 시 체크리스트

### Supabase 프로젝트 변경

- [ ] Supabase Dashboard → 새 프로젝트의 Settings → API 에서 URL, anon key, service_role key 복사
- [ ] 로컬 `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 교체
- [ ] Vercel: Environment Variables 에서 위 세 변수 업데이트 후 재배포
- [ ] GitHub: Secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 업데이트
- [ ] 인증(Auth) 프로바이더(카카오/구글) Redirect URL을 새 Supabase 프로젝트에 맞게 재설정

참고: [02-data-supabase](02-data-supabase.md), [05-env-variables](05-env-variables.md)

---

### 카카오/구글 앱 변경

- [ ] **Supabase** → Authentication → Providers → Kakao / Google: 새 앱의 Client ID·Secret(또는 REST API 키) 반영
- [ ] **앱 환경 변수**: `NEXT_PUBLIC_KAKAO_APP_KEY` 를 새 카카오 JavaScript 키로 변경 (로컬·Vercel·GitHub Secrets)
- [ ] **카카오/구글 콘솔**: Redirect URI·사이트 도메인을 현재 앱 도메인과 Supabase 콜백 URL에 맞게 설정
- [ ] 로그인 플로우 end-to-end 한 번 테스트

참고: [01-auth](01-auth.md), [05-env-variables](05-env-variables.md)

---

### Vercel / 도메인 변경

- [ ] Vercel에서 새 프로젝트 또는 새 도메인 연결 시, **Environment Variables** 에 `NEXT_PUBLIC_APP_URL` 을 새 도메인으로 설정
- [ ] GitHub Secrets: `NEXT_PUBLIC_APP_URL` 업데이트 (Actions 빌드에 사용하는 경우)
- [ ] OAuth Redirect URL: Supabase·카카오·구글 콘솔에 새 도메인 기준 콜백 URL 등록
- [ ] 필요 시 로컬 `.vercel/project.json` 은 `vercel link` 로 다시 연결

참고: [04-deployment-vercel](04-deployment-vercel.md), [05-env-variables](05-env-variables.md).  
**로그인 후 이전 도메인으로 리다이렉트되는 경우**: [주의사항](주의사항.md)(`lib/utils/url.ts` 하드코딩·확인 방법) 참고.

---

### OCR / Cloud Run·서비스 계정 변경

- [ ] 새 서비스 계정 키(JSON) 발급 후, **한 줄 문자열**로 `GOOGLE_SERVICE_ACCOUNT_KEY` 에 설정 (로컬·Vercel)
- [ ] 또는 `CLOUD_RUN_OCR_AUTH_TOKEN` (정적 ID 토큰) 사용 시 해당 값만 교체
- [ ] Cloud Run URL 변경 시 `CLOUD_RUN_OCR_URL` 업데이트
- [ ] GitHub Actions 사용 시 `GOOGLE_SERVICE_ACCOUNT_JSON` 등 OCR 관련 Secret 반영 후 재배포
- [ ] 노트 이미지 업로드 → OCR 동작 여부 확인

참고: [03-apis](03-apis.md), [05-env-variables](05-env-variables.md)

---

### 기타 API 키만 변경 (Naver, Gemini 등)

- [ ] 해당 변수만 로컬 `.env.local`·Vercel Environment Variables·필요 시 GitHub Secrets 에서 교체
- [ ] 재배포 후 해당 기능(검색, AI 채팅 등) 동작 확인

참고: [03-apis](03-apis.md), [05-env-variables](05-env-variables.md)
