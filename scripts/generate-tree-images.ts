/**
 * DALL-E 3를 사용한 레벨별 나무 이미지 생성 스크립트
 *
 * 사용법:
 * 1. .env.local에 OPENAI_API_KEY 추가
 * 2. npx tsx scripts/generate-tree-images.ts
 *
 * 생성 위치: public/images/trees/level-{1-10}.webp
 */

import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { config } from "dotenv";

// .env.local 로드
config({ path: ".env.local" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 출력 디렉토리
const OUTPUT_DIR = path.join(process.cwd(), "public", "images", "trees");

// 공통 스타일 프롬프트
const STYLE_PROMPT = `
Style requirements:
- Soft watercolor illustration style with gentle brush strokes
- Warm, friendly, and inviting atmosphere
- Cute kawaii aesthetic suitable for a reading app
- Clean white/cream background (easy to remove later)
- Centered composition with the tree as the main focus
- Soft pastel colors with subtle gradients
- No text, no people, no animals
- Game asset style, icon-friendly design
- High detail but clean edges
`.trim();

// 레벨별 프롬프트 정의
const LEVEL_PROMPTS: Record<number, { name: string; prompt: string }> = {
  1: {
    name: "씨앗 (Seed)",
    prompt: `
A tiny cute seed partially buried in soft brown soil.
The seed is acorn-shaped with a warm brown color.
Small sparkles hint at potential growth.
Minimal design, very simple and hopeful.
Soft earth tones: brown, beige, warm cream.
${STYLE_PROMPT}
    `.trim(),
  },
  2: {
    name: "새싹 (Sprout)",
    prompt: `
A tiny green sprout emerging from soil with two small cotyledon leaves.
Fresh, bright lime green color with dewdrops on leaves.
The sprout looks delicate but determined.
Simple design showing new life and hope.
Colors: fresh green, soft brown soil.
${STYLE_PROMPT}
    `.trim(),
  },
  3: {
    name: "떡잎 (Seedling)",
    prompt: `
A young seedling with 4-5 true leaves growing from a thin stem.
Vibrant green leaves with visible leaf veins.
The plant looks healthy and growing stronger.
Small grass blades around the base.
Colors: emerald green, forest green accents.
${STYLE_PROMPT}
    `.trim(),
  },
  4: {
    name: "어린나무 (Young Tree)",
    prompt: `
A small young tree with a thin trunk and developing branches.
Leafy crown starting to form with multiple branches.
The trunk shows early bark texture.
Small flowers or buds beginning to appear.
Colors: rich greens, warm brown trunk.
${STYLE_PROMPT}
    `.trim(),
  },
  5: {
    name: "나무 (Tree)",
    prompt: `
A healthy medium-sized tree with a sturdy trunk and full canopy.
Lush green foliage with depth and dimension.
Well-defined branches spreading outward.
Roots visible at the base for stability.
Colors: deep forest green, chocolate brown trunk.
${STYLE_PROMPT}
    `.trim(),
  },
  6: {
    name: "큰나무 (Large Tree)",
    prompt: `
A magnificent large tree with a thick trunk and expansive canopy.
Dense, layered foliage creating beautiful shadows.
Strong branches reaching outward and upward.
Detailed bark texture showing age and wisdom.
Colors: deep green, dark brown, subtle highlights.
${STYLE_PROMPT}
    `.trim(),
  },
  7: {
    name: "꽃나무 (Flowering Tree)",
    prompt: `
A beautiful tree covered in delicate pink and white cherry blossoms.
Petals gently falling in the breeze.
Magical and romantic atmosphere with soft glow.
Mix of green leaves and abundant flowers.
Colors: soft pink, white, green, warm brown.
${STYLE_PROMPT}
    `.trim(),
  },
  8: {
    name: "열매나무 (Fruit Tree)",
    prompt: `
A bountiful tree laden with colorful fruits among green leaves.
Red apples, golden fruits hanging from branches.
Represents abundance, harvest, and achievement.
Some fruits with a magical golden glow.
Colors: red, gold, orange fruits, deep green leaves.
${STYLE_PROMPT}
    `.trim(),
  },
  9: {
    name: "세계수 (World Tree)",
    prompt: `
A majestic giant tree reaching toward the sky with ethereal presence.
Trunk glowing with mystical teal and cyan energy.
Leaves shimmer with magical particles and starlight.
Ancient, wise, and powerful presence.
Subtle aurora effects around the crown.
Colors: teal, cyan, silver, mystical blue-green.
${STYLE_PROMPT}
    `.trim(),
  },
  10: {
    name: "황금숲 (Golden Forest)",
    prompt: `
A legendary tree made entirely of shimmering gold with magical radiance.
Golden leaves that sparkle and glow with inner light.
Magical golden particles and stardust floating around.
Crown jewel achievement, ultimate transformation.
Divine, heavenly, triumphant atmosphere.
Colors: rich gold, amber, white sparkles, soft golden glow.
${STYLE_PROMPT}
    `.trim(),
  },
};

/**
 * 이미지 생성 및 저장
 */
async function generateImage(level: number): Promise<string> {
  const { name, prompt } = LEVEL_PROMPTS[level];

  console.log(`\n🎨 Level ${level} (${name}) 이미지 생성 중...`);

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "vivid",
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error("이미지 URL을 받지 못했습니다.");
    }

    // 이미지 다운로드
    console.log(`  📥 이미지 다운로드 중...`);
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // PNG로 저장 (원본)
    const pngPath = path.join(OUTPUT_DIR, `level-${level}-original.png`);
    fs.writeFileSync(pngPath, buffer);
    console.log(`  💾 원본 PNG 저장: ${pngPath}`);

    // WebP로 변환 (최적화)
    const webpPath = path.join(OUTPUT_DIR, `level-${level}.webp`);
    await sharp(buffer)
      .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .webp({ quality: 90 })
      .toFile(webpPath);
    console.log(`  ✅ WebP 변환 완료: ${webpPath}`);

    // 썸네일 생성 (48x48 for badges)
    const thumbPath = path.join(OUTPUT_DIR, `level-${level}-thumb.webp`);
    await sharp(buffer)
      .resize(96, 96, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .webp({ quality: 85 })
      .toFile(thumbPath);
    console.log(`  🖼️ 썸네일 생성: ${thumbPath}`);

    return webpPath;
  } catch (error) {
    console.error(`  ❌ Level ${level} 생성 실패:`, error);
    throw error;
  }
}

/**
 * 메인 실행
 */
async function main() {
  console.log("🌳 Reading Tree 이미지 생성 시작");
  console.log("================================\n");

  // API 키 확인
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY가 설정되지 않았습니다.");
    console.log("\n.env.local 파일에 다음을 추가하세요:");
    console.log("OPENAI_API_KEY=your_openai_api_key");
    process.exit(1);
  }

  // 출력 디렉토리 확인
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 디렉토리 생성: ${OUTPUT_DIR}`);
  }

  // 레벨별 이미지 생성
  const results: { level: number; success: boolean; path?: string; error?: string }[] = [];

  for (let level = 1; level <= 10; level++) {
    try {
      const imagePath = await generateImage(level);
      results.push({ level, success: true, path: imagePath });

      // Rate limit 방지 (DALL-E 3: 5 images/min)
      if (level < 10) {
        console.log(`  ⏳ Rate limit 대기 (15초)...`);
        await new Promise((resolve) => setTimeout(resolve, 15000));
      }
    } catch (error) {
      results.push({
        level,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // 결과 요약
  console.log("\n================================");
  console.log("📊 생성 결과 요약");
  console.log("================================\n");

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ 성공: ${successful.length}/10`);
  successful.forEach((r) => {
    console.log(`   Level ${r.level}: ${r.path}`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ 실패: ${failed.length}/10`);
    failed.forEach((r) => {
      console.log(`   Level ${r.level}: ${r.error}`);
    });
  }

  // 비용 안내
  console.log("\n💰 예상 비용:");
  console.log(`   DALL-E 3 HD 1024x1024: $0.080 x ${successful.length} = $${(0.08 * successful.length).toFixed(2)}`);

  console.log("\n🎉 완료!");
}

main().catch(console.error);
