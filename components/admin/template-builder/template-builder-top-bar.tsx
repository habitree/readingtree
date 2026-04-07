"use client";

/**
 * 템플릿 빌더 상단 바
 * 템플릿 메타 정보 + 글로벌 설정 + 액션 버튼
 */

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X, Eye, Loader2 } from "lucide-react";
import type { TemplateTone, TargetLength, TemplateStyle } from "@/types/ai/report-template";
import { TONE_LABELS, LENGTH_LABELS, STYLE_LABELS } from "@/types/ai/report-template";
import type { BuilderState } from "./use-template-builder";

interface TemplateBuilderTopBarProps {
  state: BuilderState;
  saving: boolean;
  onSetMeta: (field: "name" | "description" | "slug", value: string) => void;
  onSetStyle: (value: TemplateStyle) => void;
  onSetTone: (value: TemplateTone) => void;
  onSetLength: (value: TargetLength) => void;
  onSetToggle: (field: "includeStats" | "multiReadAware", value: boolean) => void;
  onTogglePreview: () => void;
  onSave: () => void;
  onClose: () => void;
}

export function TemplateBuilderTopBar({
  state,
  saving,
  onSetMeta,
  onSetStyle,
  onSetTone,
  onSetLength,
  onSetToggle,
  onTogglePreview,
  onSave,
  onClose,
}: TemplateBuilderTopBarProps) {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-2.5">
      {/* 첫 줄: 이름 + 액션 */}
      <div className="flex items-center gap-3 mb-2">
        <Input
          value={state.name}
          onChange={(e) => onSetMeta("name", e.target.value)}
          placeholder="템플릿 이름"
          className="h-8 text-sm font-semibold max-w-[200px]"
        />
        <Input
          value={state.slug}
          onChange={(e) => onSetMeta("slug", e.target.value)}
          placeholder="slug"
          className="h-8 text-xs font-mono max-w-[140px]"
        />
        <Input
          value={state.description}
          onChange={(e) => onSetMeta("description", e.target.value)}
          placeholder="설명 (선택)"
          className="h-8 text-sm flex-1"
        />

        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          {state.isDirty && (
            <Badge variant="secondary" className="text-xs">
              수정됨
            </Badge>
          )}
          <Button variant="outline" size="sm" className="h-8" onClick={onTogglePreview}>
            <Eye className="h-3.5 w-3.5 mr-1" />
            미리보기
          </Button>
          <Button
            size="sm"
            className="h-8"
            onClick={onSave}
            disabled={saving || !state.name.trim() || !state.slug.trim()}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            저장
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 둘째 줄: 글로벌 설정 */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">스타일</Label>
          <Select value={state.style} onValueChange={(v) => onSetStyle(v as TemplateStyle)}>
            <SelectTrigger className="h-6 w-24 text-xs border-dashed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(STYLE_LABELS) as [TemplateStyle, string][]).map(([k, label]) => (
                <SelectItem key={k} value={k} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">톤</Label>
          <Select value={state.tone} onValueChange={(v) => onSetTone(v as TemplateTone)}>
            <SelectTrigger className="h-6 w-20 text-xs border-dashed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(TONE_LABELS) as [TemplateTone, string][]).map(([k, label]) => (
                <SelectItem key={k} value={k} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">길이</Label>
          <Select value={state.targetLength} onValueChange={(v) => onSetLength(v as TargetLength)}>
            <SelectTrigger className="h-6 w-16 text-xs border-dashed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(LENGTH_LABELS) as [TargetLength, string][]).map(([k, label]) => (
                <SelectItem key={k} value={k} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <Switch
            id="includeStats"
            checked={state.includeStats}
            onCheckedChange={(v) => onSetToggle("includeStats", v)}
            className="scale-75"
          />
          <Label htmlFor="includeStats" className="text-xs text-muted-foreground cursor-pointer">
            통계 포함
          </Label>
        </div>

        <div className="flex items-center gap-1.5">
          <Switch
            id="multiReadAware"
            checked={state.multiReadAware}
            onCheckedChange={(v) => onSetToggle("multiReadAware", v)}
            className="scale-75"
          />
          <Label htmlFor="multiReadAware" className="text-xs text-muted-foreground cursor-pointer">
            다회독 분석
          </Label>
        </div>

        <Badge variant="outline" className="text-[10px] ml-auto">
          {state.sections.length}개 섹션
        </Badge>
      </div>
    </div>
  );
}
