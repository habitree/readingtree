# GOOGLE_SERVICE_ACCOUNT_KEY 환경 변수 형식 (OCR)

## 에러 메시지

```
[Cloud Run OCR] 서비스 계정 키 파싱 실패: Bad control character in string literal in JSON at position 158 (line 1 column 159)
GOOGLE_SERVICE_ACCOUNT_KEY 환경 변수가 유효한 JSON 형식이 아닙니다: ...
```

## 원인

- `GOOGLE_SERVICE_ACCOUNT_KEY` 에 넣은 **서비스 계정 JSON 문자열** 안에 **JSON 규격에 맞지 않는 제어 문자**가 들어 있을 때 발생합니다.
- 흔한 경우:
  1. **여러 줄로 된 JSON**을 그대로 복사해 환경 변수에 붙여넣기 → 줄바꿈(개행)이 그대로 들어감.
  2. **`private_key` 값** 안에 **실제 줄바꿈**이 들어감.  
     JSON에서는 문자열 안의 줄바꿈을 **반드시 `\n`(역슬래시 + n 두 글자)** 로만 써야 합니다. 실제 엔터(제어 문자)는 허용되지 않습니다.

## 해결 방법

### 1. 한 줄(minified) JSON으로 저장

- 서비스 계정 JSON 파일을 **한 줄로 만든 뒤** 그 문자열 전체를 `GOOGLE_SERVICE_ACCOUNT_KEY` 에 넣습니다.
- Node에서 한 줄로 만드는 방법 예:
  ```bash
  node -e "console.log(JSON.stringify(require('./서비스계정키.json')))"
  ```
  출력된 한 줄을 복사해 환경 변수 값으로 사용합니다.
- 또는 에디터/온라인 도구로 JSON을 minify(줄바꿈·불필요 공백 제거)한 뒤 한 줄을 복사해 넣습니다.

### 2. private_key 안의 줄바꿈은 `\n` 두 글자로

- JSON 안의 `private_key` 값은 보통 다음과 같습니다:
  ```json
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
  ```
- 여기서 **반드시 역슬래시+n (`\n`) 두 글자**로만 줄바꿈을 표현해야 합니다.  
  실제 엔터(줄바꿈 문자)가 들어가면 "Bad control character in string literal" 오류가 납니다.
- JSON을 한 줄로 minify 하면 `private_key` 안의 실제 줄바꿈은 자동으로 `\n` 으로 이스케이프된 형태로 들어가는 경우가 많습니다. **한 줄 JSON**을 쓰는 것이 가장 안전합니다.

### 3. Vercel / 로컬 환경 변수

- **Vercel**: Environment Variables 에 값을 붙여넣을 때, 위와 같이 **한 줄로 만든 JSON**만 넣습니다. 여러 줄로 넣지 마세요.
- **로컬 `.env.local`**: 마찬가지로 한 줄로 저장합니다.  
  값에 큰따옴표가 많으므로, 보통은 값을 작은따옴표로 감싸거나 이스케이프해서 넣기보다는, **한 줄 JSON 전체를 그대로** 넣는 방식을 사용합니다.

## 참고

- 로그에 "인증 토큰이 없습니다. 공개 함수로 시도합니다" 가 나와도, Cloud Run 서비스가 인증 없이 열려 있으면 OCR은 **200 성공**할 수 있습니다.  
  다만 나중에 Cloud Run을 인증 필수로 바꾸면, 이때 **반드시** `GOOGLE_SERVICE_ACCOUNT_KEY` 를 위 형식대로 수정해 두어야 ID 토큰 생성이 되고 OCR이 계속 동작합니다.
- 관련 코드: [lib/api/cloud-run-ocr.ts](../../lib/api/cloud-run-ocr.ts) — `getAuthToken()` 내부의 `JSON.parse(serviceAccountKey)`.
