import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const idsPath = path.join(__dirname, "post_lognos.txt");
const outTsv = path.join(__dirname, "_posts_meta.tsv");
const ids = fs
  .readFileSync(idsPath, "utf8")
  .split(/\r?\n/)
  .map((s) => s.trim())
  .filter((s) => /^\d+$/.test(s));

const bookRe =
  /책|도서|독서|읽었|읽을|서적|『|투자책|명작|소설|에세이|저자|추천.{0,8}책/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];

for (let i = 0; i < ids.length; i++) {
  const id = ids[i];
  const url = `https://m.blog.naver.com/pillion21/${id}`;
  let title = "";
  let bookMention = false;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const html = await res.text();
    const m = html.match(/property="og:title"\s+content="([^"]*)"/);
    if (m) title = m[1].trim();
    const plain = html.replace(/<[^>]+>/g, " ");
    bookMention = bookRe.test(plain);
  } catch {
    title = "LOAD_ERROR";
  }
  rows.push({ logNo: id, title, bookMention });
  if ((i + 1) % 25 === 0) console.error(`progress ${i + 1} / ${ids.length}`);
  await sleep(350);
}

const header = "logNo\ttitle\tbookMention\n";
const body = rows
  .map((r) => `${r.logNo}\t${r.title.replace(/\t/g, " ")}\t${r.bookMention}`)
  .join("\n");
fs.writeFileSync(outTsv, header + body + "\n", "utf8");
console.error(`Wrote ${outTsv} count=${rows.length}`);
