# YYYY-MM 과금 점검

> 사용법: 이 파일을 `doc/cost/reviews/YYYY-MM.md`로 복사한 뒤 채운다. 소요 약 10분.
> 점검일: YYYY-MM-DD · 담당:

---

## 1. 서비스별 청구액

| 서비스 | 이번 달 | 전월 | 증감 | 비고 |
|---|---|---|---|---|
| GCP Cloud Run | ₩ | ₩ | % | |
| GCP (Firebase 계정) | ₩ | ₩ | % | |
| Vercel | ₩ | ₩ | % | 플랜: |
| Supabase | ₩ | ₩ | % | 플랜: |
| OpenAI | ₩ | ₩ | % | |
| Gemini | ₩ | ₩ | % | |
| Anthropic | ₩ | ₩ | % | |
| Polar 수수료 | ₩ | ₩ | % | |
| **합계** | **₩** | **₩** | **%** | |

확인 경로는 `../README.md`의 표 참조. GCP는 **그룹화 기준을 SKU로** 바꿔서 볼 것.

---

## 2. 사용량 교차 검증

```sql
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

| 지표 | 이번 달 | 전월 |
|---|---|---|
| ocr_logs | | |
| chat_messages | | |
| ai_generated_reports | | |
| access_logs (PV) | | |

**판정**: 사용량 0인데 청구액 > 0 인 서비스가 있는가?
→ 있다면 낭비 확정. `incidents/`에 기록하고 즉시 조치.

- [ ] 해당 없음
- [ ] 있음 → 서비스명:

---

## 3. 이상 징후 체크

- [ ] 전월 대비 20% 이상 증가한 항목이 있는가 → 원인:
- [ ] 무료 티어 소진율이 80%를 넘은 항목이 있는가 → 항목:
- [ ] 새로 추가된 SKU가 있는가 (의도한 것인가) → 항목:
- [ ] Cloud Run 서비스의 **최소 인스턴스가 0인가** (1이면 유휴 과금)
- [ ] Supabase Storage 사용량이 1GB에 근접했는가 (현재 음악 버킷 약 660MB)

---

## 4. 조치 사항

| 항목 | 조치 | 예상 절감 | 완료 |
|---|---|---|---|
| | | ₩ | ⬜ |

---

## 5. 다음 달 주시할 것

-
