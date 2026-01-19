"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteBook } from "@/app/actions/books";
import { BookStatusBadge } from "./book-status-badge";
import { BookNotesPreview } from "./book-notes-preview";
import { BookDeleteButton } from "./book-delete-button";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { BookOpen, FileText, Loader2, Users, BookOpen as BookOpenIcon, MoreVertical, Edit, ExternalLink, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateBookStatus, getBookDescriptionSummary } from "@/app/actions/books";
import { moveBookToBookshelf, getBookshelves } from "@/app/actions/bookshelves";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate, formatDateWithDashes } from "@/lib/utils/date";
import type { BookWithNotes } from "@/app/actions/books";
import type { ReadingStatus } from "@/types/book";
import { Bookshelf } from "@/types/bookshelf";

interface BookTableProps {
  books: BookWithNotes[];
}

/**
 * 제목에서 괄호 내용을 분리하는 함수
 * 예: "제목 (부제목)" -> { main: "제목", subtitle: "부제목" }
 */
function parseTitle(title: string): { main: string; subtitle: string | null } {
  // 괄호 패턴 찾기: (내용) 또는 (내용!)
  const match = title.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return {
      main: match[1].trim(),
      subtitle: match[2].trim(),
    };
  }
  return { main: title.trim(), subtitle: null };
}

/**
 * 제목에서 출판사 정보 제거
 * 제목 끝에 출판사명이 있는 경우 제거
 */
