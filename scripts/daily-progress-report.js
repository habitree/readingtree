/**
 * Daily Progress Report Bot
 *
 * GitHub Actions에서 매일 01:00 KST에 실행되어:
 * 1. Git 커밋/PR 정보를 수집
 * 2. Linear 이슈 변경 사항을 수집
 * 3. Gemini로 한국어 요약 생성
 * 4. Linear에 Daily Progress 이슈 생성
 */

/* eslint-disable no-console */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY; // owner/repo
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 선택 값 (없으면 기본값 사용)
const LINEAR_TEAM = process.env.DAILY_PROGRESS_LINEAR_TEAM || "Readtree";
const LINEAR_PROJECT = process.env.DAILY_PROGRESS_LINEAR_PROJECT || "AI Features";

// Gemini API 설정
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ============================================================================
// 환경 변수 검증
// ============================================================================

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

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 한국 시간 기준으로 어제 날짜 범위를 계산
 * 01:00 KST에 실행되므로, 전날 00:00 ~ 23:59:59 범위를 수집
 */
function getDateRangeKST() {
  const now = new Date();

  // 한국 시간으로 변환 (UTC+9)
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);

  // 어제 날짜 계산
  const yesterday = new Date(kstNow);
  yesterday.setDate(yesterday.getDate() - 1);

  // 어제 00:00:00 KST
  const startKST = new Date(Date.UTC(
    yesterday.getUTCFullYear(),
    yesterday.getUTCMonth(),
    yesterday.getUTCDate(),
    0, 0, 0
  ));

  // 어제 23:59:59 KST
  const endKST = new Date(Date.UTC(
    yesterday.getUTCFullYear(),
    yesterday.getUTCMonth(),
    yesterday.getUTCDate(),
    23, 59, 59
  ));

  // UTC로 변환
  const start = new Date(startKST.getTime() - kstOffset);
  const end = new Date(endKST.getTime() - kstOffset);

  // 날짜 라벨 (YYYY-MM-DD)
  const dateLabel = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`;

  return { start, end, dateLabel };
}

function formatISO(date) {
  return date.toISOString();
}

// ============================================================================
// GitHub API
// ============================================================================

/**
 * GitHub에서 지정된 기간의 커밋 정보를 수집
 */
async function fetchGitCommits(start, end) {
  const [owner, repo] = GITHUB_REPOSITORY.split("/");
  const since = formatISO(start);
  const until = formatISO(end);

  console.log("[DailyProgress] GitHub 커밋 조회:", { since, until });

  const url = `https://api.github.com/repos/${owner}/${repo}/commits?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&per_page=100`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "User-Agent": "daily-progress-bot",
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    console.error("[DailyProgress] GitHub commits fetch 실패:", res.status, res.statusText);
    return [];
  }

  const commits = await res.json();

  return commits.map((c) => ({
    sha: c.sha?.slice(0, 7),
    message: c.commit?.message?.split("\n")[0], // 첫 줄만
    author: c.commit?.author?.name,
    date: c.commit?.author?.date,
    url: c.html_url,
  }));
}

/**
 * GitHub에서 지정된 기간의 머지된 PR 정보를 수집
 */
