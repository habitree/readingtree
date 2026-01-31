# Chat 모듈 고도화 계획

> **모듈**: chat
> **현재 규모**: ~600 LOC
> **성숙도**: ⭐⭐⭐⭐ (4/5)
> **우선순위**: 🔴 높음

---

## 1. 현황 분석

### 1.1 핵심 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| AI 대화 | 독서 관련 대화 | ✅ 완료 |
| 세션 관리 | 대화 저장/불러오기 | ✅ 완료 |
| 스트리밍 | 실시간 응답 출력 | ✅ 완료 |
| 컨텍스트 | 책/기록 기반 대화 | ✅ 완료 |
| Provider 전환 | Claude/OpenAI 선택 | ✅ 완료 |

### 1.2 기술 구조

```
app/actions/chat/
├── index.ts                  # 채팅 actions
├── sessions.ts               # 세션 관리
└── context.ts                # 컨텍스트 빌더

lib/ai/
├── provider-factory.ts       # AI Provider 팩토리
├── claude-provider.ts
├── openai-provider.ts
└── types.ts

components/chat/
├── ChatInterface.tsx
├── MessageList.tsx
├── MessageInput.tsx
├── ContextSelector.tsx
└── SessionList.tsx
```

### 1.3 데이터 모델

```sql
chat_sessions (
  id, user_id, title, context_type,
  context_id, created_at, updated_at
)

chat_messages (
  id, session_id, role, content,
  created_at
)
```

---

## 2. 관점별 분석

### 2.1 핵심 기능 강화

| 항목 | 현재 | 목표 | 우선순위 | 복잡도 |
|------|------|------|---------|--------|
| **컨텍스트 강화** | 단일 책/기록 | 다중 컨텍스트 | 🔴 높음 | ⭐⭐ |
| **스트리밍 최적화** | 기본 | 청크 최적화 | 🟡 중간 | ⭐⭐ |
| **대화 검색** | 없음 | 전체 검색 | 🟡 중간 | ⭐⭐ |
| **대화 내보내기** | 없음 | Markdown 저장 | 🟢 낮음 | ⭐ |
| **프롬프트 템플릿** | 없음 | 자주 쓰는 질문 | 🟢 낮음 | ⭐ |

#### 상세: 다중 컨텍스트 지원

```typescript
interface ChatContext {
  type: 'book' | 'note' | 'bookshelf' | 'global';
  items: {
    books?: Book[];
    notes?: Note[];
    bookshelf?: Bookshelf;
  };
}

// 컨텍스트 빌더
function buildContextPrompt(context: ChatContext): string {
  let prompt = '다음은 사용자의 독서 정보입니다:\n\n';

  if (context.items.books?.length) {
    prompt += '## 관련 책\n';
    context.items.books.forEach(book => {
      prompt += `- ${book.title} (${book.author})\n`;
      prompt += `  진행률: ${book.progress}%\n`;
    });
  }

  if (context.items.notes?.length) {
    prompt += '\n## 관련 기록\n';
    context.items.notes.forEach(note => {
      prompt += `- [${note.type}] ${note.content.slice(0, 200)}...\n`;
    });
  }

  return prompt;
}
```

### 2.2 확장성/창의성

| 아이디어 | 설명 | 가치 | 실현성 | 분류 |
|----------|------|------|--------|------|
| **음성 입력** | 말로 질문하기 | 높음 | 높음 | 🚀 즉시 |
| **음성 출력** | AI 응답 읽어주기 | 중간 | 높음 | 💡 아이디어 |
| **기록 자동 생성** | 대화→기록 저장 | 높음 | 높음 | 🚀 즉시 |
| **독서 퀴즈** | AI가 복습 질문 | 높음 | 높음 | 🚀 즉시 |
| **도서 추천** | 대화 기반 추천 | 높음 | 중간 | 💡 아이디어 |
| **멀티모달** | 이미지 분석 | 중간 | 중간 | 🔮 장기 |

#### 상세: 기록 자동 생성

