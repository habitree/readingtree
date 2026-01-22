# Phase 1: 디렉토리 구조 생성

**실행 방식:** 모든 Task 병렬 실행 가능

---

## Task 1-1: lib/ai 디렉토리 구조 생성

### Subagent 명령
```
lib/ai 디렉토리 구조를 생성하세요:
1. lib/ai/ 폴더 생성
2. lib/ai/providers/ 폴더 생성
3. lib/ai/prompts/ 폴더 생성
4. lib/ai/utils/ 폴더 생성
5. lib/ai/index.ts 파일 생성 (아래 내용으로)

lib/ai/index.ts 내용:
/**
 * AI 라이브러리 진입점
 * AI 관련 모든 기능을 여기서 export합니다.
 */

// Providers
// export * from './providers';

// Prompts
// export * from './prompts';

// Utils
// export * from './utils';
```

### 검증
```bash
ls lib/ai/
# 예상 출력: index.ts  prompts/  providers/  utils/
```

---

## Task 1-2: app/actions/ai 디렉토리 생성

### Subagent 명령
```
app/actions/ai 디렉토리를 생성하세요:
1. app/actions/ai/ 폴더 생성
2. app/actions/ai/index.ts 파일 생성 (아래 내용으로)

app/actions/ai/index.ts 내용:
/**
 * AI Server Actions 진입점
 * AI 관련 모든 Server Actions를 여기서 export합니다.
 */

// 챗봇
// export * from './chat';

// 설정
// export * from './settings';

// 페르소나
// export * from './persona';

// 요약
// export * from './summarization';

// OCR
// export * from './ocr';
```

### 검증
```bash
ls app/actions/ai/
# 예상 출력: index.ts
```

---

## Task 1-3: app/api/ai 디렉토리 생성

### Subagent 명령
```
app/api/ai 디렉토리 구조를 생성하세요:
1. app/api/ai/ 폴더 생성
2. app/api/ai/chat/ 폴더 생성
3. app/api/ai/chat/.gitkeep 파일 생성 (빈 파일)
```

### 검증
```bash
ls app/api/ai/
# 예상 출력: chat/
```

---

## Task 1-4: components/ai 디렉토리 생성

### Subagent 명령
```
components/ai 디렉토리 구조를 생성하세요:
1. components/ai/ 폴더 생성
2. components/ai/chat/ 폴더 생성
3. components/ai/admin/ 폴더 생성
4. components/ai/chat/.gitkeep 파일 생성 (빈 파일)
5. components/ai/admin/.gitkeep 파일 생성 (빈 파일)
```

### 검증
```bash
ls components/ai/
# 예상 출력: admin/  chat/
```

---

## Task 1-5: types/ai 디렉토리 생성

### Subagent 명령
```
types/ai 디렉토리를 생성하세요:
1. types/ai/ 폴더 생성
2. types/ai/index.ts 파일 생성 (아래 내용으로)

types/ai/index.ts 내용:
/**
 * AI 타입 진입점
 * AI 관련 모든 타입을 여기서 export합니다.
 */

// 챗봇 타입
// export * from './chat';

// 페르소나 타입
// export * from './persona';

// 설정 타입
// export * from './settings';

// Provider 타입
// export * from './providers';
```

### 검증
```bash
ls types/ai/
# 예상 출력: index.ts
```

---

## Task 1-6: doc/ai 디렉토리 생성

### Subagent 명령
```
doc/ai 디렉토리를 생성하세요:
1. doc/ai/ 폴더 생성
2. doc/ai/.gitkeep 파일 생성 (빈 파일)
```

### 검증
```bash
ls doc/ai/
# 예상 출력: .gitkeep
```

---

## 일괄 실행 스크립트

### Bash (Linux/Mac)
```bash
#!/bin/bash

# lib/ai
mkdir -p lib/ai/{providers,prompts,utils}

# app/actions/ai
mkdir -p app/actions/ai

# app/api/ai
mkdir -p app/api/ai/chat

# components/ai
mkdir -p components/ai/{chat,admin}

# types/ai
mkdir -p types/ai

# doc/ai
mkdir -p doc/ai

echo "디렉토리 구조 생성 완료"
```

### PowerShell (Windows)
```powershell
# lib/ai
New-Item -ItemType Directory -Force -Path "lib/ai/providers"
New-Item -ItemType Directory -Force -Path "lib/ai/prompts"
New-Item -ItemType Directory -Force -Path "lib/ai/utils"

# app/actions/ai
New-Item -ItemType Directory -Force -Path "app/actions/ai"

# app/api/ai
New-Item -ItemType Directory -Force -Path "app/api/ai/chat"

# components/ai
New-Item -ItemType Directory -Force -Path "components/ai/chat"
New-Item -ItemType Directory -Force -Path "components/ai/admin"

# types/ai
New-Item -ItemType Directory -Force -Path "types/ai"

# doc/ai
New-Item -ItemType Directory -Force -Path "doc/ai"

Write-Host "디렉토리 구조 생성 완료"
```

---

## 완료 체크리스트

- [ ] lib/ai/providers/ 생성됨
- [ ] lib/ai/prompts/ 생성됨
- [ ] lib/ai/utils/ 생성됨
- [ ] lib/ai/index.ts 생성됨
- [ ] app/actions/ai/ 생성됨
- [ ] app/actions/ai/index.ts 생성됨
- [ ] app/api/ai/chat/ 생성됨
- [ ] components/ai/chat/ 생성됨
- [ ] components/ai/admin/ 생성됨
- [ ] types/ai/ 생성됨
- [ ] types/ai/index.ts 생성됨
- [ ] doc/ai/ 생성됨
