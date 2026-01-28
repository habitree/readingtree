import { notFound } from "next/navigation";
import { getUserById } from "@/app/actions/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getProxiedImageUrl } from "@/lib/utils/image";
import { User, ArrowLeft } from "lucide-react";
import { typography } from "@/lib/design-tokens";
import Link from "next/link";

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="javascript:history.back()">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className={typography.pageTitle}>프로필</h1>
          <p className={typography.pageDescription}>
            사용자 프로필 정보
          </p>
        </div>
      </div>

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
                {user.name?.[0]?.toUpperCase() || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{user.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
