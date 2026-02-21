"use client";

import { getProfile } from "@/app/actions/profile";
import { ProfileForm } from "./profile-form";
import { DeleteAccountSection } from "./delete-account-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatSmartDate } from "@/lib/utils/date";
import { useTranslation } from "@/lib/i18n";
import { User, AlertCircle, RefreshCw } from "lucide-react";

interface ProfileContentProps {
  initialProfile: Awaited<ReturnType<typeof getProfile>> | null;
}

/**
 * 프로필 컨텐츠 컴포넌트
 * 서버에서 전달받은 initialProfile을 즉시 표시 (클라이언트 fetch 제거)
 */
export function ProfileContent({ initialProfile }: ProfileContentProps) {
  const { t } = useTranslation();

  if (!initialProfile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">{t("profile.loadError")}</p>
              <p className="text-sm text-muted-foreground">
                {t("profile.temporaryError")}
              </p>
            </div>
            <Button asChild variant="outline">
              <a href="/profile">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("profile.retryButton")}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 프로필 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.profileInfoTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={initialProfile.avatar_url || undefined}
                alt={initialProfile.name}
              />
              <AvatarFallback>
                {initialProfile.name[0]?.toUpperCase() || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{initialProfile.name}</p>
              {initialProfile.email && (
                <p className="text-sm text-muted-foreground">{initialProfile.email}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {t("profile.joinDateLabel", { date: formatSmartDate(initialProfile.created_at) })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 프로필 수정 폼 */}
      <ProfileForm user={initialProfile} />

      {/* 계정 삭제 섹션 */}
      <DeleteAccountSection />
    </div>
  );
}
