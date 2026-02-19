import { notFound } from "next/navigation";
import { getUserById } from "@/app/actions/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProxiedImageUrl } from "@/lib/utils/image";
import { User } from "lucide-react";
import { UserProfilePageHeader, ProfileInfoCardTitle } from "@/components/profile/user-profile-page-header";

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
      <UserProfilePageHeader />

      <Card>
        <CardHeader>
          <CardTitle><ProfileInfoCardTitle /></CardTitle>
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
