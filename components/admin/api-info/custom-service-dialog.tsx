"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import {
  createCustomApiService,
  updateCustomApiService,
} from "@/app/actions/admin/custom-api-services";
import type { CustomApiService } from "@/types/custom-api-service";

interface CustomServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editService?: CustomApiService | null;
}

export function CustomServiceDialog({
  open,
  onOpenChange,
  onSuccess,
  editService,
}: CustomServiceDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!editService;

  const [name, setName] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [description, setDescription] = useState("");
  const [externalDocUrl, setExternalDocUrl] = useState("");
  const [featuresText, setFeaturesText] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // editService가 변경될 때 폼 초기화
  const resetForm = (service?: CustomApiService | null) => {
    if (service) {
      setName(service.name);
      setEndpointUrl(service.endpoint_url);
      setApiKey("");
      setDescription(service.description);
      setExternalDocUrl(service.external_doc_url);
      setFeaturesText(service.features.join("\n"));
      setNotes(service.notes);
      setIsActive(service.is_active);
    } else {
      setName("");
      setEndpointUrl("");
      setApiKey("");
      setDescription("");
      setExternalDocUrl("");
      setFeaturesText("");
      setNotes("");
      setIsActive(true);
    }
    setError("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetForm(editService);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t("admin.apiInfo.customServiceNameRequired"));
      return;
    }

    setSaving(true);
    setError("");

    const features = featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const input = {
      name: name.trim(),
      endpoint_url: endpointUrl.trim(),
      api_key: apiKey,
      description: description.trim(),
      external_doc_url: externalDocUrl.trim(),
      features,
      notes: notes.trim(),
      is_active: isActive,
    };

    const result = isEdit
      ? await updateCustomApiService(editService!.id, input)
      : await createCustomApiService(input);

    setSaving(false);

    if (result.success) {
      onOpenChange(false);
      onSuccess();
    } else {
      setError(result.error ?? t("admin.apiInfo.customServiceSaveError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("admin.apiInfo.editCustomService")
              : t("admin.apiInfo.addCustomService")}
          </DialogTitle>
          <DialogDescription className="sr-only">커스텀 API 서비스 설정</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 서비스명 */}
          <div className="space-y-1.5">
            <Label htmlFor="cs-name">{t("admin.apiInfo.serviceName")} *</Label>
            <Input
              id="cs-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Stripe, SendGrid..."
            />
          </div>

          {/* 엔드포인트 URL */}
          <div className="space-y-1.5">
            <Label htmlFor="cs-url">{t("admin.apiInfo.endpointUrl")}</Label>
            <Input
              id="cs-url"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
            />
          </div>

          {/* API 키 */}
          <div className="space-y-1.5">
            <Label htmlFor="cs-key">{t("admin.apiInfo.apiKey")}</Label>
            <Input
              id="cs-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                isEdit
                  ? t("admin.apiInfo.apiKeyKeepExisting")
                  : "sk-..."
              }
            />
            {isEdit && editService?.api_key_preview && (
              <p className="text-xs text-muted-foreground">
                {t("admin.apiInfo.currentKey")}: {editService.api_key_preview}
              </p>
            )}
          </div>

          {/* 설명 */}
          <div className="space-y-1.5">
            <Label htmlFor="cs-desc">{t("admin.apiInfo.serviceDescription")}</Label>
            <Input
              id="cs-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("admin.apiInfo.serviceDescriptionPlaceholder")}
            />
          </div>

          {/* 문서 URL */}
          <div className="space-y-1.5">
            <Label htmlFor="cs-doc">{t("admin.apiInfo.docUrl")}</Label>
            <Input
              id="cs-doc"
              value={externalDocUrl}
              onChange={(e) => setExternalDocUrl(e.target.value)}
              placeholder="https://docs.example.com"
            />
          </div>

          {/* 기능 목록 */}
          <div className="space-y-1.5">
            <Label htmlFor="cs-features">{t("admin.apiInfo.featuresList")}</Label>
            <Textarea
              id="cs-features"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder={t("admin.apiInfo.featuresPlaceholder")}
              rows={3}
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label htmlFor="cs-notes">{t("admin.apiInfo.serviceNotes")}</Label>
            <Textarea
              id="cs-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* 활성 상태 */}
          <div className="flex items-center gap-3">
            <Switch
              id="cs-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="cs-active">{t("admin.apiInfo.serviceActive")}</Label>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {t("admin.apiInfo.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEdit
              ? t("admin.apiInfo.save")
              : t("admin.apiInfo.addCustomService")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
