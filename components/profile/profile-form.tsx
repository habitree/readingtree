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
import { getImageUrl, getProxiedImageUrl, smartCompressImage, formatFileSize } from "@/lib/utils/image";
import type { User as UserType } from "@/types/user";

interface ProfileFormProps {
  user: UserType;
}

/**
 * 프로필 수정 폼 컴포넌트
 * 프로필 정보 수정 및 이미지 업로드
 */
export function ProfileForm({ user }: ProfileFormProps) {
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

      toast.success("저장됨");
      // 프로필 수정 후 페이지 새로고침하여 헤더도 갱신
      router.refresh();
      // 약간의 지연 후 다시 새로고침하여 헤더 컴포넌트의 useEffect가 실행되도록 함
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("프로필 수정 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "프로필 수정에 실패했습니다."
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
      toast.error("지원하지 않는 파일 형식입니다. (jpg, png, webp만 지원)");
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
          const savedPercent = Math.round((1 - fileToUpload.size / originalSize) * 100);
          console.log(`[프로필 이미지 압축] ${formatFileSize(originalSize)} → ${formatFileSize(fileToUpload.size)} (${savedPercent}% 감소)`);
        }
      } catch (compressError) {
        console.error("이미지 압축 오류:", compressError);
        // 압축 실패 시 원본 파일 사용
      }

      const result = await updateProfileImage(fileToUpload);
      setAvatarUrl(result.avatarUrl);
      toast.success("저장됨");
      // 프로필 이미지 업로드 후 페이지 새로고침하여 헤더도 갱신
      router.refresh();
      // 약간의 지연 후 다시 새로고침하여 헤더 컴포넌트의 useEffect가 실행되도록 함
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "이미지 업로드에 실패했습니다."
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
          <CardTitle>프로필 이미지</CardTitle>
          <CardDescription>
            jpg, png, webp 형식, 최대 2MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={avatarUrl ? getProxiedImageUrl(avatarUrl) : undefined}
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
                    업로드 중...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    이미지 변경
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                권장 크기: 400x400px
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 프로필 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>프로필 정보</CardTitle>
          <CardDescription>
            이름과 독서 목표를 수정할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="이름을 입력하세요"
                required
                maxLength={100}
                disabled={isSubmitting || isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reading_goal">올해 독서 목표 (권)</Label>
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
                placeholder="1-100 사이의 숫자"
                required
                disabled={isSubmitting || isUploading}
              />
              <p className="text-xs text-muted-foreground">
                1-100 사이의 숫자를 입력하세요
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
                    {isSubmitting ? "저장 중..." : "업로드 중..."}
                  </>
                ) : (
                  "저장"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

