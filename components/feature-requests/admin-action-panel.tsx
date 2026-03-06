"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Pin, PinOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateFeatureRequestStatus,
  togglePin,
} from "@/app/actions/feature-requests";
import {
  FEATURE_REQUEST_STATUS_CONFIG,
  type FeatureRequestStatus,
} from "@/types/feature-request";

interface AdminActionPanelProps {
  featureRequestId: string;
  currentStatus: FeatureRequestStatus;
  currentAdminResponse: string | null;
  isPinned: boolean;
}

export function AdminActionPanel({
  featureRequestId,
  currentStatus,
  currentAdminResponse,
  isPinned,
}: AdminActionPanelProps) {
  const [status, setStatus] = useState<FeatureRequestStatus>(currentStatus);
  const [adminResponse, setAdminResponse] = useState(currentAdminResponse || "");
  const [pinned, setPinned] = useState(isPinned);
  const [isPending, startTransition] = useTransition();
  const [isPinPending, startPinTransition] = useTransition();

  const hasChanges = status !== currentStatus || adminResponse !== (currentAdminResponse || "");

  function handleSave() {
    startTransition(async () => {
      const result = await updateFeatureRequestStatus(
        featureRequestId,
        status,
        adminResponse || undefined
      );
      if (result.success) {
        toast.success("상태가 변경되었습니다.");
      } else {
        toast.error(result.error || "상태 변경에 실패했습니다.");
      }
    });
  }

  function handleTogglePin() {
    startPinTransition(async () => {
      const result = await togglePin(featureRequestId);
      if (result.success) {
        setPinned(result.pinned);
        toast.success(result.pinned ? "고정되었습니다." : "고정 해제되었습니다.");
      } else {
        toast.error(result.error || "고정 상태 변경에 실패했습니다.");
      }
    });
  }

  return (
    <Card className="border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          관리자 패널
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 상태 변경 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">상태</label>
          <Select value={status} onValueChange={(v) => setStatus(v as FeatureRequestStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FEATURE_REQUEST_STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`${config.bgColor} ${config.textColor} text-xs`}
                    >
                      {config.label}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 관리자 응답 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">관리자 응답</label>
          <Textarea
            value={adminResponse}
            onChange={(e) => setAdminResponse(e.target.value)}
            placeholder="사용자에게 전달할 응답을 입력하세요..."
            rows={3}
          />
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            size="sm"
          >
            {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            저장
          </Button>

          <Button
            onClick={handleTogglePin}
            disabled={isPinPending}
            variant="outline"
            size="sm"
          >
            {isPinPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : pinned ? (
              <PinOff className="h-4 w-4 mr-1" />
            ) : (
              <Pin className="h-4 w-4 mr-1" />
            )}
            {pinned ? "고정 해제" : "고정"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
