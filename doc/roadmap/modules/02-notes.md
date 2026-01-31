# Notes 모듈 고도화 계획

> **모듈**: notes
> **현재 규모**: ~800 LOC
> **성숙도**: ⭐⭐⭐⭐ (4/5)
> **우선순위**: 🔴 높음

---

## 1. 현황 분석

### 1.1 핵심 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| 4가지 기록 타입 | 메모, 인용, 요약, 감상 | ✅ 완료 |
| OCR 기능 | 이미지에서 텍스트 추출 | ✅ 완료 |
| 책 연결 | 특정 책에 기록 연결 | ✅ 완료 |
| 페이지 번호 | 기록 위치 추적 | ✅ 완료 |
| 그룹 공유 | 독서모임에 기록 공유 | ✅ 완료 |

### 1.2 기술 구조

```
app/actions/notes.ts          # Server Actions
├── createNote()
├── updateNote()
├── deleteNote()
├── getNotes()
└── shareNoteToGroup()

components/notes/
├── NoteCard.tsx              # 기록 카드
├── NoteEditor.tsx            # 기록 편집기
├── NoteTypeSelector.tsx      # 타입 선택
├── OCRButton.tsx             # OCR 버튼
└── NoteFilters.tsx           # 필터링

hooks/
└── useNotes.ts
```

### 1.3 데이터 모델

```sql
notes (
  id, user_id, book_id, type, content,
  page_number, is_public, created_at, updated_at
)

shared_notes (
  id, note_id, group_id, shared_by, shared_at
)
```

---

## 2. 관점별 분석

### 2.1 핵심 기능 강화

| 항목 | 현재 | 목표 | 우선순위 | 복잡도 |
|------|------|------|---------|--------|
| **실시간 자동저장** | 수동 저장 | 디바운스 자동저장 | 🔴 높음 | ⭐ |
| **기록 복구** | 없음 | 실수 삭제 복구 | 🔴 높음 | ⭐⭐ |
| **리치 텍스트 에디터** | 기본 textarea | 마크다운/WYSIWYG | 🟡 중간 | ⭐⭐ |
| **이미지 첨부** | OCR만 | 이미지 직접 첨부 | 🟡 중간 | ⭐⭐ |
| **태그 시스템** | 없음 | 커스텀 태그 | 🟡 중간 | ⭐⭐ |

#### 상세: 실시간 자동저장

```typescript
// hooks/useAutoSave.ts
function useAutoSave(noteId: string, content: string) {
  const debouncedContent = useDebouncedValue(content, 1000);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!debouncedContent) return;

    const save = async () => {
      setIsSaving(true);
      try {
        await updateNote(noteId, { content: debouncedContent });
        setLastSaved(new Date());
      } catch (error) {
        toast.error('자동저장 실패');
      } finally {
        setIsSaving(false);
      }
    };

    save();
  }, [debouncedContent, noteId]);

  return { isSaving, lastSaved };
}

// UI 표시
<span className="text-xs text-muted-foreground">
  {isSaving ? '저장 중...' : lastSaved ? `마지막 저장: ${formatTime(lastSaved)}` : ''}
</span>
```

### 2.2 확장성/창의성

| 아이디어 | 설명 | 가치 | 실현성 | 분류 |
|----------|------|------|--------|------|
| **AI 요약 생성** | 긴 기록 자동 요약 | 높음 | 높음 | 🚀 즉시 |
| **AI 질문 생성** | 기록 기반 복습 질문 | 높음 | 높음 | 🚀 즉시 |
| **감정 분석** | 기록의 감정 태깅 | 중간 | 높음 | 💡 아이디어 |
| **연결 노트** | 노트 간 링크 | 높음 | 중간 | 💡 아이디어 |
| **음성 기록** | 음성→텍스트 변환 | 중간 | 중간 | 🔮 장기 |
| **하이라이트 공유** | SNS용 이미지 생성 | 중간 | 높음 | 🚀 즉시 |

