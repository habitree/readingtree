# 노션 API를 사용한 자동 마이그레이션 가이드

## 개요

Notion 공식 API를 사용하여 독서 리스트의 책 페이지에 기록정보 섹션을 자동으로 추가하는 스크립트입니다.

## 사전 준비

### 1. Notion Integration 생성

1. [Notion Integrations 페이지](https://www.notion.so/my-integrations) 접속
2. **"+ New integration"** 클릭
3. 다음 정보 입력:
   - **Name**: `독서 리스트 마이그레이션` (또는 원하는 이름)
   - **Logo**: 선택사항
   - **Associated workspace**: 현재 워크스페이스 선택
4. **Capabilities** 설정:
   - ✅ **Read content** 체크
   - ✅ **Update content** 체크
   - ✅ **Insert content** 체크
5. **Submit** 클릭
6. **Internal Integration Token** 복사 (나중에 다시 볼 수 없으므로 안전하게 보관)

### 2. Integration에 데이터베이스 접근 권한 부여

1. **"📖 독서 리스트"** 데이터베이스 페이지 열기
2. 우측 상단 **"..."** 메뉴 클릭
3. **"Add connections"** 선택
4. 방금 생성한 Integration 선택
5. **"Confirm"** 클릭

### 3. 환경 변수 설정

#### 방법 1: .env 파일 사용 (권장)

프로젝트 루트에 `.env.local` 파일을 생성하거나 기존 파일에 추가:

```env
NOTION_API_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 방법 2: 환경 변수 직접 설정

**Windows (PowerShell):**
```powershell
$env:NOTION_API_TOKEN="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Windows (CMD):**
```cmd
set NOTION_API_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Mac/Linux:**
```bash
export NOTION_API_TOKEN="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## 스크립트 실행

### 1. Python 및 라이브러리 설치

Python 3.7 이상이 필요합니다.

```bash
# requests 라이브러리 설치
pip install requests
```

### 2. 스크립트 실행

```bash
# Windows
python scripts/migrate-notion-books.py

# Mac/Linux
python3 scripts/migrate-notion-books.py
```

## 스크립트 동작 방식

1. **페이지 블록 가져오기**: 각 책 페이지의 모든 블록(이미지, 텍스트 등)을 가져옵니다.
2. **이미지-텍스트 쌍 추출**: 이미지 블록과 그 다음에 오는 텍스트 블록을 쌍으로 묶습니다.
3. **기록정보 섹션 생성**: 다음 형식으로 블록을 생성합니다:
   ```
   ## 기록정보
   
   ### 필사정보
   [이미지]
   
   ### 내생각정보
   [텍스트]
   
   ---
   ```
4. **페이지에 추가**: 생성한 블록들을 페이지 끝에 추가합니다.

## 처리되는 책 목록

- 죽음의 수용소에서
- 어린왕자
- 넥서스
- 사랑의기술
- 기회의 심리학
- 지적대화를 위한 넓고 얕은 지식 1

## 주의사항

1. **책읽는 이유**: 기존 Properties의 "책읽는 이유" 필드는 그대로 유지됩니다.
2. **중복 실행**: 스크립트를 여러 번 실행하면 기록정보 섹션이 중복으로 추가될 수 있습니다.
3. **이미지 URL**: 외부 이미지 URL이 만료될 수 있으므로, 가능하면 Notion에 직접 업로드된 이미지를 사용하는 것을 권장합니다.

## 문제 해결

### 오류: "NOTION_API_TOKEN 환경 변수가 설정되지 않았습니다"
- `.env.local` 파일에 토큰이 올바르게 설정되었는지 확인
- 환경 변수가 올바르게 로드되었는지 확인

### 오류: "401 Unauthorized"
- Integration 토큰이 올바른지 확인
- Integration에 데이터베이스 접근 권한이 부여되었는지 확인

### 오류: "404 Not Found"
- 페이지 ID가 올바른지 확인
- Integration이 해당 페이지에 접근할 수 있는지 확인

### 오류: "requests 라이브러리가 필요합니다"
```bash
pip install requests
```

## 추가 책 처리

새로운 책을 추가하려면 `scripts/migrate-notion-books.py` 파일의 `books` 리스트에 다음 형식으로 추가:

```python
{
    "page_id": "페이지-ID",
    "title": "책 제목"
}
```

페이지 ID는 Notion 페이지 URL에서 확인할 수 있습니다:
- URL: `https://www.notion.so/18cfcf15-b6ad-8167-a571-f768b898058d`
- Page ID: `18cfcf15-b6ad-8167-a571-f768b898058d`
