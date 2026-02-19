/**
 * Readtree 기록용 기본 표지 이미지
 *
 * DALL-E 3로 사전 생성된 공용 표지 이미지.
 * 관리자가 POST /api/generate-cover 로 일괄 생성하면
 * images/covers/default/ 경로에 업로드됩니다.
 */

/** 기본 표지 파일명 목록 (Supabase Storage images 버킷 기준) */
export const DEFAULT_COVER_FILES = [
  "cover-01-forest.png",
  "cover-02-ocean.png",
  "cover-03-starry-night.png",
  "cover-04-autumn-leaves.png",
  "cover-05-mountain.png",
  "cover-06-rain.png",
  "cover-07-sunrise.png",
  "cover-08-garden.png",
  "cover-09-library.png",
  "cover-10-moonlight.png",
] as const;

/** DALL-E 3 생성용 프롬프트 + 파일명 매핑 */
export const DEFAULT_COVER_PROMPTS = [
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
] as const;

/**
 * 랜덤 기본 표지 Storage 경로 반환
 * @returns "covers/default/cover-XX-theme.png" 형태의 경로
 */
export function getRandomDefaultCoverPath(): string {
  const index = Math.floor(Math.random() * DEFAULT_COVER_FILES.length);
  return `covers/default/${DEFAULT_COVER_FILES[index]}`;
}
