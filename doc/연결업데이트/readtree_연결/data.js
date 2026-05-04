// Mock data — 스크린샷 (14권 책, 8개 연결) 스케일에 맞춰 작성
// 한국 도서 + 표지 placeholder URL (실제로는 books.cover_image_url)

window.MOCK_USERS = [
  { id: "u1", name: "김지은", email: "jieun.kim@example.com", relationCount: 8 },
  { id: "u2", name: "박서윤", email: "seoyoon.park@example.com", relationCount: 5 },
  { id: "u3", name: "이도현", email: "dohyun.lee@example.com", relationCount: 3 },
  { id: "u4", name: "최예린", email: "yerin.choi@example.com", relationCount: 2 },
];

window.MOCK_STATS = {
  totalRelations: 18,
  uniqueBooks: 14,
  usersWithRelations: 4,
  avgConnectionsPerBook: 2.6,
};

// 14권 책 (id, title, author, color = 표지 placeholder 색상, genre, user)
window.MOCK_BOOKS = [
  { id: "b1",  title: "인생은 흑백 영화가 아니다", author: "정세랑",   genre: "에세이",  hue: 28,  user: "u1", connectionCount: 6 },
  { id: "b2",  title: "주저도 인생도 복지처럼",     author: "김혼비",   genre: "에세이",  hue: 200, user: "u1", connectionCount: 5 },
  { id: "b3",  title: "내가 너무 어색하게 구는 건", author: "이슬아",   genre: "에세이",  hue: 340, user: "u1", connectionCount: 4 },
  { id: "b4",  title: "지적대화를 위한 넓고 얕은", author: "채사장",   genre: "인문",    hue: 220, user: "u2", connectionCount: 3 },
  { id: "b5",  title: "지적대화를 위한 넓고 얕은 2", author: "채사장",  genre: "인문",    hue: 230, user: "u2", connectionCount: 3 },
  { id: "b6",  title: "헤리 흑스턴 시대 3부",       author: "권민지",   genre: "역사",    hue: 12,  user: "u2", connectionCount: 2 },
  { id: "b7",  title: "넥서스",                     author: "유발 하라리", genre: "인문", hue: 260, user: "u3", connectionCount: 3 },
  { id: "b8",  title: "불변의 법칙",                author: "모건 하우젤", genre: "경제", hue: 48,  user: "u3", connectionCount: 2 },
  { id: "b9",  title: "우리는 언젠가 만난다",       author: "채사장",   genre: "에세이",  hue: 140, user: "u4", connectionCount: 2 },
  { id: "b10", title: "소유냐 존재냐",               author: "에리히 프롬", genre: "철학", hue: 168, user: "u4", connectionCount: 1 },
  { id: "b11", title: "죽음은 통제할 수 없지",       author: "정유정",   genre: "소설",    hue: 305, user: "u1", connectionCount: 2 },
  { id: "b12", title: "죽음은 통제할 수 없지만",     author: "정유정",   genre: "소설",    hue: 290, user: "u1", connectionCount: 2 },
  { id: "b13", title: "내가 너무 어색하게 구는 건 2", author: "이슬아",  genre: "에세이",  hue: 355, user: "u2", connectionCount: 1 },
  { id: "b14", title: "지적대화를 위한 넓고 얕은 3", author: "채사장",   genre: "인문",    hue: 240, user: "u3", connectionCount: 1 },
];

