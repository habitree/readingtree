---
name: ship
description: Linear 이슈 생성 + GitHub 배포를 일괄 처리합니다. 작업 완료 후 정리/배포할 때 사용합니다.
disable-model-invocation: true
argument-hint: [작업 요약 메시지]
allowed-tools: Bash(git:*), Bash(gh:*), mcp__linear__create_issue, mcp__linear__update_issue, mcp__linear__list_issues, mcp__linear__list_issue_labels, Read, Grep
---

# Ship: Linear 이슈 + GitHub 배포 일괄 처리

작업 내용을 분석하여 Linear 이슈를 생성하고 GitHub에 배포합니다.

## 입력

사용자 메시지: $ARGUMENTS

## 실행 단계

### 1단계: 작업 내용 분석

다음 명령어로 현재 작업 상황을 파악합니다:

```bash
# 변경된 파일 목록
git status --short

# 상세 변경 내용
git diff --stat

# 최근 커밋 히스토리 (아직 푸시 안 된 것)
git log origin/main..HEAD --oneline 2>/dev/null || git log -5 --oneline
```

### 2단계: 변경 내용 요약

분석 결과를 바탕으로 다음을 정리합니다:

1. **작업 유형** 판단:
   - `feature`: 새 기능 추가
   - `fix`: 버그 수정
   - `refactor`: 코드 리팩토링
   - `docs`: 문서 수정
   - `style`: UI/스타일 변경
   - `chore`: 설정/의존성 변경

2. **영향 범위** 파악:
   - 변경된 주요 파일/디렉토리
   - 영향받는 기능

3. **요약 문구** 작성:
   - 한글 제목 (50자 이내)
   - 상세 설명 (변경 사항, 이유, 영향)

### 3단계: Linear 이슈 생성

`mcp__linear__create_issue` 도구를 사용하여 이슈를 생성합니다:

```
팀: Readtree
제목: [작업유형] 요약 제목
설명:
## 변경 사항
- 주요 변경 내용 목록

## 영향 범위
- 영향받는 기능/파일

## 테스트
- [ ] 로컬 테스트 완료
- [ ] 빌드 확인

상태: Done (완료된 작업인 경우)
```

### 4단계: Git 커밋 및 푸시

```bash
# 모든 변경 사항 스테이징
git add -A

# 커밋 (Linear 이슈 번호 포함)
git commit -m "$(cat <<'EOF'
[작업유형] 요약 제목 (#이슈번호)

- 변경 사항 1
- 변경 사항 2

Linear: LIN-XXX
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"

# 원격 저장소에 푸시
git push origin main
```

### 5단계: 결과 보고

완료 후 다음을 사용자에게 보고합니다:

```
## 배포 완료

### Linear 이슈
- 이슈 번호: LIN-XXX
- 제목: [작업유형] 요약
- 링크: https://linear.app/readtree/issue/LIN-XXX

### GitHub 커밋
- 커밋 해시: abc1234
- 브랜치: main
- 변경 파일: X개

### 요약
[작업 내용 한 줄 요약]
```

## 주의사항

1. **커밋 전 확인**: 민감한 정보(.env, 키 등)가 포함되지 않았는지 확인
2. **빌드 확인**: 가능하면 `npm run build` 성공 여부 확인
3. **이슈 상태**: 작업 완료 시 Linear 이슈를 "Done" 상태로 설정
4. **브랜치**: 기본적으로 main 브랜치에 푸시 (다른 브랜치 지정 가능)

## 예시

```
/ship 독서 통계 페이지 차트 컴포넌트 추가
```

결과:
- Linear: "LIN-42: [feature] 독서 통계 페이지 차트 컴포넌트 추가"
- Git: `[feature] 독서 통계 페이지 차트 컴포넌트 추가 (#42)`
