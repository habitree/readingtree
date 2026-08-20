# summary와 description_summary 처리 방식 분석

**작성일:** 2026-01-22
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 1. 데이터베이스 컬럼 정의

### books 테이블

| 컬럼명 | 타입 | 설명 | 용도 |
|--------|------|------|------|
| `summary` | TEXT | 전체 책소개 | Naver API 원본 또는 출판사 제공 |
| `description_summary` | VARCHAR(50) | 25~35자 요약 | Gemini/GPT API로 요약된 짧은 설명 |

---

## 2. 컬럼별 역할

### summary (전체 책소개)
```
- 출처: Naver API의 description 필드
- 길이: 제한 없음 (TEXT)
- 생성: getBookDescriptionSummary() 함수에서 Naver API 호출 시 저장
- 용도: 원본 책소개 보관, 상세 페이지에서 사용 가능
```

### description_summary (요약)
```
- 출처: Gemini/GPT API로 summary를 요약
- 길이: 25~35자 (VARCHAR 50)
- 생성 조건:
  - summary가 30자 이상 → Gemini API로 요약
  - summary가 30자 미만 → 그대로 사용
- 용도: 책 목록 테이블에서 간결한 설명 표시
```

---

## 3. 전체 처리 흐름도

```mermaid
flowchart TB
    subgraph "1. 책 등록"
        A[책 추가/검색] --> B[books 테이블에 저장]
        B --> C["summary: NULL<br/>description_summary: NULL"]
    end

    subgraph "2. 책 목록 조회"
        D[getUserBooksWithNotes 호출] --> E[Supabase 쿼리]
        E --> F["SELECT<br/>summary,<br/>description_summary<br/>FROM books"]
        F --> G[BookWithNotes 타입으로 반환]
    end

    subgraph "3. 화면 표시 - book-table.tsx"
        H[useEffect 실행] --> I{description_summary<br/>있음?}
        I -->|Yes| J[즉시 표시]
        I -->|No| K{summary 있음?}
        K -->|Yes| L[summary 표시]
        K -->|No| M[API 호출 필요]
    end

    subgraph "4. getBookDescriptionSummary 함수"
        M --> N[DB에서 summary 확인]
        N --> O{summary 있음?}
        O -->|Yes| P{30자 이상?}
        O -->|No| Q[Naver API 호출]
        Q --> R[description 가져옴]
        R --> S[summary에 저장]
        S --> P
        P -->|Yes| T[Gemini API로 요약]
        P -->|No| U[그대로 사용]
        T --> V[description_summary에 저장]
        U --> V
        V --> W[요약 반환]
    end

    C -.->|조회 시| D
    G --> H
    W --> J
```

---

## 4. 상세 흐름 다이어그램

### 4.1 데이터 저장 흐름

```mermaid
sequenceDiagram
    participant UI as book-table.tsx
    participant Action as books.ts
    participant Naver as Naver API
    participant Gemini as Gemini/GPT API
    participant DB as Supabase

    UI->>Action: getBookDescriptionSummary(bookId, isbn, title)
    Action->>DB: SELECT summary, description_summary FROM books

    alt description_summary 있음
        DB-->>Action: description_summary 반환
        Action-->>UI: description_summary 반환
    else summary만 있음 (30자 이상)
        DB-->>Action: summary 반환
        Action->>Gemini: summarizeBookDescription(summary)
        Gemini-->>Action: 25~35자 요약
        Action->>DB: UPDATE description_summary
        Action-->>UI: 요약 반환
    else summary만 있음 (30자 미만)
        DB-->>Action: summary 반환
        Action->>DB: UPDATE description_summary = summary
        Action-->>UI: summary 그대로 반환
    else 둘 다 없음
        DB-->>Action: NULL
        Action->>Naver: searchBooks(isbn or title)
        Naver-->>Action: description 반환
        Action->>DB: UPDATE summary = description
        alt 30자 이상
            Action->>Gemini: summarizeBookDescription(description)
            Gemini-->>Action: 25~35자 요약
            Action->>DB: UPDATE description_summary
        else 30자 미만
            Action->>DB: UPDATE description_summary = description
        end
        Action-->>UI: 요약 반환
    end
```

### 4.2 화면 표시 우선순위

```mermaid
flowchart LR
    A[책 목록 로드] --> B{description_summary?}
    B -->|있음| C[description_summary 표시]
    B -->|없음| D{summary?}
    D -->|있음| E[summary 표시]
    D -->|없음| F{bookDescriptions state?}
    F -->|있음| G[state 값 표시]
    F -->|없음| H['-' 표시 또는 로딩]

    style C fill:#90EE90
    style E fill:#87CEEB
    style G fill:#DDA0DD
    style H fill:#FFB6C1
```

---

## 5. 코드 위치 및 역할

### 5.1 타입 정의

**파일:** `types/database.ts:55-56`

