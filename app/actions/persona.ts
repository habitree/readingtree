"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database";
import type {
  UserPersona,
  PersonaAnalysisResult,
  ReadingPace,
  NoteStyle,
  ActivityPattern,
  GroupEngagement,
  CategoryPreference,
  ReadingStats,
  ActivityTimeDistribution,
} from "@/types/persona";

type UserPersonaRow = Database["public"]["Tables"]["user_personas"]["Row"];

// Gemini API 클라이언트
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * 사용자 페르소나 조회
 */
export async function getUserPersona(): Promise<UserPersona | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("user_personas")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116: 결과 없음
    console.error("페르소나 조회 오류:", error);
  }

  return data as UserPersona | null;
}

/**
 * 페르소나 분석이 필요한지 확인
 * 24시간 이상 경과했거나 페르소나가 없으면 true
 */
export async function needsPersonaAnalysis(): Promise<boolean> {
  const persona = await getUserPersona();

  if (!persona) {
    return true;
  }

  const lastAnalyzed = new Date(persona.last_analyzed_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - lastAnalyzed.getTime()) / (1000 * 60 * 60);

  return hoursDiff >= 24;
}

/**
 * 사용자 독서 데이터 분석
 */
async function analyzeReadingData(userId: string): Promise<PersonaAnalysisResult> {
  const supabase = await createServerSupabaseClient();

  // 1. 사용자의 모든 책 조회
  const { data: userBooks } = await supabase
    .from("user_books")
    .select(`
      id,
      status,
      started_at,
      completed_at,
      books (
        id,
        title,
        category,
        total_pages
      )
    `)
    .eq("user_id", userId);

  // 2. 사용자의 모든 기록 조회
  const { data: notes } = await supabase
    .from("notes")
    .select("id, type, created_at")
    .eq("user_id", userId);

  // 3. 그룹 참여 정보 조회
  const { data: groupMemberships } = await supabase
    .from("group_members")
    .select("group_id, role, status")
    .eq("user_id", userId)
    .eq("status", "approved");

  // 4. 통계 계산
  const totalBooks = userBooks?.length || 0;
  const completedBooks =
    userBooks?.filter((ub: any) => ub.status === "completed").length || 0;
  const readingBooks =
    userBooks?.filter((ub: any) => ub.status === "reading").length || 0;
  const totalNotes = notes?.length || 0;

  // 5. 독서 속도 계산 (완독한 책 기준)
  let averageReadingDays = 0;
  let averagePagesPerDay = 0;
  const completedUserBooks =
    userBooks?.filter(
      (ub: any) => ub.status === "completed" && ub.started_at && ub.completed_at
    ) || [];

  if (completedUserBooks.length > 0) {
    const readingDaysArray = completedUserBooks.map((ub: any) => {
      const start = new Date(ub.started_at);
      const end = new Date(ub.completed_at);
      return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    });
    averageReadingDays = Math.round(
      readingDaysArray.reduce((a: number, b: number) => a + b, 0) / readingDaysArray.length
    );

    // 페이지 수가 있는 책들의 평균 계산
    const booksWithPages = completedUserBooks.filter((ub: any) => ub.books?.total_pages);
    if (booksWithPages.length > 0) {
      const pagesPerDayArray = booksWithPages.map((ub: any) => {
        const start = new Date(ub.started_at);
        const end = new Date(ub.completed_at);
        const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        return ub.books.total_pages / days;
      });
      averagePagesPerDay = Math.round(
        pagesPerDayArray.reduce((a: number, b: number) => a + b, 0) / pagesPerDayArray.length
      );
    }
  }

  // 6. 독서 속도 분류
  let reading_pace: ReadingPace | null = null;
  if (completedBooks >= 3) {
    if (averageReadingDays <= 7) {
      reading_pace = "fast";
    } else if (averageReadingDays <= 21) {
      reading_pace = "steady";
    } else {
      reading_pace = "slow";
    }
  }

  // 7. 기록 스타일 분석
  const noteTypeDistribution = {
    quote: 0,
    memo: 0,
    photo: 0,
    transcription: 0,
  };

  notes?.forEach((note: any) => {
    if (note.type in noteTypeDistribution) {
      noteTypeDistribution[note.type as keyof typeof noteTypeDistribution]++;
    }
  });

  let note_style: NoteStyle | null = null;
  if (totalNotes >= 5) {
    const quoteRatio = noteTypeDistribution.quote / totalNotes;
    const memoRatio = noteTypeDistribution.memo / totalNotes;
    const visualRatio = (noteTypeDistribution.photo + noteTypeDistribution.transcription) / totalNotes;

    if (quoteRatio >= 0.5) {
      note_style = "quote-focused";
    } else if (memoRatio >= 0.5) {
      note_style = "reflection-focused";
    } else if (visualRatio >= 0.5) {
      note_style = "visual";
    } else {
      note_style = "balanced";
    }
  }

  // 8. 활동 시간대 분석
  const activity_time_distribution: ActivityTimeDistribution = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };

  notes?.forEach((note: any) => {
    const hour = new Date(note.created_at).getHours();
    if (hour >= 6 && hour < 12) {
      activity_time_distribution.morning++;
    } else if (hour >= 12 && hour < 18) {
      activity_time_distribution.afternoon++;
    } else if (hour >= 18 && hour < 22) {
      activity_time_distribution.evening++;
    } else {
      activity_time_distribution.night++;
    }
  });

  let activity_pattern: ActivityPattern | null = null;
  if (totalNotes >= 5) {
    const maxTime = Math.max(
      activity_time_distribution.morning,
      activity_time_distribution.afternoon,
      activity_time_distribution.evening,
      activity_time_distribution.night
    );

    if (maxTime === activity_time_distribution.morning) {
      activity_pattern = "morning";
    } else if (maxTime === activity_time_distribution.afternoon) {
      activity_pattern = "afternoon";
    } else if (maxTime === activity_time_distribution.evening) {
      activity_pattern = "evening";
    } else {
      activity_pattern = "night";
    }
  }

  // 9. 그룹 참여 스타일
  let group_engagement: GroupEngagement = "solo";
  const approvedGroups = groupMemberships || [];

  if (approvedGroups.length > 0) {
    const leaderCount = approvedGroups.filter((g: any) => g.role === "leader").length;

    if (leaderCount >= 1) {
      group_engagement = "leader";
    } else if (approvedGroups.length >= 3) {
      group_engagement = "active";
    } else {
      group_engagement = "observer";
    }
  }

  // 10. 카테고리 선호도
  const categoryCounts: Record<string, number> = {};
  userBooks?.forEach((ub: any) => {
    const category = ub.books?.category || "기타";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const category_preferences: CategoryPreference[] = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: totalBooks > 0 ? Math.round((count / totalBooks) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 11. 통계 객체
  const reading_stats: ReadingStats = {
    totalBooks,
    completedBooks,
    readingBooks,
    averageReadingDays,
    averagePagesPerDay,
    totalNotes,
    noteTypeDistribution,
  };

  return {
    reading_pace,
    note_style,
    activity_pattern,
    group_engagement,
    reading_stats,
    category_preferences,
    activity_time_distribution,
    persona_summary: null, // AI가 생성
  };
}

/**
 * AI로 페르소나 요약 생성
 */
async function generatePersonaSummary(
  analysisResult: PersonaAnalysisResult
): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `다음 독서 성향 분석 결과를 바탕으로 사용자를 설명하는 짧은 문장을 작성해주세요.
2-3문장으로 간결하게, 친근한 어투로 작성해주세요.
특수문자, 이모지는 사용하지 마세요.

분석 결과:
- 독서 속도: ${analysisResult.reading_pace || "분석 불가"}
- 기록 스타일: ${analysisResult.note_style || "분석 불가"}
- 활동 시간: ${analysisResult.activity_pattern || "분석 불가"}
- 그룹 참여: ${analysisResult.group_engagement || "분석 불가"}
- 총 책 수: ${analysisResult.reading_stats.totalBooks}권
- 완독: ${analysisResult.reading_stats.completedBooks}권
- 총 기록: ${analysisResult.reading_stats.totalNotes}개
- 선호 카테고리: ${analysisResult.category_preferences.map((c) => c.category).join(", ") || "없음"}

예시:
"당신은 꾸준하게 책을 읽는 저녁형 독서가입니다. 소설과 에세이를 즐겨 읽으며, 인상적인 구절을 기록하는 것을 좋아합니다."`;

  try {
    const result = await model.generateContent(prompt);
    let summary = result.response.text().trim();

    // 따옴표 제거
    summary = summary.replace(/^["']|["']$/g, "");

    return summary;
  } catch (error) {
    console.error("페르소나 요약 생성 오류:", error);
    return "독서를 즐기는 분입니다.";
  }
}

/**
 * 페르소나 분석 및 저장
 */
export async function analyzeAndSavePersona(): Promise<UserPersona | null> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

  // 1. 데이터 분석
  const analysisResult = await analyzeReadingData(user.id);

  // 2. AI 요약 생성
  const persona_summary = await generatePersonaSummary(analysisResult);
  analysisResult.persona_summary = persona_summary;

  // 3. 기존 페르소나 확인
  const { data: existingPersona } = await supabase
    .from("user_personas")
    .select("id")
    .eq("user_id", user.id)
    .single();

  // 4. 저장 (upsert)
  const personaData = {
    user_id: user.id,
    reading_pace: analysisResult.reading_pace,
    note_style: analysisResult.note_style,
    activity_pattern: analysisResult.activity_pattern,
    group_engagement: analysisResult.group_engagement,
    reading_stats: analysisResult.reading_stats,
    category_preferences: analysisResult.category_preferences,
    persona_summary: analysisResult.persona_summary,
    last_analyzed_at: new Date().toISOString(),
  };

  let result;

  if (existingPersona) {
    // 업데이트
    const { data, error } = await supabase
      .from("user_personas")
      .update(personaData)
      .eq("id", existingPersona.id)
      .select()
      .single();

    if (error) {
      throw new Error(`페르소나 업데이트 실패: ${error.message}`);
    }
    result = data;
  } else {
    // 새로 생성
    const { data, error } = await supabase
      .from("user_personas")
      .insert(personaData)
      .select()
      .single();

    if (error) {
      throw new Error(`페르소나 생성 실패: ${error.message}`);
    }
    result = data;
  }

  // 페이지 캐시 무효화
  revalidatePath("/persona");

  return result as UserPersona;
}

/**
 * 페르소나 삭제
 */
export async function deletePersona(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("user_personas")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`페르소나 삭제 실패: ${error.message}`);
  }
}

/**
 * 페르소나 대시보드 데이터 조회
 */
export async function getPersonaDashboardData() {
  const persona = await getUserPersona();
  const needsAnalysis = await needsPersonaAnalysis();

  let analysisAge = 0;
  if (persona?.last_analyzed_at) {
    const lastAnalyzed = new Date(persona.last_analyzed_at);
    const now = new Date();
    analysisAge = Math.floor(
      (now.getTime() - lastAnalyzed.getTime()) / (1000 * 60 * 60)
    );
  }

  return {
    persona,
    needsAnalysis,
    lastAnalyzedAt: persona?.last_analyzed_at || null,
    analysisAge,
  };
}
