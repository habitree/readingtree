// 경로 → 실제 메뉴명 매핑 (관리자 접속기록·메뉴 사용 분석 표시용)
export const PAGE_LABELS: Record<string, string> = {
  "/": "홈(대시보드)",
  "/books": "내 서재",
  "/bookshelves": "책장",
  "/notes": "독서 노트",
  "/timeline": "타임라인",
  "/stats": "통계",
  "/groups": "독서 모임",
  "/profile": "프로필",
  "/pricing": "요금제",
  "/feature-requests": "기능 요청",
  "/sample": "샘플 체험",
  "/about": "서비스 소개",
  "/terms": "이용약관",
  "/privacy": "개인정보처리방침",
  "/login": "로그인",
  "/signup": "회원가입",
  "/chat": "AI 채팅",
  "/search": "검색",
  "/settings": "설정",
  "/stamps": "스탬프",
  "/persona": "독서 성향",
  "/points": "포인트",
  "/recap": "월간 결산",
  "/payment": "결제",
  "/onboarding": "온보딩",
  "/share": "공유 페이지",
  "/callback": "로그인 콜백",
  "/admin": "관리자",
};

// 정확 일치 → 첫 세그먼트 일치 → 매핑 없으면 null (호출부에서 원시 경로 표시)
export function getPageLabel(path: string): string | null {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  const segments = path.split("/").filter(Boolean);
  const menu = segments.length > 0 ? `/${segments[0]}` : "/";
  return PAGE_LABELS[menu] ?? null;
}
