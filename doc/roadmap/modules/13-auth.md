# Auth 모듈 고도화 계획

> **모듈**: auth
> **현재 규모**: ~400 LOC
> **성숙도**: ⭐⭐⭐⭐ (4/5)
> **우선순위**: 🟢 낮음

---

## 1. 현황 분석

### 1.1 핵심 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| 이메일 로그인 | 이메일/비밀번호 | ✅ 완료 |
| 소셜 로그인 | Google, Kakao | ✅ 완료 |
| 회원가입 | 이메일 인증 | ✅ 완료 |
| 비밀번호 재설정 | 이메일 발송 | ✅ 완료 |
| 세션 관리 | Supabase Auth | ✅ 완료 |

### 1.2 기술 구조

```
app/(auth)/
├── login/page.tsx
├── register/page.tsx
├── forgot-password/page.tsx
└── callback/page.tsx         # OAuth 콜백

lib/auth/
├── supabase-client.ts
├── auth-actions.ts
└── middleware.ts

components/auth/
├── LoginForm.tsx
├── RegisterForm.tsx
├── SocialLoginButtons.tsx
└── AuthGuard.tsx
```

### 1.3 데이터 모델

```sql
-- Supabase Auth 기본 테이블 활용
auth.users (id, email, created_at, ...)

-- 커스텀 프로필
profiles (id, user_id, display_name, ...)
```

---

## 2. 관점별 분석

### 2.1 핵심 기능 강화

| 항목 | 현재 | 목표 | 우선순위 | 복잡도 |
|------|------|------|---------|--------|
| **MFA 지원** | 없음 | TOTP 인증 | 🟡 중간 | ⭐⭐ |
| **보안 강화** | 기본 | Rate limiting | 🟡 중간 | ⭐⭐ |
| **세션 관리** | 기본 | 다중 기기 관리 | 🟢 낮음 | ⭐⭐ |
| **로그인 기록** | 없음 | 접속 히스토리 | 🟢 낮음 | ⭐ |

#### 상세: MFA 지원

```typescript
// Supabase MFA 활성화
// supabase.auth.mfa.enroll()

async function enableMFA() {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
  });

  if (error) throw error;

  // QR 코드 표시
  return {
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

async function verifyMFA(code: string) {
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totpFactor = factors.totp[0];

  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: totpFactor.id,
    code,
  });

  return { success: !error };
}

// MFA 설정 UI
function MFASetup() {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify' | 'complete'>('intro');
  const [mfaData, setMfaData] = useState<MFAData | null>(null);

  const handleEnable = async () => {
    const data = await enableMFA();
    setMfaData(data);
    setStep('qr');
  };

  return (
    <Card>
      <CardHeader>
        <Shield className="h-6 w-6" />
        <CardTitle>2단계 인증 설정</CardTitle>
      </CardHeader>
      <CardContent>
        {step === 'intro' && (
          <div className="space-y-4">
            <p>2단계 인증을 활성화하면 로그인 시 추가 보안 코드가 필요합니다.</p>
            <Button onClick={handleEnable}>활성화하기</Button>
          </div>
        )}
        {step === 'qr' && mfaData && (
          <div className="space-y-4">
            <p>인증 앱으로 QR 코드를 스캔하세요.</p>
            <img src={mfaData.qrCode} alt="MFA QR Code" />
            <Button onClick={() => setStep('verify')}>다음</Button>
          </div>
        )}
        {/* verify, complete 단계 */}
      </CardContent>
    </Card>
  );
}
```

### 2.2 확장성/창의성

| 아이디어 | 설명 | 가치 | 실현성 | 분류 |
|----------|------|------|--------|------|
| **추가 소셜 로그인** | Apple, Naver | 중간 | 높음 | 🚀 즉시 |
| **SSO** | 기업용 SSO | 낮음 | 낮음 | 🔮 장기 |
| **패스키** | 비밀번호 없는 로그인 | 높음 | 중간 | 💡 아이디어 |
| **익명 체험** | 가입 없이 체험 | 중간 | 높음 | 💡 아이디어 |

#### 상세: 패스키 (WebAuthn)

```typescript
// Supabase는 WebAuthn을 지원하지 않으므로 별도 구현 필요
// 또는 Supabase에서 지원 시 활용

async function registerPasskey() {
  const publicKey = await generateRegistrationOptions({
    rpName: 'ReadTree',
    rpID: 'readtree.app',
    userID: user.id,
    userName: user.email,
  });

  const credential = await navigator.credentials.create({ publicKey });

  // 서버에 credential 저장
  await savePasskey(user.id, credential);
}

async function loginWithPasskey() {
  const publicKey = await generateAuthenticationOptions({
    rpID: 'readtree.app',
  });

  const credential = await navigator.credentials.get({ publicKey });

  // 서버에서 검증
  const verified = await verifyPasskey(credential);

  if (verified) {
    // 세션 생성
  }
}
```

