/**
 * ReadTree 헤더용 lucide Trees 아이콘을 forest-600 색상으로 PNG로 내보냅니다.
 * 사용: node scripts/export-trees-icon-png.mjs
 */
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FOREST_600 = "#24855e";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${FOREST_600}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/>
  <path d="M7 16v6"/>
  <path d="M13 19v3"/>
  <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>
</svg>
`.trim();

async function main() {
  const size = 24;
  const outDir = join(__dirname, "..", "public", "images");
  mkdirSync(outDir, { recursive: true });

  const png = await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toBuffer();

  const path24 = join(outDir, "readtree-trees-icon-24.png");
  writeFileSync(path24, png);
  console.log("생성됨:", path24);

  // 48x48, 96x96도 생성 (고해상도/파비콘 등용)
  for (const s of [48, 96]) {
    const buf = await sharp(Buffer.from(svg))
      .resize(s, s)
      .png()
      .toBuffer();
    const p = join(outDir, `readtree-trees-icon-${s}.png`);
    writeFileSync(p, buf);
    console.log("생성됨:", p);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
