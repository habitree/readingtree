# 외부 API 연결

연결 정보 단일 참고: [README](README.md) | 환경 변수: [05-env-variables](05-env-variables.md)

---

## 요약 표

| API | 환경 변수 | 용도 | 필수 | 설정/발급 |
|-----|-----------|------|------|-----------|
| Naver 검색 | `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` | 도서 검색 | 필수 | [네이버 개발자 센터](https://developers.naver.com/) |
| Kakao SDK | `NEXT_PUBLIC_KAKAO_APP_KEY` | 로그인 UI·관리자 표시 (OAuth는 Supabase) | 필수 | [카카오 개발자 콘솔](https://developers.kakao.com/console/app) → JavaScript 키 |
| 국립중앙도서관 | `NL_SEOJI_CERT_KEY` | ISBN 서지정보·페이지 수 | 선택(권장) | [data.go.kr](https://www.data.go.kr/data/3078982/openapi.do) |
| 알라딘 | `ALADIN_TTB_KEY` | 도서 정보·페이지 수 | 선택(권장) | [알라딘 Open API](https://blog.aladin.co.kr/openapi/5353304) |
| Google Books | `GOOGLE_BOOKS_API_KEY` | 도서·페이지 수 폴백 | 선택 | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| Gemini | `GEMINI_API_KEY` | AI 채팅·요약·OCR 보정 | 필수(AI 사용 시) | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| OCR (Cloud Run) | `GOOGLE_SERVICE_ACCOUNT_KEY` 또는 `CLOUD_RUN_OCR_AUTH_TOKEN`, `CLOUD_RUN_OCR_URL` | 이미지 텍스트 추출 | OCR 사용 시 | Google Cloud 서비스 계정 / Cloud Run URL |

---

## Naver (도서 검색)

- **파일**: [lib/api/naver.ts](../../lib/api/naver.ts)
- **변수**: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- **설정**: 네이버 개발자 센터 → 애플리케이션 등록 → API 설정(검색 API) → Client ID/Secret

---

## Kakao SDK

- **용도**: 클라이언트에서 카카오 로그인 버튼·관리자 화면 API 상태 표시. 실제 OAuth 발급/검증은 **Supabase**에서 수행.
- **변수**: `NEXT_PUBLIC_KAKAO_APP_KEY` (JavaScript 키)
- **설정**: [카카오 앱 키 가이드](../question/authentication/kakao-app-key-guide.md) 참고

---

## 도서·페이지 수 API

- **파일**: [lib/api/book-page-count.ts](../../lib/api/book-page-count.ts)
- **국립중앙도서관**: `NL_SEOJI_CERT_KEY` — 한국 도서 커버리지 우선 사용
- **알라딘**: `ALADIN_TTB_KEY` — 한국 온라인 서점
- **Google Books**: `GOOGLE_BOOKS_API_KEY` — 선택, 키 없이도 제한적 사용 가능

---

## Gemini (AI)

- **사용처**: [app/api/ai/chat/route.ts](../../app/api/ai/chat/route.ts), [lib/ai/providers/gemini.ts](../../lib/ai/providers/gemini.ts), [lib/ai/ocr-correction.ts](../../lib/ai/ocr-correction.ts), [app/actions/ai/persona.ts](../../app/actions/ai/persona.ts), [app/actions/ai/settings.ts](../../app/actions/ai/settings.ts)
- **변수**: `GEMINI_API_KEY`
- **설정**: Google AI Studio → Get API key

---

## OCR (Google Cloud Run)

- **실제 호출**: [lib/api/ocr.ts](../../lib/api/ocr.ts) → [lib/api/cloud-run-ocr.ts](../../lib/api/cloud-run-ocr.ts).  
  **Vision API를 앱에서 직접 호출하지 않음.** Cloud Run에 배포된 OCR 서비스를 호출합니다.
- **변수**:
  - `CLOUD_RUN_OCR_URL`: Cloud Run 서비스 URL (선택, 기본값 있음)
  - `GOOGLE_SERVICE_ACCOUNT_KEY`: 서비스 계정 JSON **문자열** (권장). Cloud Run 인증용 ID 토큰 생성
  - `CLOUD_RUN_OCR_AUTH_TOKEN`: 정적 ID 토큰 (선택, 하위 호환)
- **참고**: GitHub Actions/Vercel 문서에 `GOOGLE_VISION_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON`가 있을 수 있음. **현재 OCR 경로는 Cloud Run + 서비스 계정**이므로, OCR용으로는 `GOOGLE_SERVICE_ACCOUNT_KEY`(또는 워크플로에서 `GOOGLE_SERVICE_ACCOUNT_JSON`) 사용을 문서에 명시.

---

## 설정 페이지 URL 정리

- Naver: https://developers.naver.com/
- Kakao: https://developers.kakao.com/console/app
- 국립중앙도서관: https://www.data.go.kr/data/3078982/openapi.do
- 알라딘: https://blog.aladin.co.kr/openapi/5353304
- Google Books / 서비스 계정: https://console.cloud.google.com/apis/credentials
- Gemini: https://aistudio.google.com/app/apikey
