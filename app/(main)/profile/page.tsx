import { Suspense } from "react";
import { ProfileContent } from "@/components/profile/profile-content";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { typography } from "@/lib/design-tokens";

/**
 * 프로필 페이지
 * US-005: 프로필 관리
 */
export default function ProfilePage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className={typography.pageTitle}>프로필</h1>
        <p className={typography.pageDescription}>
          프로필 정보를 수정하고 관리하세요
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          </div>
        }
      >
        <ProfileContent />
      </Suspense>
    </div>
  );
}

