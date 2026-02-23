"use client";

/**
 * AI 설정 관리 패널 컴포넌트
 *
 * 관리자가 AI 챗봇 시스템의 전체 설정을 관리할 수 있는 UI입니다.
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  Settings,
  Zap,
  Brain,
  MessageSquare,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Sparkles,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import {
  getActiveAISettings,
  updateAISettings,
  createAISettings,
  testAIConnection,
  getAPIKeyStatus,
  initializeDefaultAISettings,
} from "@/app/actions/ai";
import {
  AI_MODELS,
  AI_PROVIDER_INFO,
  DEFAULT_AI_SETTINGS,
  DEFAULT_REPORT_SETTINGS,
  type AIProvider,
  type AISettings,
  type AIReportSettings,
  type ContextSettings,
  type GenerationSettings,
  type MemorySettings,
} from "@/types/ai";
import {
  getReportSettings,
  updateReportSettings,
} from "@/app/actions/ai/report-settings";

interface AISettingsPanelProps {
  initialSettings?: AISettings | null;
  apiKeyStatus?: { openai: boolean; google: boolean; anthropic: boolean };
}

export function AISettingsPanel({
  initialSettings,
  apiKeyStatus: initialApiKeyStatus,
}: AISettingsPanelProps) {
  const { t } = useTranslation();
  // 상태 관리
  const [settings, setSettings] = useState<AISettings | null>(
    initialSettings || null
  );
  const [apiKeyStatus, setApiKeyStatus] = useState(
    initialApiKeyStatus || { openai: false, google: false, anthropic: false }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    responseTime?: number;
  } | null>(null);

  // 폼 상태
  const [provider, setProvider] = useState<AIProvider>(
    settings?.provider || DEFAULT_AI_SETTINGS.provider
  );
  const [modelId, setModelId] = useState(
    settings?.modelId || DEFAULT_AI_SETTINGS.modelId
  );
  const [systemPrompt, setSystemPrompt] = useState(
    settings?.systemPromptTemplate || DEFAULT_AI_SETTINGS.systemPromptTemplate
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    settings?.welcomeMessage || DEFAULT_AI_SETTINGS.welcomeMessage
  );
  const [contextSettings, setContextSettings] = useState<ContextSettings>(
    settings?.contextSettings || DEFAULT_AI_SETTINGS.contextSettings
  );
  const [generationSettings, setGenerationSettings] =
    useState<GenerationSettings>(
      settings?.generationSettings || DEFAULT_AI_SETTINGS.generationSettings
    );
  const [memorySettings, setMemorySettings] = useState<MemorySettings>(
    settings?.memorySettings || DEFAULT_AI_SETTINGS.memorySettings
  );

  // 리포트 설정 상태
  const [reportProvider, setReportProvider] = useState<AIProvider>(DEFAULT_REPORT_SETTINGS.provider);
  const [reportModelId, setReportModelId] = useState(DEFAULT_REPORT_SETTINGS.modelId);
  const [reportSystemPrompt, setReportSystemPrompt] = useState(DEFAULT_REPORT_SETTINGS.systemPrompt);
  const [reportTemperature, setReportTemperature] = useState(DEFAULT_REPORT_SETTINGS.temperature);
  const [reportMaxTokens, setReportMaxTokens] = useState(DEFAULT_REPORT_SETTINGS.maxOutputTokens);
  const [reportSettingsId, setReportSettingsId] = useState<string | null>(null);
  const [isSavingReport, setIsSavingReport] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      setProvider(initialSettings.provider);
      setModelId(initialSettings.modelId);
      setSystemPrompt(initialSettings.systemPromptTemplate);
      setWelcomeMessage(initialSettings.welcomeMessage);
      setContextSettings(initialSettings.contextSettings);
      setGenerationSettings(initialSettings.generationSettings);
      setMemorySettings(initialSettings.memorySettings);
    }
  }, [initialSettings]);

  // 리포트 설정 초기 로드
  useEffect(() => {
    getReportSettings().then((rs) => {
      if (rs) {
        setReportSettingsId(rs.id);
        setReportProvider(rs.provider);
        setReportModelId(rs.modelId);
        setReportSystemPrompt(rs.systemPrompt);
        setReportTemperature(rs.temperature);
        setReportMaxTokens(rs.maxOutputTokens);
      }
    }).catch(() => {});
  }, []);

  // 제공자 변경 시 모델 초기화
  useEffect(() => {
    const models = AI_MODELS[provider];
    if (models.length > 0 && !models.find((m) => m.id === modelId)) {
      setModelId(models[0].id);
    }
  }, [provider]);

  // 리포트 제공자 변경 시 모델 초기화
  useEffect(() => {
    const models = AI_MODELS[reportProvider];
    if (models.length > 0 && !models.find((m) => m.id === reportModelId)) {
      setReportModelId(models[0].id);
    }
  }, [reportProvider]);

  // 설정 저장
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = {
        provider,
        modelId,
        systemPromptTemplate: systemPrompt,
        welcomeMessage,
        contextSettings,
        generationSettings,
        memorySettings,
      };

      if (settings?.id) {
        await updateAISettings(settings.id, formData);
        toast.success(t("admin.aiSettings.savedSuccess"));
      } else {
        const newSettings = await createAISettings(formData);
        setSettings(newSettings);
        toast.success(t("admin.aiSettings.createdSuccess"));
      }
    } catch (error) {
      toast.error(t("admin.aiSettings.saveFailed"));
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // 연결 테스트
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testAIConnection(provider, modelId);
      setTestResult({
        success: result.success,
        message: result.success
          ? t("admin.aiSettings.connectionSuccess", { response: result.testResponse ?? "" })
          : t("admin.aiSettings.connectionFailed", { error: result.error ?? "" }),
        responseTime: result.responseTime,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: t("admin.aiSettings.testError"),
      });
    } finally {
      setIsTesting(false);
    }
  };

  // 리포트 설정 저장
  const handleSaveReport = async () => {
    setIsSavingReport(true);
    try {
      const result = await updateReportSettings({
        provider: reportProvider,
        modelId: reportModelId,
        systemPrompt: reportSystemPrompt,
        temperature: reportTemperature,
        maxOutputTokens: reportMaxTokens,
      });
      setReportSettingsId(result.id);
      toast.success(t("admin.aiSettings.savedSuccess"));
    } catch (error) {
      toast.error(t("admin.aiSettings.saveFailed"));
      console.error(error);
    } finally {
      setIsSavingReport(false);
    }
  };

  // 기본값으로 초기화
  const handleInitializeDefaults = async () => {
    try {
      const defaultSettings = await initializeDefaultAISettings();
      setSettings(defaultSettings);
      setProvider(defaultSettings.provider);
      setModelId(defaultSettings.modelId);
      setSystemPrompt(defaultSettings.systemPromptTemplate);
      setWelcomeMessage(defaultSettings.welcomeMessage);
      setContextSettings(defaultSettings.contextSettings);
      setGenerationSettings(defaultSettings.generationSettings);
      setMemorySettings(defaultSettings.memorySettings);
      toast.success(t("admin.aiSettings.resetSuccess"));
    } catch (error) {
      toast.error(t("admin.aiSettings.resetFailed"));
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t("admin.aiSettings.title")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("admin.aiSettings.description")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleInitializeDefaults}
            disabled={isSaving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("admin.aiSettings.resetDefaults")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {t("admin.aiSettings.save")}
          </Button>
        </div>
      </div>

      {/* API 키 상태 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {t("admin.aiSettings.apiKeyStatus")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(apiKeyStatus) as AIProvider[]).map((key) => (
              <Badge
                key={key}
                variant={apiKeyStatus[key] ? "default" : "secondary"}
                className={`flex items-center gap-1.5 px-3 py-1.5 ${
                  apiKeyStatus[key]
                    ? "bg-green-500/10 text-green-700 border-green-500/30"
                    : "bg-red-500/10 text-red-700 border-red-500/30"
                }`}
              >
                {apiKeyStatus[key] ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                {AI_PROVIDER_INFO[key].name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="model" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="model" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t("admin.aiSettings.tabModel")}
          </TabsTrigger>
          <TabsTrigger value="prompt" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t("admin.aiSettings.tabPrompt")}
          </TabsTrigger>
          <TabsTrigger value="context" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t("admin.aiSettings.tabContext")}
          </TabsTrigger>
          <TabsTrigger value="generation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {t("admin.aiSettings.tabGeneration")}
          </TabsTrigger>
          <TabsTrigger value="memory" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            {t("admin.aiSettings.tabMemory")}
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t("admin.aiSettings.tabReport")}
          </TabsTrigger>
        </TabsList>

        {/* 모델 선택 탭 */}
        <TabsContent value="model">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.aiSettings.modelTitle")}</CardTitle>
              <CardDescription>
                {t("admin.aiSettings.modelDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 제공자 선택 */}
              <div className="space-y-3">
                <Label>{t("admin.aiSettings.providerLabel")}</Label>
                <div className="grid grid-cols-3 gap-4">
                  {(Object.keys(AI_PROVIDER_INFO) as AIProvider[]).map(
                    (key) => {
                      const info = AI_PROVIDER_INFO[key];
                      const isAvailable = apiKeyStatus[key];
                      return (
                        <button
                          key={key}
                          onClick={() => isAvailable && setProvider(key)}
                          disabled={!isAvailable}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            provider === key
                              ? "border-primary bg-primary/5"
                              : isAvailable
                              ? "border-border hover:border-primary/50"
                              : "border-border opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="font-semibold mb-1">{info.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {info.description}
                          </div>
                          {!isAvailable && (
                            <Badge
                              variant="outline"
                              className="mt-2 text-xs bg-red-500/10 text-red-600"
                            >
                              {t("admin.aiSettings.noApiKey")}
                            </Badge>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* 모델 선택 */}
              <div className="space-y-3">
                <Label>{t("admin.aiSettings.modelLabel")}</Label>
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("admin.aiSettings.modelPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS[provider].map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 연결 테스트 */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTesting || !apiKeyStatus[provider]}
                  >
                    {isTesting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    {isTesting ? t("admin.aiSettings.testing") : t("admin.aiSettings.testConnection")}
                  </Button>
                  {testResult && (
                    <div
                      className={`flex items-center gap-2 text-sm ${
                        testResult.success ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {testResult.success ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span>{testResult.message}</span>
                      {testResult.responseTime && (
                        <span className="text-muted-foreground">
                          ({testResult.responseTime}ms)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 프롬프트 설정 탭 */}
        <TabsContent value="prompt">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.aiSettings.promptTitle")}</CardTitle>
              <CardDescription>
                {t("admin.aiSettings.promptDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>{t("admin.aiSettings.systemPromptLabel")}</Label>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder={t("admin.aiSettings.systemPromptPlaceholder")}
                  className="min-h-[300px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {t("admin.aiSettings.systemPromptHint")}
                </p>
              </div>

              <div className="space-y-3">
                <Label>{t("admin.aiSettings.welcomeLabel")}</Label>
                <Textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder={t("admin.aiSettings.welcomePlaceholder")}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 컨텍스트 설정 탭 */}
        <TabsContent value="context">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.aiSettings.contextTitle")}</CardTitle>
              <CardDescription>
                {t("admin.aiSettings.contextDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("admin.aiSettings.historyCountLabel")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.aiSettings.historyCountDesc")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[contextSettings.maxHistoryMessages]}
                      onValueChange={([value]) =>
                        setContextSettings({
                          ...contextSettings,
                          maxHistoryMessages: value,
                        })
                      }
                      max={30}
                      min={1}
                      step={1}
                      className="w-32"
                    />
                    <span className="w-8 text-right font-mono">
                      {contextSettings.maxHistoryMessages}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <Label>{t("admin.aiSettings.includeInfo")}</Label>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{t("admin.aiSettings.personaLabel")}</span>
                      <p className="text-xs text-muted-foreground">
                        {t("admin.aiSettings.personaDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={contextSettings.includePersona}
                      onCheckedChange={(checked) =>
                        setContextSettings({
                          ...contextSettings,
                          includePersona: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{t("admin.aiSettings.recentBooksLabel")}</span>
                      <p className="text-xs text-muted-foreground">
                        {t("admin.aiSettings.recentBooksDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={contextSettings.includeRecentBooks}
                      onCheckedChange={(checked) =>
                        setContextSettings({
                          ...contextSettings,
                          includeRecentBooks: checked,
                        })
                      }
                    />
                  </div>

                  {contextSettings.includeRecentBooks && (
                    <div className="ml-6 flex items-center justify-between">
                      <span className="text-sm">{t("admin.aiSettings.booksCountLabel")}</span>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[contextSettings.maxRecentBooks]}
                          onValueChange={([value]) =>
                            setContextSettings({
                              ...contextSettings,
                              maxRecentBooks: value,
                            })
                          }
                          max={20}
                          min={1}
                          step={1}
                          className="w-24"
                        />
                        <span className="w-8 text-right font-mono">
                          {contextSettings.maxRecentBooks}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{t("admin.aiSettings.recentNotesLabel")}</span>
                      <p className="text-xs text-muted-foreground">
                        {t("admin.aiSettings.recentNotesDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={contextSettings.includeRecentNotes}
                      onCheckedChange={(checked) =>
                        setContextSettings({
                          ...contextSettings,
                          includeRecentNotes: checked,
                        })
                      }
                    />
                  </div>

                  {contextSettings.includeRecentNotes && (
                    <div className="ml-6 flex items-center justify-between">
                      <span className="text-sm">{t("admin.aiSettings.notesCountLabel")}</span>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[contextSettings.maxRecentNotes]}
                          onValueChange={([value]) =>
                            setContextSettings({
                              ...contextSettings,
                              maxRecentNotes: value,
                            })
                          }
                          max={30}
                          min={1}
                          step={1}
                          className="w-24"
                        />
                        <span className="w-8 text-right font-mono">
                          {contextSettings.maxRecentNotes}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{t("admin.aiSettings.goalsLabel")}</span>
                      <p className="text-xs text-muted-foreground">
                        {t("admin.aiSettings.goalsDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={contextSettings.includeReadingGoal}
                      onCheckedChange={(checked) =>
                        setContextSettings({
                          ...contextSettings,
                          includeReadingGoal: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 생성 설정 탭 */}
        <TabsContent value="generation">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.aiSettings.generationTitle")}</CardTitle>
              <CardDescription>
                {t("admin.aiSettings.generationDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("admin.aiSettings.temperatureLabel")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.aiSettings.temperatureDesc")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[generationSettings.temperature]}
                      onValueChange={([value]) =>
                        setGenerationSettings({
                          ...generationSettings,
                          temperature: value,
                        })
                      }
                      max={2}
                      min={0}
                      step={0.1}
                      className="w-40"
                    />
                    <span className="w-12 text-right font-mono">
                      {generationSettings.temperature.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("admin.aiSettings.maxTokensLabel")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.aiSettings.maxTokensDesc")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[generationSettings.maxOutputTokens]}
                      onValueChange={([value]) =>
                        setGenerationSettings({
                          ...generationSettings,
                          maxOutputTokens: value,
                        })
                      }
                      max={8192}
                      min={256}
                      step={256}
                      className="w-40"
                    />
                    <span className="w-16 text-right font-mono">
                      {generationSettings.maxOutputTokens}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("admin.aiSettings.topPLabel")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.aiSettings.topPDesc")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[generationSettings.topP]}
                      onValueChange={([value]) =>
                        setGenerationSettings({
                          ...generationSettings,
                          topP: value,
                        })
                      }
                      max={1}
                      min={0}
                      step={0.05}
                      className="w-40"
                    />
                    <span className="w-12 text-right font-mono">
                      {generationSettings.topP.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("admin.aiSettings.freqPenaltyLabel")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.aiSettings.freqPenaltyDesc")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[generationSettings.frequencyPenalty]}
                      onValueChange={([value]) =>
                        setGenerationSettings({
                          ...generationSettings,
                          frequencyPenalty: value,
                        })
                      }
                      max={2}
                      min={0}
                      step={0.1}
                      className="w-40"
                    />
                    <span className="w-12 text-right font-mono">
                      {generationSettings.frequencyPenalty.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("admin.aiSettings.presPenaltyLabel")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.aiSettings.presPenaltyDesc")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[generationSettings.presencePenalty]}
                      onValueChange={([value]) =>
                        setGenerationSettings({
                          ...generationSettings,
                          presencePenalty: value,
                        })
                      }
                      max={2}
                      min={0}
                      step={0.1}
                      className="w-40"
                    />
                    <span className="w-12 text-right font-mono">
                      {generationSettings.presencePenalty.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 메모리 설정 탭 */}
        <TabsContent value="memory">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.aiSettings.memoryTitle")}</CardTitle>
              <CardDescription>
                {t("admin.aiSettings.memoryDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t("admin.aiSettings.longTermMemoryLabel")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.aiSettings.longTermMemoryDesc")}
                  </p>
                </div>
                <Switch
                  checked={memorySettings.enableLongTermMemory}
                  onCheckedChange={(checked) =>
                    setMemorySettings({
                      ...memorySettings,
                      enableLongTermMemory: checked,
                    })
                  }
                />
              </div>

              {memorySettings.enableLongTermMemory && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t("admin.aiSettings.maxMemoryItemsLabel")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("admin.aiSettings.maxMemoryItemsDesc")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[memorySettings.maxMemoryItems]}
                        onValueChange={([value]) =>
                          setMemorySettings({
                            ...memorySettings,
                            maxMemoryItems: value,
                          })
                        }
                        max={200}
                        min={10}
                        step={10}
                        className="w-32"
                      />
                      <span className="w-12 text-right font-mono">
                        {memorySettings.maxMemoryItems}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>{t("admin.aiSettings.memoryPromptLabel")}</Label>
                    <Textarea
                      value={memorySettings.memoryUpdatePrompt}
                      onChange={(e) =>
                        setMemorySettings({
                          ...memorySettings,
                          memoryUpdatePrompt: e.target.value,
                        })
                      }
                      placeholder={t("admin.aiSettings.memoryPromptPlaceholder")}
                      className="min-h-[150px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("admin.aiSettings.memoryPromptHint")}
                    </p>
                  </div>
                </>
              )}

              {!memorySettings.enableLongTermMemory && (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {t("admin.aiSettings.memoryDisabledNote")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 리포트 설정 탭 */}
        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.aiSettings.reportTitle")}</CardTitle>
              <CardDescription>
                {t("admin.aiSettings.reportDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 제공자 선택 */}
              <div className="space-y-3">
                <Label>{t("admin.aiSettings.reportProvider")}</Label>
                <div className="grid grid-cols-3 gap-4">
                  {(Object.keys(AI_PROVIDER_INFO) as AIProvider[]).map(
                    (key) => {
                      const info = AI_PROVIDER_INFO[key];
                      const isAvailable = apiKeyStatus[key];
                      return (
                        <button
                          key={key}
                          onClick={() => isAvailable && setReportProvider(key)}
                          disabled={!isAvailable}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            reportProvider === key
                              ? "border-primary bg-primary/5"
                              : isAvailable
                              ? "border-border hover:border-primary/50"
                              : "border-border opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="font-semibold mb-1">{info.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {info.description}
                          </div>
                          {!isAvailable && (
                            <Badge
                              variant="outline"
                              className="mt-2 text-xs bg-red-500/10 text-red-600"
                            >
                              {t("admin.aiSettings.noApiKey")}
                            </Badge>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* 모델 선택 */}
              <div className="space-y-3">
                <Label>{t("admin.aiSettings.reportModel")}</Label>
                <Select value={reportModelId} onValueChange={setReportModelId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("admin.aiSettings.modelPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS[reportProvider].map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t("admin.aiSettings.reportTemperature")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.aiSettings.temperatureDesc")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[reportTemperature]}
                    onValueChange={([value]) => setReportTemperature(value)}
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-40"
                  />
                  <span className="w-12 text-right font-mono">
                    {reportTemperature.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Max Output Tokens */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t("admin.aiSettings.reportMaxTokens")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.aiSettings.maxTokensDesc")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[reportMaxTokens]}
                    onValueChange={([value]) => setReportMaxTokens(value)}
                    max={16384}
                    min={256}
                    step={256}
                    className="w-40"
                  />
                  <span className="w-16 text-right font-mono">
                    {reportMaxTokens}
                  </span>
                </div>
              </div>

              {/* 시스템 프롬프트 */}
              <div className="space-y-3">
                <Label>{t("admin.aiSettings.reportPrompt")}</Label>
                <Textarea
                  value={reportSystemPrompt}
                  onChange={(e) => setReportSystemPrompt(e.target.value)}
                  placeholder={t("admin.aiSettings.reportPromptPlaceholder")}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              {/* 저장 버튼 */}
              <div className="pt-4 border-t">
                <Button onClick={handleSaveReport} disabled={isSavingReport}>
                  {isSavingReport ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t("admin.aiSettings.save")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
