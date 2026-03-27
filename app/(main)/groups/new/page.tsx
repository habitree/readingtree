"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createGroup } from "@/app/actions/groups";
import { toast } from "sonner";
import { Loader2, Globe, ShieldCheck, Lock } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { typography, spacing } from "@/lib/design-tokens";
import type { JoinType } from "@/types/group";

const JOIN_TYPE_OPTIONS: Array<{
  value: JoinType;
  icon: typeof Globe;
  colorClass: string;
  selectedClass: string;
}> = [
  {
    value: "open",
    icon: Globe,
    colorClass: "text-green-600 dark:text-green-400",
    selectedClass: "border-green-500 bg-green-50 dark:bg-green-950/20",
  },
  {
    value: "approval",
    icon: ShieldCheck,
    colorClass: "text-blue-600 dark:text-blue-400",
    selectedClass: "border-blue-500 bg-blue-50 dark:bg-blue-950/20",
  },
  {
    value: "private",
    icon: Lock,
    colorClass: "text-amber-600 dark:text-amber-400",
    selectedClass: "border-amber-500 bg-amber-50 dark:bg-amber-950/20",
  },
];

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
    joinType: "approval" as JoinType,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createGroup({
        name: formData.name,
        description: formData.description || undefined,
        joinType: formData.joinType,
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

            {/* 가입 방식 선택 */}
            <div className="space-y-3">
              <Label>{t("groups.joinTypeLabel")}</Label>
              <div className="grid gap-2">
                {JOIN_TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = formData.joinType === option.value;
                  const labelKey = `joinType${option.value.charAt(0).toUpperCase() + option.value.slice(1)}` as
                    | "joinTypeOpen"
                    | "joinTypeApproval"
                    | "joinTypePrivate";
                  const descKey = `${labelKey}Desc` as
                    | "joinTypeOpenDesc"
                    | "joinTypeApprovalDesc"
                    | "joinTypePrivateDesc";

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, joinType: option.value })
                      }
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? option.selectedClass
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <Icon className={`h-5 w-5 shrink-0 ${option.colorClass}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-sm">
                          {t(`groups.${labelKey}`)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(`groups.${descKey}`)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
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
