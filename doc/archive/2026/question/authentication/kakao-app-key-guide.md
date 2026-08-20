# 카카오 앱 키 가이드

**작성일:** 2025년 12월  
**프로젝트:** Habitree Reading Hub  
**관련 앱:** readingtree2.0 (앱 ID: 1359530)

---

## 목차
1. [카카오 앱 키란?](#카카오-앱-키란)
2. [카카오 앱 키 종류](#카카오-앱-키-종류)
3. [앱 키 확인 방법](#앱-키-확인-방법)
4. [프로젝트에서 사용하는 앱 키](#프로젝트에서-사용하는-앱-키)
5. [환경 변수 이름 차이점](#환경-변수-이름-차이점) ⭐ **중요**
6. [앱 키 설정 방법](#앱-키-설정-방법)

---

## 카카오 앱 키란?

**카카오 앱 키**는 카카오 플랫폼에서 제공하는 API를 사용하기 위해 발급받는 고유한 키입니다. 이 키는 애플리케이션을 식별하고, API 호출 시 인증을 위해 사용됩니다.

### 주요 특징
- 각 애플리케이션마다 고유한 키가 발급됩니다
- 앱 키는 민감한 정보이므로 외부에 노출되지 않도록 주의해야 합니다
- 카카오 개발자 센터에서 애플리케이션을 등록한 후 자동으로 발급됩니다

---

## 카카오 앱 키 종류

카카오 개발자 센터에서 제공하는 앱 키는 용도에 따라 여러 종류가 있습니다:

### 1. REST API 키
- **용도**: 서버에서 REST API를 호출할 때 사용
- **사용 예시**: 서버 사이드에서 카카오 로그인 처리
- **보안**: 서버에서만 사용해야 하며, 클라이언트에 노출되면 안 됨

### 2. JavaScript 키
- **용도**: 웹 브라우저에서 JavaScript SDK를 사용할 때 필요
- **사용 예시**: 클라이언트 사이드에서 카카오 로그인, 공유 기능
- **특징**: `NEXT_PUBLIC_` 접두사로 환경 변수에 설정 (클라이언트에 노출됨)

### 3. 네이티브 앱 키
- **용도**: 모바일 애플리케이션(Android/iOS)에서 카카오 SDK 사용 시
- **사용 예시**: 모바일 앱에서 카카오 로그인

### 4. Admin 키
- **용도**: 관리자 권한이 필요한 API 호출에 사용
- **보안**: 가장 민감한 키로, 서버에서만 사용하고 절대 클라이언트에 노출되면 안 됨

---

## 앱 키 확인 방법

### 단계별 가이드

1. **카카오 개발자 센터 접속**
   - URL: [https://developers.kakao.com/](https://developers.kakao.com/)
   - 카카오 계정으로 로그인

2. **내 애플리케이션 페이지 이동**
   - 상단 메뉴에서 **"앱"** 클릭
   - 또는 직접 접속: [https://developers.kakao.com/console/app](https://developers.kakao.com/console/app)

3. **앱 선택**
   - 사용할 앱 클릭 (예: readingtree2.0)
   - 앱 ID: 1359530

4. **앱 키 확인**
   - 왼쪽 사이드바에서 **"앱 키"** 메뉴 클릭
   - 또는 URL: `https://developers.kakao.com/console/app/{앱ID}/appkey`
   - 예시: `https://developers.kakao.com/console/app/1359530/appkey`

5. **키 복사**
   - 필요한 키를 복사하여 환경 변수에 설정

### 앱 키 페이지에서 확인할 수 있는 정보

```
앱 키
├── REST API 키: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
├── JavaScript 키: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
├── Admin 키: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (보안 주의)
└── 네이티브 앱 키: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 프로젝트에서 사용하는 앱 키

### Habitree Reading Hub 프로젝트에서 필요한 키

이 프로젝트에서는 **JavaScript 키**를 사용합니다.

**이유:**
- Next.js 클라이언트 사이드에서 카카오 로그인 및 공유 기능 사용
- `NEXT_PUBLIC_KAKAO_APP_KEY` 환경 변수로 설정
- 브라우저에서 JavaScript SDK를 통해 카카오 API 호출

### 환경 변수 설정

#### 로컬 개발 환경 (`.env.local`)

```bash
# 카카오 JavaScript 키
NEXT_PUBLIC_KAKAO_APP_KEY=your_javascript_key_here
```

#### 프로덕션 환경 (Vercel)

1. Vercel Dashboard 접속
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 다음 변수 추가:
   - **Key**: `NEXT_PUBLIC_KAKAO_APP_KEY`
   - **Value**: JavaScript 키 값
   - **Environment**: Production, Preview, Development 모두 선택

#### GitHub Secrets (GitHub Actions)

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 클릭
3. 다음 Secret 추가:
   - **Name**: `KAKAO_APP_KEY` (GitHub Secrets 이름)
   - **Value**: JavaScript 키 값

> **참고**: GitHub Secrets에는 `KAKAO_APP_KEY`로 저장하지만, GitHub Actions 워크플로우에서 빌드 시 `NEXT_PUBLIC_KAKAO_APP_KEY` 환경 변수로 매핑됩니다. 자세한 내용은 아래 ["환경 변수 이름 차이점"](#환경-변수-이름-차이점) 섹션을 참고하세요.

---

## 앱 키 설정 방법

### 1. 카카오 개발자 센터에서 키 확인

1. [카카오 개발자 센터](https://developers.kakao.com/) 접속
2. 로그인
3. **내 애플리케이션** → **readingtree2.0** 앱 선택
4. 왼쪽 메뉴에서 **"앱 키"** 클릭
5. **JavaScript 키** 복사

### 2. 로컬 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# .env.local
NEXT_PUBLIC_KAKAO_APP_KEY=복사한_JavaScript_키
```

### 3. Vercel 환경 변수 설정

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** → **Environment Variables**
4. **Add New** 클릭
5. 다음 정보 입력:
   - **Key**: `NEXT_PUBLIC_KAKAO_APP_KEY`
   - **Value**: JavaScript 키
   - **Environment**: Production, Preview, Development 모두 선택
6. **Save** 클릭

### 4. GitHub Secrets 설정

1. [GitHub 저장소](https://github.com/habitree/readingtree4.0) 접속
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** 클릭
4. 다음 정보 입력:
   - **Name**: `KAKAO_APP_KEY` (GitHub Secrets 이름)
   - **Secret**: JavaScript 키
5. **Add secret** 클릭

> **중요**: GitHub Secrets에는 `KAKAO_APP_KEY`로 저장하지만, GitHub Actions 워크플로우에서 자동으로 `NEXT_PUBLIC_KAKAO_APP_KEY` 환경 변수로 매핑됩니다. 워크플로우 파일(`.github/workflows/*.yml`)을 확인하면 `NEXT_PUBLIC_KAKAO_APP_KEY: ${{ secrets.KAKAO_APP_KEY }}` 형태로 설정되어 있습니다.

---

## 환경 변수 이름 차이점

### 왜 이름이 다른가요?

프로젝트에서 두 가지 다른 이름을 사용하는 이유는 **사용 위치와 목적**이 다르기 때문입니다.

#### 1. `NEXT_PUBLIC_KAKAO_APP_KEY` (Next.js 환경 변수)

**사용 위치:**
- 로컬 개발 환경 (`.env.local`)
- Vercel 환경 변수
- Next.js 애플리케이션 코드 내부

**특징:**
- `NEXT_PUBLIC_` 접두사는 Next.js의 특별한 규칙입니다
- 이 접두사가 있으면 **클라이언트 사이드(브라우저)에서도 접근 가능**합니다
- JavaScript 키는 브라우저에서 사용하므로 이 접두사가 **필수**입니다
- 빌드 시 JavaScript 번들에 포함되어 브라우저에 노출됩니다

**사용 예시:**
```typescript
// 클라이언트 사이드에서 접근 가능
const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
window.Kakao.init(appKey);
```

#### 2. `KAKAO_APP_KEY` (GitHub Secrets 이름)

**사용 위치:**
- GitHub Secrets (저장소 설정)
- GitHub Actions 워크플로우 파일

**특징:**
- GitHub Secrets의 이름은 간단하게 `KAKAO_APP_KEY`로 저장합니다
- GitHub Actions에서 빌드할 때 `NEXT_PUBLIC_KAKAO_APP_KEY` 환경 변수로 매핑합니다
- 이렇게 하는 이유는:
  1. GitHub Secrets 이름을 간단하게 유지
  2. 워크플로우에서 필요에 따라 다른 이름으로 매핑 가능
  3. 여러 환경 변수를 관리할 때 일관성 유지

**GitHub Actions 워크플로우 예시:**
```yaml
# .github/workflows/ci.yml
- name: Build
  run: npm run build
  env:
    # GitHub Secrets의 KAKAO_APP_KEY를 
    # Next.js 환경 변수 NEXT_PUBLIC_KAKAO_APP_KEY로 매핑
    NEXT_PUBLIC_KAKAO_APP_KEY: ${{ secrets.KAKAO_APP_KEY }}
```

### 요약 표

| 위치 | 변수 이름 | 용도 | 접근 가능 범위 |
|------|----------|------|---------------|
| `.env.local` | `NEXT_PUBLIC_KAKAO_APP_KEY` | 로컬 개발 | 클라이언트 + 서버 |
| Vercel | `NEXT_PUBLIC_KAKAO_APP_KEY` | 프로덕션 배포 | 클라이언트 + 서버 |
| GitHub Secrets | `KAKAO_APP_KEY` | CI/CD 빌드 | GitHub Actions만 |
| GitHub Actions | `NEXT_PUBLIC_KAKAO_APP_KEY` | 빌드 시 매핑 | 빌드 프로세스 |

### 왜 이렇게 복잡하게 하나요?

**간단한 답변:**
- Next.js는 `NEXT_PUBLIC_` 접두사가 있어야 브라우저에서 사용 가능
- GitHub Secrets는 간단한 이름으로 저장하는 것이 관리하기 쉬움
- 워크플로우에서 매핑하면 유연하게 관리 가능

**실제로는:**
- GitHub Secrets에도 `NEXT_PUBLIC_KAKAO_APP_KEY`로 저장해도 됩니다
- 하지만 일반적으로는 간단한 이름(`KAKAO_APP_KEY`)으로 저장하고 워크플로우에서 매핑합니다

### 권장 설정 방법

**옵션 1: 현재 방식 (권장)**
```yaml
# GitHub Secrets
KAKAO_APP_KEY = "your_key_here"

# GitHub Actions
env:
  NEXT_PUBLIC_KAKAO_APP_KEY: ${{ secrets.KAKAO_APP_KEY }}
```

**옵션 2: 직접 매핑**
```yaml
# GitHub Secrets
NEXT_PUBLIC_KAKAO_APP_KEY = "your_key_here"

# GitHub Actions
env:
  NEXT_PUBLIC_KAKAO_APP_KEY: ${{ secrets.NEXT_PUBLIC_KAKAO_APP_KEY }}
```

두 방식 모두 작동하지만, 옵션 1이 더 일반적이고 관리하기 쉽습니다.

---

## 카카오 앱 키 사용 예시

### Next.js에서 사용

```typescript
// lib/kakao.ts
export function initKakao() {
  if (typeof window !== 'undefined' && !window.Kakao) {
    const script = document.createElement('script');
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
    script.async = true;
    document.head.appendChild(script);
    
    script.onload = () => {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY!);
    };
  }
}

// 사용
import { initKakao } from '@/lib/kakao';

export function LoginButton() {
  useEffect(() => {
    initKakao();
  }, []);

  const handleLogin = () => {
    window.Kakao.Auth.login({
      success: (authObj: any) => {
        // 로그인 성공 처리
      },
      fail: (err: any) => {
        // 로그인 실패 처리
      },
    });
  };

  return <button onClick={handleLogin}>카카오 로그인</button>;
}
```

---

## 보안 주의사항

### JavaScript 키
- ✅ 클라이언트 사이드에서 사용 가능 (브라우저에 노출됨)
- ✅ `NEXT_PUBLIC_` 접두사로 환경 변수 설정
- ⚠️ 공개 저장소에 커밋해도 상대적으로 안전 (의도된 사용)

### REST API 키 / Admin 키
- ❌ 절대 클라이언트에 노출하면 안 됨
- ❌ `NEXT_PUBLIC_` 접두사 사용 금지
- ✅ 서버 사이드에서만 사용
- ✅ GitHub Secrets에만 저장

---

## 문제 해결

### 문제 1: "Invalid JavaScript key" 에러

**원인:**
- 잘못된 키 사용
- JavaScript 키 대신 REST API 키 사용

**해결:**
- 카카오 개발자 센터에서 **JavaScript 키**를 정확히 복사
- 환경 변수 이름이 `NEXT_PUBLIC_KAKAO_APP_KEY`인지 확인

### 문제 2: 카카오 로그인이 작동하지 않음

**원인:**
- 앱 키가 설정되지 않음
- 리다이렉트 URI가 등록되지 않음

**해결:**
1. 환경 변수가 올바르게 설정되었는지 확인
2. 카카오 개발자 센터 → **앱 설정** → **플랫폼** → **Web 플랫폼 등록**
3. 사이트 도메인 등록 (예: `http://localhost:3000`, `https://readingtree.vercel.app`)
4. 리다이렉트 URI 등록 (예: `http://localhost:3000/auth/callback`)

### 문제 3: 카카오 공유가 작동하지 않음

**원인:**
- JavaScript SDK가 초기화되지 않음
- 앱 키가 올바르게 설정되지 않음

**해결:**
1. `window.Kakao.init()`이 호출되었는지 확인
2. 환경 변수가 브라우저에서 접근 가능한지 확인 (`NEXT_PUBLIC_` 접두사)

---

## 참고 자료

### 공식 문서
- [카카오 개발자 센터](https://developers.kakao.com/)
- [카카오 로그인 가이드](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [카카오 JavaScript SDK](https://developers.kakao.com/docs/latest/ko/getting-started/sdk-js)

### 프로젝트 관련 문서
- [software_design.md](../software_design.md) - 6.2.4 AI 및 외부 API
- [user_stories.md](../user_stories.md) - US-001, US-027
- [github-action.md](./github-action.md) - GitHub Actions 설정

---

## 체크리스트

카카오 앱 키 설정 시 확인사항:

- [ ] 카카오 개발자 센터에서 JavaScript 키 확인
- [ ] 로컬 `.env.local` 파일에 `NEXT_PUBLIC_KAKAO_APP_KEY` 설정
- [ ] Vercel 환경 변수에 `NEXT_PUBLIC_KAKAO_APP_KEY` 설정
- [ ] GitHub Secrets에 `KAKAO_APP_KEY` 설정 (워크플로우에서 자동으로 `NEXT_PUBLIC_KAKAO_APP_KEY`로 매핑됨)
- [ ] 카카오 개발자 센터에서 Web 플랫폼 등록
- [ ] 리다이렉트 URI 등록
- [ ] 카카오 로그인 테스트
- [ ] 카카오 공유 기능 테스트

---

**문서 끝**

