"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile, updateProfileImage } from "@/app/actions/profile";
import { toast } from "sonner";
import { Loader2, Upload, User } from "lucide-react";
import { getImageUrl, smartCompressImage, formatFileSize } from "@/lib/utils/image";
import { useTranslation } from "@/lib/i18n";
import type { User as UserType } from "@/types/user";

interface ProfileFormProps {
  user: UserType;
}

/**
 * 프로필 수정 폼 컴포넌트
 * 프로필 정보 수정 및 이미지 업로드
 */
export function ProfileForm({ user }: ProfileFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    reading_goal: user.reading_goal,
  });
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 이미 제출 중이면 무시
    if (isSubmitting || isUploading) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      await updateProfile({
        name: formData.name,
        reading_goal: formData.reading_goal,
      });

      toast.success(t("profile.saved"));
      router.refresh();
    } catch (error) {
      console.error("프로필 수정 오류:", error);
      toast.error(
        error instanceof Error ? error.message : t("profile.profileUpdateFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 형식 검증
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("profile.unsupportedFileFormat"));
      return;
    }

    setIsUploading(true);
    try {
      // 이미지 압축 (비율 유지 + 용량 자동 최적화)
      // 프로필 이미지는 500KB 이상이면 압축, 최대 512x512
      let fileToUpload = file;
      try {
        const originalSize = file.size;
        fileToUpload = await smartCompressImage(file, {
          compressionThreshold: 500 * 1024, // 500KB 이상이면 압축
          maxWidth: 512,
          maxHeight: 512,
          targetSizeBytes: 500 * 1024, // 목표: 500KB
          minQuality: 0.6,
          maxQuality: 0.9,
          verbose: true,
        });

        if (fileToUpload.size < originalSize) {
        }
      } catch (compressError) {
        console.error("이미지 압축 오류:", compressError);
        // 압축 실패 시 원본 파일 사용
      }

      const result = await updateProfileImage(fileToUpload);
      setAvatarUrl(result.avatarUrl);
      toast.success(t("profile.saved"));
      router.refresh();
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      toast.error(
        error instanceof Error ? error.message : t("profile.imageUploadFailed")
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 프로필 이미지 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.profileImage")}</CardTitle>
          <CardDescription>
            {t("profile.profileImageDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={avatarUrl || undefined}
                alt={user.name}
              />
              <AvatarFallback>
                {user.name[0]?.toUpperCase() || <User className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
                id="avatar-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("profile.uploading")}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {t("profile.changeImage")}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t("profile.recommendedSize")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 프로필 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.profileInfoTitle")}</CardTitle>
          <CardDescription>
            {t("profile.profileInfoDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("profile.nameLabel")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t("profile.namePlaceholder")}
                required
                maxLength={100}
                disabled={isSubmitting || isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reading_goal">{t("profile.readingGoalLabel")}</Label>
              <Input
                id="reading_goal"
                type="number"
                min="1"
                max="100"
                value={formData.reading_goal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reading_goal: parseInt(e.target.value, 10) || 0,
                  })
                }
                placeholder={t("profile.readingGoalPlaceholder")}
                required
                disabled={isSubmitting || isUploading}
              />
              <p className="text-xs text-muted-foreground">
                {t("profile.readingGoalHint")}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting || isUploading}
                fullWidth
                size="lg"
              >
                {isSubmitting || isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSubmitting ? t("profile.saving") : t("profile.uploading")}
                  </>
                ) : (
                  t("common.save")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

