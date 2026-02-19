/**
 * 일회성 스크립트: Readtree 기본 표지 10장 DALL-E 3 생성 + Supabase Storage 업로드
 *
 * 실행: node scripts/generate-default-covers.mjs
 * 필요 환경변수: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * (.env.local에서 자동 로드)
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { config } from "dotenv";
import { resolve } from "path";

// .env.local 로드
config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error("필수 환경변수가 없습니다: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const COVERS = [
  {
    fileName: "cover-01-forest.png",
    prompt:
      "A serene watercolor painting of a quiet forest path with dappled sunlight filtering through tall trees. Soft greens and golden light. Artistic, literary mood. No text, letters, or words.",
  },
  {
    fileName: "cover-02-ocean.png",
    prompt:
      "A dreamy watercolor seascape with gentle ocean waves meeting a sandy shore at golden hour. Soft blues, turquoise, and warm sunset tones. Artistic, contemplative mood. No text, letters, or words.",
  },
  {
    fileName: "cover-03-starry-night.png",
    prompt:
      "A magical watercolor painting of a starry night sky over a peaceful village. Deep indigo and purple with scattered golden stars. Artistic, literary mood. No text, letters, or words.",
  },
  {
    fileName: "cover-04-autumn-leaves.png",
    prompt:
      "A warm watercolor illustration of autumn leaves gently falling around a single bench in a park. Rich oranges, reds, and golden yellows. Artistic, nostalgic mood. No text, letters, or words.",
  },
  {
    fileName: "cover-05-mountain.png",
    prompt:
      "A majestic watercolor painting of misty mountains at dawn with soft pink and lavender clouds. Peaceful, vast landscape. Artistic, reflective mood. No text, letters, or words.",
  },
  {
    fileName: "cover-06-rain.png",
    prompt:
      "A gentle watercolor scene of rain falling on a quiet cobblestone street with warm light from windows. Soft grays, blues, and amber glows. Artistic, cozy mood. No text, letters, or words.",
  },
  {
    fileName: "cover-07-sunrise.png",
    prompt:
      "A luminous watercolor painting of a sunrise over a calm lake with delicate reflections. Soft pinks, peaches, and light golds. Artistic, hopeful mood. No text, letters, or words.",
  },
  {
    fileName: "cover-08-garden.png",
    prompt:
      "A lush watercolor illustration of a secret garden with blooming flowers, a winding path, and a stone archway. Vibrant greens, pinks, and purples. Artistic, whimsical mood. No text, letters, or words.",
  },
  {
    fileName: "cover-09-library.png",
    prompt:
      "A cozy watercolor painting of an old library interior with towering bookshelves, warm lamplight, and a reading nook. Rich browns, warm golds, and deep greens. Artistic, intellectual mood. No text, letters, or words.",
  },
  {
    fileName: "cover-10-moonlight.png",
    prompt:
      "A peaceful watercolor painting of moonlight casting silver glow over a quiet field of wildflowers. Soft silvers, blues, and pale lavenders. Artistic, dreamy mood. No text, letters, or words.",
  },
];

async function main() {
  console.log(`\n🎨 Readtree 기본 표지 생성 시작 (${COVERS.length}장)\n`);

  let successCount = 0;
  let skipCount = 0;

  for (let i = 0; i < COVERS.length; i++) {
    const { fileName, prompt } = COVERS[i];
    const filePath = `covers/default/${fileName}`;

    console.log(`[${i + 1}/${COVERS.length}] ${fileName}`);

    // 이미 존재하는지 확인
    const { data: existing } = await supabase.storage
      .from("images")
      .list("covers/default", { search: fileName });

    if (existing && existing.length > 0) {
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filePath);
      console.log(`  ⏭️  이미 존재 → ${publicUrl}\n`);
      skipCount++;
      continue;
    }

    try {
      // DALL-E 3 호출
      console.log("  🖌️  DALL-E 3 생성 중...");
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        size: "1024x1024",
        quality: "standard",
        n: 1,
      });

      const generatedUrl = imageResponse.data?.[0]?.url;
      if (!generatedUrl) {
        console.log("  ❌ 이미지 생성 실패\n");
        continue;
      }

      // 이미지 다운로드
      console.log("  ⬇️  다운로드 중...");
      const imageRes = await fetch(generatedUrl);
      if (!imageRes.ok) {
        console.log("  ❌ 다운로드 실패\n");
        continue;
      }
      const imageBuffer = await imageRes.arrayBuffer();

      // Supabase Storage 업로드
      console.log("  ⬆️  업로드 중...");
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, new Uint8Array(imageBuffer), {
          contentType: "image/png",
          cacheControl: "31536000",
          upsert: true,
        });

      if (uploadError) {
        console.log(`  ❌ 업로드 실패: ${uploadError.message}\n`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filePath);
      console.log(`  ✅ 완료 → ${publicUrl}\n`);
      successCount++;
    } catch (error) {
      console.log(`  ❌ 오류: ${error.message}\n`);
    }
  }

  console.log(`\n📊 결과: ${successCount}장 생성, ${skipCount}장 스킵, ${COVERS.length - successCount - skipCount}장 실패\n`);
}

main().catch(console.error);