// 18개 연결 (양방향 중복 제거 기준)
window.MOCK_EDGES = [
  { source: "b1",  target: "b2",  user: "u1", createdAt: "2026-04-22T10:14:00Z", reason: "작가 페르소나가 닮음" },
  { source: "b1",  target: "b3",  user: "u1", createdAt: "2026-04-22T10:18:00Z", reason: "에세이 스타일 유사" },
  { source: "b2",  target: "b3",  user: "u1", createdAt: "2026-04-23T09:02:00Z", reason: "동시기에 읽음" },
  { source: "b1",  target: "b13", user: "u2", createdAt: "2026-04-23T11:40:00Z", reason: "문체 비교" },
  { source: "b1",  target: "b11", user: "u1", createdAt: "2026-04-24T08:10:00Z", reason: "주제: 인생관" },
  { source: "b1",  target: "b12", user: "u1", createdAt: "2026-04-24T08:12:00Z", reason: "주제: 인생관" },
  { source: "b11", target: "b12", user: "u1", createdAt: "2026-04-24T08:15:00Z", reason: "시리즈" },
  { source: "b4",  target: "b5",  user: "u2", createdAt: "2026-04-24T14:32:00Z", reason: "시리즈" },
  { source: "b4",  target: "b14", user: "u3", createdAt: "2026-04-25T10:05:00Z", reason: "시리즈" },
  { source: "b5",  target: "b14", user: "u3", createdAt: "2026-04-25T10:08:00Z", reason: "시리즈" },
  { source: "b4",  target: "b6",  user: "u2", createdAt: "2026-04-25T16:20:00Z", reason: "교차 분야" },
  { source: "b6",  target: "b7",  user: "u3", createdAt: "2026-04-26T09:11:00Z", reason: "역사·인문 교차" },
  { source: "b7",  target: "b8",  user: "u3", createdAt: "2026-04-26T09:30:00Z", reason: "동일 패턴" },
  { source: "b8",  target: "b9",  user: "u4", createdAt: "2026-04-27T13:45:00Z", reason: "교양" },
  { source: "b9",  target: "b10", user: "u4", createdAt: "2026-04-27T14:00:00Z", reason: "철학적 주제" },
  { source: "b2",  target: "b9",  user: "u1", createdAt: "2026-04-28T11:22:00Z", reason: "삶과 일" },
  { source: "b3",  target: "b13", user: "u2", createdAt: "2026-04-28T15:48:00Z", reason: "동일 작가" },
  { source: "b1",  target: "b4",  user: "u2", createdAt: "2026-04-29T09:00:00Z", reason: "교차 추천" },
];

// Top connected (b1 = 6 연결)
window.MOCK_TOP = [
  { userBookId: "b1",  title: "인생은 흑백 영화가 아니다", author: "정세랑",     hue: 28,  connectionCount: 6, userName: "김지은" },
  { userBookId: "b2",  title: "주저도 인생도 복지처럼",     author: "김혼비",     hue: 200, connectionCount: 5, userName: "김지은" },
  { userBookId: "b3",  title: "내가 너무 어색하게 구는 건", author: "이슬아",     hue: 340, connectionCount: 4, userName: "김지은" },
  { userBookId: "b4",  title: "지적대화를 위한 넓고 얕은", author: "채사장",     hue: 220, connectionCount: 3, userName: "박서윤" },
  { userBookId: "b5",  title: "지적대화를 위한 넓고 얕은 2", author: "채사장",   hue: 230, connectionCount: 3, userName: "박서윤" },
  { userBookId: "b7",  title: "넥서스",                     author: "유발 하라리", hue: 260, connectionCount: 3, userName: "이도현" },
  { userBookId: "b6",  title: "헤리 흑스턴 시대 3부",       author: "권민지",     hue: 12,  connectionCount: 2, userName: "박서윤" },
  { userBookId: "b8",  title: "불변의 법칙",                author: "모건 하우젤", hue: 48,  connectionCount: 2, userName: "이도현" },
  { userBookId: "b9",  title: "우리는 언젠가 만난다",       author: "채사장",     hue: 140, connectionCount: 2, userName: "최예린" },
  { userBookId: "b11", title: "죽음은 통제할 수 없지",       author: "정유정",     hue: 305, connectionCount: 2, userName: "김지은" },
];

// Genre distribution
window.MOCK_GENRES = [
  { name: "에세이", count: 5, hue: 340 },
  { name: "인문",   count: 4, hue: 220 },
  { name: "소설",   count: 2, hue: 295 },
  { name: "역사",   count: 1, hue: 12  },
  { name: "철학",   count: 1, hue: 168 },
  { name: "경제",   count: 1, hue: 48  },
];

// 최근 활동 타임라인 (28일)
window.MOCK_TIMELINE = (() => {
  const out = [];
  const today = new Date("2026-04-29");
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // 곡선 분포: 최근 일주일에 집중
    const base = Math.max(0, Math.round(Math.sin((27 - i) / 27 * Math.PI) * 3 + (Math.random() * 2 - 0.5)));
    out.push({ date: d.toISOString().slice(0, 10), count: base });
  }
  // 마지막 며칠 누적 보정 → 총합 ≈ 18에 맞춤
  let total = out.reduce((s, d) => s + d.count, 0);
  while (total < 18) { out[out.length - 1 - Math.floor(Math.random() * 7)].count++; total++; }
  while (total > 18) {
    const idx = Math.floor(Math.random() * out.length);
    if (out[idx].count > 0) { out[idx].count--; total--; }
  }
  return out;
})();
