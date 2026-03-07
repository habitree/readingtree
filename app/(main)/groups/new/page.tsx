"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createGroup } from "@/app/actions/groups";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { typography, spacing } from "@/lib/design-tokens";

/**
 * 모임 생성 페이지
 * US-033: 독서모임 생성
 */
export default function NewGroupPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createGroup({
        name: formData.name,
        description: formData.description || undefined,
        isPublic: formData.isPublic,
      });

      toast.success(t("groups.groupCreatedSuccess"));
      router.push(`/groups/${result.groupId}`);
    } catch (error) {
      console.error("모임 생성 오류:", error);
      toast.error(
        error instanceof Error ? error.message : t("groups.groupCreateFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={spacing.pageSectionWide}>
      <div>
        <h1 className={typography.pageTitle}>{t("groups.newGroupPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("groups.newGroupPageDesc")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("groups.groupInfoCardTitle")}</CardTitle>
          <CardDescription>
            {t("groups.groupInfoCardDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("groups.groupNameLabel")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t("groups.groupNamePlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("groups.groupDescLabel")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={t("groups.groupDescPlaceholder")}
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isPublic">{t("groups.groupPublicLabel")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("groups.groupPublicDesc")}
                </p>
              </div>
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublic: checked })
                }
              />
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name}
                fullWidth
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("groups.groupCreating")}
                  </>
                ) : (
                  t("groups.groupCreateBtn")
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                fullWidth
              >
                {t("groups.groupCancelBtn")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

