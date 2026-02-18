"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  FileText,
  Quote,
  MessageSquare,
  Lightbulb,
  Heart,
  Target,
  Sparkles,
  Plus,
  X,
  Check,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  icon: typeof FileText;
  color: string;
  bgColor: string;
  quotePrompt?: string;
  memoPrompt?: string;
}

// 기본 제공 템플릿
const DEFAULT_TEMPLATES: NoteTemplate[] = [
  {
    id: "simple",
    name: "간단 메모",
    description: "빠르게 생각을 기록해요",
    icon: MessageSquare,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    memoPrompt: "",
  },
  {
    id: "quote-reflection",
    name: "인용구 + 생각",
    description: "좋은 문장과 나의 생각을 함께",
    icon: Quote,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    quotePrompt: "인상 깊은 문장을 적어보세요...",
    memoPrompt: "이 문장이 나에게 어떤 의미인가요?",
  },
  {
    id: "insight",
    name: "인사이트",
    description: "책에서 얻은 깨달음을 정리",
    icon: Lightbulb,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    memoPrompt: "이 책에서 얻은 가장 큰 인사이트는 무엇인가요?",
  },
  {
    id: "emotion",
    name: "감정 기록",
    description: "책을 읽으며 느낀 감정",
    icon: Heart,
    color: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    memoPrompt: "이 장면/문장을 읽으며 어떤 감정을 느꼈나요?",
  },
  {
    id: "action",
    name: "실천 계획",
    description: "책에서 배운 것을 실천으로",
    icon: Target,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    quotePrompt: "실천하고 싶은 내용이 담긴 문장",
    memoPrompt: "어떻게 실천할 수 있을까요? 구체적인 계획을 세워보세요.",
  },
];

interface NoteTemplateProps {
  /** 템플릿 선택 시 콜백 */
  onSelect: (template: NoteTemplate) => void;
  /** 현재 선택된 템플릿 ID */
  selectedId?: string;
  /** 컴팩트 모드 (버튼만 표시) */
  compact?: boolean;
  className?: string;
}

/**
 * 기록 템플릿 선택 컴포넌트
 *
 * 자주 사용하는 기록 형식을 템플릿으로 제공하여 기록 작성 부담을 줄입니다.
 */
export function NoteTemplateSelector({
  onSelect,
  selectedId,
  compact = false,
  className,
}: NoteTemplateProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (template: NoteTemplate) => {
    onSelect(template);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            템플릿
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>기록 템플릿</DialogTitle>
            <DialogDescription>
              원하는 템플릿을 선택하면 작성 가이드가 제공됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {DEFAULT_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={selectedId === template.id}
                onClick={() => handleSelect(template)}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        기록 템플릿
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {DEFAULT_TEMPLATES.slice(0, 4).map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            selected={selectedId === template.id}
            onClick={() => onSelect(template)}
            compact
          />
        ))}
      </div>
      {DEFAULT_TEMPLATES.length > 4 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => setIsOpen(true)}
        >
          더 보기
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      )}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>모든 템플릿</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {DEFAULT_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={selectedId === template.id}
                onClick={() => handleSelect(template)}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TemplateCardProps {
  template: NoteTemplate;
  selected?: boolean;
  onClick: () => void;
  compact?: boolean;
}

function TemplateCard({ template, selected, onClick, compact }: TemplateCardProps) {
  const Icon = template.icon;

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg border text-left transition-all",
          selected
            ? "border-primary bg-primary/5"
            : "border-transparent bg-muted/50 hover:bg-muted"
        )}
      >
        <div
          className={cn(
            "h-7 w-7 rounded-md flex items-center justify-center",
            template.bgColor
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", template.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{template.name}</p>
        </div>
        {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all w-full",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
          template.bgColor
        )}
      >
        <Icon className={cn("h-5 w-5", template.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{template.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {template.description}
        </p>
      </div>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="shrink-0"
        >
          <Check className="h-5 w-5 text-primary" />
        </motion.div>
      )}
    </button>
  );
}

/**
 * 사용자 정의 템플릿 생성 다이얼로그
 */
interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: Omit<NoteTemplate, "id">) => void;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  onSave,
}: CreateTemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quotePrompt, setQuotePrompt] = useState("");
  const [memoPrompt, setMemoPrompt] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("템플릿 이름을 입력해주세요.");
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || "사용자 정의 템플릿",
      icon: FileText,
      color: "text-slate-500",
      bgColor: "bg-slate-50 dark:bg-slate-950/30",
      quotePrompt: quotePrompt.trim() || undefined,
      memoPrompt: memoPrompt.trim() || undefined,
    });

    // 초기화
    setName("");
    setDescription("");
    setQuotePrompt("");
    setMemoPrompt("");
    onOpenChange(false);
    toast.success("템플릿이 저장됐어요.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>나만의 템플릿 만들기</DialogTitle>
          <DialogDescription>
            자주 사용하는 기록 형식을 템플릿으로 저장하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">템플릿 이름</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 독서 일기"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">설명 (선택)</Label>
            <Input
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 매일 읽은 내용 정리"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote-prompt">인용구 입력 가이드 (선택)</Label>
            <Textarea
              id="quote-prompt"
              value={quotePrompt}
              onChange={(e) => setQuotePrompt(e.target.value)}
              placeholder="예: 오늘 읽은 부분에서 기억에 남는 문장"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo-prompt">생각 입력 가이드 (선택)</Label>
            <Textarea
              id="memo-prompt"
              value={memoPrompt}
              onChange={(e) => setMemoPrompt(e.target.value)}
              placeholder="예: 이 내용을 읽고 느낀 점"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 템플릿 타입 export
export type { NoteTemplate };
export { DEFAULT_TEMPLATES };
