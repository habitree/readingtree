/**
 * 기능 영역 트리 설정
 * 기능 요청 시 어떤 서비스 영역에 대한 요청인지 선택할 수 있도록 하는 계층 구조
 *
 * 업데이트 방법: 새 기능 추가 시 해당 상위 카테고리 아래에 하위 노드를 추가하면 됩니다.
 * DB 마이그레이션 불필요 (VARCHAR 저장)
 */

export interface FeatureAreaNode {
  /** 고유 ID (점 표기법: "books", "books.search") */
  id: string;
  /** 한국어 라벨 */
  labelKo: string;
  /** 영어 라벨 */
  labelEn: string;
  /** lucide 아이콘 이름 (상위 카테고리만) */
  icon?: string;
  /** 하위 기능 영역 */
  children?: FeatureAreaNode[];
}

export const FEATURE_AREA_TREE: FeatureAreaNode[] = [
  {
    id: "home",
    labelKo: "홈/대시보드",
    labelEn: "Home / Dashboard",
    icon: "Home",
    children: [
      { id: "home.feed", labelKo: "최근 기록 피드", labelEn: "Recent Notes Feed" },
      { id: "home.summary", labelKo: "독서 현황 요약", labelEn: "Reading Summary" },
      { id: "home.widget", labelKo: "대시보드 위젯", labelEn: "Dashboard Widgets" },
    ],
  },
  {
    id: "books",
    labelKo: "도서 관리",
    labelEn: "Book Management",
    icon: "BookOpen",
    children: [
      { id: "books.search", labelKo: "도서 검색", labelEn: "Book Search" },
      { id: "books.detail", labelKo: "도서 상세 정보", labelEn: "Book Detail" },
      { id: "books.bulk", labelKo: "일괄 등록", labelEn: "Bulk Import" },
      { id: "books.status", labelKo: "독서 상태 관리", labelEn: "Reading Status" },
      { id: "books.progress", labelKo: "페이지 수 추적", labelEn: "Page Tracking" },
      { id: "books.ocr", labelKo: "OCR 텍스트 인식", labelEn: "OCR Recognition" },
    ],
  },
  {
    id: "bookshelves",
    labelKo: "책장(서재)",
    labelEn: "Bookshelves",
    icon: "Library",
    children: [
      { id: "bookshelves.edit", labelKo: "책장 생성/편집", labelEn: "Create / Edit Shelf" },
      { id: "bookshelves.sort", labelKo: "책장 정렬/드래그", labelEn: "Shelf Ordering" },
      { id: "bookshelves.share", labelKo: "책장 공유", labelEn: "Shelf Sharing" },
    ],
  },
  {
    id: "notes",
    labelKo: "기록(노트)",
    labelEn: "Notes",
    icon: "PenLine",
    children: [
      { id: "notes.quick", labelKo: "빠른 기록 작성", labelEn: "Quick Capture" },
      { id: "notes.quote", labelKo: "인용구 기록", labelEn: "Quote Notes" },
      { id: "notes.photo", labelKo: "사진 기록", labelEn: "Photo Notes" },
      { id: "notes.memo", labelKo: "메모 기록", labelEn: "Memo Notes" },
      { id: "notes.ocr", labelKo: "OCR 기록", labelEn: "OCR Notes" },
      { id: "notes.progress", labelKo: "독서 진행도 기록", labelEn: "Progress Notes" },
      { id: "notes.free", labelKo: "자유 기록", labelEn: "Free Notes" },
      { id: "notes.filter", labelKo: "기록 검색/필터", labelEn: "Notes Search / Filter" },
    ],
  },
  {
    id: "groups",
    labelKo: "독서모임",
    labelEn: "Reading Groups",
    icon: "Users",
    children: [
      { id: "groups.manage", labelKo: "모임 생성/관리", labelEn: "Group Management" },
      { id: "groups.invite", labelKo: "초대/가입", labelEn: "Invite / Join" },
      { id: "groups.books", labelKo: "공유 도서", labelEn: "Shared Books" },
      { id: "groups.feed", labelKo: "모임 기록 피드", labelEn: "Group Feed" },
      { id: "groups.comments", labelKo: "댓글/반응", labelEn: "Comments / Reactions" },
      { id: "groups.stats", labelKo: "모임 통계", labelEn: "Group Stats" },
    ],
  },
  {
    id: "profile",
    labelKo: "프로필",
    labelEn: "Profile",
    icon: "User",
    children: [
      { id: "profile.edit", labelKo: "프로필 편집", labelEn: "Edit Profile" },
      { id: "profile.stats", labelKo: "독서 통계", labelEn: "Reading Stats" },
      { id: "profile.achievements", labelKo: "업적/배지", labelEn: "Achievements / Badges" },
    ],
  },
  {
    id: "ai",
    labelKo: "AI 기능",
    labelEn: "AI Features",
    icon: "Bot",
    children: [
      { id: "ai.chat", labelKo: "AI 채팅", labelEn: "AI Chat" },
      { id: "ai.autotag", labelKo: "자동 태그", labelEn: "Auto Tag" },
      { id: "ai.summary", labelKo: "AI 요약", labelEn: "AI Summary" },
      { id: "ai.persona", labelKo: "독서 페르소나", labelEn: "Reading Persona" },
    ],
  },
  {
    id: "stats",
    labelKo: "통계/분석",
    labelEn: "Statistics / Analytics",
    icon: "BarChart3",
    children: [
      { id: "stats.reading", labelKo: "독서 통계", labelEn: "Reading Stats" },
      { id: "stats.persona", labelKo: "페르소나 진화", labelEn: "Persona Evolution" },
      { id: "stats.timeline", labelKo: "타임라인", labelEn: "Timeline" },
    ],
  },
  {
    id: "search",
    labelKo: "검색",
    labelEn: "Search",
    icon: "Search",
    children: [
      { id: "search.global", labelKo: "통합 검색", labelEn: "Global Search" },
    ],
  },
  {
    id: "music",
    labelKo: "음악/타이머",
    labelEn: "Music / Timer",
    icon: "Music2",
    children: [
      { id: "music.playlist", labelKo: "재즈 플레이리스트", labelEn: "Jazz Playlists" },
      { id: "music.timer", labelKo: "독서 타이머", labelEn: "Reading Timer" },
    ],
  },
  {
    id: "points",
    labelKo: "포인트",
    labelEn: "Points",
    icon: "Coins",
    children: [
      { id: "points.earn", labelKo: "포인트 적립", labelEn: "Earn Points" },
      { id: "points.spend", labelKo: "포인트 소비", labelEn: "Spend Points" },
    ],
  },
  {
    id: "subscription",
    labelKo: "구독/결제",
    labelEn: "Subscription / Payment",
    icon: "CreditCard",
    children: [
      { id: "subscription.plans", labelKo: "요금제", labelEn: "Plans" },
      { id: "subscription.payment", labelKo: "결제 수단", labelEn: "Payment Methods" },
    ],
  },
  {
    id: "auth",
    labelKo: "로그인/계정",
    labelEn: "Login / Account",
    icon: "Lock",
    children: [
      { id: "auth.login", labelKo: "회원가입/로그인", labelEn: "Sign Up / Login" },
      { id: "auth.onboarding", labelKo: "온보딩", labelEn: "Onboarding" },
      { id: "auth.account", labelKo: "계정 관리", labelEn: "Account Management" },
    ],
  },
  {
    id: "share",
    labelKo: "공유 기능",
    labelEn: "Sharing",
    icon: "Share2",
    children: [
      { id: "share.notes", labelKo: "기록 공유", labelEn: "Share Notes" },
      { id: "share.bookshelves", labelKo: "책장 공유", labelEn: "Share Bookshelves" },
      { id: "share.reports", labelKo: "독서 리포트 공유", labelEn: "Share Reports" },
    ],
  },
  {
    id: "theme",
    labelKo: "테마/설정",
    labelEn: "Theme / Settings",
    icon: "Palette",
    children: [
      { id: "theme.darkmode", labelKo: "다크모드", labelEn: "Dark Mode" },
      { id: "theme.language", labelKo: "언어 전환", labelEn: "Language Toggle" },
    ],
  },
  {
    id: "feature-requests",
    labelKo: "기능 요청",
    labelEn: "Feature Requests",
    icon: "Lightbulb",
    children: [
      { id: "feature-requests.create", labelKo: "요청 작성", labelEn: "Create Request" },
      { id: "feature-requests.vote", labelKo: "투표", labelEn: "Voting" },
      { id: "feature-requests.comments", labelKo: "댓글", labelEn: "Comments" },
    ],
  },
  {
    id: "other",
    labelKo: "기타/일반",
    labelEn: "Other / General",
    icon: "MoreHorizontal",
  },
];