async function fetchMergedPRs(start, end) {
  const [owner, repo] = GITHUB_REPOSITORY.split("/");

  // 머지된 PR 검색
  const query = `repo:${owner}/${repo} is:pr is:merged merged:${formatISO(start).slice(0,10)}..${formatISO(end).slice(0,10)}`;
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=50`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "User-Agent": "daily-progress-bot",
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    console.error("[DailyProgress] GitHub PRs fetch 실패:", res.status, res.statusText);
    return [];
  }

  const data = await res.json();

  return (data.items || []).map((pr) => ({
    number: pr.number,
    title: pr.title,
    author: pr.user?.login,
    url: pr.html_url,
    mergedAt: pr.pull_request?.merged_at,
  }));
}

// ============================================================================
// Linear API
// ============================================================================

/**
 * Linear에서 팀의 모든 이슈 중 지정된 기간에 업데이트된 이슈를 조회
 */
async function fetchLinearIssues(start, end) {
  const query = `
    query DailyProgressIssues($teamName: String!, $updatedAfter: DateTime!, $updatedBefore: DateTime!) {
      issues(
        filter: {
          team: { name: { eq: $teamName } }
          updatedAt: { gte: $updatedAfter, lte: $updatedBefore }
        }
        first: 100
        orderBy: updatedAt
      ) {
        nodes {
          id
          identifier
          title
          description
          state { name type }
          priority
          labels { nodes { name } }
          createdAt
          updatedAt
          completedAt
          url
          project { name }
        }
      }
    }
  `;

  const variables = {
    teamName: LINEAR_TEAM,
    updatedAfter: formatISO(start),
    updatedBefore: formatISO(end),
  };

  console.log("[DailyProgress] Linear 이슈 조회:", { teamName: LINEAR_TEAM, updatedAfter: variables.updatedAfter, updatedBefore: variables.updatedBefore });

  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: LINEAR_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    console.error("[DailyProgress] Linear issues fetch 실패:", res.status, res.statusText);
    return [];
  }

  const json = await res.json();
  if (json.errors) {
    console.error("[DailyProgress] Linear GraphQL 에러:", json.errors);
    return [];
  }

  const nodes = json.data?.issues?.nodes || [];

  return nodes.map((n) => ({
    id: n.id,
    key: n.identifier,
    title: n.title,
    state: n.state?.name,
    stateType: n.state?.type, // backlog, unstarted, started, completed, canceled
    priority: n.priority,
    labels: n.labels?.nodes?.map(l => l.name) || [],
    project: n.project?.name,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    completedAt: n.completedAt,
    url: n.url,
  }));
}

// ============================================================================
// Gemini API
// ============================================================================

/**
 * Gemini API를 호출해 한국어 Daily Progress 리포트를 생성
 */
async function summarizeWithGemini(dateLabel, gitCommits, mergedPRs, linearIssues) {
  // 이슈 분류
  const completedIssues = linearIssues.filter(i => i.stateType === 'completed' || i.completedAt);
  const inProgressIssues = linearIssues.filter(i => i.stateType === 'started');
  const newIssues = linearIssues.filter(i => {
    const created = new Date(i.createdAt);
    const updated = new Date(i.updatedAt);
    return Math.abs(created.getTime() - updated.getTime()) < 60000; // 1분 이내면 새로 생성된 것
  });

  const prompt = `당신은 소프트웨어 개발 프로젝트의 일간 진행 리포트를 작성하는 AI 어시스턴트입니다.

## 날짜: ${dateLabel}

## Git 커밋 목록 (${gitCommits.length}개)
${gitCommits.length > 0 ? gitCommits.map(c => `- [${c.sha}] ${c.message} (by ${c.author})`).join('\n') : '- 커밋 없음'}

## 머지된 PR 목록 (${mergedPRs.length}개)
${mergedPRs.length > 0 ? mergedPRs.map(pr => `- #${pr.number}: ${pr.title} (by ${pr.author})`).join('\n') : '- PR 없음'}

## Linear 이슈 변경 사항 (${linearIssues.length}개)
### 완료된 이슈 (${completedIssues.length}개)
${completedIssues.length > 0 ? completedIssues.map(i => `- ${i.key}: ${i.title} [${i.labels.join(', ') || '라벨없음'}]`).join('\n') : '- 없음'}

### 진행 중 이슈 (${inProgressIssues.length}개)
${inProgressIssues.length > 0 ? inProgressIssues.map(i => `- ${i.key}: ${i.title} [${i.labels.join(', ') || '라벨없음'}]`).join('\n') : '- 없음'}

### 새로 생성된 이슈 (${newIssues.length}개)
${newIssues.length > 0 ? newIssues.map(i => `- ${i.key}: ${i.title} [${i.labels.join(', ') || '라벨없음'}]`).join('\n') : '- 없음'}

---

위 정보를 바탕으로 **한국어**로 Daily Progress 리포트를 작성해 주세요.

## 요구사항:
1. 마크다운 형식으로 작성
2. 다음 섹션을 포함:
   - **오늘의 핵심 변경 사항** (커밋/PR 기반으로 2-4개의 핵심 포인트)
   - **완료된 작업** (완료된 이슈 요약)
   - **진행 중인 작업** (진행 중 이슈 요약)
   - **새로 등록된 작업** (새 이슈 요약)
   - **내일 우선순위 추천** (진행 중/새 이슈 기반으로 1-3개 추천)
3. 각 섹션은 불릿 포인트로 간결하게 작성
4. 변경 사항이 없는 섹션은 "해당 없음"으로 표시
5. 전체 분량은 너무 길지 않게 핵심만 정리`;

  console.log("[DailyProgress] Gemini API 호출 중...");

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[DailyProgress] Gemini API 실패:", res.status, errorText);
      return generateFallbackReport(dateLabel, gitCommits, mergedPRs, linearIssues);
    }

    const data = await res.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error("[DailyProgress] Gemini 응답에 텍스트가 없습니다:", data);
      return generateFallbackReport(dateLabel, gitCommits, mergedPRs, linearIssues);
    }

    console.log("[DailyProgress] Gemini 요약 생성 완료");
    return generatedText;
  } catch (error) {
    console.error("[DailyProgress] Gemini API 오류:", error);
    return generateFallbackReport(dateLabel, gitCommits, mergedPRs, linearIssues);
  }
}

/**
 * Gemini 실패 시 기본 리포트 생성
 */
function generateFallbackReport(dateLabel, gitCommits, mergedPRs, linearIssues) {
  const completedIssues = linearIssues.filter(i => i.stateType === 'completed' || i.completedAt);
  const inProgressIssues = linearIssues.filter(i => i.stateType === 'started');

  return `## Daily Progress ${dateLabel}

### 오늘의 핵심 변경 사항
${gitCommits.length > 0
  ? gitCommits.slice(0, 5).map(c => `- \`${c.sha}\` ${c.message}`).join('\n')
  : '- 커밋 없음'}

### 머지된 PR
${mergedPRs.length > 0
  ? mergedPRs.map(pr => `- #${pr.number}: ${pr.title}`).join('\n')
  : '- PR 없음'}

### 완료된 작업
${completedIssues.length > 0
  ? completedIssues.map(i => `- [${i.key}](${i.url}): ${i.title}`).join('\n')
  : '- 해당 없음'}

### 진행 중인 작업
${inProgressIssues.length > 0
  ? inProgressIssues.map(i => `- [${i.key}](${i.url}): ${i.title}`).join('\n')
  : '- 해당 없음'}

### 통계
- 총 커밋: ${gitCommits.length}개
- 머지된 PR: ${mergedPRs.length}개
- Linear 이슈 업데이트: ${linearIssues.length}개

---
*이 리포트는 Daily Progress Bot에 의해 자동 생성되었습니다.*`;
}

// ============================================================================
// Linear Issue 생성
// ============================================================================

/**
 * Linear에 Daily Progress 이슈를 생성
 */
async function createLinearProgressIssue(dateLabel, markdownBody) {
  // 먼저 팀 ID와 프로젝트 ID를 조회
  const teamQuery = `
    query GetTeamAndProject($teamName: String!, $projectName: String!) {
      teams(filter: { name: { eq: $teamName } }) {
        nodes {
          id
          name
        }
      }
      projects(filter: { name: { eq: $projectName } }) {
        nodes {
          id
          name
        }
      }
    }
  `;

  const teamRes = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: LINEAR_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: teamQuery,
      variables: { teamName: LINEAR_TEAM, projectName: LINEAR_PROJECT },
    }),
  });

  if (!teamRes.ok) {
    console.error("[DailyProgress] 팀/프로젝트 조회 실패:", teamRes.status);
    return null;
  }

  const teamData = await teamRes.json();
  const teamId = teamData.data?.teams?.nodes?.[0]?.id;
  const projectId = teamData.data?.projects?.nodes?.[0]?.id;

  if (!teamId) {
    console.error("[DailyProgress] 팀을 찾을 수 없습니다:", LINEAR_TEAM);
    return null;
  }

  console.log("[DailyProgress] 팀 ID:", teamId, "프로젝트 ID:", projectId || "없음");

  // 이슈 생성
  const mutation = `
    mutation CreateDailyProgress($teamId: String!, $projectId: String, $title: String!, $description: String!) {
      issueCreate(
        input: {
          title: $title
          description: $description
          teamId: $teamId
          projectId: $projectId
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
    teamId,
    projectId: projectId || null,
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
    console.error("[DailyProgress] 이슈 생성 실패:", res.status, res.statusText);
    return null;
  }

  const json = await res.json();
  if (json.errors) {
    console.error("[DailyProgress] Linear mutation 에러:", json.errors);
    return null;
  }

  const issue = json.data?.issueCreate?.issue;
  if (issue) {
    console.log("[DailyProgress] Daily Progress 이슈 생성 완료:", issue.identifier, issue.url);
  } else {
    console.warn("[DailyProgress] 이슈 응답에 issue가 없습니다.");
  }

  return issue;
}

// ============================================================================
// 메인 실행
// ============================================================================

async function main() {
  console.log("=".repeat(60));
  console.log("[DailyProgress] Daily Progress Report Bot 시작");
  console.log("=".repeat(60));

  const { start, end, dateLabel } = getDateRangeKST();
  console.log(`[DailyProgress] 대상 날짜: ${dateLabel}`);
  console.log(`[DailyProgress] 조회 범위: ${formatISO(start)} ~ ${formatISO(end)}`);

  // 병렬로 데이터 수집
  const [gitCommits, mergedPRs, linearIssues] = await Promise.all([
    fetchGitCommits(start, end),
    fetchMergedPRs(start, end),
    fetchLinearIssues(start, end),
  ]);

  console.log("[DailyProgress] 수집 결과:");
  console.log(`  - Git 커밋: ${gitCommits.length}개`);
  console.log(`  - 머지된 PR: ${mergedPRs.length}개`);
  console.log(`  - Linear 이슈: ${linearIssues.length}개`);

  // 변경 사항이 전혀 없으면 스킵
  if (gitCommits.length === 0 && mergedPRs.length === 0 && linearIssues.length === 0) {
    console.log("[DailyProgress] 변경 사항이 없어 리포트 생성을 스킵합니다.");
    return;
  }

  // Gemini로 요약 생성
  const reportMarkdown = await summarizeWithGemini(dateLabel, gitCommits, mergedPRs, linearIssues);

  // Linear에 이슈 생성
  await createLinearProgressIssue(dateLabel, reportMarkdown);

  console.log("=".repeat(60));
  console.log("[DailyProgress] Daily Progress Report Bot 완료");
  console.log("=".repeat(60));
}

// Node 18+의 전역 fetch 사용
if (typeof fetch !== "function") {
  console.error("[DailyProgress] fetch가 정의되어 있지 않습니다. Node 18+ 환경에서 실행해야 합니다.");
  process.exit(1);
}

main().catch((err) => {
  console.error("[DailyProgress] 예기치 못한 오류:", err);
  process.exit(1);
});
