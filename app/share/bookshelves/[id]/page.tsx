import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicBookshelfWithBooks } from "@/app/actions/bookshelves";
import { getAppUrl } from "@/lib/utils/url";
import { isValidUUID } from "@/lib/utils/validation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Library, BookOpen } from "lucide-react";

/**
 * 공유 서재 메타데이터 생성
 */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const resolvedParams = await params;
  const bookshelfId = resolvedParams.id;

  if (!bookshelfId || typeof bookshelfId !== "string" || !isValidUUID(bookshelfId)) {
    return { title: "서재를 찾을 수 없습니다" };
  }

  const result = await getPublicBookshelfWithBooks(bookshelfId);

  if (!result) {
    return { title: "서재를 찾을 수 없습니다" };
  }

  const { bookshelf, books, owner } = result;
  const baseUrl = getAppUrl();
  const shareUrl = `${baseUrl}/share/bookshelves/${bookshelf.id}`;

  const ownerName = owner?.name || "ReadTree 사용자";
  const description = bookshelf.description
    || `${ownerName}님의 서재 - ${books.length}권의 책`;

  return {
    title: `${bookshelf.name} - ${ownerName}님의 서재`,
    description,
    openGraph: {
      title: `${bookshelf.name} - ${ownerName}님의 서재`,
      description,
      type: "website",
      url: shareUrl,
      siteName: "ReadTree",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary",
      title: `${bookshelf.name} - ${ownerName}님의 서재`,
      description,
    },
  };
}

/**
 * 읽기 상태 라벨 매핑
 */
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    reading: "읽는 중",
    completed: "완독",
    paused: "일시정지",
    not_started: "읽기 전",
    rereading: "재독",
  };
  return statusMap[status] || status;
}

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    reading: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    not_started: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
    rereading: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };
  return colorMap[status] || "bg-gray-100 text-gray-700";
}

/**
 * 공유 서재 페이지
 */
export default async function ShareBookshelfPage({
  params,
}: {
  params: { id: string };
}) {
  const resolvedParams = await params;
  const bookshelfId = resolvedParams.id;

  if (!bookshelfId || typeof bookshelfId !== "string" || !isValidUUID(bookshelfId)) {
    notFound();
  }

  const result = await getPublicBookshelfWithBooks(bookshelfId);

  if (!result) {
    notFound();
  }

  const { bookshelf, books, owner } = result;
  const ownerName = owner?.name || "ReadTree 사용자";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-primary/20">
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-5xl">
        {/* 상단 액션 바 */}
        <div className="flex items-center justify-between mb-10">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
            <Link href="/">
              <ChevronLeft className="w-4 h-4 mr-1" />
              메인으로
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Public Shared Bookshelf
            </div>
          </div>
        </div>

        {/* 서재 정보 카드 */}
        <div className="relative group mb-10">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Library className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {bookshelf.name}
                </h1>
                {bookshelf.description && (
                  <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    {bookshelf.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-3 text-sm text-slate-400">
                  <span>{ownerName}님의 서재</span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {books.length}권
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 책 목록 그리드 */}
        {books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="group/book bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* 표지 */}
                <div className="aspect-[2/3] relative bg-slate-100 dark:bg-slate-800">
                  {book.cover_image_url ? (
                    <Image
                      src={book.cover_image_url}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3">
                      <span className="text-xs text-slate-400 text-center line-clamp-3">
                        {book.title}
                      </span>
                    </div>
                  )}
                </div>
                {/* 정보 */}
                <div className="p-3">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                    {book.title}
                  </h3>
                  {book.author && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                      {book.author}
                    </p>
                  )}
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(book.status)}`}>
                      {getStatusLabel(book.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">
              이 서재에는 아직 책이 없습니다.
            </p>
          </div>
        )}

        {/* 하단 CTA */}
        <div className="mt-16 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 italic tracking-tight">
              ReadTree
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              나만의 서재를 만들고 독서 기록을 시작해보세요.<br />
              읽은 책을 정리하고 생각을 기록할 수 있습니다.
            </p>
          </div>
          <Button asChild className="rounded-full px-8 h-12 text-sm font-bold shadow-xl shadow-primary/20 transition-transform duration-300 hover:scale-105 active:scale-95">
            <Link href="/login">
              나도 서재 만들기
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