#### 상세: AI 요약 생성

```typescript
// app/actions/ai-notes.ts
export async function generateNoteSummary(noteId: string) {
  const note = await getNote(noteId);

  const response = await ai.chat({
    model: 'claude-3-haiku',
    messages: [{
      role: 'user',
      content: `다음 독서 기록을 3문장 이내로 요약해주세요:\n\n${note.content}`
    }]
  });

  return response.content;
}

// UI 컴포넌트
function NoteSummaryButton({ noteId }: { noteId: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    const result = await generateNoteSummary(noteId);
    setSummary(result);
    setIsLoading(false);
  };

  return (
    <>
      <Button onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? <Spinner /> : <Sparkles />}
        AI 요약
      </Button>
      {summary && <Card className="p-4 bg-muted">{summary}</Card>}
    </>
  );
}
```

### 2.3 기술 품질

| 항목 | 현재 상태 | 목표 | 액션 |
|------|----------|------|------|
| **테스트 커버리지** | 0% | 80% | 유닛/통합 테스트 |
| **에러 복구** | 없음 | 자동 복구 | Error Boundary + 재시도 |
| **오프라인 지원** | 없음 | 로컬 저장 | IndexedDB |
| **충돌 해결** | 없음 | 마지막 수정 우선 | 버전 관리 |
| **성능** | 양호 | 가상화 적용 | react-window |

#### 에러 복구 전략

```typescript
// 로컬 스토리지 백업
const BACKUP_KEY = 'note_draft_backup';

function useNoteBackup(noteId: string, content: string) {
  // 작성 중인 내용 주기적 백업
  useEffect(() => {
    const backup = { noteId, content, timestamp: Date.now() };
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
  }, [noteId, content]);

  // 복구 함수
  const recover = useCallback(() => {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup) {
      const { content } = JSON.parse(backup);
      return content;
    }
    return null;
  }, []);

  return { recover };
}
```

### 2.4 통합/연동

| 연동 대상 | 유형 | 데이터 흐름 | 우선순위 |
|----------|------|------------|---------|
| **books 모듈** | 내부 | book_id 연결 | ✅ 완료 |
| **groups 모듈** | 내부 | 기록 공유 | ✅ 완료 |
| **chat 모듈** | 내부 | AI 분석 연동 | 🟡 중간 |
| **Notion** | 외부 | Export 기능 | 🟡 중간 |
| **Obsidian** | 외부 | Markdown 동기화 | 🟢 낮음 |

#### Notion 연동 설계

```typescript
// lib/notion-export.ts
interface NotionExporter {
  exportNote(note: Note): Promise<NotionPage>;
  exportBook(book: Book, notes: Note[]): Promise<NotionDatabase>;
  syncChanges(lastSync: Date): Promise<SyncResult>;
}

class NotionExportService implements NotionExporter {
  private client: NotionClient;

  async exportNote(note: Note): Promise<NotionPage> {
    return this.client.pages.create({
      parent: { database_id: this.databaseId },
      properties: {
        title: { title: [{ text: { content: note.book.title } }] },
        type: { select: { name: note.type } },
        page: { number: note.page_number },
      },
      children: this.convertToBlocks(note.content),
    });
  }
}
```

---

## 3. 고도화 항목 상세

### 3.1 단기 개선 (Quick Wins)

#### QW-01: 자동저장 상태 표시

```typescript
// components/notes/AutoSaveIndicator.tsx
export function AutoSaveIndicator({ status }: { status: SaveStatus }) {
  const icons = {
    idle: null,
    saving: <Cloud className="animate-pulse" />,
    saved: <CloudCheck className="text-green-500" />,
    error: <CloudOff className="text-red-500" />,
  };

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {icons[status]}
      {status === 'saving' && '저장 중...'}
      {status === 'saved' && '저장됨'}
      {status === 'error' && '저장 실패'}
    </div>
  );
}
```