```typescript
// 대화에서 인사이트 추출하여 기록으로 저장
function extractInsightsFromChat(messages: ChatMessage[]): NoteCandidate[] {
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  const candidates: NoteCandidate[] = [];

  for (const message of assistantMessages) {
    // 인용구 추출
    const quotes = message.content.match(/"[^"]+"/g);
    if (quotes) {
      candidates.push({
        type: 'quote',
        content: quotes.join('\n'),
        source: 'AI 대화에서 추출',
      });
    }

    // 핵심 요약 추출
    if (message.content.includes('핵심') || message.content.includes('요약')) {
      candidates.push({
        type: 'summary',
        content: message.content,
        source: 'AI 대화에서 추출',
      });
    }
  }

  return candidates;
}

// UI
function SaveToNoteButton({ messages, bookId }: Props) {
  const [candidates, setCandidates] = useState<NoteCandidate[]>([]);

  const handleExtract = () => {
    const extracted = extractInsightsFromChat(messages);
    setCandidates(extracted);
  };

  return (
    <>
      <Button onClick={handleExtract}>
        <FileText /> 기록으로 저장
      </Button>
      <Dialog open={candidates.length > 0}>
        <DialogContent>
          <h3>저장할 내용 선택</h3>
          {candidates.map((c, i) => (
            <NotePreview key={i} candidate={c} bookId={bookId} />
          ))}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

#### 상세: 독서 퀴즈

```typescript
// 독서 내용 복습 퀴즈 생성
async function generateReadingQuiz(bookId: string): Promise<Quiz> {
  const book = await getBook(bookId);
  const notes = await getNotesByBook(bookId);

  const response = await ai.chat({
    messages: [{
      role: 'system',
      content: `당신은 독서 복습을 도와주는 튜터입니다.
사용자가 읽은 책과 기록을 바탕으로 복습 질문을 생성해주세요.`
    }, {
      role: 'user',
      content: `책: ${book.title}
기록:
${notes.map(n => n.content).join('\n')}

이 내용을 바탕으로 3개의 복습 질문을 생성해주세요.
각 질문은 객관식(4지선다)으로 만들어주세요.`
    }]
  });

  return parseQuizResponse(response.content);
}

interface Quiz {
  bookId: string;
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}
```

### 2.3 기술 품질

| 항목 | 현재 상태 | 목표 | 액션 |
|------|----------|------|------|
| **테스트 커버리지** | 0% | 70% | 테스트 작성 |
| **에러 처리** | 기본 | 재시도 로직 | Error Boundary |
| **토큰 관리** | 없음 | 토큰 카운트 | tiktoken |
| **응답 캐싱** | 없음 | 유사 질문 캐싱 | Redis/메모리 |

#### 토큰 관리

```typescript
import { encoding_for_model } from 'tiktoken';

function countTokens(text: string, model: string = 'gpt-4'): number {
  const enc = encoding_for_model(model);
  return enc.encode(text).length;
}

function truncateContext(context: string, maxTokens: number): string {
  const tokens = countTokens(context);
  if (tokens <= maxTokens) return context;

  // 뒤에서부터 잘라내기
  const ratio = maxTokens / tokens;
  return context.slice(0, Math.floor(context.length * ratio));
}

// 대화 히스토리 컨텍스트 윈도우 관리
function manageConversationHistory(
  messages: ChatMessage[],
  maxTokens: number = 4000
): ChatMessage[] {
  let totalTokens = 0;
  const result: ChatMessage[] = [];

  // 최신 메시지부터 역순으로 추가
  for (let i = messages.length - 1; i >= 0; i--) {
    const msgTokens = countTokens(messages[i].content);
    if (totalTokens + msgTokens > maxTokens) break;
    result.unshift(messages[i]);
    totalTokens += msgTokens;
  }

  return result;
}
```

### 2.4 통합/연동

| 연동 대상 | 유형 | 데이터 흐름 | 우선순위 |
|----------|------|------------|---------|
| **books 모듈** | 내부 | 책 컨텍스트 | ✅ 완료 |
| **notes 모듈** | 내부 | 기록 컨텍스트 | ✅ 완료 |
| **persona 모듈** | 내부 | 대화 스타일 | 🟡 중간 |
| **search 모듈** | 내부 | 시맨틱 검색 연동 | 🟢 낮음 |

---

## 3. 고도화 항목 상세

### 3.1 단기 개선 (Quick Wins)

#### QW-01: 프롬프트 템플릿

```typescript
const promptTemplates = [
  {
    id: 'summary',
    label: '이 책 요약해줘',
    prompt: '이 책의 핵심 내용을 3문장으로 요약해주세요.',
    icon: <FileText />,
  },
  {
    id: 'similar',
    label: '비슷한 책 추천',
    prompt: '이 책과 비슷한 주제나 스타일의 책을 3권 추천해주세요.',
    icon: <BookOpen />,
  },
  {
    id: 'quiz',
    label: '복습 질문',
    prompt: '이 책의 핵심 내용을 확인할 수 있는 질문 3개를 만들어주세요.',
    icon: <HelpCircle />,
  },
  {
    id: 'apply',
    label: '실생활 적용',
    prompt: '이 책에서 배운 내용을 실생활에 어떻게 적용할 수 있을까요?',
    icon: <Lightbulb />,
  },
];

