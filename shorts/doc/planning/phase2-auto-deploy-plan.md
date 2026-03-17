# Phase 2: 자동 스케줄링 & 배포 기획서

> Phase 1 (AudioLayer 전면 적용 + 프롬프트 확장) 완료 후 진행
> 실제 배포는 데이터 퀄리티 확인 후 수동 승인 기반으로 시작

---

## 목표

모든 시리즈의 콘텐츠를 **자동 생성 → 검수 대기 → 승인 → 플랫폼 배포**까지
사람 개입을 최소화하며 주기적으로 운영할 수 있는 시스템 구축

---

## 아키텍처 개요

```
┌─────────────┐    ┌──────────────┐    ┌───────────────┐
│  Scheduler   │───▶│  Pipeline    │───▶│  Review Queue │
│  (GH Actions)│    │  (생성+렌더) │    │  (대시보드)    │
└─────────────┘    └──────────────┘    └───────┬───────┘
                                               │ 승인
                                        ┌──────▼──────┐
                                        │  Deployer   │
                                        │  (API 배포)  │
                                        └──────┬──────┘
                                               │
                          ┌────────────┬───────┼────────────┐
                          ▼            ▼       ▼            ▼
                     YouTube      TikTok    Reels      Analytics
                     Shorts                            수집 cron
```

---

## P2-1: 스케줄러 — GitHub Actions Cron

### 구현 방법

파일: `.github/workflows/shorts-scheduler.yml`

```yaml
name: Shorts Auto-Generate

on:
  schedule:
    # 매일 09:00 KST (00:00 UTC)
    - cron: '0 0 * * *'
  workflow_dispatch:
    inputs:
      series:
        description: 'Target series (or "scheduled" for DB-driven)'
        required: false
        default: 'scheduled'

jobs:
  generate:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd shorts && npm ci
      - run: cd shorts && npx tsx scripts/scheduled-generate.ts
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          SHORTS_SUPABASE_URL: ${{ secrets.SHORTS_SUPABASE_URL }}
          SHORTS_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SHORTS_SUPABASE_SERVICE_ROLE_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### 스케줄 전략 스크립트

파일: `shorts/scripts/scheduled-generate.ts`

```typescript
// schedules 테이블에서 현재 시각에 맞는 스케줄 조회
// → 해당 시리즈의 approved 콘텐츠 선택 (or AI 생성)
// → 파이프라인 실행
// → 결과를 pipeline_runs에 기록
// → status를 'rendered'로 전이 (자동 배포 OFF 시 여기서 멈춤)
```

### 비용/제한

| 항목 | 제한 | 예상 사용량 |
|------|------|-------------|
| GitHub Actions 무료 | 2,000분/월 | ~300분 (60편 × 5분) |
| 동시 실행 | 20 jobs | 1 (순차) |
| 아티팩트 보관 | 500MB | ~60편 × 15MB (매일 삭제) |

---

## P2-2: YouTube Data API v3 연동

### 필요 설정

1. Google Cloud Console → 프로젝트 생성
2. YouTube Data API v3 활성화
3. OAuth 2.0 클라이언트 ID 생성 (데스크톱 앱 타입)
4. 최초 1회 수동 인증 → refresh_token 획득 → 시크릿 저장

### API 호출

```typescript
// POST https://www.googleapis.com/upload/youtube/v3/videos
// ?part=snippet,status
// Content-Type: multipart/related

