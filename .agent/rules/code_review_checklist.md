# 코드 리뷰 체크리스트

> PR/코드 리뷰 시 확인해야 할 필수 항목들

---

## 1. 성능 체크

### 리렌더링

- [ ] 불필요한 리렌더링 없는지 확인
- [ ] 리스트 아이템에 `React.memo` 적용 여부
- [ ] `useCallback`/`useMemo` 적절히 사용 여부
- [ ] 인라인 함수가 자식에게 props로 전달되지 않는지

### 번들 사이즈

- [ ] 불필요한 라이브러리 import 없는지
- [ ] 동적 import (`lazy`, `dynamic`) 적절히 사용 여부
- [ ] 트리 쉐이킹 가능한 import 방식 사용 여부

```tsx
// 금지
import _ from 'lodash';

// 권장
import debounce from 'lodash/debounce';
```

### 이미지

- [ ] `next/image` 사용 여부
- [ ] `sizes` 속성 적절히 설정 여부
- [ ] 적절한 이미지 포맷 사용 (WebP/AVIF)

---

## 2. 모바일 체크

### 터치 타겟

- [ ] 버튼/링크 최소 44x44px 이상
- [ ] 인접한 터치 타겟 간 적절한 간격

### 애니메이션

- [ ] `transition-all` 사용하지 않음
- [ ] `height: "auto"` 애니메이션 사용하지 않음
- [ ] duration 300ms 이하
- [ ] `prefers-reduced-motion` 존중

### 터치 최적화

- [ ] `touch-action: manipulation` 적용
- [ ] 스크롤 성능 최적화

---

## 3. 접근성 체크

### ARIA

- [ ] 인터랙티브 요소에 적절한 `role` 지정
- [ ] `aria-label` 또는 시각적 레이블 존재
- [ ] `aria-hidden` 적절히 사용

### 키보드

- [ ] Tab 순서 논리적
- [ ] 모든 인터랙티브 요소 키보드 접근 가능
- [ ] Escape로 모달/팝업 닫기 가능
- [ ] 포커스 트랩 적절히 구현

### 색상 및 대비

- [ ] 색상만으로 정보 전달하지 않음
- [ ] 텍스트 대비율 4.5:1 이상

---

## 4. 보안 체크

### XSS 방지

- [ ] `dangerouslySetInnerHTML` 사용 시 sanitize
- [ ] 사용자 입력 적절히 이스케이프
- [ ] URL 파라미터 검증

```tsx
// 금지
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// 권장 (sanitize 필수)
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### SQL/Command 인젝션

- [ ] 사용자 입력을 쿼리에 직접 포함하지 않음
- [ ] Supabase RLS 정책 확인
- [ ] 파라미터화된 쿼리 사용

### 인증/권한

- [ ] 민감한 데이터 접근 시 인증 확인
- [ ] RLS 정책 적절히 설정
- [ ] 클라이언트에서 민감 정보 노출 없음

---

## 5. 코드 품질 체크

### 타입 안전성

- [ ] `any` 타입 사용 최소화
- [ ] 적절한 타입 정의 사용
- [ ] `null`/`undefined` 적절히 처리

### 에러 처리

- [ ] try-catch 적절히 사용
- [ ] 사용자에게 에러 메시지 표시
- [ ] 에러 로깅 구현

### 코드 스타일

- [ ] 일관된 네이밍 컨벤션
- [ ] 불필요한 주석 없음
- [ ] 매직 넘버/문자열 상수화

---

## 6. 데이터 규칙 체크

### Server Actions

- [ ] DB 접근은 `app/actions/`에서만
- [ ] 컴포넌트에서 Supabase 직접 호출 없음
- [ ] 반환 타입 명시

### RLS

- [ ] 새 테이블 생성 시 RLS Enable
- [ ] 4가지 정책(SELECT/INSERT/UPDATE/DELETE) 작성
- [ ] `auth.uid() = user_id` 패턴 사용

---

## 7. 테스트 체크

### 기본 확인

- [ ] 주요 기능 수동 테스트 완료
- [ ] 엣지 케이스 확인 (빈 데이터, 긴 텍스트 등)
- [ ] 에러 케이스 확인

### 브라우저/기기

- [ ] 주요 브라우저에서 확인 (Chrome, Safari)
- [ ] 모바일에서 확인
- [ ] 다크 모드 확인

---

## 8. 문서화 체크

### 스키마 변경 시

- [ ] `DATA_MODEL.md` 업데이트
- [ ] `types/database.ts` 업데이트
- [ ] 마이그레이션 파일 작성

### 규칙 변경 시

- [ ] `.agent/rules/` 원본 수정
- [ ] `doc/claude/RULES.md` 동기화

---

## 리뷰어 코멘트 가이드

### 심각도 레벨

| 태그 | 의미 | 예시 |
|------|------|------|
| `[BLOCKER]` | 머지 불가 | 보안 취약점, 데이터 유실 가능성 |
| `[MUST]` | 수정 필요 | 버그, 성능 문제 |
| `[SHOULD]` | 권장 | 코드 개선, 가독성 |
| `[NIT]` | 사소함 | 스타일, 네이밍 |
| `[QUESTION]` | 질문 | 로직 이해 필요 |

### 코멘트 예시

```
[MUST] transition-all은 모바일 성능에 영향을 줍니다.
→ transition-transform duration-150으로 변경해주세요.

[SHOULD] 이 함수는 useCallback으로 감싸면
자식 컴포넌트 리렌더링을 방지할 수 있습니다.

[NIT] 변수명 `data`보다 `bookList`가 더 명확할 것 같습니다.
```

---

## 변경 로그

| 날짜 | 변경 내용 |
|------|----------|
| 2025-02-06 | 최초 생성 |