function PromptTemplateBar({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {promptTemplates.map(template => (
        <Button
          key={template.id}
          variant="outline"
          size="sm"
          onClick={() => onSelect(template.prompt)}
        >
          {template.icon}
          {template.label}
        </Button>
      ))}
    </div>
  );
}
```

#### QW-02: 대화 내보내기

```typescript
function exportChatToMarkdown(session: ChatSession, messages: ChatMessage[]): string {
  let md = `# ${session.title}\n\n`;
  md += `📅 ${format(session.created_at, 'yyyy-MM-dd HH:mm')}\n\n`;
  md += `---\n\n`;

  for (const msg of messages) {
    const role = msg.role === 'user' ? '👤 사용자' : '🤖 AI';
    md += `### ${role}\n\n`;
    md += `${msg.content}\n\n`;
  }

  return md;
}

function ExportButton({ session, messages }: Props) {
  const handleExport = () => {
    const markdown = exportChatToMarkdown(session, messages);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${session.id}.md`;
    a.click();
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download /> 내보내기
    </Button>
  );
}
```

### 3.2 중기 개선 (Planned)

#### PL-01: 음성 입력

```typescript
// hooks/useSpeechRecognition.ts
function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      setTranscript(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, []);

  const startListening = () => {
    recognitionRef.current?.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return { isListening, transcript, startListening, stopListening };
}
```

#### PL-02: 다중 컨텍스트 선택 UI

```typescript
function MultiContextSelector({ onSelect }: Props) {
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Settings2 /> 컨텍스트 설정
          {(selectedBooks.length + selectedNotes.length) > 0 && (
            <Badge className="ml-2">
              {selectedBooks.length + selectedNotes.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>대화 컨텍스트 설정</SheetTitle>
          <SheetDescription>
            AI가 참고할 책과 기록을 선택하세요
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="books">
          <TabsList>
            <TabsTrigger value="books">책</TabsTrigger>
            <TabsTrigger value="notes">기록</TabsTrigger>
          </TabsList>

          <TabsContent value="books">
            <BookSelector
              selected={selectedBooks}
              onChange={setSelectedBooks}
            />
          </TabsContent>

          <TabsContent value="notes">
            <NoteSelector
              selected={selectedNotes}
              onChange={setSelectedNotes}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
```

### 3.3 장기 비전 (Vision)

#### VS-01: 멀티모달 대화

```
┌─────────────────────────────────────────────────────────────┐
│                    멀티모달 AI 채팅                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  지원 입력:                                                  │
│  • 📝 텍스트 질문                                            │
│  • 🎤 음성 입력 (Speech-to-Text)                            │
│  • 📷 이미지 (책 페이지, 인용구 사진)                         │
│  • 📄 PDF 페이지                                             │
│                                                             │
│  지원 출력:                                                  │
│  • 📝 텍스트 응답                                            │
│  • 🔊 음성 출력 (Text-to-Speech)                            │
│  • 📊 차트/그래프 (분석 결과)                                │
│  • 🔗 관련 기록 링크                                         │
│                                                             │
│  활용 예시:                                                  │
│  1. 책 페이지 사진 → "이 부분 설명해줘"                       │
│  2. 음성으로 질문 → 음성으로 응답                            │
│  3. 기록 기반 분석 → 시각화 결과                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 구현 가이드

### 4.1 기술 요구사항

| 기능 | 필요 기술 | 비고 |
|------|----------|------|
| 음성 입력 | Web Speech API | 브라우저 내장 |
| 음성 출력 | Web Speech API (TTS) | 브라우저 내장 |
| 토큰 계산 | tiktoken | npm 패키지 |
| 이미지 분석 | Claude Vision | API 지원 |

### 4.2 마이그레이션 계획

```sql
-- 대화 메타데이터 확장
ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS context_items JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS token_count INTEGER DEFAULT 0;

-- 대화 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_messages_content
ON chat_messages USING gin(to_tsvector('korean', content));
```

---

## 5. 성공 지표 (KPIs)

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| **세션당 메시지** | - | 8+ | 평균 대화 길이 |
| **음성 입력 사용률** | - | 20% | 음성 입력 비율 |
| **기록 저장 전환** | - | 15% | 대화→기록 저장 비율 |
| **재방문 세션** | - | 40% | 기존 세션 재개 비율 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-30 | 최초 작성 |

---

*관련 문서: [메인 계획서](../MODULE_ENHANCEMENT_PLAN.md) | [Persona 모듈](./07-persona.md) | [Notes 모듈](./02-notes.md)*
