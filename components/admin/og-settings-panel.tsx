"use client";

import { useState, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Image,
  Palette,
  Eye,
  Upload,
  Trash2,
  RotateCcw,
  Save,
  ExternalLink,
  Loader2,
} from "lucide-react";
import type { OgSettings, OgSettingsFormData } from "@/types/og-settings";
import { OG_SETTINGS_DEFAULTS, isValidHexColor } from "@/types/og-settings";
import {
  updateOgSettings,
  uploadOgBrandIcon,
  deleteOgBrandIcon,
  resetOgSettings,
} from "@/app/actions/admin/og-settings";

interface OgSettingsPanelProps {
  initialSettings: OgSettings | null;
}

/** DB 데이터를 폼 데이터로 변환 */
function settingsToForm(s: OgSettings | null): OgSettingsFormData {
  if (!s) return { ...OG_SETTINGS_DEFAULTS };
  return {
    brand_name: s.brand_name,
    tagline: s.tagline,
    keywords: s.keywords,
    domain: s.domain,
    description: s.description,
    brand_icon_url: s.brand_icon_url,
    color_background: s.color_background,
    color_forest: s.color_forest,
    color_forest_light: s.color_forest_light,
    color_forest_lighter: s.color_forest_lighter,
    color_text_primary: s.color_text_primary,
    color_text_secondary: s.color_text_secondary,
    color_text_muted: s.color_text_muted,
    color_card_background: s.color_card_background,
    color_border: s.color_border,
    color_earth: s.color_earth,
    color_earth_light: s.color_earth_light,
  };
}

const COLOR_GROUPS = [
  {
    label: "배경",
    fields: [
      { key: "color_background" as const, label: "메인 배경" },
      { key: "color_card_background" as const, label: "카드 배경" },
    ],
  },
  {
    label: "포레스트 그린",
    fields: [
      { key: "color_forest" as const, label: "포레스트" },
      { key: "color_forest_light" as const, label: "포레스트 라이트" },
      { key: "color_forest_lighter" as const, label: "포레스트 라이터" },
      { key: "color_border" as const, label: "보더" },
    ],
  },
  {
    label: "텍스트",
    fields: [
      { key: "color_text_primary" as const, label: "기본 텍스트" },
      { key: "color_text_secondary" as const, label: "보조 텍스트" },
      { key: "color_text_muted" as const, label: "뮤트 텍스트" },
    ],
  },
  {
    label: "어스 톤 (리포트용)",
    fields: [
      { key: "color_earth" as const, label: "어스" },
      { key: "color_earth_light" as const, label: "어스 라이트" },
    ],
  },
];

