"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/app/actions/profile";
import { ProfileForm } from "./profile-form";
import { DeleteAccountSection } from "./delete-account-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getProxiedImageUrl } from "@/lib/utils/image";
import { formatSmartDate } from "@/lib/utils/date";
import { useTranslation } from "@/lib/i18n";
import { User, AlertCircle, RefreshCw, Loader2 } from "lucide-react";

/**
 * 프로필 컨텐츠 컴포넌트
 * 프로필 정보 표시 및 수정 폼
 */
export function ProfileContent() {
  const { t } = useTranslation();
  const [user, setUser] = useState<Awaited<ReturnType<typeof getProfile>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProfile()
      .then((data) => {
        if (!cancelled) {
          setUser(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("프로필 조회 오류:", err);
          setError(err instanceof Error ? err.message : t("profile.loadError"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [t]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !user) {
    const errorMessage = error || t("profile.loadError");
    const isLoginRequired = errorMessage.includes("로그인이 필요합니다") || errorMessage.includes("Login required");

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">{t("profile.loadError")}</p>
              <p className="text-sm text-muted-foreground">
                {isLoginRequired
                  ? t("profile.loginRequiredMessage")
                  : t("profile.temporaryError")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <a href="/profile">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t("profile.retryButton")}
                </a>
              </Button>
              {isLoginRequired && (
                <Button asChild>
                  <a href="/login">{t("profile.goToLogin")}</a>
                </Button>
              )}
            </div>
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
                src={user.avatar_url ? getProxiedImageUrl(user.avatar_url) : undefined}
                alt={user.name}
              />
              <AvatarFallback>
                {user.name[0]?.toUpperCase() || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{user.name}</p>
              {user.email && (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {t("profile.joinDateLabel", { date: formatSmartDate(user.created_at) })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 프로필 수정 폼 */}
      <ProfileForm user={user} />

      {/* 계정 삭제 섹션 */}
      <DeleteAccountSection />
    </div>
  );
}
