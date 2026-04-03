"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb } from "lucide-react";
import { createFeatureRequest, updateFeatureRequest } from "@/app/actions/feature-requests";
import { FeatureAreaPicker } from "./feature-area-picker";
import { toast } from "sonner";
import type { FeatureRequest } from "@/types/feature-request";

interface FeatureRequestFormProps {
  mode: "create" | "edit";
  initialData?: Pick<FeatureRequest, "id" | "title" | "description" | "feature_area">;
}

/**
 * 기능 요청 작성/수정 폼
 */
export function FeatureRequestForm({
  mode,
  initialData,
}: FeatureRequestFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [featureArea, setFeatureArea] = useState<string | null>(initialData?.feature_area || null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        if (mode === "create") {
          const result = await createFeatureRequest({
            title,
            description,
            feature_area: featureArea || undefined,
          });

          if (result.success && result.id) {
            toast.success(t("featureRequests.submitSuccess"));
            router.push(`/feature-requests/${result.id}`);
          } else {
            toast.error(result.error || t("featureRequests.submitFailed"));
          }
        } else if (mode === "edit" && initialData) {
          const result = await updateFeatureRequest(initialData.id, {
            title,
            description,
            feature_area: featureArea || undefined,
          });

          if (result.success) {
            toast.success(t("featureRequests.updateSuccess"));
            router.push(`/feature-requests/${initialData.id}`);
          } else {
            toast.error(result.error || t("featureRequests.updateFailed"));
          }
        }
      } catch (error) {
        toast.error(t("featureRequests.errorOccurred"));
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          {mode === "create" ? t("featureRequests.newRequest") : t("featureRequests.editRequest")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("featureRequests.titleLabel")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("featureRequests.titlePlaceholder")}
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/200
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t("featureRequests.featureAreaLabel")}</Label>
            <FeatureAreaPicker
              value={featureArea}
              onChange={setFeatureArea}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("featureRequests.descriptionLabel")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("featureRequests.descriptionPlaceholder")}
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              {t("featureRequests.minCharsNotice")}
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button
              type="submit"
              disabled={isPending}
              fullWidth
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? t("featureRequests.submitting") : t("featureRequests.updating")}
                </>
              ) : mode === "create" ? (
                t("featureRequests.submitButton")
              ) : (
                t("featureRequests.updateButton")
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
              fullWidth
            >
              {t("featureRequests.cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
