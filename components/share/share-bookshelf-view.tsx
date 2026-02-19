"use client";

import { useTranslation } from "@/lib/i18n";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Library, BookOpen } from "lucide-react";
import { ShareCtaSection } from "./share-cta-section";

interface BookItem {
  id: string;
  title: string;
  author?: string | null;
  cover_image_url?: string | null;
  status: string;
}

interface BookshelfData {
  id: string;
  name: string;
  description?: string | null;
}

interface ShareBookshelfViewProps {
  bookshelf: BookshelfData;
  books: BookItem[];
  ownerName: string;
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

export function ShareBookshelfView({ bookshelf, books, ownerName }: ShareBookshelfViewProps) {
  const { t } = useTranslation();

  function getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      reading: t("books.statusReading"),
      completed: t("books.statusCompleted"),
      paused: t("books.statusPaused"),
      not_started: t("books.statusNotStarted"),
      rereading: t("books.statusRereading"),
    };
    return statusMap[status] || status;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-primary/20">
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-5xl">
        {/* 상단 액션 바 */}
        <div className="flex items-center justify-between mb-10">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
            <Link href="/">
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t("share.backToMain")}
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
                  <span>{t("share.ownerBookshelf", { name: ownerName })}</span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {t("share.bookCountUnit", { count: books.length })}
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
              {t("share.emptyBookshelf")}
            </p>
          </div>
        )}

        {/* 하단 CTA */}
        <ShareCtaSection variant="bookshelf" />
      </div>
    </div>
  );
}
