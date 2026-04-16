import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tsv = fs.readFileSync(path.join(__dirname, "_posts_meta.tsv"), "utf8");
const lines = tsv.trim().split(/\r?\n/).slice(1);
const rows = lines.map((line) => {
  const tab = line.indexOf("\t");
  const tab2 = line.indexOf("\t", tab + 1);
  const logNo = line.slice(0, tab);
  const title = line.slice(tab + 1, tab2).replace(/\r/g, "");
  const bookMention = line.slice(tab2 + 1).trim() === "true";
  return { logNo, title, bookMention };
});

const blogBase = "https://blog.naver.com/pillion21";

const readme = `# 알바트로스 블로그 (pillion21) 자료 모음

- 블로그: [알바트로스의 파생 이야기](https://blog.naver.com/pillion21)
- 이 폴더는 **자동 수집한 글 목록·메타데이터**를 담습니다. 네이버 UI·정책 변경 시 스크립트 재실행이 필요할 수 있습니다.

## 수집 범위·한계

| 항목 | 설명 |
|------|------|
| 글 개수 | 목록 페이지 \`PostList.naver\` 1~130페이지를 순회해 **고유 logNo ${rows.length}개**를 수집했습니다. 블로그 상단에 표시되는 「전체보기 N개」와 숫자가 다를 수 있습니다(비공개·카테고리 필터·집계 방식 차이 등). |
| 제목 | 각 글의 모바일 페이지 \`og:title\` 메타 태그에서 읽었습니다. |
| 댓글의 책 추천 | 네이버 댓글 API는 비브라우저·단순 요청 시 **정책으로 차단**되는 경우가 많아, **댓글 전문을 자동으로 긁어오지 못했습니다.** 댓글에만 있는 추천 도서는 블로그에서 해당 글을 연 뒤 댓글을 직접 확인해야 합니다. |
| 본문의 책·독서 언급 | HTML 본문을 단순 키워드(책·독서·도서·읽었·투자책·소설 등)로 스캔해 **참고용 후보 글**을 표시했습니다. 오탐·미탐이 있습니다. |

## 폴더 안 파일

- \`전체_글_목록.md\` — 수집된 모든 글의 링크·제목
- \`본문_독서책_키워드_매칭_글.md\` — 본문에 독서/책 관련 키워드가 잡힌 글만 모음 (댓글 미포함)
- \`post_lognos.txt\` — logNo 한 줄에 하나
- \`_posts_meta.tsv\` — logNo, title, bookMention (스크립트 출력)
- \`_fetch_posts.ps1\`, \`_enrich_posts.mjs\` — 수집용 스크립트

## 스크립트 다시 돌리기

1. PowerShell: \`_fetch_posts.ps1\` (페이지 수는 파일 안 \`maxPages\` 조정)
2. Node: \`node _enrich_posts.mjs\`
3. Node: \`node _build_markdown.mjs\`
`;

const fullList =
  `# 전체 글 목록 (${rows.length}건)\n\n` +
  `| 제목 | PC 링크 |\n| --- | --- |\n` +
  rows
    .map(
      (r) =>
        `| ${r.title.replace(/\|/g, "\\|")} | [${r.logNo}](${blogBase}/${r.logNo}) |`
    )
    .join("\n") +
  `\n`;

const bookRows = rows.filter((r) => r.bookMention);
const bookMd =
  `# 본문 독서·책 키워드 매칭 글 (${bookRows.length}건)\n\n` +
  `> 자동 키워드 매칭입니다. **댓글 내용은 포함되지 않습니다.**\n\n` +
  `| 제목 | 링크 |\n| --- | --- |\n` +
  bookRows
    .map(
      (r) =>
        `| ${r.title.replace(/\|/g, "\\|")} | [보기](${blogBase}/${r.logNo}) |`
    )
    .join("\n") +
  `\n`;

fs.writeFileSync(path.join(__dirname, "README.md"), readme, "utf8");
fs.writeFileSync(path.join(__dirname, "전체_글_목록.md"), fullList, "utf8");
fs.writeFileSync(
  path.join(__dirname, "본문_독서책_키워드_매칭_글.md"),
  bookMd,
  "utf8"
);
console.error("Wrote README.md, 전체_글_목록.md, 본문_독서책_키워드_매칭_글.md");
