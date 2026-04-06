"use client";

/**
 * 리포트 템플릿 편집 다이얼로그
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Loader2,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
} from "lucide-react";
import type {
  ReportTemplate,
  ReportTemplateSectionConfig,
  SectionType,
  TemplateTone,
  TargetLength,
} from "@/types/ai/report-template";
import {
  TONE_LABELS,
  LENGTH_LABELS,
  SECTION_TYPE_LABELS,
} from "@/types/ai/report-template";

interface ReportTemplateEditorProps {
  template: ReportTemplate | null;
  onSave: (data: ReportTemplate) => Promise<void>;
  onClose: () => void;
}

const ALL_SECTION_TYPES: SectionType[] = [
  "overview", "insights", "quotes", "thoughts", "journey", "summary",
  "discussion", "action_items", "comparison", "growth", "social_snippet", "concept_map",
];

export function ReportTemplateEditor({
  template,
  onSave,
  onClose,
}: ReportTemplateEditorProps) {
  const isNew = !template;

  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [slug, setSlug] = useState(template?.slug || "");
  const [tone, setTone] = useState<TemplateTone>(template?.tone || "friendly");
  const [targetLength, setTargetLength] = useState<TargetLength>(
    template?.targetLength || "medium"
  );
  const [includeStats, setIncludeStats] = useState(template?.includeStats ?? true);
  const [multiReadAware, setMultiReadAware] = useState(template?.multiReadAware ?? false);
  const [sections, setSections] = useState<ReportTemplateSectionConfig[]>(
    template?.sections || []
  );
  const [saving, setSaving] = useState(false);

  // 섹션 순서 변경
  const moveSection = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((s, i) => (s.sortOrder = i + 1));
    setSections(updated);
  };

  // 섹션 추가
  const addSection = (key: SectionType) => {
    const existing = sections.find((s) => s.key === key);
    if (existing) return;
    setSections([
      ...sections,
      {
        key,
        title: SECTION_TYPE_LABELS[key],
        promptInstruction: "",
        maxLength: null,
        required: true,
        sortOrder: sections.length + 1,
      },
    ]);
  };

  // 섹션 제거
  const removeSection = (index: number) => {
    const updated = sections.filter((_, i) => i !== index);
    updated.forEach((s, i) => (s.sortOrder = i + 1));
    setSections(updated);
  };

  // 섹션 프롬프트 수정
  const updateSectionPrompt = (index: number, value: string) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], promptInstruction: value };
    setSections(updated);
  };

  // 섹션 타이틀 수정
  const updateSectionTitle = (index: number, value: string) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], title: value };
    setSections(updated);
  };

  // 사용 가능한 섹션 타입 (아직 추가되지 않은)
  const availableTypes = ALL_SECTION_TYPES.filter(
    (t) => !sections.some((s) => s.key === t)
  );

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    try {
      await onSave({
        id: template?.id || "",
        name,
        description: description || null,
        slug,
        tone,
        targetLength,
        includeStats,
        multiReadAware,
        isDefault: template?.isDefault ?? false,
        isSystem: template?.isSystem ?? false,
        sortOrder: template?.sortOrder ?? 0,
        sections,
        createdAt: template?.createdAt || "",
        updatedAt: template?.updatedAt || "",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "새 템플릿 만들기" : `${template.name} 편집`}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>이름</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="템플릿 이름"
              />
            </div>
            <div className="space-y-1.5">
              <Label>슬러그 (URL용)</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-template"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>설명</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="템플릿 설명"
            />
          </div>

          {/* 스타일 설정 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>톤</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as TemplateTone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(TONE_LABELS) as [TemplateTone, string][]).map(
                    ([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>길이</Label>
              <Select
                value={targetLength}
                onValueChange={(v) => setTargetLength(v as TargetLength)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(LENGTH_LABELS) as [TargetLength, string][]).map(
                    ([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 토글 옵션 */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={includeStats} onCheckedChange={setIncludeStats} />
              <Label className="text-sm">통계 포함</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={multiReadAware} onCheckedChange={setMultiReadAware} />
              <Label className="text-sm">다회독 분석</Label>
            </div>
          </div>

          {/* 섹션 관리 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">섹션 구성</Label>
              <Badge variant="secondary">{sections.length}개</Badge>
            </div>

            {sections.map((section, idx) => (
              <div
                key={`${section.key}-${idx}`}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => moveSection(idx, -1)}
                      disabled={idx === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => moveSection(idx, 1)}
                      disabled={idx === sections.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {SECTION_TYPE_LABELS[section.key]}
                  </Badge>
                  <Input
                    value={section.title}
                    onChange={(e) => updateSectionTitle(idx, e.target.value)}
                    className="flex-1 h-8 text-sm"
                    placeholder="섹션 제목"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeSection(idx)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Textarea
                  value={section.promptInstruction}
                  onChange={(e) => updateSectionPrompt(idx, e.target.value)}
                  placeholder="이 섹션에 대한 AI 지시문..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            ))}

            {/* 섹션 추가 */}
            {availableTypes.length > 0 && (
              <div className="flex items-center gap-2">
                <Select onValueChange={(v) => addSection(v as SectionType)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="섹션 추가..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {SECTION_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim() || !slug.trim()}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
