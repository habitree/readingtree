# 공유 버튼 이미지 잘림 및 기능 오류 해결

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**문제:** 공유 버튼 클릭 시 이미지가 잘려보이고 기능적 오류 발생

---

## 🔍 문제 분석

### 발견된 문제

**증상:**
- 공유 다이얼로그에서 카드뉴스 미리보기 이미지가 잘려서 보임
- 카드뉴스 생성 후 공유 버튼이 제대로 작동하지 않음
- 비공개 기록도 카드뉴스 생성이 안 됨

**원인 분석:**

#### 1. 이미지 잘림 문제
- `card-news-generator.tsx`에서 `object-cover` 사용
- `object-cover`는 이미지를 컨테이너에 맞추기 위해 잘라냄
- 카드뉴스는 1080x1080 정사각형이므로 전체가 보여야 함

#### 2. prop 이름 및 기능 오류
- `onClose` prop 이름이 잘못됨 (다이얼로그 닫기 함수처럼 보임)
- 실제로는 카드뉴스 생성 완료 시 호출되는 콜백이어야 함
- 템플릿 변경 시 카드뉴스 URL이 업데이트되지 않음

#### 3. API 권한 문제
- 카드뉴스 생성 API가 공개 기록만 조회 가능
- 본인이 작성한 비공개 기록도 카드뉴스를 생성할 수 있어야 함

---

## ✅ 해결 방법

### 1. 이미지 미리보기 수정

**파일**: `components/share/card-news-generator.tsx`

**변경 사항**:
- `object-cover`를 `object-contain`으로 변경
- 이미지가 잘리지 않고 전체가 보이도록 수정

**수정 내용**:
```typescript
<div className="aspect-square relative bg-muted rounded-lg overflow-hidden flex items-center justify-center">
  <img
    src={previewUrl}
    alt="카드뉴스 미리보기"
    className="w-full h-full object-contain"
  />
</div>
```

### 2. prop 이름 및 기능 수정

**파일**: `components/share/card-news-generator.tsx`

**변경 사항**:
- `onClose` prop을 `onCardNewsGenerated`로 변경
- 카드뉴스 다운로드 완료 시 콜백 호출
- 템플릿 변경 시에도 콜백 호출하여 URL 업데이트

**수정 내용**:
```typescript
interface CardNewsGeneratorProps {
  note: NoteWithBook;
  onCardNewsGenerated?: (templateId: string) => void;
}

export function CardNewsGenerator({ note, onCardNewsGenerated }: CardNewsGeneratorProps) {
  // ...
  
  const handleDownload = async () => {
    // ... 다운로드 로직 ...
    
    // 카드뉴스 생성 완료 콜백 호출
    if (onCardNewsGenerated) {
      onCardNewsGenerated(selectedTemplate.id);
    }
  };
  
  // 템플릿 변경 시
  <Select
    onValueChange={(value) => {
      const template = CARD_NEWS_TEMPLATES.find((t) => t.id === value);
      if (template) {
        setSelectedTemplate(template);
        // 템플릿 변경 시 카드뉴스 URL 업데이트
        if (onCardNewsGenerated) {
          onCardNewsGenerated(template.id);
        }
      }
    }}
  >
}
```

### 3. ShareDialog 수정

**파일**: `components/share/share-dialog.tsx`

**변경 사항**:
- `onClose` prop을 `onCardNewsGenerated`로 변경
- 카드뉴스 URL 업데이트 로직 개선
- 다이얼로그 스크롤 가능하도록 수정

**수정 내용**:
```typescript
export function ShareDialog({ note }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [cardNewsUrl, setCardNewsUrl] = useState<string | undefined>();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const defaultCardNewsUrl = `${baseUrl}/api/share/card?noteId=${note.id}&templateId=minimal`;

  const handleCardNewsGenerated = (templateId: string = "minimal") => {
    const newCardNewsUrl = `${baseUrl}/api/share/card?noteId=${note.id}&templateId=${templateId}`;
    setCardNewsUrl(newCardNewsUrl);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ... */}
        <CardNewsGenerator
          note={note}
          onCardNewsGenerated={handleCardNewsGenerated}
        />
      </DialogContent>
    </Dialog>
  );
}
```

### 4. API 권한 수정

**파일**: `app/api/share/card/route.tsx`

**변경 사항**:
- 공개 기록뿐만 아니라 본인 기록도 카드뉴스 생성 가능하도록 수정

**수정 내용**:
```typescript
// 기록 조회 (공개 기록 또는 본인 기록 조회 가능)
const supabase = await createServerSupabaseClient();
const {
  data: { user },
} = await supabase.auth.getUser();

let query = supabase
  .from("notes")
  .select(/* ... */)
  .eq("id", noteId);

// 로그인한 사용자인 경우 본인 기록도 조회 가능
if (user) {
  query = query.or(`is_public.eq.true,user_id.eq.${user.id}`);
} else {
  // 비로그인 사용자는 공개 기록만 조회 가능
  query = query.eq("is_public", true);
}

const { data: note, error } = await query.single();
```

---

## 🧪 테스트 방법

### 1. 이미지 미리보기 테스트

1. 기록 상세 페이지에서 "공유" 버튼 클릭
2. **확인**: 카드뉴스 미리보기 이미지가 전체가 보이는지 확인
3. **확인**: 이미지가 잘리지 않고 정사각형으로 표시되는지 확인

### 2. 템플릿 변경 테스트

1. 공유 다이얼로그에서 템플릿 선택 드롭다운 클릭
2. 다른 템플릿 선택
3. **확인**: 미리보기 이미지가 변경되는지 확인
4. **확인**: 공유 버튼이 새로운 템플릿의 이미지를 사용하는지 확인

### 3. 카드뉴스 다운로드 테스트

1. 공유 다이얼로그에서 "다운로드" 버튼 클릭
2. **확인**: 카드뉴스 이미지가 다운로드되는지 확인
3. **확인**: 다운로드된 이미지가 정상적으로 표시되는지 확인

### 4. 비공개 기록 공유 테스트

1. 비공개 기록 작성
2. 기록 상세 페이지에서 "공유" 버튼 클릭
3. **확인**: 카드뉴스 생성이 정상적으로 작동하는지 확인
4. **확인**: 공유 버튼들이 정상적으로 작동하는지 확인

### 5. 공유 기능 테스트

1. 공유 다이얼로그에서 각 공유 버튼 클릭
2. **확인**: 인스타그램 공유 버튼이 이미지를 다운로드하는지 확인
3. **확인**: 링크 복사 버튼이 정상적으로 작동하는지 확인
4. **확인**: 카카오톡 공유 버튼이 정상적으로 작동하는지 확인 (SDK 로드 시)

---

## 📋 수정된 파일 목록

1. `components/share/card-news-generator.tsx` - 이미지 미리보기 및 prop 수정
2. `components/share/share-dialog.tsx` - prop 이름 및 다이얼로그 스크롤 수정
3. `app/api/share/card/route.tsx` - API 권한 수정

---

## 🔗 관련 문서

- [공유 기능 계획](../tasks/front/07-task-share-plan.md)

---

## 💡 추가 개선 사항

### 향후 개선 가능한 부분

1. **이미지 로딩 상태**: 미리보기 이미지 로딩 중 스켈레톤 UI 표시
2. **에러 처리**: 이미지 생성 실패 시 더 명확한 에러 메시지
3. **성능 최적화**: 이미지 캐싱 및 최적화
4. **반응형 디자인**: 모바일에서도 잘 보이도록 개선

---

**문서 끝**

