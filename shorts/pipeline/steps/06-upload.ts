import fs from "fs";
import path from "path";
import { PipelineContext } from "../../src/types/common";
import { createServiceClient } from "../utils/supabase";

export async function uploadToStorage(
  ctx: PipelineContext,
  videoPath: string,
  thumbnailPath: string | null
): Promise<{ videoUrl: string; thumbnailUrl: string | null }> {
  const supabase = createServiceClient();
  const timestamp = Date.now();
  const videoFileName = `${ctx.series}/${timestamp}.mp4`;

  const videoFile = fs.readFileSync(videoPath);
  const { error: videoError } = await supabase.storage
    .from("shorts")
    .upload(videoFileName, videoFile, {
      contentType: "video/mp4",
    });

  if (videoError) throw new Error(`Video upload failed: ${videoError.message}`);

  const { data: videoUrlData } = supabase.storage
    .from("shorts")
    .getPublicUrl(videoFileName);

  let thumbnailUrl: string | null = null;
  if (thumbnailPath) {
    const thumbFileName = `${ctx.series}/${timestamp}-thumb.jpg`;
    const thumbFile = fs.readFileSync(thumbnailPath);
    await supabase.storage
      .from("shorts")
      .upload(thumbFileName, thumbFile, {
        contentType: "image/jpeg",
      });
    const { data: thumbUrlData } = supabase.storage
      .from("shorts")
      .getPublicUrl(thumbFileName);
    thumbnailUrl = thumbUrlData.publicUrl;
  }

  return {
    videoUrl: videoUrlData.publicUrl,
    thumbnailUrl,
  };
}
