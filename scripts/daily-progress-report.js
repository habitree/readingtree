// Daily Progress Report Bot (초기 스켈레톤)
// - GitHub Actions에서 실행되는 Node.js 스크립트
// - Git/Linear 변경 사항을 수집하고 Gemini로 요약하여
//   Linear에 Daily Progress 이슈를 생성/업데이트하는 것이 목표입니다.

/* eslint-disable no-console */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY; // owner/repo
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 선택 값 (없으면 기본값 사용)
const LINEAR_TEAM = process.env.DAILY_PROGRESS_LINEAR_TEAM || "Readtree";
const LINEAR_PROJECT =
  process.env.DAILY_PROGRESS_LINEAR_PROJECT || "AI Features";

if (!GITHUB_REPOSITORY) {
  console.error("[DailyProgress] GITHUB_REPOSITORY 환경 변수가 필요합니다.");
  process.exit(1);
}

if (!GITHUB_TOKEN) {
  console.error("[DailyProgress] GITHUB_TOKEN 환경 변수가 필요합니다.");
  process.exit(1);
}

if (!LINEAR_API_KEY) {
  console.error("[DailyProgress] LINEAR_API_KEY 환경 변수가 필요합니다.");
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error("[DailyProgress] GEMINI_API_KEY 환경 변수가 필요합니다.");
  process.exit(1);
}

/**
 * UTC 기준으로 어제~오늘 24시간 구간을 계산한다.
 */
function getDateRangeUTC() {
  const now = new Date();
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
  );
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  return { start, end };
}

function formatISO(date) {
  return date.toISOString();
}

/**
 * GitHub API에서 지정된 기간의 커밋/PR 정보를 간단히 수집한다.
 * (초기 버전: 커밋 메시지/작성자 정도만, 추후 확장)
 */
