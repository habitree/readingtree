# Search 모듈 고도화 계획

> **모듈**: search
> **현재 규모**: ~300 LOC
> **성숙도**: ⭐⭐⭐ (3/5)
> **우선순위**: 🔴 높음

---

## 1. 현황 분석

### 1.1 핵심 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| Full-text 검색 | 책/기록 전문 검색 | ✅ 완료 |
| 필터링 | 타입/상태별 필터 | ✅ 완료 |
| 검색 결과 표시 | 하이라이트 | ✅ 완료 |

### 1.2 기술 구조

```
app/actions/search.ts         # Server Actions
├── searchBooks()
├── searchNotes()
└── searchAll()

app/(main)/search/
├── page.tsx
└── components/
    ├── SearchInput.tsx
    ├── SearchResults.tsx
    └── SearchFilters.tsx
```

### 1.3 데이터 모델

```sql
-- PostgreSQL Full-text Search 인덱스
CREATE INDEX idx_books_search ON books
USING gin(to_tsvector('korean', title || ' ' || author));

CREATE INDEX idx_notes_search ON notes
USING gin(to_tsvector('korean', content));
```

---

## 2. 관점별 분석

### 2.1 핵심 기능 강화

| 항목 | 현재 | 목표 | 우선순위 | 복잡도 |
|------|------|------|---------|--------|
| **자동 완성** | 없음 | 실시간 제안 | 🔴 높음 | ⭐⭐ |
| **검색 히스토리** | 없음 | 최근 검색어 | 🟡 중간 | ⭐ |
| **오타 교정** | 없음 | 퍼지 매칭 | 🟡 중간 | ⭐⭐ |
| **검색 범위 확장** | 제한적 | 전체 데이터 | 🟢 낮음 | ⭐ |

#### 상세: 자동 완성

```typescript
// 디바운스된 검색 제안
function useSearchSuggestions(query: string) {
  const debouncedQuery = useDebouncedValue(query, 300);

  return useQuery(
    ['search-suggestions', debouncedQuery],
    () => getSuggestions(debouncedQuery),
    {
      enabled: debouncedQuery.length >= 2,
      staleTime: 1000 * 60 * 5, // 5분 캐싱
    }
  );
}

// 제안 API
async function getSuggestions(query: string): Promise<Suggestion[]> {
  const [books, notes, tags] = await Promise.all([
    supabase
      .from('books')
      .select('title, author')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      .limit(5),
    supabase
      .from('notes')
      .select('content')
      .ilike('content', `%${query}%`)
      .limit(3),
    supabase
      .from('note_tags')
      .select('name')
      .ilike('name', `%${query}%`)
      .limit(3),
  ]);

  return formatSuggestions({ books, notes, tags });
}

// UI
function SearchAutocomplete({ onSearch }: Props) {
  const [query, setQuery] = useState('');
  const { data: suggestions } = useSearchSuggestions(query);

  return (
    <Command>
      <CommandInput
        placeholder="책, 기록, 태그 검색..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {suggestions?.books.length > 0 && (
          <CommandGroup heading="책">
            {suggestions.books.map((book) => (
              <CommandItem key={book.id} onSelect={() => onSearch(book.title)}>
                <BookOpen className="mr-2 h-4 w-4" />
                {book.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {suggestions?.notes.length > 0 && (
          <CommandGroup heading="기록">
            {suggestions.notes.map((note) => (
              <CommandItem key={note.id}>
                <FileText className="mr-2 h-4 w-4" />
                {note.content.slice(0, 50)}...
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
```

### 2.2 확장성/창의성

| 아이디어 | 설명 | 가치 | 실현성 | 분류 |
|----------|------|------|--------|------|
| **시맨틱 검색** | 의미 기반 검색 | 높음 | 중간 | 🔮 장기 |
| **자연어 검색** | "지난 달 읽은 책" | 높음 | 중간 | 💡 아이디어 |
| **음성 검색** | 말로 검색 | 중간 | 높음 | 💡 아이디어 |
| **이미지 검색** | 책 표지로 검색 | 낮음 | 낮음 | 🔮 장기 |
| **유사 콘텐츠** | 관련 기록 추천 | 높음 | 중간 | 🚀 즉시 |

