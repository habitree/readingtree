"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { X, Trash2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getUserTags, deleteTag, getTagUsageCount } from "@/app/actions/notes";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  /** AI 태그 추천을 위한 노트 텍스트 내용 */
  noteContent?: string;
}

/**
 * 태그 입력 컴포넌트
 * 자동완성 및 저장된 태그 목록 제공
 */
export function TagInput({ value, onChange, placeholder, label, noteContent }: TagInputProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder || t("notes.tagInputPlaceholder");
  const resolvedLabel = label || t("notes.tagLabel");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedTagsForDelete, setSelectedTagsForDelete] = useState<Set<string>>(new Set());
  const [isAiLoading, setIsAiLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 사용자 태그 목록 로드
  useEffect(() => {
    loadUserTags();
  }, []);

  // value prop 변경 시 inputValue 동기화
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const loadUserTags = async () => {
    try {
      const tags = await getUserTags();
      setUserTags(tags);
    } catch (error) {
      console.error("태그 목록 로드 오류:", error);
    }
  };

  // AI 태그 추천 요청
  const handleAiTagSuggestion = async () => {
    if (!noteContent || noteContent.trim().length < 10) {
      toast.info(t("notes.aiTagNeedContent"));
      return;
    }

    setIsAiLoading(true);
    try {
      const response = await fetch("/api/ai/auto-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || t("notes.aiTagFailed"));
        return;
      }

      if (!data.tags || data.tags.length === 0) {
        toast.info(t("notes.aiTagNoResult"));
        return;
      }

      // 기존 태그와 합치기 (중복 제거, 10개 제한)
      const currentTags = inputValue
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const newTags = data.tags.filter((tag: string) => !currentTags.includes(tag));
      const mergedTags = [...currentTags, ...newTags].slice(0, 10);

      const newValue = mergedTags.join(", ") + ", ";
      setInputValue(newValue);
      onChange(newValue);

      toast.success(t("notes.aiTagSuccess", { count: newTags.length }));
    } catch (error) {
      console.error("[TagInput] AI 태그 추천 오류:", error);
      toast.error(t("notes.aiTagFailed"));
    } finally {
      setIsAiLoading(false);
    }
  };

  // 태그 완전 삭제 (단일)
  const handleDeleteTag = async (tag: string) => {
    try {
      // 태그 사용 횟수 확인
      const usageCount = await getTagUsageCount(tag);
      
      if (usageCount === 0) {
        toast.info(t("notes.tagAlreadyUnused"));
        // 태그 목록 새로고침 (이미 삭제된 경우)
        await loadUserTags();
        return;
      }

      // 태그 삭제
      const result = await deleteTag(tag);
      
      if (result.success) {
        if (result.updatedCount > 0) {
          toast.success(t("notes.tagDeletedSuccess", { tag, count: result.updatedCount }));
        } else {
          toast.info(t("notes.tagDeletedNoUsage", { tag }));
        }
        
        // 태그 목록 새로고침
        await loadUserTags();
        
        // 입력 필드에서도 해당 태그 제거 (있는 경우)
        const currentTags = inputValue
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        
        if (currentTags.includes(tag)) {
          handleTagRemove(tag);
        }
      }
    } catch (error) {
      console.error("태그 삭제 오류:", error);
      toast.error(
        error instanceof Error ? error.message : t("notes.tagDeleteFailed")
      );
    }
  };

  // 선택된 태그들 일괄 삭제
  const handleBatchDeleteTags = async () => {
    if (selectedTagsForDelete.size === 0) {
      toast.info(t("notes.selectTagsToDelete"));
      return;
    }

    try {
      const tagsToDelete = Array.from(selectedTagsForDelete);
      let totalUpdatedCount = 0;
      let successCount = 0;
      let failCount = 0;

      const results = await Promise.allSettled(
        tagsToDelete.map((tag) => deleteTag(tag))
      );

      for (const result of results) {
        if (result.status === "fulfilled" && result.value.success) {
          totalUpdatedCount += result.value.updatedCount || 0;
          successCount++;
        } else {
          failCount++;
        }
      }

      // 태그 목록 새로고침
      await loadUserTags();

      // 입력 필드에서도 해당 태그들 제거
      const currentTags = inputValue
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .filter((tag) => !selectedTagsForDelete.has(tag));
      
      const newValue = currentTags.length > 0 
        ? currentTags.join(", ") + ", "
        : "";
      setInputValue(newValue);
      onChange(newValue);

      // 삭제 모드 종료 및 선택 초기화
      setIsDeleteMode(false);
      setSelectedTagsForDelete(new Set());

      if (successCount > 0) {
        toast.success(
          t("notes.tagBatchDeleteSuccess", { count: successCount, total: totalUpdatedCount })
        );
      }
      if (failCount > 0) {
        toast.error(t("notes.tagBatchDeleteFailed", { count: failCount }));
      }
    } catch (error) {
      console.error("태그 일괄 삭제 오류:", error);
      toast.error(t("notes.tagBatchDeleteError"));
    }
  };

  // 삭제 모드에서 태그 선택/해제
  const handleTagToggleForDelete = (tag: string) => {
    const newSelected = new Set(selectedTagsForDelete);
    if (newSelected.has(tag)) {
      newSelected.delete(tag);
    } else {
      newSelected.add(tag);
    }
    setSelectedTagsForDelete(newSelected);
  };

  // 입력값 변경 시 자동완성 필터링 및 태그 개수 검증
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // 현재 입력된 태그 개수 확인
    const currentTags = newValue
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    
    // 태그 개수 제한 (10개)
    if (currentTags.length > 10) {
      toast.error(t("notes.tagMaxError"));
      // 10개까지만 유지
      const limitedTags = currentTags.slice(0, 10);
      const limitedValue = limitedTags.join(", ") + (newValue.endsWith(",") ? ", " : "");
      setInputValue(limitedValue);
      onChange(limitedValue);
      return;
    }
    
    setInputValue(newValue);
    onChange(newValue);

    // 마지막 쉼표 이후의 텍스트 추출
    const lastCommaIndex = newValue.lastIndexOf(",");
    const currentTag = lastCommaIndex >= 0 
      ? newValue.substring(lastCommaIndex + 1).trim()
      : newValue.trim();

    if (currentTag.length > 0) {
      // 사용자 태그 중에서 현재 입력과 일치하는 태그 필터링
      const filtered = userTags.filter((tag) =>
        tag.toLowerCase().includes(currentTag.toLowerCase()) &&
        !newValue.toLowerCase().includes(tag.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 10)); // 최대 10개만 표시
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // 태그 선택
  const handleTagSelect = (tag: string) => {
    const currentTags = inputValue
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    
    // 태그 개수 제한 확인
    if (currentTags.length >= 10) {
      toast.error(t("notes.tagMaxError"));
      setShowSuggestions(false);
      return;
    }
    
    const lastCommaIndex = inputValue.lastIndexOf(",");
    const beforeComma = lastCommaIndex >= 0 
      ? inputValue.substring(0, lastCommaIndex + 1)
      : "";
    const newValue = beforeComma + (beforeComma ? " " : "") + tag + ", ";
    setInputValue(newValue);
    onChange(newValue);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // 저장된 태그 클릭으로 추가 (삭제 모드가 아닐 때만)
  const handleSavedTagClick = (tag: string) => {
    if (isDeleteMode) {
      // 삭제 모드일 때는 선택/해제만
      handleTagToggleForDelete(tag);
      return;
    }

    const currentTags = inputValue
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    
    // 태그 개수 제한 확인
    if (currentTags.length >= 10) {
      toast.error(t("notes.tagMaxError"));
      return;
    }
    
    if (!currentTags.includes(tag)) {
      const newValue = currentTags.length > 0 
        ? [...currentTags, tag].join(", ") + ", "
        : tag + ", ";
      setInputValue(newValue);
      onChange(newValue);
      inputRef.current?.focus();
    }
  };

  // 태그 삭제
  const handleTagRemove = (tagToRemove: string) => {
    const currentTags = inputValue
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((tag) => tag !== tagToRemove);
    
    const newValue = currentTags.length > 0 
      ? currentTags.join(", ") + ", "
      : "";
    setInputValue(newValue);
    onChange(newValue);
    inputRef.current?.focus();
  };

  // 키보드 이벤트 처리 (백스페이스로 마지막 태그 삭제)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 백스페이스 키이고 입력 필드가 비어있을 때
    if (e.key === "Backspace" && inputValue.trim() === "") {
      const currentTags = inputValue
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      
      if (currentTags.length > 0) {
        // 마지막 태그 제거
        const newTags = currentTags.slice(0, -1);
        const newValue = newTags.length > 0 
          ? newTags.join(", ") + ", "
          : "";
        setInputValue(newValue);
        onChange(newValue);
        e.preventDefault();
      }
    }
  };

  // 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 현재 입력된 태그 목록
  const currentTags = inputValue
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // 사용 가능한 태그 (이미 입력된 태그 제외)
  const availableTags = userTags.filter((tag) => !currentTags.includes(tag));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="tags">{resolvedLabel}</Label>
        {noteContent && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={handleAiTagSuggestion}
            disabled={isAiLoading || !noteContent || noteContent.trim().length < 10}
          >
            {isAiLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 text-amber-500" />
            )}
            {t("notes.aiTagBtn")}
          </Button>
        )}
      </div>
      <div className="relative">
        <Input
          ref={inputRef}
          id="tags"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={resolvedPlaceholder}
        />
        
        {/* 자동완성 목록 */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto"
          >
            {suggestions.map((tag, index) => (
              <button
                key={index}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onClick={() => handleTagSelect(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 저장된 태그 목록 (사용 가능한 태그만 표시) */}
      {availableTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {t("notes.savedTags")} <span className="text-foreground">{t("notes.savedTagsClickToAdd")}</span>
            </p>
            <div className="flex items-center gap-2">
              {isDeleteMode && (
                <span className="text-xs text-muted-foreground">
                  {t("notes.selectedTagCount", { count: selectedTagsForDelete.size })}
                </span>
              )}
              <Button
                type="button"
                variant={isDeleteMode ? "default" : "outline"}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  if (isDeleteMode) {
                    // 삭제 모드 종료
                    setIsDeleteMode(false);
                    setSelectedTagsForDelete(new Set());
                  } else {
                    // 삭제 모드 시작
                    setIsDeleteMode(true);
                  }
                }}
              >
                {isDeleteMode ? t("notes.cancel") : t("notes.deleteTagBtn")}
              </Button>
              {isDeleteMode && selectedTagsForDelete.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      {t("notes.deleteSelected", { count: selectedTagsForDelete.size })}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("notes.confirmDeleteTagsTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("notes.confirmDeleteTagsDesc", { count: selectedTagsForDelete.size })}
                        <br />
                        {t("notes.confirmDeleteTagsNote")}
                        <br />
                        <span className="text-destructive font-semibold">
                          {t("notes.deleteIrreversible")}
                        </span>
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm font-medium mb-1">{t("notes.tagsToDelete")}</p>
                          <div className="flex flex-wrap gap-1">
                            {Array.from(selectedTagsForDelete).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("notes.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBatchDeleteTags}
                        variant="destructive"
                      >
                        {t("notes.deleteAction")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.slice(0, 20).map((tag, index) => {
              const isSelected = selectedTagsForDelete.has(tag);
              return (
                <Badge
                  key={index}
                  variant={isDeleteMode ? (isSelected ? "destructive" : "outline") : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors px-3 py-1 text-sm h-7 flex items-center",
                    isDeleteMode
                      ? isSelected
                        ? "bg-destructive text-destructive-foreground"
                        : "hover:bg-muted"
                      : "hover:bg-primary hover:text-primary-foreground"
                  )}
                  onClick={() => handleSavedTagClick(tag)}
                  title={isDeleteMode ? (isSelected ? t("notes.deselectTag") : t("notes.selectToDelete")) : t("notes.clickToAdd")}
                >
                  <span className="truncate max-w-[120px]">{tag}</span>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* 현재 입력된 태그 미리보기 */}
      {currentTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {t("notes.enteredTags")}
              <span className={`ml-1 font-semibold ${currentTags.length >= 10 ? "text-destructive" : "text-foreground"}`}>
                {currentTags.length}/10
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentTags.map((tag, index) => (
              <div
                key={index}
                className="group inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full pl-3 pr-1 py-1 text-sm"
              >
                <span className="truncate max-w-[120px]">{tag}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTagRemove(tag);
                  }}
                  className="ml-1 h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors shrink-0"
                  aria-label={t("notes.tagRemoveAriaLabel", { tag })}
                  title={t("notes.tagRemoveTitle")}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          {currentTags.length >= 10 && (
            <p className="text-xs text-destructive font-medium">
              {t("notes.tagMaxError")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

