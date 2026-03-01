---
name: gitp
description: Git 커밋 + 푸시를 일괄 처리합니다. Linear 없이 빠르게 배포할 때 사용합니다.
argument-hint: [커밋 메시지 또는 작업 요약]
allowed-tools: Bash(git:*), Bash(gh:*), Read, Grep
---

# gitp: Git 커밋 + 푸시 일괄 처리

변경 내용을 분석하여 커밋하고 main에 푸시합니다.

## 입력

사용자 메시지: $ARGUMENTS

## 실행 단계

### 1단계: 변경 내용 분석

```bash
# 변경된 파일 확인
git status --short

# 변경 상세 (staged + unstaged)
git diff --stat
git diff --cached --stat

# 최근 커밋 스타일 참고
git log -5 --oneline
```

### 2단계: 작업 유형 판단

변경 내용을 분석하여 prefix를 결정합니다:

- `feat`: 새 기능 추가
- `fix`: 버그 수정
- `refactor`: 코드 리팩토링
- `docs`: 문서 수정
- `style`: UI/스타일 변경
- `chore`: 설정/의존성 변경
- `perf`: 성능 개선

### 3단계: 커밋 메시지 작성

- 사용자가 `$ARGUMENTS`를 제공한 경우: 해당 내용을 커밋 메시지로 활용
- 제공하지 않은 경우: 변경 내용을 분석하여 자동으로 작성

메시지 형식:
```
[prefix]: 한글 요약 (50자 이내)

- 변경 사항 1
- 변경 사항 2

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### 4단계: 스테이징 + 커밋

```bash
# 변경 파일 스테이징 (민감 파일 제외 확인)
git add <files>

# 커밋
git commit -m "$(cat <<'EOF'
[prefix]: 요약

- 변경 내용

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

**주의**: `.env`, `credentials`, 키 파일 등 민감 파일은 절대 스테이징하지 않습니다.

### 5단계: GitHub 계정 확인 + 푸시

이 PC는 GitHub CLI(`gh`)로 여러 계정을 관리합니다. 푸시 전 반드시 활성 계정을 확인합니다.

```bash
# 현재 활성 계정 확인
gh auth status

# readingtree 리포는 habitree 계정 필요
# 활성 계정이 habitree가 아니면 전환 후 푸시
gh auth switch --user habitree
git push origin main
```

**계정 매핑**:
- `habitree/readingtree` → `habitree` 계정
- 다른 리포 → `setlog-ntl` 계정

**Permission denied 발생 시**: `gh auth switch --user habitree` 실행 후 재시도

### 6단계: 결과 보고

```
## 배포 완료

- 커밋: abc1234
- 메시지: [prefix]: 요약
- 변경 파일: X개
- 브랜치: main → origin/main
```

## 주의사항

1. **민감 파일 확인**: .env, 키 파일 등 절대 커밋하지 않음
2. **빌드 여부**: 이전에 빌드가 성공했다면 별도 빌드 생략 (필요시 사용자가 요청)
3. **기본 브랜치**: main (다른 브랜치는 사용자가 명시)
4. **force push 금지**: --force 옵션 절대 사용하지 않음
