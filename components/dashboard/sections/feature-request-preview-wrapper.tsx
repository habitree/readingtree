import { getTopFeatureRequests } from "@/app/actions/feature-requests";
import {
  FeatureRequestPreviewSection,
  FeatureRequestPreviewSkeleton,
} from "@/components/feature-requests";

/**
 * 기능 요청 프리뷰 섹션 서버 래퍼
 */
export async function FeatureRequestPreviewWrapper() {
  const requests = await getTopFeatureRequests(4);

  return <FeatureRequestPreviewSection requests={requests} />;
}

export { FeatureRequestPreviewSkeleton };