export function OgSettingsPanel({ initialSettings }: OgSettingsPanelProps) {
  const [form, setForm] = useState<OgSettingsFormData>(
    settingsToForm(initialSettings)
  );
  const [iconUrl, setIconUrl] = useState<string | null>(
    initialSettings?.brand_icon_url ?? null
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof OgSettingsFormData>(
    key: K,
    value: OgSettingsFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateOgSettings({
        ...form,
        brand_icon_url: iconUrl,
      });
      if (result.success) {
        toast.success("OG 설정이 저장되었습니다.");
      } else {
        toast.error(result.error || "저장 실패");
      }
    } catch {
      toast.error("설정 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("icon", file);
      const result = await uploadOgBrandIcon(fd);
      if (result.success && result.url) {
        setIconUrl(result.url);
        toast.success("아이콘이 업로드되었습니다.");
      } else {
        toast.error(result.error || "업로드 실패");
      }
    } catch {
      toast.error("아이콘 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleIconDelete = async () => {
    setUploading(true);
    try {
      const result = await deleteOgBrandIcon();
      if (result.success) {
        setIconUrl(null);
        toast.success("아이콘이 삭제되었습니다.");
      } else {
        toast.error(result.error || "삭제 실패");
      }
    } catch {
      toast.error("아이콘 삭제 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("모든 OG 설정을 기본값으로 초기화하시겠습니까?")) return;
    setSaving(true);
    try {
      const result = await resetOgSettings();
      if (result.success) {
        setForm({ ...OG_SETTINGS_DEFAULTS });
        setIconUrl(null);
        toast.success("설정이 기본값으로 초기화되었습니다.");
      } else {
        toast.error(result.error || "초기화 실패");
      }
    } catch {
      toast.error("초기화 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const resetColorGroup = (fields: { key: keyof OgSettingsFormData }[]) => {
    setForm((prev) => {
      const updated = { ...prev };
      for (const f of fields) {
        (updated as Record<string, unknown>)[f.key] =
          OG_SETTINGS_DEFAULTS[f.key];
      }
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            OG 이미지 설정
          </h1>
          <p className="text-muted-foreground mt-1">
            소셜 미디어 공유 시 표시되는 미리보기 이미지의 브랜드, 색상, 아이콘을
            설정합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            전체 초기화
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            저장
          </Button>
        </div>
      </div>

      <Tabs defaultValue="brand" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="brand" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            브랜드
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            색상
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            미리보기
          </TabsTrigger>
        </TabsList>

        {/* 브랜드 탭 */}
        <TabsContent value="brand">
          <div className="grid gap-6">
            {/* 텍스트 설정 */}
            <Card>
              <CardHeader>
                <CardTitle>브랜드 텍스트</CardTitle>
                <CardDescription>
                  OG 이미지에 표시되는 브랜드 정보를 설정합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>브랜드 이름</Label>
                    <Input
                      value={form.brand_name}
                      onChange={(e) =>
                        updateField("brand_name", e.target.value)
                      }
                      placeholder="Habitree"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>도메인</Label>
                    <Input
                      value={form.domain}
                      onChange={(e) => updateField("domain", e.target.value)}
                      placeholder="habitree.app"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>태그라인</Label>
                  <Input
                    value={form.tagline}
                    onChange={(e) => updateField("tagline", e.target.value)}
                    placeholder="읽는 습관이 자라는 곳"
                  />
                </div>
                <div className="space-y-2">
                  <Label>키워드</Label>
                  <Input
                    value={form.keywords}
                    onChange={(e) => updateField("keywords", e.target.value)}
                    placeholder="독서 기록 · AI 도우미 · 독서 모임"
                  />
                </div>
                <div className="space-y-2">
                  <Label>설명</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="읽는 습관이 자라는 곳 - 독서 기록, AI 도우미, 독서 모임"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 아이콘 설정 */}
            <Card>
              <CardHeader>
                <CardTitle>브랜드 아이콘</CardTitle>
                <CardDescription>
                  OG 이미지에 표시되는 브랜드 아이콘입니다. 512KB 이하의 PNG,
                  SVG, JPEG, WebP 파일을 업로드하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  {/* 현재 아이콘 프리뷰 */}
                  <div className="shrink-0">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50">
                      {iconUrl ? (
                        <img
                          src={iconUrl}
                          alt="브랜드 아이콘"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Image className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {iconUrl ? "커스텀 아이콘" : "기본 아이콘"}
                    </p>
                  </div>

                  {/* 업로드/삭제 버튼 */}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg,image/webp"
                      onChange={handleIconUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      아이콘 업로드
                    </Button>
                    {iconUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleIconDelete}
                        disabled={uploading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제 (기본값 사용)
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 색상 탭 */}
        <TabsContent value="colors">
          <div className="grid gap-6">
            {COLOR_GROUPS.map((group) => (
              <Card key={group.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base">{group.label}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resetColorGroup(group.fields)}
                    className="text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    기본값
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {group.fields.map((field) => {
                      const value = form[field.key] as string;
                      const isValid = isValidHexColor(value);
                      return (
                        <div key={field.key} className="space-y-1.5">
                          <Label className="text-xs">{field.label}</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={isValid ? value : "#000000"}
                              onChange={(e) =>
                                updateField(field.key, e.target.value)
                              }
                              className="w-8 h-8 rounded-md border cursor-pointer shrink-0"
                            />
                            <Input
                              value={value}
                              onChange={(e) =>
                                updateField(
                                  field.key,
                                  e.target.value.startsWith("#")
                                    ? e.target.value
                                    : `#${e.target.value}`
                                )
                              }
                              className={`font-mono text-xs h-8 ${
                                !isValid
                                  ? "border-destructive focus-visible:ring-destructive"
                                  : ""
                              }`}
                              maxLength={7}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 미리보기 탭 */}
        <TabsContent value="preview">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>OG 이미지 미리보기</CardTitle>
                <CardDescription>
                  현재 설정으로 생성될 OG 이미지의 대략적인 미리보기입니다.
                  실제 이미지와 약간의 차이가 있을 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* 홈페이지 OG 프리뷰 */}
                <OgPreviewCard
                  title="홈페이지"
                  previewUrl="/opengraph-image"
                  form={form}
                  iconUrl={iconUrl}
                  variant="home"
                />
                {/* 노트 공유 OG 프리뷰 */}
                <OgPreviewCard
                  title="노트 공유"
                  form={form}
                  iconUrl={iconUrl}
                  variant="note"
                />
                {/* 서재 공유 OG 프리뷰 */}
                <OgPreviewCard
                  title="서재 공유"
                  form={form}
                  iconUrl={iconUrl}
                  variant="bookshelf"
                />
                {/* 리포트 공유 OG 프리뷰 */}
                <OgPreviewCard
                  title="AI 리포트 공유"
                  form={form}
                  iconUrl={iconUrl}
                  variant="report"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** CSS 기반 OG 이미지 미리보기 카드 */
function OgPreviewCard({
  title,
  previewUrl,
  form,
  iconUrl,
  variant,
}: {
  title: string;
  previewUrl?: string;
  form: OgSettingsFormData;
  iconUrl: string | null;
  variant: "home" | "note" | "bookshelf" | "report";
}) {
  const isReport = variant === "report";
  const accentColor = isReport ? form.color_earth : form.color_forest;
  const accentLight = isReport ? form.color_earth_light : form.color_forest_light;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {previewUrl && (
          <a
            href={`${previewUrl}?t=${Date.now()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            실제 이미지 보기
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* 1200x630 비율 (600x315) */}
      <div
        className="relative w-full rounded-lg overflow-hidden border shadow-sm"
        style={{
          aspectRatio: "1200/630",
          maxWidth: 600,
          backgroundColor: form.color_background,
        }}
      >
        {/* 상단 악센트 바 */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: isReport
              ? `linear-gradient(90deg, ${form.color_earth}, ${accentLight}, ${form.color_forest})`
              : `linear-gradient(90deg, ${form.color_forest}, ${form.color_forest_light}, ${form.color_forest_lighter}, ${form.color_forest_light}, ${form.color_forest})`,
          }}
        />

        {variant === "home" ? (
          /* 홈페이지 레이아웃 */
          <div className="flex flex-col items-center justify-center h-full gap-2 px-8">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: iconUrl ? "transparent" : accentColor }}
            >
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-white text-lg font-bold">
                  {form.brand_name.charAt(0)}
                </span>
              )}
            </div>
            <div
              className="text-2xl font-extrabold"
              style={{ color: form.color_text_primary }}
            >
              {form.brand_name}
            </div>
            <div
              className="text-sm font-semibold"
              style={{ color: form.color_forest }}
            >
              {form.tagline}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-6 h-0.5 rounded"
                style={{ backgroundColor: form.color_border }}
              />
              <div
                className="text-[10px] font-medium"
                style={{ color: form.color_text_secondary }}
              >
                {form.keywords}
              </div>
              <div
                className="w-6 h-0.5 rounded"
                style={{ backgroundColor: form.color_border }}
              />
            </div>
            <div
              className="text-[9px] mt-auto pb-3"
              style={{ color: form.color_text_muted }}
            >
              {form.domain}
            </div>
          </div>
        ) : (
          /* 카드 레이아웃 (노트, 서재, 리포트) */
          <div className="flex h-full pt-2 px-4 pb-2">
            {/* 좌측 */}
            <div
              className="w-[42%] flex flex-col items-center justify-center gap-1.5 rounded-l-lg p-3"
              style={{
                backgroundColor: isReport ? "#faf5ee" : "#f0fdf4",
              }}
            >
              <div className="w-12 h-16 bg-gray-200 rounded-sm" />
              <div
                className="text-[10px] font-bold text-center"
                style={{ color: form.color_text_primary }}
              >
                {variant === "bookshelf" ? "나의 서재" : "책 제목"}
              </div>
              <div className="text-[8px] text-gray-400">저자명</div>
            </div>
            {/* 우측 */}
            <div className="flex-1 flex flex-col justify-between p-3">
              <div>
                <div
                  className="inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-full mb-1.5"
                  style={{
                    color: accentColor,
                    backgroundColor: isReport
                      ? "#faf5ee"
                      : "#f0fdf4",
                    border: `1px solid ${isReport ? accentLight : form.color_border}`,
                  }}
                >
                  {variant === "note"
                    ? "인용구"
                    : variant === "bookshelf"
                      ? "BOOKSHELF"
                      : "AI 독서 리포트"}
                </div>
                <div className="flex gap-1.5">
                  <div
                    className="w-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: accentLight }}
                  />
                  <div
                    className="text-[9px] leading-relaxed"
                    style={{ color: form.color_text_primary }}
                  >
                    {variant === "note"
                      ? '"인상 깊었던 문장이 이곳에 표시됩니다..."'
                      : variant === "bookshelf"
                        ? "책 표지들이 이곳에 그리드로 표시됩니다."
                        : "AI가 분석한 독서 인사이트가 이곳에 표시됩니다."}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1">
                <div
                  className="w-3 h-3 rounded flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: iconUrl ? "transparent" : accentColor,
                  }}
                >
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt=""
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <span className="text-white text-[6px] font-bold">
                      {form.brand_name.charAt(0)}
                    </span>
                  )}
                </div>
                <span
                  className="text-[8px] font-bold"
                  style={{ color: form.color_text_primary }}
                >
                  {form.brand_name}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