```typescript
books: {
  summary: string | null;           // 전체 책소개
  description_summary: string | null; // 25~35자 요약
}
```

### 5.2 데이터 조회

**파일:** `app/actions/books.ts:722-747`

```typescript
// getUserBooksWithNotes()에서 조회
.select(`
  books (
    description_summary,  // ✅ 조회
    summary,              // ✅ 조회
    ...
  )
`)
```

### 5.3 데이터 생성 및 저장

**파일:** `app/actions/books.ts:1134-1263`

```typescript
// getBookDescriptionSummary()
export async function getBookDescriptionSummary(
  bookId: string,
  isbn?: string | null,
  title?: string | null
): Promise<string>
```

### 5.4 요약 생성 (AI API)

**파일:** `lib/api/gemini.ts:41-189`

```typescript
// summarizeBookDescription()
// - Gemini API 우선 사용
// - 실패 시 GPT API로 fallback
// - 둘 다 실패 시 35자로 자르기
```

### 5.5 화면 표시

**파일:** `components/books/book-table.tsx:111-187, 439-464`

```typescript
// useEffect에서 초기화
if (book.description_summary) {
  initialDescriptions[book.id] = book.description_summary;
} else if (book.summary) {
  initialDescriptions[book.id] = book.summary;
}

// 표시 로직
{book.description_summary || book.summary || bookDescriptions[book.id]}
```

---

## 6. 처리 조건 정리

### 6.1 요약 생성 조건

```mermaid
flowchart TB
    A[원본 텍스트] --> B{길이 체크}
    B -->|35자 이하| C[그대로 반환]
    B -->|35자 초과| D[AI 요약 시작]

    D --> E[Gemini API 호출]
    E --> F{성공?}
    F -->|Yes| G[25~35자 요약]
    F -->|No| H[GPT API fallback]
    H --> I{성공?}
    I -->|Yes| G
    I -->|No| J[35자로 자르기]

    G --> K[후처리]
    K --> L["특수문자 제거<br/>길이 조정<br/>마침표 추가"]
```

### 6.2 표시 우선순위

| 순위 | 조건 | 데이터 소스 |
|------|------|-------------|
| 1 | description_summary 존재 | DB (description_summary) |
| 2 | summary 존재 | DB (summary) |
| 3 | state에 캐시됨 | bookDescriptions state |
| 4 | 로딩 중 | "요약 중..." 표시 |
| 5 | 없음 | "-" 표시 |

---

## 7. 아키텍처 다이어그램

```mermaid
graph TB
    subgraph "프론트엔드"
        A[book-table.tsx]
        B[bookDescriptions state]
    end

    subgraph "Server Actions"
        C[getUserBooksWithNotes]
        D[getBookDescriptionSummary]
    end

    subgraph "API Layer"
        E[lib/api/naver.ts]
        F[lib/api/gemini.ts]
    end

    subgraph "외부 API"
        G[Naver Book Search API]
        H[Gemini API]
        I[OpenAI API]
    end

    subgraph "Database"
        J[(Supabase)]
        K[books.summary]
        L[books.description_summary]
    end

    A --> C
    A --> D
    C --> J
    D --> J
    D --> E
    D --> F
    E --> G
    F --> H
    F --> I

    J --- K
    J --- L

    C --> B
    D --> B
    B --> A
```

---

## 8. 샘플 데이터 처리

### 8.1 샘플 사용자 데이터

**파일:** `app/actions/sample.ts:62-281`

```typescript
// getSampleBooksWithNotes()에서도 동일하게 조회
.select(`
  books (
    description_summary,
    summary,
    ...
  )
`)
```

---

## 9. 정리

### summary vs description_summary

| 항목 | summary | description_summary |
|------|---------|---------------------|
| 길이 | 제한 없음 | 25~35자 |
| 출처 | Naver API 원본 | AI 요약 |
| 생성 시점 | API 호출 시 | API 호출 후 즉시 |
| 사용 위치 | 백업/상세 | 목록 테이블 |
| 우선순위 | 2순위 | 1순위 |

### 핵심 포인트

1. **description_summary 우선**: 화면에는 description_summary를 먼저 표시
2. **Lazy Loading**: 없을 때만 API 호출하여 생성
3. **캐싱**: DB에 저장하여 재사용
4. **Fallback**: Gemini → GPT → 35자 자르기
5. **PC 전용**: 책소개 로드는 PC(lg 이상)에서만 실행

---

## 10. 관련 파일

| 파일 | 역할 |
|------|------|
| `types/database.ts` | 타입 정의 |
| `app/actions/books.ts` | 데이터 조회/저장 |
| `app/actions/sample.ts` | 샘플 데이터 처리 |
| `lib/api/gemini.ts` | AI 요약 생성 |
| `lib/api/naver.ts` | 책 정보 조회 |
| `components/books/book-table.tsx` | 화면 표시 |
| `doc/database/migration-202601151300__books__add_description_summary.sql` | DB 마이그레이션 |
