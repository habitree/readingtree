# Linear 이슈 생성용 템플릿 (포인트·차감·출석·리더보드 계획안)

## MCP 연결 확인

1. **Cursor**에서 Linear MCP가 연결되어 있는지 확인하세요.  
   - 설정 → MCP → Linear 서버가 켜져 있고, API 키 등이 설정되어 있어야 합니다.
2. 연결된 경우: 아래 "Linear MCP로 직접 생성" 절차를 사용하면 AI가 이슈를 대신 생성할 수 있습니다.
3. 연결되지 않은 경우: "수동 생성" 절차로 Linear 웹에서 직접 만들어 주세요.

---

## Linear MCP로 직접 생성 (연결된 경우)

연결 확인 후, AI에게 **「Linear MCP 연결 확인해서 포인트 고도화 계획안 이슈 직접 생성해줘」**처럼 요청하면 됩니다.  
또는 아래 순서대로 MCP 도구를 사용할 수 있습니다.

1. `mcp__linear__list_teams` → **Readtree** 팀 ID 확인  
2. `mcp__linear__list_issue_labels` → **idea** 라벨 ID 확인  
3. `mcp__linear__create_issue` 호출 시 아래 값을 사용:
   - **teamId**: 1번에서 확인한 Readtree 팀 ID  
   - **title**: `[idea] 포인트·차감·출석·리더보드 고도화 계획안`  
   - **description**: 아래 "설명 (본문)" 블록 전체  
   - **labelIds**: 2번에서 확인한 idea 라벨 ID 배열

---

## 수동 생성 (웹에서 직접)

Linear 팀 **Readtree**에서 새 이슈를 만들고, 라벨에 **idea**를 붙인 뒤 아래를 복사해 넣으세요.

---

## 제목

```
[idea] 포인트·차감·출석·리더보드 고도화 계획안
```

---

## 설명 (본문)

```markdown
## 개요
포인트 적립 확장(기록/수정/개선안), 매일 출석, GPT/OCR 차감, 기록량 기반 무상 한도, 리더보드 도입을 담은 계획안.

## 상세 문서
- 저장 위치: `doc/plan/points-gamification-plan.md`
- 바로 적용하지 않고 고도화 및 추가 업데이트 예정.
```

---

**라벨**: idea  
**상태**: Backlog (또는 팀의 아이디어용 상태)
