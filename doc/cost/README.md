# 💰 ReadTree 과금 자료 (doc/cost)

> 외부 서비스에 **실제로 청구되는 돈**을 추적하는 폴더.
> 최초 생성: 2026-07-24 (Cloud Run 유휴 과금 발견 계기)

---

## 이 폴더의 범위

| 다루는 것 ✅ | 다루지 않는 것 ❌ |
|---|---|
| GCP·Vercel·Supabase 등 **실제 청구서** | 포인트 적립·차감 단가 |
| 인프라 설정으로 인한 낭비·최적화 | 구독 요금제 설계·가격 정책 |
| 무료 티어 잔여량·초과 위험 | 수익 모델·손익 시뮬레이션 |
| 과금 사고(인시던트) 기록 | AI 기능별 원가 기획 |

**혼동 주의** — 아래 문서들은 *사업 모델* 쪽이며 이 폴더와 별개다.
- `doc/business/COST_AND_POINT_MASTER.md` — 포인트 경제 SSoT
- `doc/business/financial-dashboard.html` — 수익 모델 대시보드
- `doc/business/unlimited-plan-cost-analysis.html` — 구독 원가 분석

한 줄 요약: **여기는 "나가는 돈", business는 "들어올 돈"**.

---

## 파일 구성

```
doc/cost/
├── README.md                      # 이 문서 — 운영 규칙
├── COST_OVERVIEW.md               # 현재 과금 현황 (SSoT, 월 1회 갱신)
├── cost-dashboard.html            # 시각 대시보드 (브라우저로 열기)
├── incidents/                     # 과금 사고 기록
│   └── 2026-07-24-cloudrun-idle-min-instance.md
└── templates/
    └── monthly-review-template.md # 월간 점검 템플릿
```

---

## 매월 하는 일 (10분)

1. `templates/monthly-review-template.md`를 복사해 `reviews/YYYY-MM.md`로 저장
2. 템플릿의 확인 경로를 따라 각 서비스 청구액 기입
3. **전월 대비 20% 이상 증가**하거나 **사용량 0인데 과금**되는 항목이 있으면
   → `incidents/`에 `YYYY-MM-DD-<슬러그>.md`로 원인·조치 기록
4. `COST_OVERVIEW.md`의 금액·갱신일 반영
5. 필요 시 `cost-dashboard.html`의 수치 갱신

---

## 확인 경로 (북마크용)

| 서비스 | URL | 확인할 것 |
|---|---|---|
| GCP (readtree) | `console.cloud.google.com/billing/01349E-055D19-62E105/reports` | 그룹화=SKU, 기간=이번 달 |
| GCP (Firebase) | `console.cloud.google.com/billing/01BA58-1E3E39-F7634B/reports` | 잔여 리소스 정리 여부 |
| Cloud Run 서비스 | `console.cloud.google.com/run?project=gen-lang-client-0287655743` | **확장(최소 인스턴스)** 값 |
| Vercel | `vercel.com/cdhrichs-projects-3cb46ad4/~/settings/billing` | 플랜(Hobby/Pro), 사용량 |
| Supabase | `supabase.com/dashboard/organizations` | 3개 조직 플랜 |
| OpenAI | `platform.openai.com/settings/organization/billing/overview` | 크레딧 잔액 |

> GCP 리포트는 **그룹화 기준을 SKU로 바꿔야** 진짜 원인이 보인다. 서비스 단위로는 "Cloud Run ₩3,082"까지만 나오고, 그게 유휴 비용인지 처리 비용인지 구분되지 않는다.

---

## 사용량 교차 검증 쿼리

청구서 숫자만 보면 "많이 쓰나 보다"로 끝난다. **DB 사용량과 대조**해야 낭비가 드러난다.

```sql
-- 기능별 실제 사용량 월별 추이 (Supabase SQL Editor 또는 MCP)
select 'ocr_logs' as src, to_char(created_at,'YYYY-MM') as ym, count(*) as cnt
from ocr_logs group by 1,2
union all
select 'chat_messages', to_char(created_at,'YYYY-MM'), count(*) from chat_messages group by 1,2
union all
select 'ai_reports', to_char(created_at,'YYYY-MM'), count(*) from ai_generated_reports group by 1,2
union all
select 'access_logs', to_char(created_at,'YYYY-MM'), count(*) from access_logs group by 1,2
order by 1,2 desc;
```

판정 기준: **사용량 0인데 청구액 > 0 이면 100% 낭비**다. 2026-07 Cloud Run 건이 정확히 이 패턴이었다.

---

## 새 유료 서비스 도입 시 체크리스트

- [ ] 무료 티어 한도와 초과 단가를 `COST_OVERVIEW.md`에 기록했는가
- [ ] **상시 기동(min instance / always-on / dedicated) 설정이 없는가** — 유휴 과금의 주범
- [ ] 사용량을 DB나 로그로 추적할 수 있는가 (교차 검증 대상)
- [ ] 예산 알림을 걸었는가
- [ ] 쓰지 않게 됐을 때 정리 담당·시점이 정해졌는가

---

## 미해결 과제

| 항목 | 내용 | 상태 |
|---|---|---|
| Vercel 플랜 확인 | Hobby면 ₩0, Pro면 월 $20 — 확정 시 최대 고정비 | ⬜ 미확인 |
| GCP 예산 알림 | 미설정. 6개월간 유휴 과금이 감지되지 않은 원인 | ⬜ 미설정 |
| Firebase 잔여 리소스 | Cloud Storage 1.16GB + Firestore PITR, 연 ₩73 | ⬜ 정리 대기 |
