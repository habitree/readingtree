"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile, updateProfileImage } from "@/app/actions/profile";
import { toast } from "sonner";
import { Loader2, Upload, User, BookHeart, Quote, Eye, EyeOff } from "lucide-react";
import { getImageUrl, smartCompressImage, formatFileSize } from "@/lib/utils/image";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
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
  const { refreshProfile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    reading_goal: user.reading_goal,
    bio: user.bio || "",
    favorite_book: user.favorite_book || "",
    favorite_quote: user.favorite_quote || "",
    is_profile_public: user.is_profile_public ?? true,
  });
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || isUploading) return;

    setIsSubmitting(true);

    try {
      await updateProfile({
        name: formData.name,
        reading_goal: formData.reading_goal,
        bio: formData.bio,
        favorite_book: formData.favorite_book,
        favorite_quote: formData.favorite_quote,
        is_profile_public: formData.is_profile_public,
      });

      toast.success(t("profile.saved"));
      await refreshProfile();
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

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("profile.unsupportedFileFormat"));
      return;
    }

    setIsUploading(true);
    try {
      let fileToUpload = file;
      try {
        fileToUpload = await smartCompressImage(file, {
          compressionThreshold: 500 * 1024,
          maxWidth: 512,
          maxHeight: 512,
          targetSizeBytes: 500 * 1024,
          minQuality: 0.6,
          maxQuality: 0.9,
          verbose: true,
        });
      } catch (compressError) {
        console.error("이미지 압축 오류:", compressError);
      }

      const result = await updateProfileImage(fileToUpload);
      setAvatarUrl(result.avatarUrl);
      toast.success(t("profile.saved"));
      await refreshProfile();
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
              <Label htmlFor="bio">{t("profile.bioLabel")}</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder={t("profile.bioPlaceholder")}
                rows={3}
                maxLength={200}
                disabled={isSubmitting || isUploading}
              />
              <p className="text-xs text-muted-foreground text-right">{formData.bio.length}/200</p>
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

      {/* 독서 프로필 (인생책 + 좋아하는 문구) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookHeart className="h-5 w-5" />
            {t("profile.readingProfileTitle")}
          </CardTitle>
          <CardDescription>
            {t("profile.readingProfileDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="favorite_book" className="flex items-center gap-1.5">
                <BookHeart className="h-3.5 w-3.5 text-primary" />
                {t("profile.favoriteBookLabel")}
              </Label>
              <Input
                id="favorite_book"
                value={formData.favorite_book}
                onChange={(e) =>
                  setFormData({ ...formData, favorite_book: e.target.value })
                }
                placeholder={t("profile.favoriteBookPlaceholder")}
                maxLength={100}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="favorite_quote" className="flex items-center gap-1.5">
                <Quote className="h-3.5 w-3.5 text-primary" />
                {t("profile.favoriteQuoteLabel")}
              </Label>
              <Textarea
                id="favorite_quote"
                value={formData.favorite_quote}
                onChange={(e) =>
                  setFormData({ ...formData, favorite_quote: e.target.value })
                }
                placeholder={t("profile.favoriteQuotePlaceholder")}
                rows={3}
                maxLength={300}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground text-right">{formData.favorite_quote.length}/300</p>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                fullWidth
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("profile.saving")}
                  </>
                ) : (
                  t("common.save")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 프로필 공개 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {formData.is_profile_public ? (
              <Eye className="h-5 w-5 text-green-600" />
            ) : (
              <EyeOff className="h-5 w-5 text-muted-foreground" />
            )}
            {t("profile.privacySettingsTitle")}
          </CardTitle>
          <CardDescription>
            {t("profile.privacySettingsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_profile_public">{t("profile.profilePublicLabel")}</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.is_profile_public
                    ? t("profile.profilePublicOnDesc")
                    : t("profile.profilePublicOffDesc")}
                </p>
              </div>
              <Switch
                id="is_profile_public"
                checked={formData.is_profile_public}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_profile_public: checked })
                }
              />
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                fullWidth
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("profile.saving")}
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
