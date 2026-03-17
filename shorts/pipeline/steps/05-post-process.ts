import { PipelineContext } from "../../src/types/common";

interface PostProcessResult {
  videoPath: string;
  thumbnailPath: string | null;
  metadata: Record<string, unknown>;
}

export async function postProcess(
  ctx: PipelineContext,
  videoPath: string
): Promise<PostProcessResult> {
  // TODO: 썸네일 자동 생성 (ffmpeg로 특정 프레임 추출)
  // TODO: 메타데이터 생성 (제목, 설명, 해시태그)

  const metadata = {
    series: ctx.series,
    generatedAt: new Date().toISOString(),
    videoPath,
  };

  return {
    videoPath,
    thumbnailPath: null,
    metadata,
  };
}