#### QW-02: 기록 타입별 템플릿

```typescript
const noteTemplates = {
  quote: '"{인용구}"\n\n- {출처/페이지}',
  summary: '## 핵심 내용\n\n## 배운 점\n\n## 적용할 점',
  thought: '이 부분을 읽고 느낀 점:\n\n',
  memo: '',
};
```

### 3.2 중기 개선 (Planned)

#### PL-01: 리치 텍스트 에디터

**기술 옵션:**
1. **Tiptap** - 추천 (확장성, 협업 기능)
2. **Lexical** - Facebook 오픈소스
3. **Plate** - Radix 호환

**구현 계획:**
```typescript
// components/notes/RichTextEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';

export function RichTextEditor({ content, onChange }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      // 커스텀 확장
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border rounded-lg">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="p-4" />
    </div>
  );
}
```

#### PL-02: 태그 시스템

```sql
-- 태그 테이블
CREATE TABLE note_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  color TEXT,
  UNIQUE(user_id, name)
);

-- 기록-태그 연결
CREATE TABLE note_tag_relations (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES note_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);
```

### 3.3 장기 비전 (Vision)

#### VS-01: 지식 그래프

```
┌─────────────────────────────────────────────────────────────┐
│                    노트 연결 그래프                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│      [리더십 노트] ←──── 참조 ────→ [경영 노트]              │
│           │                              │                  │
│           │ 관련                         │ 발전             │
│           ▼                              ▼                  │
│      [동기부여 노트] ←── 반박 ──→ [성과관리 노트]           │
│           │                                                 │
│           └──────── 확장 ────────→ [팀빌딩 노트]           │
│                                                             │
│  링크 타입: 참조 | 관련 | 반박 | 확장 | 발전                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 구현 가이드

### 4.1 기술 요구사항

| 기능 | 필요 패키지 | 비고 |
|------|------------|------|
| 리치 텍스트 | @tiptap/react, @tiptap/starter-kit | - |
| 태그 입력 | react-tag-input-component | 또는 커스텀 |
| 오프라인 | idb (IndexedDB wrapper) | - |
| AI 요약 | anthropic (이미 설치) | Claude API |

### 4.2 마이그레이션 계획

```sql
-- migration: 기록 확장 스키마
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- 소프트 삭제 뷰
CREATE OR REPLACE VIEW active_notes AS
SELECT * FROM notes WHERE deleted_at IS NULL;
```

### 4.3 테스트 전략

```typescript
// 테스트 예시
describe('NoteEditor', () => {
  it('should auto-save after 1 second of inactivity', async () => {
    const onSave = vi.fn();
    render(<NoteEditor onSave={onSave} />);

    await userEvent.type(screen.getByRole('textbox'), 'Test content');

    // 1초 대기
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Test content' })
      );
    }, { timeout: 2000 });
  });

  it('should recover draft from localStorage on error', async () => {
    localStorage.setItem('note_draft_backup', JSON.stringify({
      content: 'Recovered content',
      timestamp: Date.now()
    }));

    render(<NoteEditor hasError />);

    await userEvent.click(screen.getByText('복구하기'));
    expect(screen.getByRole('textbox')).toHaveValue('Recovered content');
  });
});
```

---

## 5. 성공 지표 (KPIs)

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| **기록 작성 빈도** | - | 주 5회 | 사용자당 평균 |
| **자동저장 성공률** | - | 99% | 저장 시도 → 성공 |
| **AI 요약 사용률** | - | 30% | 요약 생성 / 전체 기록 |
| **평균 기록 길이** | - | +50% | 문자 수 기준 |
| **테스트 커버리지** | 0% | 80% | Vitest coverage |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-30 | 최초 작성 |

---

*관련 문서: [메인 계획서](../MODULE_ENHANCEMENT_PLAN.md) | [Books 모듈](./01-books.md) | [Groups 모듈](./04-groups.md)*