### 2.3 기술 품질

| 항목 | 현재 상태 | 목표 | 액션 |
|------|----------|------|------|
| **Rate Limiting** | 없음 | 로그인 시도 제한 | Supabase 설정 |
| **보안 헤더** | 기본 | 강화 | Next.js 설정 |
| **테스트** | 0% | 80% | 테스트 작성 |

#### 보안 헤더 설정

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 2.4 통합/연동

| 연동 대상 | 유형 | 데이터 흐름 | 우선순위 |
|----------|------|------------|---------|
| **profile** | 내부 | 프로필 연동 | ✅ 완료 |
| **onboarding** | 내부 | 신규 가입 플로우 | ✅ 완료 |
| **admin** | 내부 | 사용자 관리 | 🟡 중간 |

---

## 3. 고도화 항목 상세

### 3.1 단기 개선 (Quick Wins)

#### QW-01: 로그인 기록

```sql
-- 로그인 히스토리 테이블
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  location TEXT,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login history"
  ON login_history FOR SELECT
  USING (auth.uid() = user_id);
```

```typescript
function LoginHistoryList() {
  const { data: history } = useLoginHistory();

  return (
    <Card>
      <CardHeader>
        <CardTitle>로그인 기록</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((record) => (
            <div key={record.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {record.location || '알 수 없는 위치'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {record.user_agent}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">
                  {format(record.created_at, 'yyyy-MM-dd HH:mm')}
                </p>
                <Badge variant={record.success ? 'default' : 'destructive'}>
                  {record.success ? '성공' : '실패'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### QW-02: 소셜 로그인 추가 (Apple)

```typescript
// Supabase 대시보드에서 Apple OAuth 설정 후

function AppleLoginButton() {
  const handleAppleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) toast.error('로그인 실패');
  };

  return (
    <Button variant="outline" onClick={handleAppleLogin}>
      <Apple className="mr-2 h-4 w-4" />
      Apple로 계속하기
    </Button>
  );
}
```

### 3.2 중기 개선 (Planned)

#### PL-01: 다중 기기 세션 관리

```typescript
function SessionManager() {
  const { data: sessions } = useActiveSessions();

  const handleRevokeSession = async (sessionId: string) => {
    await supabase.auth.admin.signOut(sessionId);
    // 또는 커스텀 구현
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>활성 세션</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {getDeviceIcon(session.device_type)}
                <div>
                  <p className="font-medium">{session.device_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.location} · {formatRelativeTime(session.last_active)}
                  </p>
                </div>
              </div>
              {session.is_current ? (
                <Badge>현재 기기</Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevokeSession(session.id)}
                >
                  로그아웃
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3.3 장기 비전 (Vision)

#### VS-01: 제로 트러스트 보안

```
┌─────────────────────────────────────────────────────────────┐
│                    보안 강화 로드맵                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Level 1: 기본 보안 (현재)                                   │
│  • 이메일/비밀번호 인증                                      │
│  • 소셜 로그인                                               │
│  • 세션 기반 인증                                            │
│                                                             │
│  Level 2: 강화된 보안                                        │
│  • MFA (TOTP)                                               │
│  • 로그인 기록 및 알림                                       │
│  • IP 기반 접근 제어                                         │
│                                                             │
│  Level 3: 고급 보안                                          │
│  • 패스키 (WebAuthn)                                        │
│  • 기기 신뢰 관리                                            │
│  • 이상 행동 탐지                                            │
│                                                             │
│  Level 4: 제로 트러스트                                      │
│  • 지속적 인증                                               │
│  • 컨텍스트 기반 접근 제어                                   │
│  • 실시간 위협 대응                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 구현 가이드

### 4.1 기술 요구사항

| 기능 | 필요 기술 | 비고 |
|------|----------|------|
| MFA | Supabase Auth MFA | 기본 지원 |
| 패스키 | @simplewebauthn/browser | 장기 |
| 위치 정보 | IP 기반 GeoIP | MaxMind 등 |

### 4.2 마이그레이션 계획

```sql
-- 로그인 기록 테이블
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  location TEXT,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_history_user ON login_history(user_id, created_at DESC);
```

---

## 5. 성공 지표 (KPIs)

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| **로그인 성공률** | - | 95% | 시도 대비 성공 |
| **MFA 채택률** | 0% | 20% | MFA 활성화 사용자 |
| **계정 보안 이슈** | - | 0건 | 보안 사고 수 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-30 | 최초 작성 |

---

*관련 문서: [메인 계획서](../MODULE_ENHANCEMENT_PLAN.md) | [Profile 모듈](./05-profile.md) | [Admin 모듈](./14-admin.md)*