// ============================================
// 유틸리티 함수
// ============================================

/** 트리를 플랫 배열로 변환 */
function flattenNodes(
  nodes: FeatureAreaNode[],
  parentLabel?: string
): Array<FeatureAreaNode & { breadcrumbKo: string; breadcrumbEn: string; depth: number }> {
  const result: Array<FeatureAreaNode & { breadcrumbKo: string; breadcrumbEn: string; depth: number }> = [];
  for (const node of nodes) {
    const depth = node.id.includes(".") ? 1 : 0;
    const breadcrumbKo = parentLabel ? `${parentLabel} > ${node.labelKo}` : node.labelKo;
    const parentEn = nodes === FEATURE_AREA_TREE ? undefined : undefined; // handled by caller
    result.push({ ...node, breadcrumbKo, breadcrumbEn: "", depth });
    if (node.children) {
      for (const child of node.children) {
        result.push({
          ...child,
          breadcrumbKo: `${node.labelKo} > ${child.labelKo}`,
          breadcrumbEn: `${node.labelEn} > ${child.labelEn}`,
          depth: 1,
        });
      }
    }
  }
  return result;
}

/** 캐시된 플랫 맵 */
let _flatMap: Map<string, FeatureAreaNode & { breadcrumbKo: string; breadcrumbEn: string; depth: number }> | null = null;

