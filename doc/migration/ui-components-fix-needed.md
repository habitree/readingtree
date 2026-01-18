# UI 컴포넌트 수정 필요 사항

**작성일:** 2025-01-18  
**목적:** 스키마 변경에 따른 UI 컴포넌트 수정 가이드

---

## 문제 상황

새 Supabase 프로젝트의 `user_books` 테이블에서 `completed_dates`와 `reading_reason` 컬럼이 제거되었지만, UI 컴포넌트에서 여전히 이 필드들을 사용하고 있습니다.

---

## 수정이 필요한 컴포넌트

### 1. `components/books/book-table.tsx`

#### 위치 1: `reading_reason` 표시 (약 353줄)

**현재 코드:**
```typescript
{item.reading_reason && (
  <div className="text-xs text-muted-foreground">
    "{item.reading_reason}"
  </div>
)}
```

**수정 방안:**
- 이 부분을 제거하거나 주석 처리
- 또는 항상 `null`이므로 조건문이 `false`가 되어 자동으로 표시되지 않음 (현재 상태 유지 가능)

#### 위치 2: `completed_dates` 처리 (약 546줄)

**현재 코드:**
```typescript
if (item.completed_dates) {
  if (Array.isArray(item.completed_dates)) {
    dates = item.completed_dates;
  } else if (typeof item.completed_dates === 'string') {
    try {
      dates = JSON.parse(item.completed_dates);
    } catch (e) {
      dates = [];
    }
  }
}
```

**수정 방안:**
- `completed_dates`는 항상 `null`이므로 이 로직은 실행되지 않음
- 하지만 명시적으로 제거하거나 주석 처리 권장
- `completed_at` (단일 날짜)만 사용하도록 수정

### 2. `components/search/search-result-card.tsx`

#### 위치: `reading_reason` 사용 (약 44줄)

**현재 코드:**
```typescript
const readingReason = userBook?.reading_reason;
```

**수정 방안:**
- `readingReason`을 `null`로 설정하거나 제거
- UI에서 `readingReason`을 사용하는 부분 확인 및 수정

---

## 수정 우선순위

### 높음 (즉시 수정 필요)

1. **`book-table.tsx`의 `completed_dates` 처리 로직**
   - 현재는 `null`이므로 실행되지 않지만, 명시적으로 제거 권장
   - 향후 혼란 방지

### 중간 (선택적 수정)

2. **`book-table.tsx`의 `reading_reason` 표시**
   - 현재는 `null`이므로 조건문이 `false`가 되어 표시되지 않음
   - 코드 정리를 위해 제거 권장

3. **`search-result-card.tsx`의 `reading_reason` 사용**
   - UI에서 실제로 사용되는지 확인 필요
   - 사용되지 않으면 제거

---

## 수정 예시

### `components/books/book-table.tsx`

```typescript
// 수정 전
{item.reading_reason && (
  <div className="text-xs text-muted-foreground">
    "{item.reading_reason}"
  </div>
)}

// 수정 후 (제거 또는 주석 처리)
// 읽는 이유 기능은 새 스키마에서 제거됨
// {item.reading_reason && (
//   <div className="text-xs text-muted-foreground">
//     "{item.reading_reason}"
//   </div>
// )}
```

```typescript
// 수정 전
if (item.completed_dates) {
  if (Array.isArray(item.completed_dates)) {
    dates = item.completed_dates;
  } else if (typeof item.completed_dates === 'string') {
    try {
      dates = JSON.parse(item.completed_dates);
    } catch (e) {
      dates = [];
    }
  }
}

// 수정 후
// completed_dates는 새 스키마에서 제거됨
// completed_at (단일 날짜)만 사용
// if (item.completed_dates) {
//   ...
// }
```

### `components/search/search-result-card.tsx`

```typescript
// 수정 전
const readingReason = userBook?.reading_reason;

// 수정 후
// 읽는 이유 기능은 새 스키마에서 제거됨
const readingReason = null; // 또는 이 줄 제거
```

---

## 참고 사항

### 현재 동작

- `reading_reason`과 `completed_dates`는 서버 액션에서 `null`로 반환됨
- UI 컴포넌트에서 조건문(`if (item.reading_reason)`)이 `false`가 되어 표시되지 않음
- 따라서 **현재는 오류가 발생하지 않지만**, 코드 정리를 위해 수정 권장

### 향후 영향

- 코드를 읽는 개발자가 혼란스러울 수 있음
- 향후 이 기능을 다시 추가할 때 문제가 될 수 있음
- 명시적으로 제거하거나 주석 처리하는 것이 좋음

---

**다음 단계:** UI 컴포넌트 수정 (선택 사항, 현재는 오류 없음)
