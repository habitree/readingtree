export interface PageInfo {
  route: string;
  name: string;
  group: string;
  requiresAuth: boolean;
}

export const AUTH_PAGES: PageInfo[] = [
  { route: "/login", name: "로그인", group: "auth", requiresAuth: false },
  { route: "/signup", name: "회원가입", group: "auth", requiresAuth: false },
  { route: "/verify-email", name: "이메일 검증", group: "auth", requiresAuth: false },
  { route: "/onboarding", name: "온보딩 시작", group: "auth", requiresAuth: true },
  { route: "/onboarding/consent", name: "약관 동의", group: "auth", requiresAuth: true },
  { route: "/onboarding/goal", name: "목표 설정", group: "auth", requiresAuth: true },
  { route: "/onboarding/tutorial", name: "튜토리얼", group: "auth", requiresAuth: true },
];

export const MAIN_CORE_PAGES: PageInfo[] = [
  { route: "/", name: "홈 대시보드", group: "main-core", requiresAuth: false },
  { route: "/books", name: "내 서재", group: "main-core", requiresAuth: false },
  { route: "/books/search", name: "도서 검색", group: "main-core", requiresAuth: true },
  { route: "/notes", name: "내 기록", group: "main-core", requiresAuth: false },
  { route: "/notes/new", name: "새 기록 작성", group: "main-core", requiresAuth: true },
  { route: "/notes/free", name: "자유 기록", group: "main-core", requiresAuth: true },
  { route: "/bookshelves", name: "서재 목록", group: "main-core", requiresAuth: true },
  { route: "/search", name: "전체 검색", group: "main-core", requiresAuth: false },
  { route: "/sample", name: "샘플 데이터", group: "main-core", requiresAuth: false },
];

export const MAIN_SOCIAL_PAGES: PageInfo[] = [
  { route: "/groups", name: "독서모임", group: "main-social", requiresAuth: false },
  { route: "/groups/new", name: "새 모임 생성", group: "main-social", requiresAuth: true },
  { route: "/chat", name: "AI 도우미", group: "main-social", requiresAuth: true },
  { route: "/stats", name: "통계/페르소나", group: "main-social", requiresAuth: true },
  { route: "/points", name: "포인트", group: "main-social", requiresAuth: true },
  { route: "/pricing", name: "가격 정책", group: "main-social", requiresAuth: false },
  { route: "/profile", name: "내 프로필", group: "main-social", requiresAuth: true },
  { route: "/feature-requests", name: "기능 요청", group: "main-social", requiresAuth: false },
  { route: "/feature-requests/new", name: "새 기능 요청", group: "main-social", requiresAuth: true },
  { route: "/timeline", name: "타임라인", group: "main-social", requiresAuth: false },
  { route: "/about", name: "소개", group: "main-social", requiresAuth: false },
];

export const ADMIN_PAGES: PageInfo[] = [
  { route: "/admin", name: "관리자 대시보드", group: "admin", requiresAuth: true },
  { route: "/admin/users", name: "사용자 관리", group: "admin", requiresAuth: true },
  { route: "/admin/tracking", name: "추적 데이터", group: "admin", requiresAuth: true },
  { route: "/admin/ai-usage", name: "AI 사용량", group: "admin", requiresAuth: true },
  { route: "/admin/ai-settings", name: "AI 설정", group: "admin", requiresAuth: true },
  { route: "/admin/api-info", name: "API 정보", group: "admin", requiresAuth: true },
  { route: "/admin/ocr-settings", name: "OCR 설정", group: "admin", requiresAuth: true },
  { route: "/admin/report-settings", name: "리포트 설정", group: "admin", requiresAuth: true },
];

export const STATIC_MISC_PAGES: PageInfo[] = [
  { route: "/privacy", name: "개인정보 처리방침", group: "static", requiresAuth: false },
  { route: "/terms", name: "이용약관", group: "static", requiresAuth: false },
  { route: "/payment/success", name: "결제 성공", group: "payment", requiresAuth: false },
  { route: "/payment/fail", name: "결제 실패", group: "payment", requiresAuth: false },
  { route: "/share/notes/test-id", name: "공유 기록 (404)", group: "share", requiresAuth: false },
  { route: "/share/bookshelves/test-id", name: "공유 서재 (404)", group: "share", requiresAuth: false },
  { route: "/share/reports/test-id", name: "공유 리포트 (404)", group: "share", requiresAuth: false },
];

export const ALL_PAGES: PageInfo[] = [
  ...AUTH_PAGES,
  ...MAIN_CORE_PAGES,
  ...MAIN_SOCIAL_PAGES,
  ...ADMIN_PAGES,
  ...STATIC_MISC_PAGES,
];

export const CONSOLE_NOISE_FILTERS = [
  /Download the React DevTools/,
  /Warning: ReactDOM\.render/,
  /Supabase.*session/i,
  /Failed to load resource.*favicon/,
  /third-party cookie/i,
  /DevTools failed to load/,
  /Lit is in dev mode/,
  /A cookie associated with/,
  /Chrome is moving towards/,
];