async function fetchGitChanges(start, end) {
  const [owner, repo] = GITHUB_REPOSITORY.split("/");

  const since = formatISO(start);
  const until = formatISO(end);

  console.log("[DailyProgress] GitHub commit range", { since, until });

  const url = `https://api.github.com/repos/${owner}/${repo}/commits?since=${encodeURIComponent(
    since
  )}&until=${encodeURIComponent(until)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "User-Agent": "daily-progress-bot",
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    console.error("[DailyProgress] GitHub commits fetch 실패", {
      status: res.status,
      statusText: res.statusText,
    });
    return [];
  }

  const commits = await res.json();

  return commits.map((c) => ({
    sha: c.sha,
    message: c.commit?.message,
    author: c.commit?.author?.name,
    date: c.commit?.author?.date,
    url: c.html_url,
  }));
}

/**
 * Linear에서 특정 기간 동안 업데이트된 이슈를 조회하는 GraphQL 호출 스켈레톤.
 * 실제 구현 시 updatedAt 필터, 팀/프로젝트 필터를 추가해야 한다.
 */
async function fetchLinearIssues(start, end) {
  const query = `
    query DailyProgressIssues($team: String!, $project: String!, $after: String) {
      issues(
        filter: {
          team: { name: { eq: $team } }
          project: { name: { eq: $project } }
        }
        first: 50
        after: $after
      ) {
        nodes {
          id
          identifier
          title
          state { name }
          createdAt
          updatedAt
          url
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const variables = {
    team: LINEAR_TEAM,
    project: LINEAR_PROJECT,
  };

  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: LINEAR_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    console.error("[DailyProgress] Linear issues fetch 실패", {
      status: res.status,
      statusText: res.statusText,
    });
    return [];
  }

  const json = await res.json();
  if (json.errors) {
    console.error("[DailyProgress] Linear GraphQL 에러", json.errors);
    return [];
  }

  const nodes = json.data?.issues?.nodes || [];

  // TODO: start/end(updatedAt) 범위 필터링 추가
  return nodes.map((n) => ({
    id: n.id,
    key: n.identifier,
    title: n.title,
    state: n.state?.name,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    url: n.url,
  }));
}

/**
 * Gemini API를 호출해 한국어 요약을 생성하는 스켈레톤.
 * 실제 구현 시 모델 이름/구체 옵션은 프로젝트 정책에 맞게 조정한다.
 */
async function summarizeWithGemini(dateLabel, gitChanges, linearIssues) {
  const prompt = [
    `오늘 날짜: ${dateLabel}`,
    "",
    "다음은 하루 동안의 Git 변경 내역입니다:",
    JSON.stringify(gitChanges, null, 2),
    "",
    "다음은 하루 동안 상태가 바뀌었거나 새로 생성된 Linear 이슈 목록입니다:",
    JSON.stringify(linearIssues, null, 2),
    "",
    "위 정보를 바탕으로 한국어로 Daily Progress 리포트를 작성해 주세요.",
    "- 섹션: 오늘의 핵심 변경, 완료된 이슈, 진행 중 이슈, 리스크/이슈, 내일/다음 작업 추천",
    "- 너무 길게 쓰지 말고, 핵심만 정리",
  ].join("\n");

  // NOTE: 여기서는 실제 Gemini 호출 대신 TODO 로 남깁니다.
  // 필요 시 lib/api/gemini.ts 유틸을 재사용하도록 변경하세요.

  console.log("[DailyProgress] Gemini 프롬프트 예시:\n", prompt.slice(0, 800), "...");

  // TODO: 실제 Gemini 호출 구현
  // const response = await fetch(...);
  // const data = await response.json();
  // return data.candidates[0].content;

  // 임시로 단순 요약 텍스트 반환
  return [
    `## Daily Progress ${dateLabel}`,
    "",
    "### 1. 오늘의 핵심 변경 사항",
    "- (TODO) Gemini 요약 결과로 채워질 영역입니다.",
    "",
    "### 2. 완료된 이슈",
    "- (TODO)",
    "",
    "### 3. 진행 중 이슈",
    "- (TODO)",
    "",
    "### 4. 리스크 / 이슈",
    "- (TODO)",
    "",
    "### 5. 내일 / 다음 작업 추천",
    "- (TODO)",
    "",
  ].join("\n");
}

/**
 * Linear에 Daily Progress 이슈를 생성하거나, 이미 있으면 업데이트한다.
 * (초기 버전: 항상 새 이슈를 만든다고 가정)
 */
async function createLinearProgressIssue(dateLabel, markdownBody) {
  const mutation = `
    mutation CreateDailyProgress($team: String!, $project: String!, $title: String!, $description: String!) {
      issueCreate(
        input: {
          title: $title
          description: $description
          team: { name: $team }
          project: { name: $project }
        }
      ) {
        success
        issue {
          id
          identifier
          url
        }
      }
    }
  `;

  const variables = {
    team: LINEAR_TEAM,
    project: LINEAR_PROJECT,
    title: `Daily Progress ${dateLabel}`,
    description: markdownBody,
  };

  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: LINEAR_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: mutation, variables }),
  });

  if (!res.ok) {
    console.error("[DailyProgress] Daily Progress 이슈 생성 실패", {
      status: res.status,
      statusText: res.statusText,
    });
    return null;
  }

  const json = await res.json();
  if (json.errors) {
    console.error("[DailyProgress] Linear mutation 에러", json.errors);
    return null;
  }

  const issue = json.data?.issueCreate?.issue;
  if (issue) {
    console.log(
      "[DailyProgress] Daily Progress 이슈 생성 완료:",
      issue.identifier,
      issue.url
    );
  } else {
    console.warn("[DailyProgress] Daily Progress 이슈 응답에 issue 가 없습니다.");
  }

  return issue;
}

async function main() {
  console.log("[DailyProgress] 시작");

  const { start, end } = getDateRangeUTC();
  const dateLabel = new Date(end.getTime() - 1).toISOString().slice(0, 10); // YYYY-MM-DD

  const [gitChanges, linearIssues] = await Promise.all([
    fetchGitChanges(start, end),
    fetchLinearIssues(start, end),
  ]);

  console.log("[DailyProgress] Git 변경 수:", gitChanges.length);
  console.log("[DailyProgress] Linear 이슈 수:", linearIssues.length);

  const reportMarkdown = await summarizeWithGemini(
    dateLabel,
    gitChanges,
    linearIssues
  );

  await createLinearProgressIssue(dateLabel, reportMarkdown);

  console.log("[DailyProgress] 완료");
}

// Node 18+의 전역 fetch 사용
if (typeof fetch !== "function") {
  console.error(
    "[DailyProgress] fetch 가 정의되어 있지 않습니다. Node 18+ 환경에서 실행해야 합니다."
  );
  process.exit(1);
}

main().catch((err) => {
  console.error("[DailyProgress] 예기치 못한 오류", err);
  process.exit(1);
});