{
  snippet: {
    title: "오늘의 문장 | 데미안 - 헤르만 헤세 #shorts",
    description: "...",
    tags: ["독서", "책추천", "readtree", "shorts"],
    categoryId: "22" // People & Blogs
  },
  status: {
    privacyStatus: "public",  // or "private" for review
    selfDeclaredMadeForKids: false,
    publishAt: "2026-03-09T09:00:00+09:00" // 예약 발행
  }
}
```

### 일일 할당량

| 작업 | 비용 | 일일 한도 |
|------|------|----------|
| video.insert | 1,600 유닛 | 10,000 유닛/일 |
| 일 업로드 가능 | ~6편/일 | 충분 |

### 구현 파일

- `shorts/pipeline/deployers/youtube.ts` — YouTube 업로드 모듈
- `shorts/pipeline/deployers/types.ts` — 배포 공통 인터페이스

---

## P2-3: TikTok Content Posting API

### 필요 설정

1. TikTok Developer Portal → 앱 등록
2. Content Posting API 권한 신청 (승인 필요)
3. OAuth flow → access_token 획득

### API 흐름

```
1. POST /v2/post/publish/inbox/video/init/
   → upload_url 획득

2. PUT {upload_url}
   → 영상 파일 업로드

3. POST /v2/post/publish/
   → 발행 (제목, 설명, 공개 설정)
```

### 주의사항

- Content Posting API는 **심사 기반 승인** (1~2주 소요)
- 일 업로드 제한: 앱당 30편/일
- 영상 요구사항: 1080×1920, MP4, 최대 287.6MB

### 구현 파일

- `shorts/pipeline/deployers/tiktok.ts`

---

## P2-4: Instagram Reels Publishing API

### 필요 설정

1. Meta for Developers → 앱 등록
2. Instagram Graph API 활성화
3. Instagram 비즈니스/크리에이터 계정 연결
4. `instagram_content_publish` 권한

### API 흐름

```
1. POST /{ig-user-id}/media
   → video_url, caption, media_type=REELS
   → creation_id 획득 (서버 사이드 인코딩)

2. GET /{creation_id}?fields=status_code
   → FINISHED 될 때까지 폴링

3. POST /{ig-user-id}/media_publish
   → creation_id 전달 → 발행
```

### 주의사항

- 영상은 **공개 URL**이어야 함 (Supabase Storage public URL 사용)
- 인코딩 시간: 30초~5분 (서버 사이드)
- 일 업로드 제한: 25편/일

### 구현 파일

- `shorts/pipeline/deployers/instagram.ts`

---

## P2-5: 에러 알림 Webhook

### Slack 연동

```typescript
// shorts/pipeline/utils/notify.ts

