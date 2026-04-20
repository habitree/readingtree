# 국제화(i18n) 규칙

> 공동 참조: Support Agent (중심), 전 에이전트 (향후 확장 대비)

---

## 1. 지원 로케일

| 로케일 | 코드 | 우선순위 | 상태 |
|--------|------|:--------:|------|
| 한국어 | `ko` | Primary | ✅ 완전 지원 |
| 영어 | `en` | Secondary | ✅ 완전 지원 |
| 일본어 | `ja` | Tertiary | 🔶 Wave 8 확장 예정 |

**fallback 순서**: 요청 로케일 → `ko`

---

## 2. 키 네임스페이스

### 2-1. 파일 구조

```
lib/i18n/locales/
├── ko/
│   ├── common.json       # 버튼, 레이블, 공통 UI
│   ├── auth.json         # 로그인·가입
│   ├── library.json      # 책·서재
│   ├── records.json      # 노트·기록
│   ├── groups.json       # 그룹
│   ├── points.json       # 포인트·업적
│   ├── support.json      # FAQ·피드백·공지
│   ├── subscription.json # 구독·결제
│   └── errors.json       # 에러 메시지
└── en/
    └── (동일 구조)
```

### 2-2. 키 명명 규칙

```json
{
  "common.button.save": "저장",
  "library.status.reading": "읽는 중",
  "support.feedback.title": "피드백 보내기"
}
```

- 점(.) 구분, 소문자 snake_case 또는 단순 단어
- 도메인 접두사 필수 (`support.*`, `library.*` 등)
- 문맥별 구분: `common.button.save`, `support.form.save` (동일 단어라도 문맥 분리)

---

## 3. DB 컬럼 i18n

### 3-1. 번역 필요 필드

```sql
-- 공지사항, 기능 요청, FAQ 아티클 등
CREATE TABLE announcements (
  id uuid PRIMARY KEY,
  title_ko text NOT NULL,
  title_en text NOT NULL,
  body_ko text NOT NULL,
  body_en text NOT NULL,
  -- ...
);
```

**규칙**:
- `{field}_ko`, `{field}_en` 쌍으로 저장
- 두 언어 모두 NOT NULL (비어 있으면 fallback이 무의미)
- 향후 언어 추가 시 `{field}_ja` 컬럼 추가 (JSON 컬럼 대안도 가능)

### 3-2. 사용자 UGC

- 이용자가 작성한 콘텐츠(노트, 기록)는 **번역하지 않음**
- 원문 그대로 저장, 메타 필드에 `content_language` 기록 (선택)

---

## 4. 코드 패턴

### 4-1. 서버 컴포넌트

```typescript
import { getTranslations } from '@/lib/i18n/server';

export default async function Page() {
  const t = await getTranslations('support');
  return <h1>{t('feedback.title')}</h1>;
}
```

### 4-2. 클라이언트 컴포넌트

```typescript
'use client';
import { useTranslations } from '@/lib/i18n/client';

export function FeedbackButton() {
  const t = useTranslations('support');
  return <button>{t('feedback.cta')}</button>;
}
```

### 4-3. 금지 패턴

```typescript
// ❌ 하드코딩
<button>피드백 보내기</button>

// ❌ 삼항연산자 분기
<button>{locale === 'ko' ? '저장' : 'Save'}</button>

// ✅ i18n 키
<button>{t('common.button.save')}</button>
```

---

## 5. 로케일 감지 우선순위

1. URL 경로 파라미터 `/[locale]/...`
2. `NEXT_LOCALE` 쿠키
3. `Accept-Language` 헤더
4. 기본값: `ko`

---

## 6. 날짜·숫자·통화 포맷

- 날짜: `Intl.DateTimeFormat(locale)` 사용, KST 기준 유지
- 숫자: `Intl.NumberFormat(locale)`
- 통화: Polar 다통화 대응 시 `Intl.NumberFormat(locale, { style: 'currency', currency: 'KRW' })`

---

## 7. 공개 라우트 i18n

`/help`, `/faq`, `/announcements` 등 비로그인 접근 라우트:
- URL에 로케일 포함 가능 (`/ko/help`, `/en/help`)
- SEO hreflang 태그 필수
- canonical URL은 기본 로케일(`ko`)

---

## 8. 변경 로그

| 날짜 | 내용 |
|------|------|
| 2026-04-20 | 초기 생성 — ko/en 지원, DB 컬럼 i18n, 키 네임스페이스 표준 |
