"use client";

/**
 * AI 리포트 설정 관리 패널
 * 4탭: 모델 설정 / 템플릿 관리 / 생성 설정 / 사용 통계
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
  Clock,
  Users,
  TrendingUp,
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
} from "@/types/ai/report-template";
import {
  TONE_LABELS,
  LENGTH_LABELS,
  SECTION_TYPE_LABELS,
} from "@/types/ai/report-template";
import { ReportTemplateEditor } from "./report-template-editor";

// 리포트 전용 모델 목록
const REPORT_MODELS: Record<string, { id: string; name: string }[]> = {
  openai: [
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
  ],
  google: [
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
  ],
  anthropic: [
    { id: "claude-3-5-sonnet-latest", name: "Claude 3.5 Sonnet" },
    { id: "claude-3-haiku-latest", name: "Claude 3 Haiku" },
  ],
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
  // 모델 설정 상태
  const [provider, setProvider] = useState<AIProvider>(
    (initialSettings?.provider as AIProvider) || "openai"
  );
  const [modelId, setModelId] = useState(initialSettings?.modelId || "gpt-4o-mini");
  const [systemPrompt, setSystemPrompt] = useState(initialSettings?.systemPrompt || "");
  const [temperature, setTemperature] = useState(initialSettings?.temperature ?? 0.7);
  const [maxOutputTokens, setMaxOutputTokens] = useState(initialSettings?.maxOutputTokens ?? 4096);

  // 생성 설정 상태
  const [minNotes, setMinNotes] = useState(initialSettings?.minNotesThreshold ?? 3);
  const [maxNotes, setMaxNotes] = useState(initialSettings?.maxNotesForAnalysis ?? 50);
  const [enableMultiReading, setEnableMultiReading] = useState(initialSettings?.enableMultiReading ?? false);
  const [noteTypeWeights, setNoteTypeWeights] = useState<NoteTypeWeights>(
    initialSettings?.noteTypeWeights ?? { quote: 1, memo: 1, transcription: 1, progress: 1, photo: 1 }
  );
  const [defaultTemplateId, setDefaultTemplateId] = useState<string | null>(
    initialSettings?.defaultTemplateId ?? null
  );

  // 템플릿 상태
  const [templates, setTemplates] = useState<ReportTemplate[]>(initialTemplates);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // UI 상태
  const [saving, setSaving] = useState(false);
  const [savingGeneration, setSavingGeneration] = useState(false);

  const stats = initialStats;

  // 모델 설정 저장
  const handleSaveModel = async () => {
    setSaving(true);
    try {
      await updateReportSettingsExtended({
        provider,
        modelId,
        systemPrompt,
        temperature,
        maxOutputTokens,
      });
      toast.success("모델 설정이 저장되었습니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  // 생성 설정 저장
  const handleSaveGeneration = async () => {
    setSavingGeneration(true);
    try {
      await updateReportSettingsExtended({
        minNotesThreshold: minNotes,
        maxNotesForAnalysis: maxNotes,
        enableMultiReading,
        noteTypeWeights,
        defaultTemplateId,
      });
      toast.success("생성 설정이 저장되었습니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSavingGeneration(false);
    }
  };

  // 기본 템플릿 지정
  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultTemplate(id);
      setTemplates((prev) =>
        prev.map((t) => ({ ...t, isDefault: t.id === id }))
      );
      toast.success("기본 템플릿이 변경되었습니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "변경 실패");
    }
  };

  // 템플릿 삭제
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("이 템플릿을 삭제하시겠습니까?")) return;
    try {
      await deleteReportTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("템플릿이 삭제되었습니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제 실패");
    }
  };

  // 템플릿 저장 핸들러 (에디터에서 호출)
  const handleSaveTemplate = async (data: ReportTemplate) => {
    try {
      if (editingTemplate) {
        const updated = await updateReportTemplate(editingTemplate.id, {
          name: data.name,
          description: data.description,
          slug: data.slug,
          sections: data.sections,
          tone: data.tone,
          targetLength: data.targetLength,
          includeStats: data.includeStats,
          multiReadAware: data.multiReadAware,
        });
        setTemplates((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
      } else {
        const created = await createReportTemplate({
          name: data.name,
          description: data.description,
          slug: data.slug,
          sections: data.sections,
          tone: data.tone,
          targetLength: data.targetLength,
          includeStats: data.includeStats,
          multiReadAware: data.multiReadAware,
        });
        setTemplates((prev) => [...prev, created]);
      }
      setEditingTemplate(null);
      setIsCreating(false);
      toast.success("템플릿이 저장되었습니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장 실패");
    }
  };

  const models = REPORT_MODELS[provider] || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI 리포트 설정</h1>
        <p className="text-muted-foreground mt-1">
          AI 독서 리포트의 모델, 템플릿, 생성 방식을 관리합니다.
        </p>
      </div>

      <Tabs defaultValue="model" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="model" className="flex items-center gap-1.5">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">모델 설정</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">템플릿 관리</span>
          </TabsTrigger>
          <TabsTrigger value="generation" className="flex items-center gap-1.5">
            <Sliders className="h-4 w-4" />
            <span className="hidden sm:inline">생성 설정</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">사용 통계</span>
          </TabsTrigger>
        </TabsList>

        {/* 탭 1: 모델 설정 */}
        <TabsContent value="model" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>AI 모델 선택</CardTitle>
              <CardDescription>리포트 생성에 사용할 AI 모델을 선택합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider 선택 */}
              <div className="space-y-2">
                <Label>AI 제공자</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(["openai", "google", "anthropic"] as AIProvider[]).map((p) => {
                    const info = AI_PROVIDER_INFO[p];
                    const available = apiKeyStatus?.[p] ?? false;
                    return (
                      <Button
                        key={p}
                        variant={provider === p ? "default" : "outline"}
                        className="flex flex-col items-center gap-1 h-auto py-3"
                        onClick={() => {
                          setProvider(p);
                          const firstModel = REPORT_MODELS[p]?.[0];
                          if (firstModel) setModelId(firstModel.id);
                        }}
                        disabled={!available}
                      >
                        <span className="font-medium">{info?.name || p}</span>
                        {available ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* 모델 선택 */}
              <div className="space-y-2">
                <Label>모델</Label>
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="모델 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Temperature</Label>
                  <span className="text-sm text-muted-foreground">{temperature}</span>
                </div>
                <Slider
                  value={[temperature]}
                  onValueChange={([v]) => setTemperature(v)}
                  min={0}
                  max={2}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">
                  낮을수록 일관된 결과, 높을수록 창의적인 결과
                </p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>최대 출력 토큰</Label>
                  <span className="text-sm text-muted-foreground">{maxOutputTokens}</span>
                </div>
                <Slider
                  value={[maxOutputTokens]}
                  onValueChange={([v]) => setMaxOutputTokens(v)}
                  min={1024}
                  max={16384}
                  step={256}
                />
              </div>

              {/* 시스템 프롬프트 */}
              <div className="space-y-2">
                <Label>시스템 프롬프트</Label>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="리포트 생성 시 사용할 시스템 프롬프트를 입력하세요..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  비어있으면 기본 시스템 프롬프트가 사용됩니다.
                </p>
              </div>

              <Button onClick={handleSaveModel} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                모델 설정 저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 탭 2: 템플릿 관리 */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">리포트 템플릿</h2>
              <p className="text-sm text-muted-foreground">다양한 리포트 스타일을 관리합니다.</p>
            </div>
            <Button
              onClick={() => {
                setEditingTemplate(null);
                setIsCreating(true);
              }}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              새 템플릿
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {templates.map((t) => (
              <Card key={t.id} className={t.isDefault ? "border-primary" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {t.name}
                        {t.isDefault && (
                          <Badge variant="default" className="text-xs">기본</Badge>
                        )}
                        {t.isSystem && (
                          <Badge variant="secondary" className="text-xs">시스템</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{t.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Badge variant="outline">{TONE_LABELS[t.tone]}</Badge>
                    <Badge variant="outline">{LENGTH_LABELS[t.targetLength]}</Badge>
                    <Badge variant="outline">{t.sections.length}개 섹션</Badge>
                    {t.multiReadAware && <Badge variant="outline">다회독</Badge>}
                  </div>
                  <div className="flex gap-2">
                    {!t.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(t.id)}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        기본 지정
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(t);
                        setIsCreating(true);
                      }}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      편집
                    </Button>
                    {!t.isSystem && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(t.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        삭제
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 템플릿 편집 다이얼로그 */}
          {isCreating && (
            <ReportTemplateEditor
              template={editingTemplate}
              onSave={handleSaveTemplate}
              onClose={() => {
                setIsCreating(false);
                setEditingTemplate(null);
              }}
            />
          )}
        </TabsContent>

        {/* 탭 3: 생성 설정 */}
        <TabsContent value="generation" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>리포트 생성 파라미터</CardTitle>
              <CardDescription>리포트 생성 시 적용되는 세부 설정입니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 최소 노트 수 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>최소 기록 수</Label>
                  <span className="text-sm text-muted-foreground">{minNotes}개</span>
                </div>
                <Slider
                  value={[minNotes]}
                  onValueChange={([v]) => setMinNotes(v)}
                  min={1}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  리포트 생성에 필요한 최소 기록 수
                </p>
              </div>

              {/* 최대 분석 노트 수 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>최대 분석 기록 수</Label>
                  <span className="text-sm text-muted-foreground">{maxNotes}개</span>
                </div>
                <Slider
                  value={[maxNotes]}
                  onValueChange={([v]) => setMaxNotes(v)}
                  min={10}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  토큰 절약을 위해 분석할 최대 기록 수 (많을수록 비용 증가)
                </p>
              </div>

              {/* 다회독 분석 */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>다회독 분석</Label>
                  <p className="text-xs text-muted-foreground">
                    여러 번 읽은 책의 회독별 비교/성장 분석을 활성화합니다.
                  </p>
                </div>
                <Switch
                  checked={enableMultiReading}
                  onCheckedChange={setEnableMultiReading}
                />
              </div>

              {/* 기본 템플릿 선택 */}
              <div className="space-y-2">
                <Label>기본 템플릿</Label>
                <Select
                  value={defaultTemplateId || "none"}
                  onValueChange={(v) => setDefaultTemplateId(v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="기본 템플릿 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">자동 (is_default 템플릿)</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 노트 유형 가중치 */}
              <div className="space-y-3">
                <Label>노트 유형별 가중치</Label>
                <p className="text-xs text-muted-foreground">
                  높은 가중치의 노트 유형이 분석에서 더 많은 비중을 차지합니다.
                </p>
                {(["quote", "memo", "transcription", "progress", "photo"] as const).map(
                  (type) => {
                    const labels: Record<string, string> = {
                      quote: "인용",
                      memo: "메모",
                      transcription: "필사",
                      progress: "독서 여정",
                      photo: "사진",
                    };
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <span className="w-20 text-sm">{labels[type]}</span>
                        <Slider
                          value={[noteTypeWeights[type]]}
                          onValueChange={([v]) =>
                            setNoteTypeWeights((prev) => ({ ...prev, [type]: v }))
                          }
                          min={0}
                          max={3}
                          step={0.5}
                          className="flex-1"
                        />
                        <span className="w-8 text-sm text-right text-muted-foreground">
                          {noteTypeWeights[type]}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>

              <Button onClick={handleSaveGeneration} disabled={savingGeneration} className="w-full">
                {savingGeneration ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                생성 설정 저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 탭 4: 사용 통계 */}
        <TabsContent value="stats" className="space-y-4 mt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>총 리포트 생성</CardDescription>
                <CardTitle className="text-2xl">{stats?.totalReports ?? 0}건</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>이번 달</CardDescription>
                <CardTitle className="text-2xl">{stats?.monthlyReports ?? 0}건</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>평균 생성 시간</CardDescription>
                <CardTitle className="text-2xl">
                  {stats?.avgGenerationTimeMs
                    ? `${(stats.avgGenerationTimeMs / 1000).toFixed(1)}초`
                    : "-"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* 템플릿별 인기도 */}
          {stats?.templatePopularity && stats.templatePopularity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  템플릿별 사용량
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.templatePopularity.map((tp) => (
                    <div key={tp.templateId} className="flex items-center justify-between">
                      <span className="text-sm">{tp.templateName}</span>
                      <Badge variant="secondary">{tp.count}회</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 사용자별 TOP */}
          {stats?.topUsers && stats.topUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  사용자별 생성량 TOP 10
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.topUsers.map((u, i) => (
                    <div key={u.userId} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        #{i + 1} {u.userId.slice(0, 8)}...
                      </span>
                      <Badge variant="secondary">{u.count}건</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(!stats || (stats.totalReports === 0)) && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                아직 생성된 리포트가 없습니다.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
