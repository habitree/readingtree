# PWA 및 오프라인 지원 계획

> **영역**: Progressive Web App, 오프라인 지원
> **우선순위**: 🟡 중간
> **Phase**: 3 (확장 기능)

---

## 1. 현황 분석

### 1.1 현재 상태

- PWA 지원 없음
- 오프라인 사용 불가
- 푸시 알림 없음
- 앱 설치 불가

### 1.2 목표

```
PWA 목표
═══════════════════════════════════════════════════════════

  ✅ 설치 가능 (Add to Home Screen)
  ✅ 오프라인 기본 사용
  ✅ 백그라운드 동기화
  ✅ 푸시 알림
  ✅ 빠른 로딩 (캐싱)

═══════════════════════════════════════════════════════════
```

---

## 2. 기술 스택

### 2.1 라이브러리

```json
{
  "dependencies": {
    "@ducanh2912/next-pwa": "^5.6.0",
    "idb": "^8.0.0"
  }
}
```

### 2.2 PWA 구성 요소

```
┌─────────────────────────────────────────────────────────────┐
│                      PWA 아키텍처                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Web App Manifest]                                         │
│     └── 앱 메타데이터, 아이콘, 테마                          │
│                                                             │
│  [Service Worker]                                           │
│     ├── 캐싱 전략                                           │
│     ├── 오프라인 폴백                                       │
│     └── 백그라운드 동기화                                   │
│                                                             │
│  [IndexedDB]                                                │
│     └── 로컬 데이터 저장소                                  │
│                                                             │
│  [Push API]                                                 │
│     └── 푸시 알림 수신                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 구현 설계

### 3.1 Web App Manifest

```json
// public/manifest.json
{
  "name": "ReadTree - 독서 기록 앱",
  "short_name": "ReadTree",
  "description": "책을 읽고, 기록하고, 성장하세요",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/books.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "shortcuts": [
    {
      "name": "책 추가",
      "short_name": "책 추가",
      "url": "/books/add",
      "icons": [{ "src": "/icons/add-book.png", "sizes": "96x96" }]
    },
    {
      "name": "기록 작성",
      "short_name": "기록",
      "url": "/notes/new",
      "icons": [{ "src": "/icons/add-note.png", "sizes": "96x96" }]
    }
  ],
  "categories": ["books", "education", "productivity"]
}
```

### 3.2 Next.js PWA 설정

```typescript
// next.config.js
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-api',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60, // 1시간
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30일
          },
        },
      },
      {
        urlPattern: /\.(?:js|css)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-resources',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24, // 1일
          },
        },
      },
    ],
  },
});

module.exports = withPWA({
  // 기존 next.config.js 설정
});
```

### 3.3 IndexedDB 로컬 저장소

```typescript
// lib/idb.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ReadTreeDB extends DBSchema {
  drafts: {
    key: string;
    value: {
      id: string;
      type: 'note' | 'book';
      data: any;
      createdAt: Date;
      updatedAt: Date;
    };
    indexes: { 'by-type': string };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      action: 'create' | 'update' | 'delete';
      entity: string;
      data: any;
      createdAt: Date;
    };
  };
  cache: {
    key: string;
    value: {
      key: string;
      data: any;
      expiresAt: Date;
    };
  };
}

let db: IDBPDatabase<ReadTreeDB>;

export async function getDB() {
  if (!db) {
    db = await openDB<ReadTreeDB>('readtree', 1, {
      upgrade(db) {
        // 드래프트 저장소
        const draftsStore = db.createObjectStore('drafts', {
          keyPath: 'id',
        });
        draftsStore.createIndex('by-type', 'type');

        // 동기화 큐
        db.createObjectStore('syncQueue', {
          keyPath: 'id',
        });

        // 캐시
        db.createObjectStore('cache', {
          keyPath: 'key',
        });
      },
    });
  }
  return db;
}

// 드래프트 저장
export async function saveDraft(type: 'note' | 'book', data: any) {
  const db = await getDB();
  const id = data.id || crypto.randomUUID();

  await db.put('drafts', {
    id,
    type,
    data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return id;
}

// 드래프트 조회
export async function getDrafts(type?: 'note' | 'book') {
  const db = await getDB();

  if (type) {
    return db.getAllFromIndex('drafts', 'by-type', type);
  }
  return db.getAll('drafts');
}

// 동기화 큐에 추가
export async function addToSyncQueue(
  action: 'create' | 'update' | 'delete',
  entity: string,
  data: any
) {
  const db = await getDB();

  await db.add('syncQueue', {
    id: crypto.randomUUID(),
    action,
    entity,
    data,
    createdAt: new Date(),
  });
}
```

### 3.4 오프라인 동기화

```typescript
// lib/sync.ts
import { getDB, addToSyncQueue } from './idb';

// 온라인 상태 감지
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// 오프라인 지원 액션
export async function createNoteOfflineAware(data: NoteInput) {
  const isOnline = navigator.onLine;

  if (isOnline) {
    // 온라인: 서버에 직접 저장
    return createNote(data);
  } else {
    // 오프라인: 로컬에 저장하고 동기화 큐에 추가
    const id = await saveDraft('note', data);
    await addToSyncQueue('create', 'notes', { ...data, localId: id });

    return {
      success: true,
      data: { id, ...data, _offline: true },
      message: '오프라인 저장됨. 연결 시 동기화됩니다.',
    };
  }
}

// 동기화 실행
export async function syncPendingChanges() {
  const db = await getDB();
  const pendingItems = await db.getAll('syncQueue');

  for (const item of pendingItems) {
    try {
      switch (item.action) {
        case 'create':
          await createOnServer(item.entity, item.data);
          break;
        case 'update':
          await updateOnServer(item.entity, item.data);
          break;
        case 'delete':
          await deleteOnServer(item.entity, item.data.id);
          break;
      }

      // 성공 시 큐에서 제거
      await db.delete('syncQueue', item.id);
    } catch (error) {
      console.error('Sync failed:', error);
      // 실패 시 나중에 재시도
    }
  }
}

// 온라인 복귀 시 동기화
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncPendingChanges();
  });
}
```

### 3.5 푸시 알림

```typescript
// lib/push.ts
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// 푸시 알림 구독
export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications not supported');
  }

  const registration = await navigator.serviceWorker.ready;

  // 기존 구독 확인
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  // 서버에 구독 정보 저장
  await savePushSubscription(subscription);

  return subscription;
}

