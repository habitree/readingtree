# OCR 인식 에러 및 이미지 Preload 경고 정리

## 1. Preload 경고 (이미지 미사용)

### 나타나는 메시지 예

```
The resource https://readingtree.vercel.app/_next/image?url=https%3A%2F%2Fshopping-phinf.pstatic.net%2F...&w=48&q=75 
was preloaded using link preload but not used within a few seconds from the window's load event.
```

### 원인

- **해당 URL은 OCR용 이미지가 아니라 책 표지(cover) 이미지입니다.**  
  `shopping-phinf.pstatic.net` 은 네이버 도서 검색 API에서 오는 표지 URL입니다.
- Next.js `Image` 컴포넌트가 중요 이미지에 대해 `<link rel="preload">` 를 넣는데,  
  그 이미지가 실제로 몇 초 안에 화면에 쓰이지 않으면 브라우저가 이 경고를 띄웁니다.
- 흔한 경우:
  - 리스트/그리드에서 아래쪽 아이템의 표지가 preload 되었는데, 사용자가 스크롤하지 않아 뷰포트에 안 들어옴
  - 탭 전환/페이지 이탈 등으로 컴포넌트가 언마운트되어 해당 이미지가 렌더되지 않음

### OCR와의 관계

- **OCR 인식 에러와는 별개**입니다.  
  노트의 필사 이미지는 Supabase Storage 의 **공개 URL** 이며, `_next/image` 프록시 URL 이 아닙니다.
- OCR 실패 원인 조사 시 이 preload 경고는 무시해도 됩니다.

### 대응 (선택)

- 리스트/그리드에서 **많은 수의 표지**를 쓸 때는 `priority` 를 첫 몇 개만 두고 나머지는 lazy 로 두기.  
  (예: [components/dashboard/sections/home-hero-section.tsx](../../components/dashboard/sections/home-hero-section.tsx) 에서 `priority={index === 0}` 사용)
- 표지가 “몇 초 안에 반드시 보일” 위치가 아니면 `priority` 를 주지 않아 preload 개수를 줄이면 경고가 줄어들 수 있습니다.

---

## 2. OCR 인식 에러 원인 정리

OCR 은 **노트의 `image_url`**(Supabase Storage 공개 URL)을 서버에서 그대로 `fetch` 한 뒤 Cloud Run OCR 로 보냅니다.  
아래는 코드 기준으로 실패가 날 수 있는 지점입니다.

### 2.1 이미지 다운로드 단계 (Cloud Run 호출 전)

| 원인 | 설명 | 로그/메시지 예 |
|------|------|----------------|
| **404** | 이미지가 Storage 에 없거나 URL 이 잘못됨. (삭제/경로 오타 등) | `이미지 파일을 찾을 수 없습니다 (404). 이미지 URL이 만료되었거나 삭제되었을 수 있습니다.` |
| **403/401** | Storage 버킷이 비공개이거나, URL 이 공개용이 아닌데 서버에서 접근 | `이미지 접근이 거부되었습니다 (403)...` |
| **타임아웃** | 30초 내에 응답 없음 (Supabase/네트워크 지연) | `이미지 다운로드 타임아웃: 이미지 서버에 연결할 수 없습니다.` |
| **이미지 크기** | 10MB 초과 | `이미지 크기가 너무 큽니다. (최대 10MB)` |

- 구현 위치: [lib/api/cloud-run-ocr.ts](../../lib/api/cloud-run-ocr.ts) — `extractTextFromImage()` 내부의 `fetch(imageUrl)` 및 크기 체크.

### 2.2 Cloud Run OCR 단계

| 원인 | 설명 | 확인 방법 |
|------|------|-----------|
| **인증 실패** | `GOOGLE_SERVICE_ACCOUNT_KEY` 없음/잘못됨 또는 `CLOUD_RUN_OCR_AUTH_TOKEN` 만료 | 관리자 > API 연동 정보 > OCR 실시간 연결 테스트 |
| **API 4xx/5xx** | Cloud Run 서비스 오류 또는 할당량/권한 문제 | Vercel Functions 로그에서 `[Cloud Run OCR] API 호출 실패` |
| **빈 텍스트** | 이미지에 글자가 없거나 인식 불가 | `Cloud Run OCR에서 텍스트를 추출하지 못했습니다.` |

- 구현 위치: [lib/api/cloud-run-ocr.ts](../../lib/api/cloud-run-ocr.ts) (토큰 생성, 요청/응답 처리), [lib/api/ocr.ts](../../lib/api/ocr.ts) (래퍼).

### 2.3 OCR 처리 API 전체 (process 라우트)

- 인증 실패(401), 권한 없음(403), `noteId`/`imageUrl` 누락(400) 시 OCR 로직까지 가지 않고 바로 실패합니다.
- 처리 중 예외는 모두 [app/api/ocr/process/route.ts](../../app/api/ocr/process/route.ts) 의 `catch` 에서 로그 남기고,  
  `transcription` 상태를 `failed` 로 바꾸며, `recordOcrFailure` 로 실패 통계를 기록합니다.

---

## 3. OCR 에러 확인 방법

1. **Vercel 로그**
   - Vercel Dashboard → 해당 프로젝트 → **Deployments** → 최신 배포 → **Functions**  
   - `POST /api/ocr/process` 로그에서:
     - `[OCR Process] ========== OCR 처리 오류 발생 ==========`
     - `[OCR Process] 에러 메시지: ...`
     - `[OCR Process] Image URL: ...`
   - Cloud Run 까지 갔다면 `[Cloud Run OCR]` 로그로 이미지 다운로드/API 실패 구분.

2. **관리자 페이지**
   - `/admin/api-info` → OCR 섹션의 **실시간 연결 테스트**  
   - 토큰 생성 성공 여부, API 연결 성공/실패/지연 확인.

3. **DB**
   - `transcriptions` 테이블에서 해당 `note_id` 의 `status = 'failed'` 인지 확인.

4. **이미지 URL**
   - 실패한 노트의 `image_url` 이 **Supabase Storage 공개 URL** 인지 확인.  
     `_next/image?url=...` 또는 다른 도메인(예: 네이버 표지)이 들어가 있으면, 그건 OCR 용도가 아니거나 잘못 저장된 경우입니다.  
     정상 플로우에서는 업로드 시 [app/api/upload/route.ts](../../app/api/upload/route.ts) 가 반환한 **공개 URL** 만 저장됩니다.

---

## 4. 요약

- **Preload 경고**: 네이버 표지 등 `_next/image` 로 로드되는 이미지가 preload 만 되고 몇 초 안에 쓰이지 않아서 나는 경고. **OCR과 무관**.
- **OCR 인식 에러**:  
  - 이미지 단계: 404/403/타임아웃/용량 초과  
  - Cloud Run 단계: 인증 실패, API 오류, 빈 추출  
  → Vercel `/api/ocr/process` 로그와 관리자 API 연동 정보에서 단계별로 확인하면 원인 좁히기 좋습니다.

관련 문서: [ocr-image-url-error-handling.md](./ocr-image-url-error-handling.md), [ocr-setup-checklist.md](./ocr-setup-checklist.md).
