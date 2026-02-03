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
} from "lucide-react";
import { toast } from "sonner";
import {
  getActiveOcrCorrectionSettings,
  updateOcrCorrectionSettings,
  createOcrCorrectionSettings,
  getOcrCorrectionStats,
  testOcrCorrectionConnection,
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
        toast.success("OCR 보정 설정이 저장되었습니다.");
      } else {
        const newSettings = await createOcrCorrectionSettings(formData);
        setSettings(newSettings);
        toast.success("OCR 보정 설정이 생성되었습니다.");
      }
    } catch (error) {
      toast.error("설정 저장에 실패했습니다.");
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
          ? `연결 성공! 응답시간: ${result.responseTime}ms`
          : `연결 실패: ${result.error}`,
        responseTime: result.responseTime,
      });
      if (result.success) {
        toast.success("연결 테스트 성공!");
      } else {
        toast.error(`연결 테스트 실패: ${result.error}`);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "테스트 중 오류가 발생했습니다.",
      });
      toast.error("연결 테스트 중 오류가 발생했습니다.");
    } finally {
      setIsTesting(false);
    }
  };

  // 기본값으로 초기화
  const handleResetDefaults = () => {
    setProvider(DEFAULT_OCR_CORRECTION_SETTINGS.provider);
    setModelId(DEFAULT_OCR_CORRECTION_SETTINGS.modelId);
    setGenerationSettings(DEFAULT_OCR_CORRECTION_SETTINGS.generationSettings);
    toast.info("기본값으로 초기화되었습니다. 저장을 눌러 적용하세요.");
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
            <h2 className="text-2xl font-bold">OCR 보정 설정</h2>
            <p className="text-muted-foreground text-sm">
              OCR 텍스트 자동 보정에 사용할 AI 모델과 파라미터를 설정합니다
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
            기본값 복원
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            저장
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
                  <p className="text-sm text-muted-foreground">이번 달 보정</p>
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
                  <p className="text-sm text-muted-foreground">성공률</p>
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
                  <p className="text-sm text-muted-foreground">이번 달 비용</p>
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
                  <p className="text-sm text-muted-foreground">예상 비용</p>
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
            API 키 상태
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="model" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            모델 선택
          </TabsTrigger>
          <TabsTrigger value="params" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            파라미터
          </TabsTrigger>
          <TabsTrigger value="cost" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            비용 정보
          </TabsTrigger>
        </TabsList>

        {/* 모델 선택 탭 */}
        <TabsContent value="model">
          <Card>
            <CardHeader>
              <CardTitle>AI 모델 선택</CardTitle>
              <CardDescription>
                OCR 텍스트 보정에 사용할 AI 제공자와 모델을 선택하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 제공자 선택 */}
              <div className="space-y-3">
                <Label>AI 제공자</Label>
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
                              권장: {recommendedModel.name}
                            </div>
                          )}
                          {!isAvailable && (
                            <Badge
                              variant="outline"
                              className="mt-2 text-xs bg-red-500/10 text-red-600"
                            >
                              API 키 미설정
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
                <Label>모델</Label>
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="모델을 선택하세요" />
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
                              권장
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            (입력: ${model.cost.input}/1M, 출력: $
                            {model.cost.output}/1M)
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
                    <span className="font-medium">현재 선택</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <strong>{AI_PROVIDER_INFO[provider].name}</strong> -{" "}
                      {currentModel.name}
                    </p>
                    <p>
                      비용: 입력 ${currentModel.cost.input}/1M 토큰, 출력 $
                      {currentModel.cost.output}/1M 토큰
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
                    연결 테스트
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
              <CardTitle>생성 파라미터</CardTitle>
              <CardDescription>
                OCR 보정 AI의 동작 방식을 조정하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Temperature (일관성)</Label>
                    <p className="text-xs text-muted-foreground">
                      낮을수록 일관된 보정, 높을수록 다양한 보정 (권장: 0.3)
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
                    <Label>최대 출력 토큰</Label>
                    <p className="text-xs text-muted-foreground">
                      보정된 텍스트의 최대 길이 (권장: 2048)
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
                    <p className="font-medium mb-1">OCR 보정 권장 설정</p>
                    <ul className="list-disc list-inside text-xs space-y-1">
                      <li>Temperature: 0.3 (일관된 보정)</li>
                      <li>Max Tokens: 2048 (긴 텍스트 대응)</li>
                      <li>
                        보정 품질이 중요하면 Temperature를 낮추고, 다양성이
                        필요하면 높이세요
                      </li>
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
              <CardTitle>모델별 비용 비교</CardTitle>
              <CardDescription>
                각 모델의 비용을 비교하여 효율적인 모델을 선택하세요
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
                            미설정
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
                                      권장
                                    </Badge>
                                  )}
                                  {isSelected && (
                                    <Badge
                                      variant="default"
                                      className="text-xs"
                                    >
                                      선택됨
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <span>월 1000건: </span>
                                  <span className="font-mono font-medium">
                                    ${monthlyEst.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                입력: ${model.cost.input}/1M 토큰 | 출력: $
                                {model.cost.output}/1M 토큰
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
                    <p className="font-medium mb-1">비용 절감 팁</p>
                    <ul className="list-disc list-inside text-xs space-y-1">
                      <li>
                        <strong>Gemini 2.0 Flash</strong>가 가장 저렴하며 성능도
                        우수합니다
                      </li>
                      <li>
                        <strong>GPT-4o Mini</strong>는 비용 대비 안정적인
                        품질을 제공합니다
                      </li>
                      <li>
                        월 1000건 기준 $0.13 ~ $0.50 수준의 비용이 예상됩니다
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
