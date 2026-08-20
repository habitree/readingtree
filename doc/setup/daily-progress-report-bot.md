## 일간 프로그래스 리포트 Bot 설계

이 문서는 Linear + GitHub + Gemini를 이용해 **매일 자동으로 “Daily Progress” 리포트**를 생성하는 Bot의 구조와 설정 방법을 정리한 것입니다.

---

## 1. 목표

- 매일 정해진 시간(예: 한국 시간 오전 9시)에:
  - **GitHub**: 하루 동안 머지된 PR/커밋, 주요 변경 파일
  - **Linear**: 상태가 바뀐 이슈, 새로 생성된 이슈
  - (선택) `doc/user_stories.md`, `doc/archive/2026/tasks/**` 등 문서 변경
- 위 정보를 **Gemini로 요약**해서
  - Linear `AI Features` 또는 별도 `Progress` 프로젝트 아래에  
    `Daily Progress YYYY-MM-DD` 이슈를 자동 생성/갱신합니다.

---

## 2. 전체 아키텍처

```text
GitHub Actions (cron)
  └─ scripts/daily-progress-report.js
        ├─ GitHub API: 하루 커밋/PR 조회
        ├─ Linear API: 이슈 변경 내역 조회
        ├─ Gemini API: 한글 요약/섹션 구성
        └─ Linear API: Daily Progress 이슈 생성/업데이트
```

- **트리거**: GitHub Actions `schedule` + 수동 실행(`workflow_dispatch`)
- **실행 환경**: Node.js 20 (Actions 러너)
- **상태 저장**: 최소 버전에서는 “전날~오늘” 구간을 매번 계산하는 방식으로 시작  
  (추후 `scripts/.daily-progress-state.json` 등으로 마지막 실행 시각을 저장하는 형태로 확장 가능)

---

## 3. 필요한 시크릿/환경 변수

GitHub 저장소 → `Settings → Secrets and variables → Actions` 에 아래 값을 추가합니다.

- **필수**
  - `LINEAR_API_KEY`  
    - Linear Personal API Key
  - `GEMINI_API_KEY`  
    - Gemini API Key (서버용, 사용량에 주의)
  - `GITHUB_TOKEN`  
    - GitHub Actions 에 기본 제공되는 `secrets.GITHUB_TOKEN` 를 사용해도 되며,  
      별도 PAT 를 쓸 경우 여기 이름으로 등록합니다.

- **선택**
  - `DAILY_PROGRESS_LINEAR_TEAM`  
    - 기본값: `"Readtree"` (팀 이름 또는 ID)
  - `DAILY_PROGRESS_LINEAR_PROJECT`  
    - 기본값: `"AI Features"` (리포트 이슈를 생성할 프로젝트 이름)

---

## 4. 요약 포맷 (초안)

Bot이 작성하는 이슈 본문은 아래와 같은 구조를 가집니다.

```markdown
## Daily Progress 2026-01-20

### 1. 오늘의 핵심 변경 사항
- Backend: ...
- Frontend: ...
- AI Features: ...
- Infra/DevOps: ...

### 2. 완료된 이슈
- [REA-7] 페르소나 기반 챗봇 아이디어 정리
- [REA-8] 일간 Progress Bot 설계

### 3. 진행 중 이슈
- [REA-5] 페르소나 기반 재독 유도 문구 생성
- [REA-6] MBTI 스타일 독서 성향 분석

### 4. 리스크 / 이슈
- OCR 배치 처리 속도 개선 필요 (대기열 증가)

### 5. 내일 / 다음 작업 추천 (Gemini 제안)
- ...
```

---

## 5. GitHub Actions 워크플로우 개요

`.github/workflows/daily-progress-report.yml`:

- **트리거**
  - `schedule`: 매일 00:00 UTC (한국 기준 오전 9시) 실행
  - `workflow_dispatch`: 필요 시 수동 실행
- **주요 단계**
  - 코드 체크아웃
  - Node.js 20 설정
  - `npm ci` (기존 의존성 설치)
  - `node scripts/daily-progress-report.js` 실행

실제 YAML 예시는 워크플로우 파일을 참고하세요.

---

## 6. 스크립트 개요 (`scripts/daily-progress-report.js`)

- 역할:
  1. 시간 범위 계산(기본: “어제 00:00 UTC ~ 오늘 00:00 UTC”)
  2. GitHub API 로 해당 구간 PR/커밋/파일 목록 조회
  3. Linear API 로 해당 구간 업데이트된 이슈 목록 조회
  4. 위 데이터를 한국어 텍스트 프롬프트로 구성해 Gemini 에 요약 요청
  5. 결과를 Linear `Daily Progress YYYY-MM-DD` 이슈로 생성/업데이트

- 초기 버전은 **로그를 많이 남기고, 실제 요약/생성 로직은 TODO 로 나누어** 점진적으로 채워나가는 구조입니다.

---

## 7. 단계별 적용 순서

1. **시크릿 설정**
   - `LINEAR_API_KEY`, `GEMINI_API_KEY`, (선택) `DAILY_PROGRESS_*` 값 등록
2. **스크립트/워크플로우 커밋**
   - `scripts/daily-progress-report.js`
   - `.github/workflows/daily-progress-report.yml`
3. **수동 실행 테스트**
   - Actions → `Daily Progress Report` 워크플로우 → `Run workflow`
   - 로그에서 Linear API / Gemini 호출 여부 확인
4. **결과 검증**
   - Linear 에 `Daily Progress YYYY-MM-DD` 이슈가 생성되었는지,
   - 내용(요약/리스트/추천)이 기대에 맞는지 확인
5. **점진 확장**
   - 더 정교한 필터링(예: 특정 레이블만 포함)
   - Supabase 로그/통계도 함께 요약
   - 주간/월간 Progress 리포트로 확장

