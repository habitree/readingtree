# Notion API 토큰 형식 수정 가이드

## 문제 발견

이미지에서 확인한 내용:
- **Notion Integration에서 제공한 토큰**: `ntn_678988161731Mc240Y9D5fMDi`
- **현재 .env.local 설정**: `NOTION_API_TOKEN=secret_ntn_67898816173...`

## 문제점

1. **잘못된 접두사**: `.env.local`에 `secret_` 접두사가 붙어있지만, Notion Integration에서 제공한 토큰은 `ntn_`으로 시작합니다.
2. **토큰이 잘림**: 실제 토큰이 완전히 복사되지 않았을 수 있습니다.

## 해결 방법

### 올바른 토큰 형식

Notion Integration에서 제공한 토큰을 **그대로** 사용해야 합니다:

```env
NOTION_API_TOKEN=ntn_678988161731Mc240Y9D5fMDi
```

**주의사항:**
- ❌ `secret_` 접두사를 추가하지 마세요
- ❌ 토큰을 잘라서 사용하지 마세요
- ✅ Notion Integration 페이지에서 제공한 토큰을 **전체** 복사해서 사용하세요

### .env.local 파일 수정

1. `.env.local` 파일 열기
2. `NOTION_API_TOKEN` 줄을 찾아서 수정:

**변경 전:**
```env
NOTION_API_TOKEN=secret_ntn_67898816173...
```

**변경 후:**
```env
NOTION_API_TOKEN=ntn_678988161731Mc240Y9D5fMDi
```

(실제 Notion Integration 페이지에서 보이는 전체 토큰을 복사해서 붙여넣으세요)

### 토큰 확인 방법

Notion Integration 페이지에서:
1. "프라이빗 API 통합 시크릿" 필드의 **전체 토큰** 복사
2. `.env.local` 파일에 붙여넣기
3. `secret_` 접두사 없이 사용

## 추가 확인 사항

### Integration이 데이터베이스에 연결되었는지 확인

1. "📖 독서 리스트" 데이터베이스 페이지 열기
2. 우측 상단 "..." 메뉴 클릭
3. "Connections" 또는 "연결" 확인
4. "readtree" Integration이 연결되어 있는지 확인

연결되어 있지 않다면:
1. "Add connections" 또는 "연결 추가" 클릭
2. "readtree" Integration 선택
3. "Confirm" 또는 "확인" 클릭

## 수정 후 테스트

토큰을 수정한 후 스크립트를 다시 실행:

```bash
node scripts/migrate-notion-books.js
```

성공하면 다음과 같은 메시지가 표시됩니다:
```
📖 처리 중: 죽음의 수용소에서
   블록 XX개 발견
   이미지-텍스트 쌍 X개 추출
   기록정보 섹션 블록 XX개 생성
   ✅ 성공적으로 추가되었습니다!
```
