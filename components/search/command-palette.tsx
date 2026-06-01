"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Book, FileText, Users, Search } from "lucide-react";
import { searchAll } from "@/app/actions/search";
import { useTranslation } from "@/lib/i18n";

interface SearchResults {
  books: Array<{
    userBookId: string;
    bookId: string;
    title: string;
    author: string | null;
    status: string;
  }>;
  notes: Array<{
    id: string;
    type: string;
    title: string | null;
    preview: string;
    createdAt: string;
  }>;
  groups: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
}

interface CommandPaletteProps {
  /**
   * 외부에서 open 상태를 제어할 때 전달 (lazy wrapper 등). 미전달 시 내부 상태와 단축키로 자체 제어.
   */
  open?: boolean;
  onOpenChange?: (next: boolean) => void;
}

/**
 * 통합 검색 Command Palette
 * Cmd+K / Ctrl+K 단축키로 열림 (open prop이 없는 경우)
 * 책, 기록, 모임을 병렬 검색하여 카테고리별로 표시
 */
export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      if (isControlled) {
        const value = typeof next === "function" ? next(controlledOpen) : next;
        onOpenChange?.(value);
      } else {
        setInternalOpen(next);
      }
    },
    [isControlled, controlledOpen, onOpenChange]
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Cmd+K / Ctrl+K 단축키 — controlled 모드에서는 wrapper가 직접 처리하므로 비활성화.
  useEffect(() => {
    if (isControlled) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setInternalOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isControlled]);

  // 디바운스 검색
  const handleSearch = useCallback((value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchAll(value);
        setResults(data);
      } catch {
        setResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleSelect = useCallback((href: string) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(href);
  }, [router, setOpen]);

  const totalResults =
    (results?.books.length ?? 0) +
    (results?.notes.length ?? 0) +
    (results?.groups.length ?? 0);

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={t("search.commandPalettePlaceholder")}
          value={query}
          onValueChange={handleSearch}
        />
        <CommandList>
          {isSearching && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t("search.searching")}
            </div>
          )}

          {!isSearching && query && totalResults === 0 && (
            <CommandEmpty>{t("search.noResults")}</CommandEmpty>
          )}

          {results && results.books.length > 0 && (
            <CommandGroup heading={`${t("search.books")} ${results.books.length}${t("search.countUnit")}`}>
              {results.books.map((book) => (
                <CommandItem
                  key={`book-${book.userBookId}`}
                  value={`book-${book.title}`}
                  onSelect={() => handleSelect(`/books/${book.userBookId}`)}
                  className="cursor-pointer"
                >
                  <Book className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium">{book.title}</span>
                    {book.author && (
                      <span className="text-xs text-muted-foreground truncate">{book.author}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results && results.notes.length > 0 && (
            <CommandGroup heading={`${t("search.notes")} ${results.notes.length}${t("search.countUnit")}`}>
              {results.notes.map((note) => (
                <CommandItem
                  key={`note-${note.id}`}
                  value={`note-${note.title || note.preview}`}
                  onSelect={() => handleSelect(`/notes/${note.id}`)}
                  className="cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium">
                      {note.title || note.preview || t("search.untitledNote")}
                    </span>
                    {note.preview && note.title && (
                      <span className="text-xs text-muted-foreground truncate">{note.preview}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results && results.groups.length > 0 && (
            <CommandGroup heading={`${t("search.groups")} ${results.groups.length}${t("search.countUnit")}`}>
              {results.groups.map((group) => (
                <CommandItem
                  key={`group-${group.id}`}
                  value={`group-${group.name}`}
                  onSelect={() => handleSelect(`/groups/${group.id}`)}
                  className="cursor-pointer"
                >
                  <Users className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium">{group.name}</span>
                    {group.description && (
                      <span className="text-xs text-muted-foreground truncate">{group.description}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!query && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <Search className="mx-auto mb-2 h-5 w-5" />
              {t("search.commandPaletteHint")}
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
