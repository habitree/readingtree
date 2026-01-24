"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Search, BookOpen, Loader2 } from "lucide-react";
import Image from "next/image";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { cn } from "@/lib/utils";
import type { NoteType } from "@/types/note";
import { getUserBooks } from "@/app/actions/books";
import { getUserTags } from "@/app/actions/notes";

interface SearchFiltersProps {
  onBooksLoaded?: (books: Array<{ id: string; books: { title: string } }>) => void;
}

/**
 * 검색 필터 컴포넌트
 * 책 제목, 날짜, 태그, 유형 필터 제공
 */
export function SearchFilters({ onBooksLoaded }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<Array<{ id: string; books: { title: string } }>>([]);
  const [userTags, setUserTags] = useState<string[]>([]);

  const bookId = searchParams.get("bookId") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const tagsParam = searchParams.get("tags") || "";
  const types = searchParams.get("types") || "";

  // 선택된 태그 배열
  const selectedTags = tagsParam
    ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    // 책 목록 및 태그 목록 로드
    Promise.all([
      getUserBooks(),
      getUserTags(),
    ])
      .then(([booksData, tagsData]) => {
        setBooks(booksData as any);
        onBooksLoaded?.(booksData as any);
        setUserTags(tagsData);
      })
      .catch((error) => {
        console.error("데이터 로드 오류:", error);
      });
  }, [onBooksLoaded]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // 필터 변경 시 첫 페이지로
    router.push(`/search?${params.toString()}`);
  };

  const clearFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  };

  // 태그 선택/해제
  const toggleTag = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentTags = selectedTags;
    
    if (currentTags.includes(tag)) {
      // 태그 제거
      const newTags = currentTags.filter((t) => t !== tag);
      if (newTags.length > 0) {
        params.set("tags", newTags.join(","));
      } else {
        params.delete("tags");
      }
    } else {
      // 태그 추가
      const newTags = [...currentTags, tag];
      params.set("tags", newTags.join(","));
    }
    
    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  };


  // 책 검색 관련 상태
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [bookSuggestions, setBookSuggestions] = useState<Array<{ id: string; books: { title: string; author?: string | null; cover_image_url?: string | null } }>>([]);
  const [showBookSuggestions, setShowBookSuggestions] = useState(false);
  const [selectedBookIndex, setSelectedBookIndex] = useState(0);
  const bookInputRef = useRef<HTMLInputElement>(null);
  const bookSuggestionsRef = useRef<HTMLDivElement>(null);

  // 선택된 책 정보
  const selectedBook = books.find((b) => b.id === bookId);
  const selectedBookTitle = selectedBook ? (selectedBook as any).books?.title : "";

  // 책 검색 필터링
  useEffect(() => {
    if (!bookSearchQuery.trim()) {
      setBookSuggestions([]);
      return;
    }

    const filtered = books.filter((userBook) => {
      const book = (userBook as any).books;
      const title = book?.title?.toLowerCase() || "";
      const author = book?.author?.toLowerCase() || "";
      const query = bookSearchQuery.toLowerCase();
      return title.includes(query) || author.includes(query);
    });

    setBookSuggestions(filtered.slice(0, 10)); // 최대 10개만 표시
    setShowBookSuggestions(filtered.length > 0);
  }, [bookSearchQuery, books]);

  // 책 선택 핸들러
  const handleBookSelect = (userBook: { id: string; books: { title: string } }) => {
    updateFilter("bookId", userBook.id);
    setBookSearchQuery("");
    setShowBookSuggestions(false);
    if (bookInputRef.current) {
      bookInputRef.current.blur();
    }
  };

  // 책 검색 입력 핸들러
  const handleBookSearchChange = (value: string) => {
    setBookSearchQuery(value);
    if (value.trim()) {
      setShowBookSuggestions(true);
    }
  };

  // 책 검색 키보드 네비게이션
  const handleBookSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showBookSuggestions && bookSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedBookIndex((prev) => (prev + 1) % bookSuggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedBookIndex((prev) => (prev - 1 + bookSuggestions.length) % bookSuggestions.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (bookSuggestions[selectedBookIndex]) {
          handleBookSelect(bookSuggestions[selectedBookIndex]);
        }
      } else if (e.key === "Escape") {
        setShowBookSuggestions(false);
        setBookSearchQuery("");
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 책 제목 필터 - 자동완성 검색 */}
      <div className="space-y-2">
        <Label>책 제목</Label>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={bookInputRef}
              type="search"
              placeholder={selectedBookTitle || "책 제목으로 검색..."}
              value={bookSearchQuery}
              onChange={(e) => handleBookSearchChange(e.target.value)}
              onKeyDown={handleBookSearchKeyDown}
              onFocus={() => {
                if (bookSuggestions.length > 0) {
                  setShowBookSuggestions(true);
                }
              }}
              onBlur={(e) => {
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (relatedTarget && bookSuggestionsRef.current?.contains(relatedTarget)) {
                  return;
                }
                setTimeout(() => {
                  if (!bookSuggestionsRef.current?.contains(document.activeElement)) {
                    setShowBookSuggestions(false);
                  }
                }, 200);
              }}
              className="pl-10"
            />
          </div>

          {/* 책 자동완성 목록 */}
          {showBookSuggestions && bookSuggestions.length > 0 && (
            <div
              ref={bookSuggestionsRef}
              className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {bookSuggestions.map((userBook, index) => {
                const book = (userBook as any).books;
                const hasValidImage = isValidImageUrl(book?.cover_image_url) && book?.cover_image_url;
                return (
                  <button
                    key={userBook.id}
                    type="button"
                    className={cn(
                      "w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-center gap-3",
                      index === selectedBookIndex && "bg-accent"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleBookSelect(userBook);
                    }}
                    onMouseEnter={() => setSelectedBookIndex(index)}
                  >
                    {/* 책 표지 */}
                    <div className="relative w-10 h-14 shrink-0 overflow-hidden rounded bg-muted">
                      {hasValidImage ? (
                        <Image
                          src={getImageUrl(book.cover_image_url!)}
                          alt={book.title || "책 표지"}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {/* 책 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {book?.title || "제목 없음"}
                      </div>
                      {book?.author && (
                        <div className="text-xs text-muted-foreground truncate">
                          {book.author}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {bookId && selectedBookTitle && (
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full pl-3 pr-1 py-1 text-sm">
              <span className="truncate max-w-[150px]">{selectedBookTitle}</span>
              <button
                type="button"
                onClick={() => clearFilter("bookId")}
                className="ml-1 h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                aria-label="책 필터 제거"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 날짜 필터 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>시작일</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => updateFilter("startDate", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>종료일</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => updateFilter("endDate", e.target.value)}
          />
        </div>
      </div>
      {(startDate || endDate) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearFilter("startDate");
            clearFilter("endDate");
          }}
          className="h-6 px-2"
        >
          <X className="h-3 w-3 mr-1" />
          날짜 필터 제거
        </Button>
      )}

      {/* 유형 필터 */}
      <div className="space-y-2">
        <Label>기록 유형</Label>
        <Select 
          value={
            // types에 quote나 transcription이 포함되어 있으면 "transcription"으로 표시
            !types || types === "all" 
              ? "all" 
              : types.includes("quote") || types.includes("transcription")
              ? "transcription"
              : types
          }
          onValueChange={(value) => {
            // "필사" 선택 시 quote와 transcription 둘 다 검색하도록 처리
            if (value === "transcription") {
              updateFilter("types", "quote,transcription");
            } else {
              updateFilter("types", value === "all" ? "" : value);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="transcription">필사</SelectItem>
            <SelectItem value="photo">사진</SelectItem>
            <SelectItem value="memo">기록</SelectItem>
          </SelectContent>
        </Select>
        {types && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearFilter("types")}
            className="h-6 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            필터 제거
          </Button>
        )}
      </div>

      {/* 태그 필터 */}
      <div className="space-y-2">
        <Label>태그</Label>
        {userTags.length > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
              {userTags.map((tag, index) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <Badge
                    key={index}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground hover:bg-primary/80"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
            {selectedTags.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">선택된 태그:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map((tag, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full pl-3 pr-1 py-1 text-sm"
                    >
                      <span className="truncate max-w-[100px]">{tag}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTag(tag);
                        }}
                        className="ml-1 h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        aria-label={`${tag} 태그 제거`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("tags")}
                  className="h-6 px-2 mt-1"
                >
                  <X className="h-3 w-3 mr-1" />
                  모든 태그 제거
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">저장된 태그가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