function getFlatMap() {
  if (!_flatMap) {
    _flatMap = new Map();
    for (const node of FEATURE_AREA_TREE) {
      _flatMap.set(node.id, {
        ...node,
        breadcrumbKo: node.labelKo,
        breadcrumbEn: node.labelEn,
        depth: 0,
      });
      if (node.children) {
        for (const child of node.children) {
          _flatMap.set(child.id, {
            ...child,
            breadcrumbKo: `${node.labelKo} > ${child.labelKo}`,
            breadcrumbEn: `${node.labelEn} > ${child.labelEn}`,
            depth: 1,
          });
        }
      }
    }
  }
  return _flatMap;
}

/** ID로 노드 조회 */
export function getFeatureAreaById(id: string): FeatureAreaNode | undefined {
  return getFlatMap().get(id);
}

/** ID로 breadcrumb 문자열 반환 (예: "도서 관리 > 도서 검색") */
export function getFeatureAreaBreadcrumb(id: string, locale: "ko" | "en" = "ko"): string {
  const entry = getFlatMap().get(id);
  if (!entry) return id;
  return locale === "ko" ? entry.breadcrumbKo : entry.breadcrumbEn;
}

/** 상위 카테고리의 아이콘 이름 반환 */
export function getFeatureAreaIcon(id: string): string | undefined {
  const topId = id.includes(".") ? id.split(".")[0] : id;
  const topNode = FEATURE_AREA_TREE.find((n) => n.id === topId);
  return topNode?.icon;
}

/** 상위 카테고리 목록 반환 (필터 드롭다운용) */
export function getTopLevelAreas(): FeatureAreaNode[] {
  return FEATURE_AREA_TREE;
}

/** 모든 영역을 플랫 리스트로 반환 */
export function getAllFeatureAreas() {
  return Array.from(getFlatMap().values());
}