#### 상세: 시맨틱 검색

```typescript
// 벡터 DB 기반 시맨틱 검색
// Supabase pgvector 확장 활용

// 1. 임베딩 생성
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

// 2. 유사 콘텐츠 검색
async function semanticSearch(
  query: string,
  options: { limit?: number; threshold?: number }
): Promise<SearchResult[]> {
  const embedding = await generateEmbedding(query);

  const { data } = await supabase.rpc('match_notes', {
    query_embedding: embedding,
    match_threshold: options.threshold ?? 0.7,
    match_count: options.limit ?? 10,
  });

  return data;
}

// SQL 함수
/*
CREATE OR REPLACE FUNCTION match_notes(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    1 - (embedding <=> query_embedding) as similarity
  FROM notes
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
*/
```

### 2.3 기술 품질

| 항목 | 현재 상태 | 목표 | 액션 |
|------|----------|------|------|
| **검색 성능** | 기본 | 최적화 | 인덱스 튜닝 |
| **결과 캐싱** | 없음 | 쿼리 캐싱 | React Query |
| **테스트** | 0% | 70% | 테스트 작성 |
| **접근성** | 기본 | ARIA 완전 지원 | 개선 |

#### 검색 성능 최적화

```sql
-- 복합 인덱스 최적화
CREATE INDEX CONCURRENTLY idx_books_search_v2 ON books
USING gin((
  setweight(to_tsvector('korean', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('korean', coalesce(author, '')), 'B') ||
  setweight(to_tsvector('korean', coalesce(publisher, '')), 'C')
));

-- 검색 함수 최적화
CREATE OR REPLACE FUNCTION search_books(search_query TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  author TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.title,
    b.author,
    ts_rank(
      setweight(to_tsvector('korean', coalesce(b.title, '')), 'A') ||
      setweight(to_tsvector('korean', coalesce(b.author, '')), 'B'),
      plainto_tsquery('korean', search_query)
    ) as rank
  FROM books b
  WHERE to_tsvector('korean', coalesce(b.title, '') || ' ' || coalesce(b.author, ''))
    @@ plainto_tsquery('korean', search_query)
  ORDER BY rank DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;
```

### 2.4 통합/연동

| 연동 대상 | 유형 | 데이터 흐름 | 우선순위 |
|----------|------|------------|---------|
| **books 모듈** | 내부 | 책 검색 | ✅ 완료 |
| **notes 모듈** | 내부 | 기록 검색 | ✅ 완료 |
| **bookshelves** | 내부 | 서재 내 검색 | 🟢 낮음 |
| **groups** | 내부 | 그룹 내 검색 | 🟢 낮음 |

---

## 3. 고도화 항목 상세

### 3.1 단기 개선 (Quick Wins)

#### QW-01: 검색 히스토리

```typescript
// 로컬 스토리지 기반 검색 히스토리
const HISTORY_KEY = 'search_history';
const MAX_HISTORY = 10;

function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const addToHistory = useCallback((query: string) => {
    const newHistory = [
      query,
      ...history.filter(h => h !== query)
    ].slice(0, MAX_HISTORY);

    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  return { history, addToHistory, clearHistory };
}
```

#### QW-02: 검색 필터 개선

```typescript
interface SearchFilters {
  type: 'all' | 'books' | 'notes';
  status?: BookStatus;
  noteType?: NoteType;
  dateRange?: {
    from: Date;
    to: Date;
  };
  sortBy: 'relevance' | 'date' | 'title';
}

function SearchFiltersPanel({ filters, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select value={filters.type} onValueChange={(v) => onChange({ ...filters, type: v })}>
        <SelectItem value="all">전체</SelectItem>
        <SelectItem value="books">책</SelectItem>
        <SelectItem value="notes">기록</SelectItem>
      </Select>

      {filters.type === 'books' && (
        <Select value={filters.status} onValueChange={(v) => onChange({ ...filters, status: v })}>
          <SelectItem value="all">모든 상태</SelectItem>
          <SelectItem value="reading">읽는 중</SelectItem>
          <SelectItem value="completed">완료</SelectItem>
          <SelectItem value="want_to_read">읽고 싶은</SelectItem>
        </Select>
      )}

      <Select value={filters.sortBy} onValueChange={(v) => onChange({ ...filters, sortBy: v })}>
        <SelectItem value="relevance">관련도순</SelectItem>
        <SelectItem value="date">최신순</SelectItem>
        <SelectItem value="title">제목순</SelectItem>
      </Select>
    </div>
  );
}
```