function removePublisherFromTitle(title: string, publisher: string | null): string {
  if (!publisher) return title;
  // 제목 끝에 출판사명이 있는지 확인
  const publisherPattern = new RegExp(`\\s*${publisher.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');
  return title.replace(publisherPattern, '').trim();
}

/**
 * 테이블 형태 책 목록 컴포넌트
 * habitree.io/search 페이지의 테이블 형태와 유사한 구조
 */
export function BookTable({ books }: BookTableProps) {
  const router = useRouter();
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [bookNotes, setBookNotes] = useState<Record<string, any[]>>({});
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [bookshelvesMap, setBookshelvesMap] = useState<Record<string, Bookshelf>>({});
  const [isLoadingBookshelves, setIsLoadingBookshelves] = useState(false);
  const [updatingBookshelf, setUpdatingBookshelf] = useState<Record<string, boolean>>({});
  const [bookDescriptions, setBookDescriptions] = useState<Record<string, string>>({});
  const [loadingDescriptions, setLoadingDescriptions] = useState<Record<string, boolean>>({});
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<Record<string, boolean>>({});
  const [confirmDeleteTitle, setConfirmDeleteTitle] = useState<Record<string, string>>({});

  // 서재 목록 로드
  useEffect(() => {
    async function loadBookshelves() {
      try {
        const data = await getBookshelves();
        setBookshelves(data);
        const map: Record<string, Bookshelf> = {};
        data.forEach((b) => {
          map[b.id] = b;
        });
        setBookshelvesMap(map);
      } catch (error) {
        console.error("서재 목록 조회 오류:", error);
      }
    }
    loadBookshelves();
  }, []);

  // 책소개 초기화 및 로드 (PC 버전에서만)
  useEffect(() => {
    // books가 없으면 스킵
    if (!books || books.length === 0) return;
    
    // PC 버전에서만 로드 (lg 이상)
    if (typeof window === "undefined") return;
    if (window.innerWidth < 1024) return;

    // 1. DB에서 가져온 description_summary 설정
    const initialDescriptions: Record<string, string> = {};
    for (const item of books) {
      if (!item || !item.books) continue;
      const book = item.books;
      // description_summary 우선 사용, 없으면 summary 사용
      if (book && book.description_summary && book.description_summary.trim().length > 0) {
        initialDescriptions[book.id] = book.description_summary;
      } else if (book && book.summary && book.summary.trim().length > 0) {
        initialDescriptions[book.id] = book.summary;
      }
    }
    setBookDescriptions((prev) => ({ ...prev, ...initialDescriptions }));

    // 2. summary가 없는 책만 API로 책소개 생성
    async function loadBookDescriptions() {
      const descriptionsToLoad: Array<{ bookId: string; isbn?: string | null; title?: string | null }> = [];

      for (const item of books) {
        if (!item || !item.books) continue;
        const book = item.books;
        // 이미 DB에 있거나 로드되었거나 로딩 중이면 스킵
        // description_summary 또는 summary가 있으면 스킵
        if (book.description_summary || book.summary || bookDescriptions[book.id] || loadingDescriptions[book.id]) {
          continue;
        }

        // ISBN이나 제목이 없으면 스킵
        if (!book.isbn && !book.title) {
          continue;
        }

        descriptionsToLoad.push({
          bookId: book.id,
          isbn: book.isbn,
          title: book.title,
        });
      }

      // 병렬로 로드 (최대 5개씩)
      const batchSize = 5;
      for (let i = 0; i < descriptionsToLoad.length; i += batchSize) {
        const batch = descriptionsToLoad.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async ({ bookId, isbn, title }) => {
            setLoadingDescriptions((prev) => ({ ...prev, [bookId]: true }));
            try {
              const summary = await getBookDescriptionSummary(bookId, isbn, title);
              if (summary) {
                setBookDescriptions((prev) => ({ ...prev, [bookId]: summary }));
              }
            } catch (error) {
              console.error(`책소개 요약 실패 (${title}):`, error);
            } finally {
              setLoadingDescriptions((prev) => {
                const next = { ...prev };
                delete next[bookId];
                return next;
              });
            }
          })
        );
      }
    }
    loadBookDescriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books]);

  const handleToggleNotes = async (bookId: string, userBookId: string) => {
    if (expandedBookId === userBookId) {
      setExpandedBookId(null);
      return;
    }

    setExpandedBookId(userBookId);

    // 이미 로드된 기록이 있으면 다시 로드하지 않음
    if (bookNotes[userBookId]) {
      return;
    }

    // 기록 로드 (API 라우트 사용)
    try {
      const response = await fetch(`/api/notes?bookId=${bookId}&limit=5`);
      if (!response.ok) {
        throw new Error("기록 로드 실패");
      }
      const data = await response.json();
      setBookNotes((prev) => ({
        ...prev,
        [userBookId]: data.notes || [],
      }));
    } catch (error) {
      console.error("기록 로드 실패:", error);
    }
  };

  const handleStatusChange = async (userBookId: string, newStatus: ReadingStatus) => {
    setUpdatingStatus((prev) => ({ ...prev, [userBookId]: true }));
    try {
      await updateBookStatus(userBookId, newStatus);
      toast.success("상태가 변경되었습니다.");
      router.refresh();
    } catch (error) {
      console.error("상태 변경 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "상태 변경에 실패했습니다."
      );
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [userBookId]: false }));
    }
  };

  const handleBookshelfChange = async (userBookId: string, bookshelfId: string) => {
    const book = books.find((b) => b.id === userBookId);
    const currentBookshelfId = (book as any)?.bookshelf_id || null;

    if (!bookshelfId || bookshelfId === currentBookshelfId) {
      return;
    }

    setUpdatingBookshelf((prev) => ({ ...prev, [userBookId]: true }));
    try {
      await moveBookToBookshelf(userBookId, bookshelfId);
      toast.success("서재가 변경되었습니다.");
      router.refresh();
    } catch (error) {
      console.error("서재 변경 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "서재 변경에 실패했습니다."
      );
    } finally {
      setUpdatingBookshelf((prev) => ({ ...prev, [userBookId]: false }));
    }
  };

  const handleDeleteClick = (userBookId: string) => {
    setDeleteDialogOpen((prev) => ({ ...prev, [userBookId]: true }));
    setConfirmDeleteTitle((prev) => ({ ...prev, [userBookId]: "" }));
  };

  const handleDeleteConfirm = async (userBookId: string, bookTitle: string) => {
    if (confirmDeleteTitle[userBookId]?.trim() !== bookTitle.trim()) {
      toast.error("책 제목이 일치하지 않습니다. 정확히 입력해주세요.");
      return;
    }

    setDeletingBookId(userBookId);
    try {
      await deleteBook(userBookId);
      toast.success("책이 삭제되었습니다.");
      setDeleteDialogOpen((prev) => ({ ...prev, [userBookId]: false }));
      setConfirmDeleteTitle((prev) => {
        const next = { ...prev };
        delete next[userBookId];
        return next;
      });
      router.push("/books");
    } catch (error) {
      console.error("책 삭제 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "책 삭제에 실패했습니다."
      );
    } finally {
      setDeletingBookId(null);
    }
  };

  const handleDeleteDialogClose = (userBookId: string, open: boolean) => {
    setDeleteDialogOpen((prev) => ({ ...prev, [userBookId]: open }));
    if (!open) {
      setConfirmDeleteTitle((prev) => {
        const next = { ...prev };
        delete next[userBookId];
        return next;
      });
    }
  };

  // books가 없거나 유효하지 않은 경우 처리
  if (!books || books.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        등록된 책이 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto overflow-y-visible" style={{ position: 'relative' }}>
        <table className="w-full border-collapse" style={{ minWidth: '100%', tableLayout: 'auto' }}>
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground" style={{ width: '120px', minWidth: '120px' }}>
                표지
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground" style={{ width: '250px', minWidth: '250px' }}>
                제목
              </th>
              <th className="hidden lg:table-cell px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground" style={{ width: 'auto', minWidth: '300px' }}>
                책소개
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground" style={{ width: '180px', minWidth: '180px' }}>
                상태/기록
              </th>
              <th className="hidden lg:table-cell px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground" style={{ width: '200px', minWidth: '200px' }}>
                책정보
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground" style={{ width: '80px', minWidth: '80px' }}>
                액션
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {books.map((item) => {
              // 데이터 유효성 검사
              if (!item || !item.books) {
                console.warn("BookTable: 유효하지 않은 책 데이터", item);
                return null;
              }
              
              const book = item.books;
              const hasValidImage =
                isValidImageUrl(book.cover_image_url) && book.cover_image_url;
              const notes = bookNotes[item.id] || [];

              return (
                <tr
                  key={item.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {/* 표지 */}
                  <td className="px-3 py-4 align-top" style={{ width: '120px', minWidth: '120px' }}>
                    <div className="relative w-16 h-24 sm:w-20 sm:h-32 lg:w-24 lg:h-36 mx-auto">
                      <Link href={`/books/${item.id}`} className="block relative w-full h-full">
                        <div className="relative w-full h-full rounded-md overflow-hidden bg-muted cursor-pointer hover:shadow-lg transition-all duration-300 shadow-md border border-black/5">
                          {hasValidImage ? (
                            <Image
                              src={getImageUrl(book.cover_image_url)}
                              alt={`${book.title} 표지`}
                              fill
                              className="object-cover hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 640px) 80px, (max-width: 1024px) 96px, 128px"
                              unoptimized={false}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                      </Link>
                      {/* 삭제 버튼 제거 (액션 메뉴에서 처리) */}
                    </div>
                  </td>

                  {/* 제목 */}
                  <td className="px-3 py-4 align-top" style={{ width: '250px', minWidth: '250px' }}>
                    <div className="space-y-1.5">
                      <div className="space-y-0.5">
                        {(() => {
                          // 출판사 정보 제거
                          const titleWithoutPublisher = removePublisherFromTitle(book.title, book.publisher);
                          // 괄호 내용 분리
                          const { main, subtitle } = parseTitle(titleWithoutPublisher);
                          
                          return (
                            <Link
                              href={`/books/${item.id}`}
                              className="block hover:text-primary transition-colors"
                            >
                              <div className="font-semibold text-sm leading-tight text-foreground">
                                {main}
                              </div>
                              {subtitle && (
                                <div className="text-xs text-muted-foreground leading-tight mt-0.5">
                                  ({subtitle})
                                </div>
                              )}
                            </Link>
                          );
                        })()}
                      </div>

                      {/* 읽는 이유 */}
                      {item.reading_reason && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 italic border-l-2 border-primary/20 pl-2 py-1 bg-muted/30 rounded-r mt-1.5">
                          "{item.reading_reason}"
                        </p>
                      )}

                      {/* 그룹 지정도서 */}
                      {item.groupBooks && item.groupBooks.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.groupBooks.map((gb) => (
                            <Badge
                              key={gb.group_id}
                              variant="outline"
                              className="text-[10px] px-1.5 py-0.5 border-primary/20 text-primary/80"
                              title={`${gb.group_name} 지정도서`}
                            >
                              <Users className="mr-0.5 h-2 w-2" />
                              {gb.group_name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 책소개 (PC 버전에서만 표시) */}
                  <td className="hidden lg:table-cell px-3 py-4 align-top" style={{ width: 'auto', minWidth: '300px', overflow: 'visible' }}>
                    <div 
                      className="text-xs text-foreground leading-relaxed pr-4"
                      style={{
                        overflow: 'visible',
                        textOverflow: 'clip',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word'
                      }}
                    >
                      {loadingDescriptions[book.id] ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-[11px]">요약 중...</span>
                        </div>
                      ) : book.description_summary || book.summary || bookDescriptions[book.id] ? (
                        <div 
                          className="text-xs text-foreground/95 leading-relaxed"
                          style={{ 
                            wordBreak: 'break-word', 
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal',
                            overflow: 'visible',
                            textOverflow: 'clip',
                            display: 'block',
                            width: '100%',
                            maxWidth: '100%',
                            minHeight: 'auto'
                          }}
                        >
                          {book.description_summary || book.summary || bookDescriptions[book.id]}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">-</span>
                      )}
                    </div>
                  </td>

                  {/* 상태/기록 그룹 */}
                  <td className="px-3 py-4 align-top" style={{ width: '180px', minWidth: '180px' }}>
                    <div className="space-y-2">
                      {/* 상태 */}
                      <div>
                        {updatingStatus[item.id] ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                            <Loader2 className="w-3 h-3 animate-spin" />
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full h-7 text-[11px] font-medium justify-center px-2.5 bg-background/50"
                                disabled={updatingStatus[item.id]}
                              >
                                <span className="truncate">
                                  {item.status === "not_started" && "읽기전"}
                                  {item.status === "reading" && "읽는 중"}
                                  {item.status === "completed" && "완독"}
                                  {item.status === "rereading" && "재독"}
                                  {item.status === "paused" && "중단"}
                                </span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[160px]" style={{ zIndex: 100 }}>
                              <DropdownMenuLabel className="text-xs">읽기 상태</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item.id, "not_started")}
                                disabled={item.status === "not_started" || updatingStatus[item.id]}
                                className={item.status === "not_started" ? "bg-accent" : ""}
                              >
                                읽기전
                                {item.status === "not_started" && " ✓"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item.id, "reading")}
                                disabled={item.status === "reading" || updatingStatus[item.id]}
                                className={item.status === "reading" ? "bg-accent" : ""}
                              >
                                읽는 중
                                {item.status === "reading" && " ✓"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item.id, "completed")}
                                disabled={item.status === "completed" || updatingStatus[item.id]}
                                className={item.status === "completed" ? "bg-accent" : ""}
                              >
                                완독
                                {item.status === "completed" && " ✓"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item.id, "rereading")}
                                disabled={item.status === "rereading" || updatingStatus[item.id]}
                                className={item.status === "rereading" ? "bg-accent" : ""}
                              >
                                재독
                                {item.status === "rereading" && " ✓"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item.id, "paused")}
                                disabled={item.status === "paused" || updatingStatus[item.id]}
                                className={item.status === "paused" ? "bg-accent" : ""}
                              >
                                중단
                                {item.status === "paused" && " ✓"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-xs">서재 이동</DropdownMenuLabel>
                              {isLoadingBookshelves ? (
                                <DropdownMenuItem disabled>
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  <span className="text-xs">로딩 중...</span>
                                </DropdownMenuItem>
                              ) : bookshelves.length === 0 ? (
                                <DropdownMenuItem disabled className="text-xs">서재가 없습니다</DropdownMenuItem>
                              ) : (
                                bookshelves.map((bookshelf) => {
                                  const currentBookshelfId = (item as any).bookshelf_id;
                                  return (
                                    <DropdownMenuItem
                                      key={bookshelf.id}
                                      onClick={() => handleBookshelfChange(item.id, bookshelf.id)}
                                      disabled={bookshelf.id === currentBookshelfId || updatingStatus[item.id] || updatingBookshelf[item.id]}
                                      className={bookshelf.id === currentBookshelfId ? "bg-accent" : ""}
                                    >
                                      <BookOpenIcon className="mr-2 h-3 w-3" />
                                      <span className="truncate">{bookshelf.name}</span>
                                      {bookshelf.id === currentBookshelfId && " ✓"}
                                    </DropdownMenuItem>
                                  );
                                })
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      
                      {/* 기록 */}
                      <Link href={`/books/${item.id}#book-info`} className="block">
                        <Button variant="ghost" size="sm" className="w-full h-7 text-[11px] text-foreground hover:text-primary hover:bg-muted justify-center px-2.5">
                          <FileText className="w-3 h-3 mr-1.5" aria-hidden="true" />
                          기록
                          {item.noteCount > 0 && (
                            <span className="ml-1 text-muted-foreground">({item.noteCount})</span>
                          )}
                        </Button>
                      </Link>
                    </div>
                  </td>

                  {/* 책정보 (태블릿 이하에서 숨김) */}
                  <td className="hidden lg:table-cell px-3 py-4 align-top" style={{ width: '200px', minWidth: '200px' }}>
                    <div className="space-y-1.5 text-xs">
                      {book.author && (
                        <div className="flex gap-2.5 items-start">
                          <span className="text-[11px] text-muted-foreground min-w-[3.5rem] shrink-0">저자</span>
                          <span className="text-xs text-foreground leading-relaxed break-words">{book.author.replace(/\^/g, ' / ')}</span>
                        </div>
                      )}
                      {book.publisher && (
                        <div className="flex gap-2.5 items-start">
                          <span className="text-[11px] text-muted-foreground min-w-[3.5rem] shrink-0">출판사</span>
                          <span className="text-xs text-foreground leading-relaxed break-words">{book.publisher}</span>
                        </div>
                      )}
                      {(() => {
                        let dates: string[] = [];
                        if (item.completed_dates) {
                          if (Array.isArray(item.completed_dates)) {
                            dates = item.completed_dates;
                          } else if (typeof item.completed_dates === 'string') {
                            try {
                              dates = JSON.parse(item.completed_dates);
                            } catch {
                              dates = [];
                            }
                          }
                        } else if (item.completed_at) {
                          dates = [item.completed_at];
                        }
                        return dates.length > 0 ? (
                          <div className="flex gap-2.5 items-start">
                            <span className="text-[11px] text-muted-foreground min-w-[3.5rem] shrink-0">완독일</span>
                            <div className="flex flex-col gap-1">
                              {dates.map((date: string, index: number) => {
                                try {
                                  const dateObj = new Date(date);
                                  const year = dateObj.getFullYear();
                                  const month = dateObj.getMonth() + 1;
                                  const day = dateObj.getDate();
                                  return (
                                    <div key={index} className="text-xs text-foreground leading-relaxed">
                                      {year}년 {month}월 {day}일
                                    </div>
                                  );
                                } catch {
                                  // 날짜 파싱 실패 시 원본 표시
                                  return (
                                    <div key={index} className="text-xs text-foreground leading-relaxed">
                                      {date}
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </td>

                  {/* 액션 메뉴 */}
                  <td className="px-3 py-4 align-middle" style={{ width: '80px', minWidth: '80px' }}>
                    <div className="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">액션 메뉴</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48" style={{ zIndex: 100 }}>
                          <DropdownMenuLabel className="text-xs">책 관리</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/books/${item.id}`}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              상세보기
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/books/${item.id}#book-info`}>
                              <Edit className="mr-2 h-4 w-4" />
                              책 정보 수정
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(item.id);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 삭제 확인 다이얼로그들 */}
      {books.map((item) => {
        if (!item || !item.books) return null;
        const book = item.books;
        return (
          <AlertDialog
            key={`delete-${item.id}`}
            open={deleteDialogOpen[item.id] || false}
            onOpenChange={(open) => handleDeleteDialogClose(item.id, open)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>책 삭제 확인</AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>
                    정말로 이 책을 삭제하시겠습니까?
                    <br />
                    이 책의 모든 기록도 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.
                  </p>
                  <div className="space-y-2 pt-2">
                    <Label htmlFor={`confirm-title-${item.id}`} className="text-sm font-medium">
                      삭제를 확인하려면 책 제목을 정확히 입력하세요:
                    </Label>
                    <p className="text-sm font-semibold text-foreground bg-muted p-2 rounded">
                      {book.title}
                    </p>
                    <Input
                      id={`confirm-title-${item.id}`}
                      value={confirmDeleteTitle[item.id] || ""}
                      onChange={(e) =>
                        setConfirmDeleteTitle((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      placeholder="책 제목 입력"
                      disabled={deletingBookId === item.id}
                      className="mt-2"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deletingBookId === item.id}>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteConfirm(item.id, book.title)}
                  disabled={
                    deletingBookId === item.id ||
                    (confirmDeleteTitle[item.id]?.trim() || "") !== book.title.trim()
                  }
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deletingBookId === item.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    "삭제"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      })}
    </div>
  );
}

