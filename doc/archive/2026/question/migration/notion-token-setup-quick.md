# Notion API 토큰 빠른 설정 가이드

## 1단계: Notion Integration 생성 (약 2분)

1. **Notion Integrations 페이지 접속**
   - https://www.notion.so/my-integrations

2. **"+ New integration"** 클릭

3. **정보 입력**
   - **Name**: `독서 리스트 마이그레이션` (또는 원하는 이름)
   - **Logo**: 선택사항
   - **Associated workspace**: 현재 워크스페이스 선택

4. **Capabilities 설정**
   - ✅ **Read content** 체크
   - ✅ **Update content** 체크
   - ✅ **Insert content** 체크

5. **Submit** 클릭

6. **Internal Integration Token 복사**
   - `secret_`로 시작하는 긴 문자열
   - ⚠️ 이 토큰은 나중에 다시 볼 수 없으므로 안전하게 보관하세요

## 2단계: 데이터베이스에 Integration 연결

1. **"📖 독서 리스트"** 데이터베이스 페이지 열기
2. 우측 상단 **"..."** 메뉴 클릭
3. **"Add connections"** 선택
4. 방금 생성한 Integration 선택
5. **"Confirm"** 클릭

## 3단계: 환경 변수 설정

프로젝트 루트의 `.env.local` 파일에 다음 줄 추가:

```env
NOTION_API_TOKEN=secret_여기에_복사한_토큰_붙여넣기
```

**예시:**
```env
NOTION_API_TOKEN=secret_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

## 4단계: 스크립트 실행

```bash
node scripts/migrate-notion-books.js
```

## 완료!

이제 스크립트가 자동으로 각 책 페이지에 기록정보 섹션을 추가합니다.
