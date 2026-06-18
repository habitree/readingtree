"use client";

/**
 * AI 리포트 설정 관리 패널 v2
 * 스타일 미리보기 + 모델 설정 + 템플릿 관리 + 생성 설정 + 통계
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  FileText,
  Sliders,
  BarChart3,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Star,
  Trash2,
  Plus,
  Edit3,
  Users,
  TrendingUp,
  Layout,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateReportSettingsExtended,
} from "@/app/actions/ai/report-settings";
import {
  createReportTemplate,
  updateReportTemplate,
  deleteReportTemplate,
  setDefaultTemplate,
} from "@/app/actions/ai/report-templates";
import { AI_PROVIDER_INFO, type AIProvider } from "@/types/ai/settings";
import type {
  ReportTemplate,
  AIReportSettingsExtended,
  ReportUsageStats,
  NoteTypeWeights,
  TemplateTone,
  TargetLength,
  TemplateStyle,
} from "@/types/ai/report-template";
import {
  TONE_LABELS,
  LENGTH_LABELS,
  STYLE_LABELS,
  STYLE_DESCRIPTIONS,
} from "@/types/ai/report-template";
import { ReportTemplateEditor } from "./report-template-editor";

const REPORT_MODELS: Record<string, { id: string; name: string }[]> = {
  openai: [
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  ],
  google: [
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
  ],
  anthropic: [
    { id: "claude-opus-4-8", name: "Claude Opus 4.8" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
  ],
};

/** 스타일별 미리보기 아이콘/색상 */
const STYLE_VISUAL: Record<TemplateStyle, { icon: string; color: string; bg: string }> = {
  editorial: { icon: "📰", color: "#c4601d", bg: "#fdf5f0" },
  timeline: { icon: "📅", color: "#4a7c6f", bg: "#eef6f3" },
  conversational: { icon: "💬", color: "#6366f1", bg: "#eef2ff" },
  "card-summary": { icon: "🃏", color: "#b8860b", bg: "#fdf8ee" },
  immersive: { icon: "✨", color: "#8b5cf6", bg: "#f5f3ff" },
};

interface ReportSettingsPanelProps {
  initialSettings: AIReportSettingsExtended | null;
  initialTemplates: ReportTemplate[];
  initialStats: ReportUsageStats | null;
  apiKeyStatus?: { openai: boolean; google: boolean; anthropic: boolean };
}