export async function notifyPipelineResult(
  status: 'success' | 'failed',
  series: string,
  details: Record<string, unknown>
) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: status === 'success'
        ? `✅ [${series}] 영상 생성 완료`
        : `❌ [${series}] 파이프라인 실패: ${details.error}`,
      blocks: [/* 상세 정보 블록 */]
    })
  });
}
```

### 알림 트리거

| 이벤트 | 채널 | 내용 |
|--------|------|------|
| 파이프라인 완료 | #shorts-pipeline | 시리즈, 소요시간, 비용 |
| 파이프라인 실패 | #shorts-pipeline | 에러 메시지, 스택트레이스 |
| 배포 완료 | #shorts-deploy | 플랫폼, URL |
| 일일 요약 | #shorts-daily | 생성/배포 건수, 총 비용 |

---

## P2-6: orchestrator 고도화 — pipeline_runs 기록

### 현재 → 목표

```
현재: runPipeline() → 로컬 실행 → console.log
목표: runPipeline() → pipeline_runs INSERT → 단계별 UPDATE → 완료/실패 기록
```

### 수정 파일

`shorts/pipeline/orchestrator.ts` 수정:

```typescript
// 1. 시작 시: pipeline_runs INSERT (status: 'pending')
// 2. 각 단계: step_current UPDATE + step_progress JSONB 업데이트
// 3. 완료 시: status='completed', cost_usd, duration_ms, output_data 기록
// 4. 실패 시: status='failed', error_message, error_stack 기록
// 5. 콘텐츠 상태 전이: contents.status = 'rendered' (or 'scheduled')
```

---

## 배포 흐름 — 수동 승인 모드 (초기)

```
1. Scheduler → 파이프라인 자동 실행
2. 영상 생성 → Supabase Storage 업로드
3. contents.status = 'rendered' (여기서 멈춤)
4. 관리자가 영상 확인 → 승인 시 status = 'approved' → 'scheduled'
5. 다음 스케줄 시점에 deployer가 'scheduled' 콘텐츠 배포
6. publications 테이블에 기록
```

### 완전 자동 모드 (이후)

```
1~2. 동일
3. quality_score >= 0.8 이면 자동으로 status = 'scheduled'
4. deployer가 즉시 배포
5. 성과 데이터 수집 → quality_score 피드백
```

---

## 구현 파일 목록

| 파일 | 작업 | 우선순위 |
|------|------|---------|
| `.github/workflows/shorts-scheduler.yml` | 신규 — cron 스케줄러 | P0 |
| `shorts/scripts/scheduled-generate.ts` | 신규 — 스케줄 기반 생성 스크립트 | P0 |
| `shorts/pipeline/orchestrator.ts` | 수정 — pipeline_runs 기록 | P0 |
| `shorts/pipeline/utils/notify.ts` | 신규 — Slack/Discord 알림 | P1 |
| `shorts/pipeline/deployers/types.ts` | 신규 — 배포 공통 인터페이스 | P1 |
| `shorts/pipeline/deployers/youtube.ts` | 신규 — YouTube 업로드 | P1 |
| `shorts/pipeline/deployers/tiktok.ts` | 신규 — TikTok 업로드 | P2 |
| `shorts/pipeline/deployers/instagram.ts` | 신규 — Instagram Reels | P2 |
| `shorts/scripts/collect-analytics.ts` | 신규 — 성과 수집 스크립트 | P2 |

---

## 환경변수 추가 목록

```env
# Phase 2 추가 환경변수

# YouTube
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REFRESH_TOKEN=...

# TikTok
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
TIKTOK_ACCESS_TOKEN=...

# Instagram
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_USER_ID=...

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

---

## 비용 요약

| 항목 | 월 비용 |
|------|--------|
| GitHub Actions (스케줄러) | $0 (무료 2000분) |
| OpenAI gpt-4o-mini (스크립트) | ~$0.06 (60편) |
| Edge TTS (음성) | $0 |
| YouTube Data API | $0 |
| TikTok API | $0 |
| Instagram Graph API | $0 |
| Supabase (쇼츠 DB) | $0 (Free tier) |
| **합계** | **~$0.06/월** |

---

## 타임라인 (예상)

| 단계 | 작업 | 기간 |
|------|------|------|
| P2-A | orchestrator pipeline_runs 기록 + 알림 | 1일 |
| P2-B | GitHub Actions cron 스케줄러 | 1일 |
| P2-C | YouTube API 연동 + 테스트 | 2일 |
| P2-D | TikTok API 심사 신청 + 연동 | 1~2주 (심사 대기) |
| P2-E | Instagram Reels API 연동 | 2일 |
| P2-F | 성과 수집 cron + 대시보드 | 3일 |

---

## 데이터 퀄리티 체크리스트 (배포 전 확인)

Phase 2 실제 배포 전 반드시 확인:

- [ ] 모든 14개 시리즈 샘플 영상 렌더링 확인
- [ ] TTS 음질/속도/자연스러움 QA (4개 음성 옵션 비교)
- [ ] AI 스크립트 톤/길이 적절성 (시리즈별 3개씩 생성 비교)
- [ ] BGM 볼륨 밸런스 (TTS 대비 15% 기본값 적절성)
- [ ] 영상 해상도/화질 플랫폼별 요구사항 충족
- [ ] 썸네일 자동 생성 품질
- [ ] 메타데이터 (제목/설명/태그) 자동 생성 품질
- [ ] YouTube private 업로드 테스트 (삭제 후 확인)
- [ ] 비용 추적 정확도
