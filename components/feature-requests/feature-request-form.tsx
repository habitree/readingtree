"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb } from "lucide-react";
import { createFeatureRequest, updateFeatureRequest } from "@/app/actions/feature-requests";
import { toast } from "sonner";
import type { FeatureRequest } from "@/types/feature-request";

interface FeatureRequestFormProps {
  mode: "create" | "edit";
  initialData?: Pick<FeatureRequest, "id" | "title" | "description">;
}

/**
 * 기능 요청 작성/수정 폼
 */
export function FeatureRequestForm({
  mode,
  initialData,
}: FeatureRequestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        if (mode === "create") {
          const result = await createFeatureRequest({ title, description });

          if (result.success && result.id) {
            toast.success("기능 요청이 등록됐어요.");
            router.push(`/feature-requests/${result.id}`);
          } else {
            toast.error(result.error || "등록에 실패했어요.");
          }
        } else if (mode === "edit" && initialData) {
          const result = await updateFeatureRequest(initialData.id, {
            title,
            description,
          });

          if (result.success) {
            toast.success("수정됐어요.");
            router.push(`/feature-requests/${initialData.id}`);
          } else {
            toast.error(result.error || "수정에 실패했어요.");
          }
        }
      } catch (error) {
        toast.error("오류가 발생했어요.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          {mode === "create" ? "새 기능 요청" : "기능 요청 수정"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="어떤 기능이 필요하신가요?"
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/200
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">상세 설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="기능이 필요한 이유와 기대하는 동작을 자세히 설명해주세요."
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              * 최소 20자 이상 작성해주세요.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button
              type="submit"
              disabled={isPending}
              fullWidth
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "등록 중..." : "수정 중..."}
                </>
              ) : mode === "create" ? (
                "등록하기"
              ) : (
                "수정하기"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
              fullWidth
            >
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
