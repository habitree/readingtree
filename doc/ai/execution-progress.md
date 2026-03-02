# 독서친구 AI 챗봇 고도화 — 단계별 실행 진행표

> 최종 수정: 2026-03-02
> 전체 7단계 중 **7단계 완료 (ALL DONE)**

---

## 실행 단계 총괄

| 단계 | 내용 | 상태 | 비고 |
|------|------|------|------|
| Step 1 | DB 타입 정합성 확보 (feedback 컬럼) | **완료** | types/database.ts + chat-interface.tsx 수정 |
| Step 2 | Phase 1 검증 — 프롬프트 고도화 품질 점검 | **완료** | 6섹션 구조/수준 판별/Few-Shot 정상 |
| Step 3 | Phase 2 검증 — 대화 모드 + 퀵 액션 안정화 | **완료** | 모드→API→프롬프트 E2E 정상 |
| Step 4 | Phase 3 검증 — 장기 기억 파이프라인 활성화 | **완료** | JSON 파싱 안전장치 추가, 관리자 토글 연동 확인 |
| Step 5 | Phase 4 검증 — UX 고도화 (온보딩/피드백) | **완료** | 온보딩/피드백/마이그레이션 정상 |
| Step 6 | 통합 테스트 + 빌드 검증 | **완료** | tsc 0 에러 + npm run build 성공 |
| Step 7 | 기획 문서 최종 업데이트 | **완료** | HTML/MD 구현 결과 섹션 추가 |

---

## Step 1: DB 타입 정합성 확보

### 문제
- `chat_messages` 테이블에 `feedback` 컬럼 마이그레이션은 작성되었으나
- `types/database.ts`의 Row/Insert/Update 타입에 `feedback` 필드 미반영
- `updateMessageFeedback()` 서버 액션에서 `.update({ feedback })` 시 타입 에러 잠재

### 작업
- [ ] `types/database.ts`의 `chat_messages` Row/Insert/Update에 `feedback` 필드 추가
- [ ] 타입 정합성 확인 (`tsc --noEmit`)

### 완료 기준
- TypeScript 에러 0개
- `updateMessageFeedback` 호출 시 타입 안전

---

## Step 2: Phase 1 검증 — 프롬프트 고도화 품질

### 점검 항목
- [ ] 시스템 프롬프트 6개 섹션 구조 확인
- [ ] `generateUserLevelSection()` 3단계 판별 로직 검증
- [ ] Few-Shot 예시 4가지 시나리오 품질 검토
- [ ] 안전 가드레일 규칙 적절성 확인
- [ ] 응답 형식 규칙 (`[[book:...]]` 등) 유지 확인

### 완료 기준
- 프롬프트가 의도대로 구성되는지 코드 레벨 검증 통과

---

## Step 3: Phase 2 검증 — 대화 모드 + 퀵 액션

### 점검 항목
- [ ] `ChatMode` 타입 → API body → 프롬프트 주입 흐름 확인
- [ ] 모드 칩 UI 렌더링 확인 (시작 화면 + 대화 중)
- [ ] `generateQuickActions()` 컨텍스트 기반 동적 생성 검증
- [ ] 점진적 기능 공개 (`getFeatureLevel`, `getAvailableModes`) 로직 검증
- [ ] 모드 전환 시 프롬프트 변화 확인

### 완료 기준
- 모드 선택 → API 전달 → 프롬프트 반영 E2E 흐름 정상

---

## Step 4: Phase 3 검증 — 장기 기억 파이프라인

### 점검 항목
- [ ] `enableLongTermMemory` 플래그 처리 전략 확정
- [ ] `extractAndSaveMemories()` 로직 안정성 검증
- [ ] `getChatContext()` 메모리 로드 → 프롬프트 주입 확인
- [ ] `generateMemorySection()` 출력 형태 검증
- [ ] 에러 핸들링 (API key 없음, JSON 파싱 실패 등)

### 완료 기준
- 메모리 추출/저장/조회/주입 전체 파이프라인 코드 검증

---

## Step 5: Phase 4 검증 — UX 고도화

### 점검 항목
- [ ] 온보딩 감지 (`isFirstUser`) 조건 정확성
- [ ] `ONBOARDING_WELCOME` + `ONBOARDING_QUESTIONS` 표시
- [ ] 피드백 버튼 (ThumbsUp/ThumbsDown) 상태 관리
- [ ] `handleFeedback` → `updateMessageFeedback` 서버 액션 연동
- [ ] 마이그레이션 SQL idempotent 확인

### 완료 기준
- 온보딩 → 모드 전환 → 퀵 액션 → 피드백 전체 UI 흐름 정상

---

## Step 6: 통합 테스트 + 빌드 검증

### 작업
- [ ] `tsc --noEmit` 통과
- [ ] `npm run build` 성공
- [ ] import/export 순환 참조 없음
- [ ] 미사용 import 없음

---

## Step 7: 기획 문서 최종 업데이트

### 작업
- [ ] `chatbot-enhancement-plan.html` 진행 상태 반영
- [ ] `chatbot-enhancement-plan.md` 동일 내용 반영
- [ ] `execution-progress.md` 전체 완료 표시