### 3.2 중기 개선 (Planned)

#### PL-01: 고급 자동 완성

```typescript
// 컨텍스트 인식 자동 완성
interface SmartSuggestion {
  type: 'book' | 'note' | 'tag' | 'filter' | 'action';
  text: string;
  subtext?: string;
  action: () => void;
}

function SmartSearchInput() {
  const [query, setQuery] = useState('');
  const { suggestions } = useSmartSuggestions(query);

  // 특수 명령어 인식
  // "status:reading" → 상태 필터
  // "author:김영하" → 작가 필터
  // "tag:인상적인" → 태그 필터

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput
        placeholder="검색어 입력 (예: author:김영하, tag:인상적인)"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {/* 필터 제안 */}
        {query.includes(':') && (
          <CommandGroup heading="필터">
            <CommandItem>
              <Filter className="mr-2 h-4 w-4" />
              {query}로 필터링
            </CommandItem>
          </CommandGroup>
        )}

        {/* 일반 제안 */}
        {suggestions.map((suggestion, i) => (
          <CommandItem
            key={i}
            onSelect={suggestion.action}
          >
            {getSuggestionIcon(suggestion.type)}
            <div>
              <p>{suggestion.text}</p>
              {suggestion.subtext && (
                <p className="text-sm text-muted-foreground">
                  {suggestion.subtext}
                </p>
              )}
            </div>
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}
```

### 3.3 장기 비전 (Vision)

#### VS-01: AI 기반 자연어 검색

```
┌─────────────────────────────────────────────────────────────┐
│                    자연어 검색 시스템                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  사용자 쿼리 예시:                                           │
│  • "지난 달에 읽은 자기계발 책"                              │
│  • "리더십에 대한 기록들"                                    │
│  • "김영하 작가의 소설 중 완독한 것"                         │
│  • "인상 깊었던 인용구"                                      │
│                                                             │
│  처리 과정:                                                  │
│  1. 자연어 → 구조화된 쿼리 변환 (AI)                         │
│  2. 시간 표현 해석 ("지난 달" → 날짜 범위)                   │
│  3. 의도 파악 (검색 vs 필터링 vs 분석)                       │
│  4. 결과 생성 및 요약                                        │
│                                                             │
│  AI 응답 예시:                                               │
│  "지난 달에 읽은 자기계발 책 3권을 찾았습니다:               │
│   1. '원씽' - 완독 (1/15)                                   │
│   2. '그릿' - 완독 (1/22)                                   │
│   3. '아웃라이어' - 80% (진행 중)"                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 구현 가이드

### 4.1 기술 요구사항

| 기능 | 필요 기술 | 비고 |
|------|----------|------|
| 자동 완성 | Debounce + React Query | - |
| 시맨틱 검색 | pgvector + OpenAI | 장기 |
| 한국어 처리 | PostgreSQL korean 설정 | - |

### 4.2 마이그레이션 계획

```sql
-- 검색 히스토리 테이블 (선택적)
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  query TEXT NOT NULL,
  result_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시맨틱 검색을 위한 벡터 컬럼 (장기)
-- ALTER TABLE notes ADD COLUMN embedding vector(1536);
```

---

## 5. 성공 지표 (KPIs)

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| **검색 사용률** | - | 40% | 검색 사용 사용자 비율 |
| **검색 성공률** | - | 85% | 결과 클릭 비율 |
| **평균 응답 시간** | - | <200ms | p95 기준 |
| **자동완성 사용률** | - | 60% | 제안 클릭 비율 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-30 | 최초 작성 |

---

*관련 문서: [메인 계획서](../MODULE_ENHANCEMENT_PLAN.md) | [Books 모듈](./01-books.md) | [Notes 모듈](./02-notes.md)*