// 알림 권한 요청
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// 알림 UI 컴포넌트
function PushNotificationSetup() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleEnable = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);

    if (perm === 'granted') {
      await subscribeToPush();
      setIsSubscribed(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <Bell className="h-5 w-5" />
        <CardTitle>푸시 알림</CardTitle>
      </CardHeader>
      <CardContent>
        {permission === 'default' && (
          <div className="space-y-4">
            <p>알림을 받으면 새로운 활동을 놓치지 않아요.</p>
            <Button onClick={handleEnable}>알림 켜기</Button>
          </div>
        )}
        {permission === 'granted' && isSubscribed && (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            알림이 활성화되었습니다
          </div>
        )}
        {permission === 'denied' && (
          <div className="text-muted-foreground">
            알림이 차단되어 있습니다. 브라우저 설정에서 변경해주세요.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 3.6 앱 설치 프롬프트

```typescript
// hooks/useInstallPrompt.ts
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 설치 프롬프트 이벤트 캡처
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 이미 설치되었는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return { isInstallable, isInstalled, install };
}

// 설치 배너 컴포넌트
function InstallBanner() {
  const { isInstallable, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useLocalStorage('install-dismissed', false);

  if (!isInstallable || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg flex items-center justify-between z-50">
      <div className="flex items-center gap-3">
        <Smartphone className="h-6 w-6" />
        <div>
          <p className="font-medium">앱으로 설치하기</p>
          <p className="text-sm opacity-90">홈 화면에 추가하세요</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setDismissed(true)}
        >
          나중에
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={install}
        >
          설치
        </Button>
      </div>
    </div>
  );
}
```

---

## 4. 오프라인 UI/UX

### 4.1 오프라인 인디케이터

```typescript
function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkPending = async () => {
      const db = await getDB();
      const count = await db.count('syncQueue');
      setPendingCount(count);
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOnline && (
        <Badge variant="secondary" className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          오프라인
        </Badge>
      )}
      {isOnline && pendingCount > 0 && (
        <Badge variant="secondary" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          {pendingCount}개 동기화 중...
        </Badge>
      )}
    </div>
  );
}
```

### 4.2 오프라인 폴백 페이지

```typescript
// app/offline/page.tsx
export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">오프라인 상태입니다</h1>
      <p className="text-muted-foreground mb-6">
        인터넷 연결을 확인해주세요.
        <br />
        연결되면 자동으로 동기화됩니다.
      </p>
      <Button onClick={() => window.location.reload()}>
        <RefreshCw className="mr-2 h-4 w-4" />
        새로고침
      </Button>
    </div>
  );
}
```

---

## 5. 구현 로드맵

### Phase 1: 기본 PWA

```
Week 1:
├── Manifest 설정
├── 아이콘 생성
├── 기본 Service Worker
└── 앱 설치 프롬프트
```

### Phase 2: 캐싱

```
Week 2:
├── 정적 리소스 캐싱
├── API 응답 캐싱
├── 이미지 캐싱
└── 오프라인 폴백 페이지
```

### Phase 3: 오프라인 기능

```
Week 3-4:
├── IndexedDB 설정
├── 드래프트 저장
├── 동기화 큐
└── 충돌 해결
```

### Phase 4: 푸시 알림

```
Week 5:
├── VAPID 키 설정
├── 구독 관리
├── 알림 전송 (서버)
└── 알림 설정 UI
```

---

## 6. 성공 지표

| 지표 | 현재 | 목표 |
|------|------|------|
| Lighthouse PWA 점수 | - | 90+ |
| 앱 설치 수 | 0 | 측정 시작 |
| 오프라인 사용률 | 0% | 10% |
| 푸시 알림 CTR | - | 20% |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-30 | 최초 작성 |

---

*관련 문서: [메인 계획서](../MODULE_ENHANCEMENT_PLAN.md) | [품질](./QUALITY.md)*
