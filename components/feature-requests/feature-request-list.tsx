"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FeatureRequestCard } from "./feature-request-card";
import { Search, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import type {
  FeatureRequestWithUser,
  FeatureRequestStatus,
} from "@/types/feature-request";
import { FEATURE_REQUEST_STATUS_CONFIG } from "@/types/feature-request";
import { getTopLevelAreas } from "@/lib/constants/feature-area-tree";
import { useTranslation } from "@/lib/i18n";

interface FeatureRequestListProps {
  requests: FeatureRequestWithUser[];
  votedRequestIds: string[];
  total: number;
  currentPage: number;
  pageSize: number;
  initialStatus?: FeatureRequestStatus | "";
  initialFeatureArea?: string;
  initialSortBy?: "vote_count" | "created_at";
  initialSearch?: string;
}

/**
 * 기능 요청 목록 컴포넌트
 */
export function FeatureRequestList({
  requests,
  votedRequestIds,
  total,
  currentPage,
  pageSize,
  initialStatus = "",
  initialFeatureArea = "",
  initialSortBy = "vote_count",
  initialSearch = "",
}: FeatureRequestListProps) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);

  const totalPages = Math.ceil(total / pageSize);

  const updateFilters = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    // 필터 변경 시 페이지 초기화
    if (!params.page) {
      newParams.delete("page");
    }
    startTransition(() => {
      router.push(`/feature-requests?${newParams.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search });
  };

  return (
    <div className="space-y-4">
      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 검색 */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("featureRequests.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>

        {/* 상태 필터 */}
        <Select
          value={initialStatus || "all"}
          onValueChange={(value) => updateFilters({ status: value === "all" ? "" : value })}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder={t("featureRequests.allStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("featureRequests.allStatus")}</SelectItem>
            {Object.entries(FEATURE_REQUEST_STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 기능 영역 필터 */}
        <Select
          value={initialFeatureArea || "all"}
          onValueChange={(value) => updateFilters({ featureArea: value === "all" ? "" : value })}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder={t("featureRequests.featureAreaAll")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("featureRequests.featureAreaAll")}</SelectItem>
            {getTopLevelAreas().map((area) => (
              <SelectItem key={area.id} value={area.id}>
                {area.labelKo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 정렬 */}
        <Select
          value={initialSortBy}
          onValueChange={(value) =>
            updateFilters({ sortBy: value as "vote_count" | "created_at" })
          }
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder={t("featureRequests.sortPopular")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vote_count">{t("featureRequests.sortPopular")}</SelectItem>
            <SelectItem value="created_at">{t("featureRequests.sortLatest")}</SelectItem>
          </SelectContent>
        </Select>

        {/* 새 요청 버튼 */}
        {user && (
          <Button asChild>
            <Link href="/feature-requests/new">
              <Plus className="h-4 w-4 mr-1" />
              {t("featureRequests.request")}
            </Link>
          </Button>
        )}
      </div>

      {/* 로딩 상태 */}
      {isPending && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* 목록 */}
      {!isPending && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((request) => (
            <FeatureRequestCard
              key={request.id}
              request={request}
              hasVoted={votedRequestIds.includes(request.id)}
            />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!isPending && requests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {initialSearch || initialStatus || initialFeatureArea
              ? t("featureRequests.noResults")
              : t("featureRequests.noRequests")}
          </p>
          {user && (
            <Button asChild>
              <Link href="/feature-requests/new">
                <Plus className="h-4 w-4 mr-1" />
                {t("featureRequests.firstRequest")}
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {!isPending && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() =>
              updateFilters({ page: String(currentPage - 1) })
            }
          >
            {t("common.prev")}
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() =>
              updateFilters({ page: String(currentPage + 1) })
            }
          >
            {t("common.next")}
          </Button>
        </div>
      )}
    </div>
  );
}
