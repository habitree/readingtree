import { getProfile } from "@/app/actions/profile";
import { ProfileForm } from "./profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getProxiedImageUrl } from "@/lib/utils/image";
import { formatSmartDate } from "@/lib/utils/date";
import { User, AlertCircle, RefreshCw } from "lucide-react";
import { sanitizeErrorForLogging } from "@/lib/utils/validation";

/**
 * 프로필 컨텐츠 컴포넌트
 * 프로필 정보 표시 및 수정 폼
 */
export async function ProfileContent() {
  let user;
  try {
    user = await getProfile();
  } catch (error) {
    const safeError = sanitizeErrorForLogging(error);
    console.error("프로필 조회 오류:", safeError);
    const errorMessage = error instanceof Error ? error.message : "프로필을 불러올 수 없습니다.";

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">프로필을 불러올 수 없습니다</p>
              <p className="text-sm text-muted-foreground">
                {errorMessage.includes("로그인이 필요합니다")
                  ? "로그인이 필요합니다. 다시 로그인해주세요."
                  : "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <a href="/profile">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  다시 시도
                </a>
              </Button>
              {errorMessage.includes("로그인이 필요합니다") && (
                <Button asChild>
                  <a href="/login">로그인하기</a>
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
          <CardTitle>프로필 정보</CardTitle>
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
                가입일: {formatSmartDate(user.created_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 프로필 수정 폼 */}
      <ProfileForm user={user} />
    </div>
  );
}
