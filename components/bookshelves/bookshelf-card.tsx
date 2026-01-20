"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookshelfWithStats } from "@/types/bookshelf";
import { BookOpen, Library } from "lucide-react";

interface BookshelfCardProps {
  bookshelf: BookshelfWithStats;
  isGuest?: boolean;
}

export function BookshelfCard({ bookshelf, isGuest = false }: BookshelfCardProps) {
  const isMain = bookshelf.is_main;

  return (
    <Link href={isMain ? "/books" : `/bookshelves/${bookshelf.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {isMain ? (
                <Library className="h-5 w-5 text-primary" />
              ) : (
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              )}
              <CardTitle className="text-lg">{bookshelf.name}</CardTitle>
            </div>
            {isMain && (
              <Badge variant="secondary" className="text-xs">
                통합
              </Badge>
            )}
          </div>
          {bookshelf.description && (
            <CardDescription className="mt-2">{bookshelf.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">전체</span>
              <span className="font-semibold">{bookshelf.book_count}권</span>
            </div>
            {bookshelf.book_count > 0 && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">읽는 중</span>
                  <span>{bookshelf.reading_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">완독</span>
                  <span>{bookshelf.completed_count}</span>
                </div>
                {bookshelf.paused_count > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">일시정지</span>
                    <span>{bookshelf.paused_count}</span>
                  </div>
                )}
                {bookshelf.rereading_count > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">재독</span>
                    <span>{bookshelf.rereading_count}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
