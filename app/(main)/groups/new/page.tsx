"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createGroup } from "@/app/actions/groups";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/**
 * 모임 생성 페이지
 * US-033: 독서모임 생성
 */
export default function NewGroupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createGroup({
        name: formData.name,
        description: formData.description || undefined,
        isPublic: formData.isPublic,
      });

      toast.success("모임이 만들어졌어요.");
      router.push(`/groups/${result.groupId}`);
    } catch (error) {
      console.error("모임 생성 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "모임 만들기에 실패했어요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">모임 만들기</h1>
        <p className="text-muted-foreground">
          새로운 독서모임을 생성하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>모임 정보</CardTitle>
          <CardDescription>
            모임 이름과 설명을 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">모임 이름 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="예: 2024년 독서 모임"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">모임 설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="모임에 대한 설명을 입력하세요"
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isPublic">공개 모임</Label>
                <p className="text-sm text-muted-foreground">
                  공개 모임은 누구나 찾아서 참여할 수 있습니다
                </p>
              </div>
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublic: checked })
                }
              />
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.name}
                fullWidth
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  "모임 만들기"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                fullWidth
              >
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

