import type { DailyBookActivity } from "@/app/actions/stats";

/**
 * 게스트용 데모 월별 활동 데이터 생성
 * 실제 샘플 데이터가 없을 때 캘린더를 채워서 보여주기 위한 정적 데모 데이터
 */
export function generateDemoMonthlyActivities(
  year: number,
  month: number
): Record<string, DailyBookActivity> {
  const demoBooks = [
    { bookId: "demo-1", userBookId: "demo-ub-1", title: "어린 왕자", coverImageUrl: null },
    { bookId: "demo-2", userBookId: "demo-ub-2", title: "나미야 잡화점의 기적", coverImageUrl: null },
    { bookId: "demo-3", userBookId: "demo-ub-3", title: "소년이 온다", coverImageUrl: null },
    { bookId: "demo-4", userBookId: "demo-ub-4", title: "달러구트 꿈 백화점", coverImageUrl: null },
    { bookId: "demo-5", userBookId: "demo-ub-5", title: "불편한 편의점", coverImageUrl: null },
  ];

  // 해당 월의 총 일수
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const kstToday = new Date(today.getTime() + 9 * 60 * 60 * 1000);
  const todayDate = kstToday.getUTCDate();
  const isCurrentMonth = kstToday.getUTCFullYear() === year && kstToday.getUTCMonth() + 1 === month;

  // 활동일 패턴: 한 달에 12~15일 정도 (주 3~4일 독서)
  const activeDayPattern = [1, 2, 4, 5, 7, 9, 11, 13, 15, 16, 18, 20, 22, 24, 26, 28];
  const activeDays = activeDayPattern.filter((d) => {
    if (d > daysInMonth) return false;
    if (isCurrentMonth && d > todayDate) return false;
    return true;
  });

  const noteTypeVariants: Array<DailyBookActivity["noteTypes"]> = [
    { transcription: 1, photo: 0, memo: 1, quote: 0, progress: 0, total: 2 },
    { transcription: 0, photo: 1, memo: 0, quote: 1, progress: 1, total: 3 },
    { transcription: 1, photo: 0, memo: 0, quote: 0, progress: 1, total: 2 },
    { transcription: 0, photo: 0, memo: 1, quote: 1, progress: 0, total: 2 },
    { transcription: 2, photo: 1, memo: 0, quote: 0, progress: 0, total: 3 },
    { transcription: 0, photo: 0, memo: 1, quote: 0, progress: 1, total: 2 },
  ];

  const activities: Record<string, DailyBookActivity> = {};

  for (let i = 0; i < activeDays.length; i++) {
    const day = activeDays[i];
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // 일자에 따라 책 1~2권 배정
    const bookCount = i % 3 === 0 ? 2 : 1;
    const bookStartIdx = i % demoBooks.length;
    const dayBooks = [];
    for (let b = 0; b < bookCount; b++) {
      dayBooks.push(demoBooks[(bookStartIdx + b) % demoBooks.length]);
    }

    activities[dateKey] = {
      date: dateKey,
      books: dayBooks,
      noteTypes: noteTypeVariants[i % noteTypeVariants.length],
    };
  }

  return activities;
}
