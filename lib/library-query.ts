import type { ReadingStatus } from "@/types/book";

/**
 * 서재 URL 쿼리 파라미터 표준.
 *
 *   /books?status=reading&shelf=abc&sort=recent&q=검색어
 */

export type LibrarySortOption =
  | "recent"
  | "oldest"
  | "title"
  | "author"
  | "completed_desc"
  | "completed_asc";

export const LIBRARY_SORT_LABELS: Record<LibrarySortOption, string> = {
  recent: "최근 추가순",
  oldest: "오래된 순",
  title: "제목순",
  author: "저자순",
  completed_desc: "최근 완독순",
  completed_asc: "오래된 완독순",
};

export const DEFAULT_SORT: LibrarySortOption = "recent";

export interface LibraryQueryState {
  status?: ReadingStatus;
  shelf?: string;
  sort: LibrarySortOption;
  q?: string;
}

const VALID_STATUSES: ReadingStatus[] = [
  "reading",
  "completed",
  "paused",
  "not_started",
  "rereading",
];

function parseStatus(value: string | undefined): ReadingStatus | undefined {
  if (!value) return undefined;
  return (VALID_STATUSES as string[]).includes(value)
    ? (value as ReadingStatus)
    : undefined;
}

function parseSort(value: string | undefined): LibrarySortOption {
  if (!value) return DEFAULT_SORT;
  return (Object.keys(LIBRARY_SORT_LABELS) as LibrarySortOption[]).includes(
    value as LibrarySortOption,
  )
    ? (value as LibrarySortOption)
    : DEFAULT_SORT;
}

/**
 * URLSearchParams 또는 Next.js searchParams 객체를 표준화된 상태로 파싱.
 */
export function parseLibrarySearchParams(
  searchParams:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | null
    | undefined,
): LibraryQueryState {
  if (!searchParams) {
    return { sort: DEFAULT_SORT };
  }

  const get = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) ?? undefined;
    }
    const value = searchParams[key];
    if (Array.isArray(value)) return value[0];
    return value ?? undefined;
  };

  return {
    status: parseStatus(get("status")),
    shelf: get("shelf") || undefined,
    sort: parseSort(get("sort")),
    q: get("q")?.trim() || undefined,
  };
}

/**
 * 현재 상태를 URL 쿼리 문자열로 직렬화. 기본값은 생략하여 URL을 깔끔하게 유지.
 */
export function serializeLibraryQuery(state: Partial<LibraryQueryState>): string {
  const params = new URLSearchParams();
  if (state.status) params.set("status", state.status);
  if (state.shelf) params.set("shelf", state.shelf);
  if (state.sort && state.sort !== DEFAULT_SORT) params.set("sort", state.sort);
  if (state.q) params.set("q", state.q);
  const str = params.toString();
  return str ? `?${str}` : "";
}

/**
 * 활성 필터를 칩으로 렌더링하기 위한 간단한 설명자.
 */
export interface LibraryFilterChip {
  key: "status" | "shelf" | "sort" | "q";
  label: string;
  value: string;
}

export function describeActiveFilters(
  state: LibraryQueryState,
  opts?: { shelfNameById?: Record<string, string> },
): LibraryFilterChip[] {
  const chips: LibraryFilterChip[] = [];

  if (state.status) {
    const statusLabel: Record<ReadingStatus, string> = {
      reading: "읽는 중",
      completed: "완독",
      paused: "잠시 멈춤",
      not_started: "읽을 예정",
      rereading: "재독",
    };
    chips.push({ key: "status", label: statusLabel[state.status], value: state.status });
  }
  if (state.shelf) {
    const shelfName = opts?.shelfNameById?.[state.shelf] ?? "책장";
    chips.push({ key: "shelf", label: shelfName, value: state.shelf });
  }
  if (state.q) {
    chips.push({ key: "q", label: `"${state.q}"`, value: state.q });
  }
  if (state.sort && state.sort !== DEFAULT_SORT) {
    chips.push({
      key: "sort",
      label: LIBRARY_SORT_LABELS[state.sort],
      value: state.sort,
    });
  }
  return chips;
}

/**
 * 특정 필터를 제거한 새 상태 반환.
 */
export function removeFilter(
  state: LibraryQueryState,
  key: LibraryFilterChip["key"],
): LibraryQueryState {
  switch (key) {
    case "status":
      return { ...state, status: undefined };
    case "shelf":
      return { ...state, shelf: undefined };
    case "q":
      return { ...state, q: undefined };
    case "sort":
      return { ...state, sort: DEFAULT_SORT };
  }
}
