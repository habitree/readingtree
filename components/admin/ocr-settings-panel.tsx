"use client";

/**
 * OCR 보정 설정 관리 패널 컴포넌트
 *
 * 관리자가 OCR 텍스트 보정 기능의 AI 모델 및 파라미터를 관리할 수 있는 UI입니다.
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
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
  ScanLine,
  Settings,
  Zap,
  DollarSign,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  Sparkles,
  Info,
  PlayCircle,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import {
  getActiveOcrCorrectionSettings,
  updateOcrCorrectionSettings,
  createOcrCorrectionSettings,
  getOcrCorrectionStats,
  testOcrCorrectionConnection,
  getOcrBatchCorrectionStats,
  runOcrBatchCorrection,
} from "@/app/actions/ai/ocr-settings";
import {
  OCR_CORRECTION_MODELS,
  DEFAULT_OCR_CORRECTION_SETTINGS,
  estimateMonthlyCost,
  type OcrCorrectionSettings,
  type OcrCorrectionStats,
  type OcrCorrectionGenerationSettings,
} from "@/types/ai/ocr-settings";
import { AI_PROVIDER_INFO, type AIProvider } from "@/types/ai/settings";

interface OcrSettingsPanelProps {
  initialSettings?: OcrCorrectionSettings | null;
  initialStats?: OcrCorrectionStats | null;
  apiKeyStatus?: { openai: boolean; google: boolean; anthropic: boolean };
}

export function OcrSettingsPanel({
  initialSettings,
  initialStats,
  apiKeyStatus: initialApiKeyStatus,
}: OcrSettingsPanelProps) {
  const { t } = useTranslation();
  // 상태 관리
  const [settings, setSettings] = useState<OcrCorrectionSettings | null>(
    initialSettings || null
  );
  const [stats, setStats] = useState<OcrCorrectionStats | null>(
    initialStats || null
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

  // 일괄 보정 상태
  const [batchStats, setBatchStats] = useState<{
    total: number;
    corrected: number;
    pending: number;
  } | null>(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    processed: number;
    success: number;
    failed: number;
    modified: number;
  } | null>(null);

  // 폼 상태
  const [provider, setProvider] = useState<AIProvider>(
    settings?.provider || DEFAULT_OCR_CORRECTION_SETTINGS.provider
  );
  const [modelId, setModelId] = useState(
    settings?.modelId || DEFAULT_OCR_CORRECTION_SETTINGS.modelId
  );
  const [generationSettings, setGenerationSettings] =
    useState<OcrCorrectionGenerationSettings>(
      settings?.generationSettings ||
        DEFAULT_OCR_CORRECTION_SETTINGS.generationSettings
    );

  // 초기 데이터 로드
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      setProvider(initialSettings.provider);
      setModelId(initialSettings.modelId);
      setGenerationSettings(initialSettings.generationSettings);
    }
  }, [initialSettings]);

  // 제공자 변경 시 모델 초기화
  useEffect(() => {
    const models = OCR_CORRECTION_MODELS[provider];
    if (models.length > 0 && !models.find((m) => m.id === modelId)) {
      // 권장 모델 또는 첫 번째 모델 선택
      const recommendedModel = models.find((m) => m.recommended) || models[0];
      setModelId(recommendedModel.id);
    }
  }, [provider]);

  // 현재 선택된 모델 정보
  const currentModel = OCR_CORRECTION_MODELS[provider].find(
    (m) => m.id === modelId
  );

  // 월간 예상 비용 계산
  const monthlyEstimate = estimateMonthlyCost(
    provider,
    modelId,
    stats?.thisMonthCorrections || 100,
    stats?.avgInputTokens || 500,
    stats?.avgOutputTokens || 300
  );

  // 설정 저장
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = {
        provider,
        modelId,
        generationSettings,
      };

      if (settings?.id && settings.id !== "default") {
        await updateOcrCorrectionSettings(settings.id, formData);
        toast.success(t("admin.ocrSettings.savedSuccess"));
      } else {
        const newSettings = await createOcrCorrectionSettings(formData);
        setSettings(newSettings);
        toast.success(t("admin.ocrSettings.createdSuccess"));
      }
    } catch (error) {
      toast.error(t("admin.ocrSettings.saveFailed"));
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
      const result = await testOcrCorrectionConnection(provider, modelId);
      setTestResult({
        success: result.success,
        message: result.success
          ? t("admin.ocrSettings.connectionSuccess", { ms: result.responseTime })
          : t("admin.ocrSettings.connectionFailed", { error: result.error }),
        responseTime: result.responseTime,
      });
      if (result.success) {
        toast.success(t("admin.ocrSettings.testSuccess"));
      } else {
        toast.error(t("admin.ocrSettings.testFailed", { error: result.error }));
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: t("admin.ocrSettings.testError"),
      });
      toast.error(t("admin.ocrSettings.testErrorToast"));
    } finally {
      setIsTesting(false);
    }
  };

  // 기본값으로 초기화
  const handleResetDefaults = () => {
    setProvider(DEFAULT_OCR_CORRECTION_SETTINGS.provider);
    setModelId(DEFAULT_OCR_CORRECTION_SETTINGS.modelId);
    setGenerationSettings(DEFAULT_OCR_CORRECTION_SETTINGS.generationSettings);
    toast.info(t("admin.ocrSettings.resetSuccess"));
  };

  // 일괄 보정 통계 로드
  const loadBatchStats = async () => {
    setIsBatchLoading(true);
    try {
      const stats = await getOcrBatchCorrectionStats();
      setBatchStats({
        total: stats.total,
        corrected: stats.corrected,
        pending: stats.pending,
      });
    } catch (error) {
      console.error("일괄 보정 통계 로드 실패:", error);
      toast.error(t("admin.ocrSettings.statsLoadFailed"));
    } finally {
      setIsBatchLoading(false);
    }
  };

  // 일괄 보정 실행
  const handleRunBatchCorrection = async () => {
    setIsBatchRunning(true);
    setBatchResult(null);
    try {
      const result = await runOcrBatchCorrection(10);
      setBatchResult({
        processed: result.processed,
        success: result.success,
        failed: result.failed,
        modified: result.modified,
      });
      toast.success(t("admin.ocrSettings.batchSuccess", { success: result.success, modified: result.modified }));
      // 통계 새로고침
      await loadBatchStats();
    } catch (error) {
      console.error("일괄 보정 실행 실패:", error);
      toast.error(t("admin.ocrSettings.batchFailed"));
    } finally {
      setIsBatchRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <ScanLine className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t("admin.ocrSettings.title")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("admin.ocrSettings.description")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleResetDefaults}
            disabled={isSaving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("admin.ocrSettings.resetDefaults")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {t("admin.ocrSettings.save")}
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.ocrSettings.thisMonthCorrections")}</p>
                  <p className="text-2xl font-bold">
                    {stats.thisMonthCorrections.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.ocrSettings.successRate")}</p>
                  <p className="text-2xl font-bold">{stats.successRate}%</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.ocrSettings.thisMonthCost")}</p>
                  <p className="text-2xl font-bold">
                    ${stats.thisMonthCostUsd.toFixed(4)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.ocrSettings.estimatedCost")}</p>
                  <p className="text-2xl font-bold">
                    ${monthlyEstimate.toFixed(4)}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API 키 상태 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {t("admin.ocrSettings.apiKeyStatus")}
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="model" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t("admin.ocrSettings.tabModel")}
          </TabsTrigger>
          <TabsTrigger value="params" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t("admin.ocrSettings.tabParams")}
          </TabsTrigger>
          <TabsTrigger value="cost" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {t("admin.ocrSettings.tabCost")}
          </TabsTrigger>
          <TabsTrigger
            value="batch"
            className="flex items-center gap-2"
            onClick={() => {
              if (!batchStats) loadBatchStats();
            }}
          >
            <Database className="h-4 w-4" />
            {t("admin.ocrSettings.tabBatch")}
          </TabsTrigger>
        </TabsList>

        {/* 모델 선택 탭 */}
        <TabsContent value="model">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.ocrSettings.modelSelectTitle")}</CardTitle>
              <CardDescription>
                {t("admin.ocrSettings.modelSelectDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 제공자 선택 */}
              <div className="space-y-3">
                <Label>{t("admin.ocrSettings.providerLabel")}</Label>
                <div className="grid grid-cols-3 gap-4">
                  {(Object.keys(AI_PROVIDER_INFO) as AIProvider[]).map(
                    (key) => {
                      const info = AI_PROVIDER_INFO[key];
                      const isAvailable = apiKeyStatus[key];
                      const models = OCR_CORRECTION_MODELS[key];
                      const recommendedModel = models.find((m) => m.recommended);

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
                          <div className="text-xs text-muted-foreground mb-2">
                            {info.description}
                          </div>
                          {recommendedModel && (
                            <div className="text-xs text-muted-foreground">
                              {t("admin.ocrSettings.recommendedModel", { name: recommendedModel.name })}
                            </div>
                          )}
                          {!isAvailable && (
                            <Badge
                              variant="outline"
                              className="mt-2 text-xs bg-red-500/10 text-red-600"
                            >
                              {t("admin.ocrSettings.noApiKey")}
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
                <Label>{t("admin.ocrSettings.modelLabel")}</Label>
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("admin.ocrSettings.modelPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {OCR_CORRECTION_MODELS[provider].map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.name}</span>
                          {model.recommended && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-green-500/10 text-green-700"
                            >
                              {t("admin.ocrSettings.recommended")}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            (${model.cost.input}/1M, ${model.cost.output}/1M)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 현재 선택 정보 */}
              {currentModel && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{t("admin.ocrSettings.currentSelection")}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <strong>{AI_PROVIDER_INFO[provider].name}</strong> -{" "}
                      {currentModel.name}
                    </p>
                    <p>
                      {t("admin.ocrSettings.costInfo", { input: currentModel.cost.input, output: currentModel.cost.output })}
                    </p>
                  </div>
                </div>
              )}

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
                    {isTesting ? t("admin.ocrSettings.testing") : t("admin.ocrSettings.testConnection")}
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
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 파라미터 설정 탭 */}
        <TabsContent value="params">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.ocrSettings.paramsTitle")}</CardTitle>
              <CardDescription>
                {t("admin.ocrSettings.paramsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("admin.ocrSettings.temperatureLabel")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.ocrSettings.temperatureDesc")}
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
                      max={1}
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
                    <Label>{t("admin.ocrSettings.maxTokensLabel")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.ocrSettings.maxTokensDesc")}
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
                      max={4096}
                      min={256}
                      step={256}
                      className="w-40"
                    />
                    <span className="w-16 text-right font-mono">
                      {generationSettings.maxOutputTokens}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">{t("admin.ocrSettings.recommendedSettings")}</p>
                    <ul className="list-disc list-inside text-xs space-y-1">
                      <li>{t("admin.ocrSettings.recommendedTemp")}</li>
                      <li>{t("admin.ocrSettings.recommendedTokens")}</li>
                      <li>{t("admin.ocrSettings.qualityTip")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 비용 정보 탭 */}
        <TabsContent value="cost">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.ocrSettings.costTitle")}</CardTitle>
              <CardDescription>
                {t("admin.ocrSettings.costDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(Object.keys(OCR_CORRECTION_MODELS) as AIProvider[]).map(
                  (providerKey) => (
                    <div key={providerKey} className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        {AI_PROVIDER_INFO[providerKey].name}
                        {!apiKeyStatus[providerKey] && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-red-500/10 text-red-600"
                          >
                            {t("admin.ocrSettings.notConfigured")}
                          </Badge>
                        )}
                      </h4>
                      <div className="grid gap-2">
                        {OCR_CORRECTION_MODELS[providerKey].map((model) => {
                          const monthlyEst = estimateMonthlyCost(
                            providerKey,
                            model.id,
                            1000,
                            500,
                            300
                          );
                          const isSelected =
                            provider === providerKey && modelId === model.id;

                          return (
                            <div
                              key={model.id}
                              className={`p-3 rounded-lg border transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {model.name}
                                  </span>
                                  {model.recommended && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs bg-green-500/10 text-green-700"
                                    >
                                      {t("admin.ocrSettings.recommended")}
                                    </Badge>
                                  )}
                                  {isSelected && (
                                    <Badge
                                      variant="default"
                                      className="text-xs"
                                    >
                                      {t("admin.ocrSettings.selected")}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <span>{t("admin.ocrSettings.monthly1000")}</span>
                                  <span className="font-mono font-medium">
                                    ${monthlyEst.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {t("admin.ocrSettings.tokenCostInfo", { input: model.cost.input, output: model.cost.output })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="mt-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="flex items-start gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">{t("admin.ocrSettings.costTips")}</p>
                    <ul className="list-disc list-inside text-xs space-y-1">
                      <li>{t("admin.ocrSettings.costTip1")}</li>
                      <li>{t("admin.ocrSettings.costTip2")}</li>
                      <li>{t("admin.ocrSettings.costTip3")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 일괄 보정 탭 */}
        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.ocrSettings.batchTitle")}</CardTitle>
              <CardDescription>
                {t("admin.ocrSettings.batchDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 통계 */}
              {isBatchLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">{t("admin.ocrSettings.statsLoading")}</span>
                </div>
              ) : batchStats ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">{t("admin.ocrSettings.totalData")}</p>
                    <p className="text-2xl font-bold">{batchStats.total}</p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-sm text-green-700">{t("admin.ocrSettings.correctionDone")}</p>
                    <p className="text-2xl font-bold text-green-700">{batchStats.corrected}</p>
                  </div>
                  <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <p className="text-sm text-orange-700">{t("admin.ocrSettings.correctionPending")}</p>
                    <p className="text-2xl font-bold text-orange-700">{batchStats.pending}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <Database className="h-12 w-12 text-muted-foreground/30" />
                  <Button variant="outline" onClick={loadBatchStats}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t("admin.ocrSettings.loadStats")}
                  </Button>
                </div>
              )}

              {/* 실행 버튼 */}
              {batchStats && batchStats.pending > 0 && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">{t("admin.ocrSettings.batchGuide")}</p>
                        <ul className="list-disc list-inside text-xs space-y-1">
                          <li>{t("admin.ocrSettings.batchGuide1")}</li>
                          <li>{t("admin.ocrSettings.batchGuide2")}</li>
                          <li>{t("admin.ocrSettings.batchGuide3")}</li>
                          <li>{t("admin.ocrSettings.batchGuide4")}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleRunBatchCorrection}
                      disabled={isBatchRunning}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isBatchRunning ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <PlayCircle className="h-4 w-4 mr-2" />
                      )}
                      {isBatchRunning ? t("admin.ocrSettings.correcting") : t("admin.ocrSettings.runBatch", { count: Math.min(10, batchStats.pending) })}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={loadBatchStats}
                      disabled={isBatchLoading || isBatchRunning}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isBatchLoading ? "animate-spin" : ""}`} />
                      {t("admin.ocrSettings.refresh")}
                    </Button>
                  </div>
                </div>
              )}

              {/* 보정 완료 메시지 */}
              {batchStats && batchStats.pending === 0 && (
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 font-medium">{t("admin.ocrSettings.allCorrected")}</span>
                  </div>
                </div>
              )}

              {/* 실행 결과 */}
              {batchResult && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="font-medium">{t("admin.ocrSettings.resultTitle")}</p>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t("admin.ocrSettings.resultProcessed")}</p>
                      <p className="font-bold">{batchResult.processed}{t("admin.ocrSettings.itemUnit")}</p>
                    </div>
                    <div>
                      <p className="text-green-600">{t("admin.ocrSettings.resultSuccess")}</p>
                      <p className="font-bold text-green-600">{batchResult.success}{t("admin.ocrSettings.itemUnit")}</p>
                    </div>
                    <div>
                      <p className="text-red-600">{t("admin.ocrSettings.resultFailed")}</p>
                      <p className="font-bold text-red-600">{batchResult.failed}{t("admin.ocrSettings.itemUnit")}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">{t("admin.ocrSettings.resultModified")}</p>
                      <p className="font-bold text-blue-600">{batchResult.modified}{t("admin.ocrSettings.itemUnit")}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
