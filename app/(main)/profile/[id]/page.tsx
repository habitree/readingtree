import { notFound } from "next/navigation";
import { getUserById } from "@/app/actions/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, BookHeart, Quote, EyeOff } from "lucide-react";
import { UserProfilePageHeader, ProfileInfoCardTitle } from "@/components/profile/user-profile-page-header";
import { formatSmartDate } from "@/lib/utils/date";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

/**
 * 사용자 공개 프로필 페이지
 * 다른 사용자의 프로필을 조회할 때 사용
 */
export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;

  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  const isPublic = user.is_profile_public !== false;

  return (
    <div className="space-y-4 sm:space-y-6">
      <UserProfilePageHeader />

      <Card>
        <CardHeader>
          <CardTitle><ProfileInfoCardTitle /></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={user.avatar_url || undefined}
                alt={user.name}
              />
              <AvatarFallback>
                {user.name?.[0]?.toUpperCase() || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{user.name}</p>
              {isPublic && user.bio && (
                <p className="text-sm text-muted-foreground">{user.bio}</p>
              )}
              {user.created_at && (
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {formatSmartDate(user.created_at)}
                </p>
              )}
            </div>
          </div>

          {/* 공개 프로필: 인생책/문구 표시 */}
          {isPublic && (user.favorite_book || user.favorite_quote) && (
            <div className="mt-4 pt-4 border-t space-y-3">
              {user.favorite_book && (
                <div className="flex items-start gap-2">
                  <BookHeart className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">인생책</p>
                    <p className="text-sm font-medium">{user.favorite_book}</p>
                  </div>
                </div>
              )}
              {user.favorite_quote && (
                <div className="flex items-start gap-2">
                  <Quote className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">좋아하는 문구</p>
                    <p className="text-sm italic text-muted-foreground">&ldquo;{user.favorite_quote}&rdquo;</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 비공개 프로필 안내 */}
          {!isPublic && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <EyeOff className="h-4 w-4" />
                <span>비공개 프로필입니다</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