export function ReportSettingsPanel({
  initialSettings,
  initialTemplates,
  initialStats,
  apiKeyStatus,
}: ReportSettingsPanelProps) {
  // 모델 설정
  const [provider, setProvider] = useState<AIProvider>((initialSettings?.provider as AIProvider) || "openai");
  const [modelId, setModelId] = useState(initialSettings?.modelId || "gpt-4o-mini");
  const [systemPrompt, setSystemPrompt] = useState(initialSettings?.systemPrompt || "");
  const [temperature, setTemperature] = useState(initialSettings?.temperature ?? 0.7);
  const [maxOutputTokens, setMaxOutputTokens] = useState(initialSettings?.maxOutputTokens ?? 4096);

  // 생성 설정
  const [minNotes, setMinNotes] = useState(initialSettings?.minNotesThreshold ?? 3);
  const [maxNotes, setMaxNotes] = useState(initialSettings?.maxNotesForAnalysis ?? 50);
  const [enableMultiReading, setEnableMultiReading] = useState(initialSettings?.enableMultiReading ?? false);
  const [noteTypeWeights, setNoteTypeWeights] = useState<NoteTypeWeights>(
    initialSettings?.noteTypeWeights ?? { quote: 1, memo: 1, transcription: 1, progress: 1, photo: 1 }
  );
  const [defaultTemplateId, setDefaultTemplateId] = useState<string | null>(initialSettings?.defaultTemplateId ?? null);

  // 템플릿
  const [templates, setTemplates] = useState<ReportTemplate[]>(initialTemplates);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filterStyle, setFilterStyle] = useState<TemplateStyle | "all">("all");

  // UI 상태
  const [saving, setSaving] = useState(false);
  const [savingGen, setSavingGen] = useState(false);
  const stats = initialStats;
  const models = REPORT_MODELS[provider] || [];

  const filteredTemplates = filterStyle === "all"
    ? templates
    : templates.filter((t) => t.style === filterStyle);

  const handleSaveModel = async () => {
    setSaving(true);
    try {
      await updateReportSettingsExtended({ provider, modelId, systemPrompt, temperature, maxOutputTokens });
      toast.success("모델 설정 저장 완료");
    } catch (err) { toast.error(err instanceof Error ? err.message : "저장 실패"); }
    finally { setSaving(false); }
  };

  const handleSaveGeneration = async () => {
    setSavingGen(true);
    try {
      await updateReportSettingsExtended({ minNotesThreshold: minNotes, maxNotesForAnalysis: maxNotes, enableMultiReading, noteTypeWeights, defaultTemplateId });
      toast.success("생성 설정 저장 완료");
    } catch (err) { toast.error(err instanceof Error ? err.message : "저장 실패"); }
    finally { setSavingGen(false); }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultTemplate(id);
      setTemplates((prev) => prev.map((t) => ({ ...t, isDefault: t.id === id })));
      toast.success("기본 템플릿 변경");
    } catch (err) { toast.error(err instanceof Error ? err.message : "실패"); }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("이 템플릿을 삭제하시겠습니까?")) return;
    try {
      await deleteReportTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("삭제 완료");
    } catch (err) { toast.error(err instanceof Error ? err.message : "실패"); }
  };

  const handleSaveTemplate = async (data: ReportTemplate) => {
    try {
      if (editingTemplate) {
        const updated = await updateReportTemplate(editingTemplate.id, {
          name: data.name, description: data.description, slug: data.slug,
          style: data.style, sections: data.sections, tone: data.tone,
          targetLength: data.targetLength, includeStats: data.includeStats,
          multiReadAware: data.multiReadAware,
        });
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const created = await createReportTemplate({
          name: data.name, description: data.description, slug: data.slug,
          style: data.style, sections: data.sections, tone: data.tone,
          targetLength: data.targetLength, includeStats: data.includeStats,
          multiReadAware: data.multiReadAware,
        });
        setTemplates((prev) => [...prev, created]);
      }
      setEditingTemplate(null);
      setIsCreating(false);
      toast.success("템플릿 저장 완료");
    } catch (err) { toast.error(err instanceof Error ? err.message : "실패"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI 리포트 설정</h1>
        <p className="text-muted-foreground mt-1">
          리포트 스타일, 모델, 템플릿을 관리합니다
        </p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates" className="flex items-center gap-1.5">
            <Layout className="h-4 w-4" />
            <span className="hidden sm:inline">템플릿</span>
          </TabsTrigger>
          <TabsTrigger value="model" className="flex items-center gap-1.5">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">모델</span>
          </TabsTrigger>
          <TabsTrigger value="generation" className="flex items-center gap-1.5">
            <Sliders className="h-4 w-4" />
            <span className="hidden sm:inline">생성 설정</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">통계</span>
          </TabsTrigger>
        </TabsList>

        {/* ═══ 탭 1: 템플릿 (기본 탭) ═══ */}
        <TabsContent value="templates" className="space-y-5 mt-4">
          {/* 스타일 필터 */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                variant={filterStyle === "all" ? "default" : "outline"}
                size="sm" className="h-8 text-xs"
                onClick={() => setFilterStyle("all")}
              >
                전체 ({templates.length})
              </Button>
              {(Object.keys(STYLE_LABELS) as TemplateStyle[]).map((s) => {
                const count = templates.filter((t) => t.style === s).length;
                const v = STYLE_VISUAL[s];
                return (
                  <Button
                    key={s}
                    variant={filterStyle === s ? "default" : "outline"}
                    size="sm" className="h-8 text-xs"
                    onClick={() => setFilterStyle(s)}
                  >
                    {v.icon} {STYLE_LABELS[s]} {count > 0 && `(${count})`}
                  </Button>
                );
              })}
            </div>
            <Button size="sm" onClick={() => { setEditingTemplate(null); setIsCreating(true); }}>
              <Plus className="h-4 w-4 mr-1" />새 템플릿
            </Button>
          </div>

          {/* 스타일 안내 (필터 선택 시) */}
          {filterStyle !== "all" && (
            <div className="rounded-lg p-3 text-sm" style={{ background: STYLE_VISUAL[filterStyle].bg, borderLeft: `3px solid ${STYLE_VISUAL[filterStyle].color}` }}>
              <span className="font-semibold">{STYLE_LABELS[filterStyle]}</span>
              <span className="text-muted-foreground ml-2">{STYLE_DESCRIPTIONS[filterStyle]}</span>
            </div>
          )}

          {/* 템플릿 카드 그리드 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((t) => {
              const sv = STYLE_VISUAL[t.style] || STYLE_VISUAL.editorial;
              return (
                <Card key={t.id} className={`relative overflow-hidden ${t.isDefault ? "ring-2 ring-primary" : ""}`}>
                  {/* 스타일 컬러 바 */}
                  <div className="h-1" style={{ background: sv.color }} />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <span>{sv.icon}</span>
                          {t.name}
                          {t.isDefault && <Badge className="text-[10px] h-4">기본</Badge>}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1 line-clamp-2">
                          {t.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="outline" className="text-[10px] h-5">
                        {STYLE_LABELS[t.style]}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {TONE_LABELS[t.tone]}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {t.sections.length}섹션
                      </Badge>
                      {t.multiReadAware && (
                        <Badge variant="outline" className="text-[10px] h-5">다회독</Badge>
                      )}
                      {t.isSystem && (
                        <Badge variant="secondary" className="text-[10px] h-5">시스템</Badge>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      {!t.isDefault && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleSetDefault(t.id)}>
                          <Star className="h-3 w-3 mr-1" />기본
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setEditingTemplate(t); setIsCreating(true); }}>
                        <Edit3 className="h-3 w-3 mr-1" />편집
                      </Button>
                      {!t.isSystem && (
                        <Button variant="outline" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleDeleteTemplate(t.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {filterStyle === "all" ? "등록된 템플릿이 없습니다." : `${STYLE_LABELS[filterStyle]} 스타일 템플릿이 없습니다.`}
            </div>
          )}

          {isCreating && (
            <ReportTemplateEditor template={editingTemplate} onSave={handleSaveTemplate} onClose={() => { setIsCreating(false); setEditingTemplate(null); }} />
          )}
        </TabsContent>

        {/* ═══ 탭 2: 모델 설정 ═══ */}
        <TabsContent value="model" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>AI 모델</CardTitle>
              <CardDescription>리포트 생성에 사용할 모델과 파라미터</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>제공자</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(["openai", "google", "anthropic"] as AIProvider[]).map((p) => {
                    const info = AI_PROVIDER_INFO[p];
                    const ok = apiKeyStatus?.[p] ?? false;
                    return (
                      <Button key={p} variant={provider === p ? "default" : "outline"}
                        className="flex flex-col h-auto py-3"
                        onClick={() => { setProvider(p); const m = REPORT_MODELS[p]?.[0]; if (m) setModelId(m.id); }}
                        disabled={!ok}>
                        <span className="font-medium text-sm">{info?.name || p}</span>
                        {ok ? <CheckCircle2 className="h-3 w-3 text-green-500 mt-1" /> : <XCircle className="h-3 w-3 text-red-400 mt-1" />}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>모델</Label>
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {models.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><Label>Temperature</Label><span className="text-xs text-muted-foreground">{temperature}</span></div>
                <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} min={0} max={2} step={0.1} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><Label>최대 출력 토큰</Label><span className="text-xs text-muted-foreground">{maxOutputTokens}</span></div>
                <Slider value={[maxOutputTokens]} onValueChange={([v]) => setMaxOutputTokens(v)} min={1024} max={16384} step={256} />
              </div>
              <div className="space-y-2">
                <Label>시스템 프롬프트</Label>
                <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="기본 시스템 프롬프트를 사용하려면 비워두세요" rows={5} />
              </div>
              <Button onClick={handleSaveModel} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ 탭 3: 생성 설정 ═══ */}
        <TabsContent value="generation" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>생성 파라미터</CardTitle>
              <CardDescription>리포트 생성 시 적용되는 세부 설정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between"><Label>최소 기록 수</Label><span className="text-xs text-muted-foreground">{minNotes}개</span></div>
                <Slider value={[minNotes]} onValueChange={([v]) => setMinNotes(v)} min={1} max={10} step={1} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><Label>최대 분석 기록 수</Label><span className="text-xs text-muted-foreground">{maxNotes}개</span></div>
                <Slider value={[maxNotes]} onValueChange={([v]) => setMaxNotes(v)} min={10} max={100} step={5} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div><Label>다회독 분석</Label><p className="text-xs text-muted-foreground">회독별 비교/성장 분석 활성화</p></div>
                <Switch checked={enableMultiReading} onCheckedChange={setEnableMultiReading} />
              </div>
              <div className="space-y-2">
                <Label>기본 템플릿</Label>
                <Select value={defaultTemplateId || "none"} onValueChange={(v) => setDefaultTemplateId(v === "none" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="자동" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">자동 (is_default)</SelectItem>
                    {templates.map((t) => <SelectItem key={t.id} value={t.id}>{STYLE_VISUAL[t.style]?.icon} {t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>노트 유형 가중치</Label>
                {(["quote", "memo", "transcription", "progress", "photo"] as const).map((type) => {
                  const labels: Record<string, string> = { quote: "인용", memo: "메모", transcription: "필사", progress: "독서 여정", photo: "사진" };
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="w-16 text-xs">{labels[type]}</span>
                      <Slider value={[noteTypeWeights[type]]} onValueChange={([v]) => setNoteTypeWeights((p) => ({ ...p, [type]: v }))} min={0} max={3} step={0.5} className="flex-1" />
                      <span className="w-6 text-xs text-right text-muted-foreground">{noteTypeWeights[type]}</span>
                    </div>
                  );
                })}
              </div>
              <Button onClick={handleSaveGeneration} disabled={savingGen} className="w-full">
                {savingGen ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ 탭 4: 통계 ═══ */}
        <TabsContent value="stats" className="space-y-4 mt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardHeader className="pb-2"><CardDescription>총 리포트</CardDescription><CardTitle className="text-2xl">{stats?.totalReports ?? 0}건</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>이번 달</CardDescription><CardTitle className="text-2xl">{stats?.monthlyReports ?? 0}건</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>평균 생성 시간</CardDescription><CardTitle className="text-2xl">{stats?.avgGenerationTimeMs ? `${(stats.avgGenerationTimeMs/1000).toFixed(1)}초` : "-"}</CardTitle></CardHeader></Card>
          </div>
          {stats?.templatePopularity && stats.templatePopularity.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />템플릿별 사용량</CardTitle></CardHeader>
              <CardContent>
                {stats.templatePopularity.map((tp) => (
                  <div key={tp.templateId} className="flex items-center justify-between py-1">
                    <span className="text-sm">{tp.templateName}</span>
                    <Badge variant="secondary">{tp.count}회</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {stats?.topUsers && stats.topUsers.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />사용자별 TOP 10</CardTitle></CardHeader>
              <CardContent>
                {stats.topUsers.map((u, i) => (
                  <div key={u.userId} className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground">#{i+1} {u.userId.slice(0,8)}...</span>
                    <Badge variant="secondary">{u.count}건</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
