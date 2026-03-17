/**
 * 쇼츠 DB 시드 데이터 스크립트
 *
 * Root.tsx의 하드코딩 샘플 → contents 테이블
 * tip-selector.ts의 팁 템플릿 → content_templates 테이블
 * 14개 시리즈 메타데이터 → series 테이블
 *
 * Usage: npx tsx scripts/seed-contents.ts
 */

import { createShortsClient } from "../pipeline/utils/supabase";
import { readFileSync } from "fs";
import { resolve } from "path";

async function seed() {
  const supabase = createShortsClient();

  // SQL 시드 파일 실행
  const seedSqlPath = resolve(
    __dirname,
    "../doc/database/migration-202603080001__shorts__seed-data.sql"
  );
  const seedSql = readFileSync(seedSqlPath, "utf-8");

  // 각 INSERT 문을 개별 실행 (Supabase JS는 raw SQL 미지원이므로 RPC 사용)
  // 대안: supabase CLI로 직접 실행 권장
  console.log("=== Habitree Shorts — Seed Data ===\n");

  // 1. series 확인
  const { data: existingSeries, error: seriesError } = await supabase
    .from("series")
    .select("id")
    .limit(1);

  if (seriesError) {
    console.error("❌ series 테이블 접근 실패:", seriesError.message);
    console.log("\n💡 마이그레이션을 먼저 실행하세요:");
    console.log(
      "   supabase db push --db-url <URL> < doc/database/migration-202603080000__shorts__initial-schema.sql"
    );
    process.exit(1);
  }

  // 2. series 시드
  const seriesData = [
    { id: "daily-quote", name: "오늘의 문장", description: "인상 깊은 문장 한 줄과 책 정보를 소개하는 감성 쇼츠", width: 1080, height: 1920, fps: 30, duration_seconds: 25, duration_in_frames: 750, remotion_id: "DailyQuote", is_active: true, priority: 1 },
    { id: "book-review", name: "1분 북리뷰", description: "완독 많은 인기 책의 핵심을 1분 안에 전달", width: 1080, height: 1920, fps: 30, duration_seconds: 60, duration_in_frames: 1800, remotion_id: "BookReview", is_active: true, priority: 2 },
    { id: "reading-tip", name: "독서 꿀팁", description: "독서 습관, 기록법, 독서모임 팁 등 실용 콘텐츠", width: 1080, height: 1920, fps: 30, duration_seconds: 30, duration_in_frames: 900, remotion_id: "ReadingTip", is_active: true, priority: 3 },
    { id: "book-vs-book", name: "이 책 vs 저 책", description: "비슷한 주제의 두 책을 비교하며 선택을 돕는 콘텐츠", width: 1080, height: 1920, fps: 30, duration_seconds: 40, duration_in_frames: 1200, remotion_id: "BookVsBook", is_active: true, priority: 4 },
    { id: "app-preview", name: "앱 미리보기", description: "ReadTree 앱의 주요 기능을 소개하는 프로모션 쇼츠", width: 1080, height: 1920, fps: 30, duration_seconds: 30, duration_in_frames: 900, remotion_id: "AppPreview", is_active: true, priority: 5 },
    { id: "service-intro", name: "서비스 소개", description: "ReadTree 서비스의 핵심 가치와 기능을 소개하는 영상", width: 1080, height: 1920, fps: 30, duration_seconds: 45, duration_in_frames: 1350, remotion_id: "ServiceIntro", is_active: true, priority: 6 },
    { id: "feature-demo", name: "기능 데모", description: "개별 기능을 상세히 보여주는 데모 영상", width: 1080, height: 1920, fps: 30, duration_seconds: 30, duration_in_frames: 900, remotion_id: "FeatureDemo", is_active: true, priority: 7 },
    { id: "service-showcase", name: "서비스 쇼케이스", description: "전체 서비스를 슬라이드 형태로 보여주는 쇼케이스", width: 1080, height: 1920, fps: 30, duration_seconds: 51, duration_in_frames: 1530, remotion_id: "ServiceShowcase", is_active: true, priority: 8 },
    { id: "user-story", name: "사용자 스토리", description: "실제 사용자의 변화 스토리를 감성적으로 전달", width: 1080, height: 1920, fps: 30, duration_seconds: 45, duration_in_frames: 1350, remotion_id: "UserStory", is_active: true, priority: 9 },
    { id: "booktok-style", name: "BookTok 감성", description: "BookTok 트렌드에 맞춘 감성 리뷰 쇼츠", width: 1080, height: 1920, fps: 30, duration_seconds: 30, duration_in_frames: 900, remotion_id: "BooktokStyle", is_active: true, priority: 10 },
    { id: "reading-challenge", name: "독서 챌린지", description: "독서 목표 달성 현황과 챌린지 참여 유도", width: 1080, height: 1920, fps: 30, duration_seconds: 25, duration_in_frames: 750, remotion_id: "ReadingChallenge", is_active: true, priority: 11 },
    { id: "pain-point", name: "공감형 콘텐츠", description: "독서인의 공통 고충을 짚고 솔루션 제시", width: 1080, height: 1920, fps: 30, duration_seconds: 20, duration_in_frames: 600, remotion_id: "PainPoint", is_active: true, priority: 12 },
    { id: "community-highlight", name: "독서모임 하이라이트", description: "활발한 독서모임 활동을 소개하는 콘텐츠", width: 1080, height: 1920, fps: 30, duration_seconds: 35, duration_in_frames: 1050, remotion_id: "CommunityHighlight", is_active: true, priority: 13 },
    { id: "creator-collab", name: "크리에이터 콜라보", description: "BookTok 크리에이터와 협업하는 추천 콘텐츠", width: 1080, height: 1920, fps: 30, duration_seconds: 40, duration_in_frames: 1200, remotion_id: "CreatorCollab", is_active: true, priority: 14 },
  ];

  const { error: seriesInsertError } = await supabase
    .from("series")
    .upsert(seriesData, { onConflict: "id" });

  if (seriesInsertError) {
    console.error("❌ series 시드 실패:", seriesInsertError.message);
    process.exit(1);
  }
  console.log(`✅ series: ${seriesData.length}개 시리즈 시드 완료`);

  // 3. contents 시드 (기존 데이터가 없는 경우에만)
  const { count } = await supabase
    .from("contents")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    console.log(`⏭️  contents: 이미 ${count}개 존재 — 스킵`);
  } else {
    const contentsData = [
      { series_id: "daily-quote", title: "데미안 — 새로운 길을 찾는 사람은", props: { seriesId: "daily-quote", quoteText: "새로운 길을 찾는 사람은\n외로워야 하고,\n고독한 시간을 보내야 한다.", bookTitle: "데미안", author: "헤르만 헤세", pageNumber: 45, coverImageUrl: null }, status: "approved", source: "manual" },
      { series_id: "service-intro", title: "독서 기록이 사라지지 않는 시대", props: { seriesId: "service-intro", tagline: "독서 기록이\n사라지지 않는 시대", painPoints: ["메모장에 흩어진 독서 기록", "다시 찾을 수 없는 인상 깊은 문장", "책 단위로 정리되지 않는 기록들", "공유하기 어려운 독서 경험"], features: [{ title: "사진 한 장으로 기록", description: "책 속 문장을 촬영하면\nAI가 자동으로 텍스트를 추출합니다", icon: "scan" }, { title: "책별 자동 정리", description: "필사, 메모, 사진이\n해당 책의 기록에 자동 연결됩니다", icon: "sort" }, { title: "문장 단위 검색", description: "저장한 문장을 제목, 주제, 내용으로\n언제든 다시 찾을 수 있습니다", icon: "search" }, { title: "카드뉴스로 공유", description: "클릭 한 번으로\n감성 카드뉴스를 만들어 공유합니다", icon: "share" }], stats: [{ label: "지원 기능", value: "5+" }, { label: "비용", value: "무료" }, { label: "기록 방식", value: "4가지" }], ctaText: "지금 시작하기" }, status: "approved", source: "manual" },
      { series_id: "user-story", title: "서연의 독서 변화 스토리", props: { seriesId: "user-story", userName: "서연", beforeText: "메모장에 흩어진 독서 기록\n다시 찾을 수 없는 문장들\n읽었는데 기억나지 않는 책", afterText: "책별로 정리된 나만의 서재\n언제든 다시 찾는 인상 깊은 문장\n독서나무와 함께 성장하는 기록", transitionText: "그런데\nReadTree를 만나고\n모든 게 달라졌어요", duration: "3개월", beforeStat: "0권", afterStat: "23권", ctaText: "무료로 시작하기" }, status: "approved", source: "manual" },
      { series_id: "booktok-style", title: "우리가 빛의 속도로 갈 수 없다면", props: { seriesId: "booktok-style", hookText: "이 책 읽고\n한참을 멍하니\n앉아 있었습니다", quoteText: "우리가 빛의 속도로\n갈 수 없다면,\n그 이유를 알고 싶었다.", reviewText: "SF를 넘어 인간 존엄에 대한 묵직한 질문", rating: 5, emotionTags: ["감동", "SF", "휴머니즘", "여운"], bookTitle: "우리가 빛의 속도로 갈 수 없다면", author: "김초엽", coverImageUrl: null }, status: "approved", source: "manual" },
      { series_id: "reading-challenge", title: "이번 달 독서 챌린지", props: { seriesId: "reading-challenge", challengeTitle: "이번 달\n당신의 독서량은?", booksRead: 7, booksGoal: 10, totalPages: 2340, genres: [{ name: "소설", count: 3 }, { name: "자기계발", count: 2 }, { name: "에세이", count: 1 }, { name: "과학", count: 1 }], percentile: 12, ctaText: "나도 챌린지 참여하기" }, status: "approved", source: "manual" },
      { series_id: "pain-point", title: "독서 기록 메모장에 하는 사람?", props: { seriesId: "pain-point", hookQuestion: "독서 기록\n메모장에 하는 사람?", painPoints: ["메모장에 흩어진 기록", "어떤 책이었는지 기억 안 남", "인상 깊은 문장 다시 못 찾음", "읽은 책 수도 모름"], solutionText: "이 앱 하나면\n독서 기록 끝", ctaText: "무료로 시작하기" }, status: "approved", source: "manual" },
      { series_id: "community-highlight", title: "철학하는 독서인 모임", props: { seriesId: "community-highlight", groupName: "철학하는 독서인", topic: "인문/철학", memberCount: 28, currentBook: "차라투스트라는 이렇게 말했다", highlights: ["\"초인의 개념이 현대에도 유효한가?\"에 대한 열띤 토론", "\"위버멘쉬를 자기계발로 해석하는 건 오독\" — 멤버 최진우", "이번 주 가장 많은 공감을 받은 메모 공유"], ctaText: "독서모임 둘러보기" }, status: "approved", source: "manual" },
      { series_id: "creator-collab", title: "책읽는민지 x 아몬드", props: { seriesId: "creator-collab", creatorName: "책읽는민지", creatorBio: "BookTok 크리에이터 | 팔로워 12K", bookTitle: "아몬드", bookAuthor: "손원평", recommendQuote: "감정을 느끼지 못하는 소년의 이야기인데\n읽고 나면 오히려\n감정이 무엇인지 다시 생각하게 돼요", libraryCount: 156, ctaText: "함께 읽으러 가기" }, status: "approved", source: "manual" },
    ];

    const { error: contentsError } = await supabase
      .from("contents")
      .insert(contentsData);

    if (contentsError) {
      console.error("❌ contents 시드 실패:", contentsError.message);
    } else {
      console.log(`✅ contents: ${contentsData.length}개 콘텐츠 시드 완료`);
    }
  }

  // 4. content_templates 시드
  const { count: templateCount } = await supabase
    .from("content_templates")
    .select("*", { count: "exact", head: true });

  if (templateCount && templateCount > 0) {
    console.log(`⏭️  content_templates: 이미 ${templateCount}개 존재 — 스킵`);
  } else {
    const templatesData = [
      { series_id: "reading-tip", name: "독서 습관 만들기 3단계", description: "독서 습관 형성을 위한 기본 팁", template_props: { tipTitle: "독서 습관 만들기 3단계", category: "독서 습관", tipSteps: [{ title: "시간 고정", description: "매일 같은 시간에 10분만 읽기", icon: "clock" }, { title: "장소 지정", description: "독서 전용 공간을 정하세요", icon: "location" }, { title: "기록하기", description: "인상 깊은 문장을 바로 저장", icon: "pen" }] }, ai_prompt: "독서 습관 형성에 관한 3단계 실용 팁을 생성하세요." },
      { series_id: "reading-tip", name: "효과적인 독서 기록법", description: "독서 기록의 질을 높이는 방법", template_props: { tipTitle: "효과적인 독서 기록법", category: "독서 기록", tipSteps: [{ title: "밑줄 긋기", description: "마음에 드는 문장에 표시하기", icon: "highlight" }, { title: "내 생각 쓰기", description: "왜 이 문장이 좋았는지 메모", icon: "thought" }, { title: "연결하기", description: "다른 책의 문장과 연결해보기", icon: "link" }] }, ai_prompt: "독서 기록을 효과적으로 하는 3단계 방법을 생성하세요." },
      { series_id: "reading-tip", name: "읽고 싶은 책 고르는 법", description: "다음에 읽을 책을 선택하는 팁", template_props: { tipTitle: "읽고 싶은 책 고르는 법", category: "책 선택", tipSteps: [{ title: "관심사 따라가기", description: "지금 궁금한 주제부터 시작", icon: "star" }, { title: "첫 10페이지", description: "서점에서 첫 10페이지 읽어보기", icon: "book" }, { title: "추천 활용", description: "비슷한 취향의 독서가 추천 확인", icon: "people" }] }, ai_prompt: "다음에 읽을 책을 고르는 3단계 방법을 생성하세요." },
    ];

    const { error: templatesError } = await supabase
      .from("content_templates")
      .insert(templatesData);

    if (templatesError) {
      console.error("❌ content_templates 시드 실패:", templatesError.message);
    } else {
      console.log(`✅ content_templates: ${templatesData.length}개 템플릿 시드 완료`);
    }
  }

  // 5. 검증
  console.log("\n=== 검증 ===");
  const { count: s } = await supabase.from("series").select("*", { count: "exact", head: true });
  const { count: c } = await supabase.from("contents").select("*", { count: "exact", head: true });
  const { count: t } = await supabase.from("content_templates").select("*", { count: "exact", head: true });
  console.log(`series: ${s}개 | contents: ${c}개 | templates: ${t}개`);
  console.log("\n✅ 시드 완료!");
}

seed().catch((err) => {
  console.error("시드 실행 실패:", err);
  process.exit(1);
});
