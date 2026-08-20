# Admin 모듈 고도화 계획

> **모듈**: admin
> **현재 규모**: ~600 LOC
> **성숙도**: ⭐⭐⭐ (3/5)
> **우선순위**: 🟢 낮음

---

## 1. 현황 분석

### 1.1 핵심 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| 관리자 대시보드 | 기본 통계 | ✅ 완료 |
| 사용자 관리 | 목록/검색 | ✅ 완료 |
| 배치 작업 | 스케줄 작업 | ✅ 완료 |
| 시스템 설정 | 기본 설정 | ✅ 완료 |

### 1.2 기술 구조

```
app/(admin)/admin/
├── page.tsx                  # 대시보드
├── users/page.tsx            # 사용자 관리
├── settings/page.tsx         # 설정
└── batch/page.tsx            # 배치 작업

app/actions/admin/
├── users.ts
├── stats.ts
└── batch.ts

components/admin/
├── AdminDashboard.tsx
├── UserTable.tsx
├── BatchJobList.tsx
└── SystemStats.tsx
```

### 1.3 데이터 모델

```sql
-- 관리자 권한
admin_users (user_id, role, created_at)

-- 배치 작업 로그
batch_jobs (id, type, status, started_at, completed_at, result)
```

---

## 2. 관점별 분석

### 2.1 핵심 기능 강화

| 항목 | 현재 | 목표 | 우선순위 | 복잡도 |
|------|------|------|---------|--------|
| **대시보드 강화** | 기본 | 상세 분석 | 🟡 중간 | ⭐⭐ |
| **감사 로그** | 없음 | 전체 추적 | 🟡 중간 | ⭐⭐ |
| **사용자 관리 강화** | 기본 | 상세 관리 | 🟢 낮음 | ⭐ |
| **배치 작업 관리** | 기본 | 스케줄 관리 | 🟢 낮음 | ⭐⭐ |

#### 상세: 관리자 대시보드

```typescript
interface AdminDashboardStats {
  users: {
    total: number;
    active: number;      // 최근 7일 활동
    newThisWeek: number;
    newThisMonth: number;
  };
  content: {
    totalBooks: number;
    totalNotes: number;
    totalGroups: number;
  };
  engagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    avgSessionDuration: number;
    avgBooksPerUser: number;
  };
  system: {
    errorRate: number;
    avgResponseTime: number;
    storageUsed: number;
  };
}

function AdminDashboard() {
  const { data: stats } = useAdminStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="총 사용자"
          value={stats.users.total}
          change={`+${stats.users.newThisWeek} 이번 주`}
        />
        <StatCard
          title="활성 사용자"
          value={stats.users.active}
          change={`${(stats.users.active / stats.users.total * 100).toFixed(1)}%`}
        />
        <StatCard
          title="총 책"
          value={stats.content.totalBooks}
        />
        <StatCard
          title="총 기록"
          value={stats.content.totalNotes}
        />
      </div>

      {/* 차트 */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>사용자 성장</CardTitle>
          </CardHeader>
          <CardContent>
            <UserGrowthChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>일일 활성 사용자</CardTitle>
          </CardHeader>
          <CardContent>
            <DAUChart />
          </CardContent>
        </Card>
      </div>

      {/* 시스템 상태 */}
      <Card>
        <CardHeader>
          <CardTitle>시스템 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <SystemHealthIndicators stats={stats.system} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2.2 확장성/창의성

| 아이디어 | 설명 | 가치 | 실현성 | 분류 |
|----------|------|------|--------|------|
| **자동화 도구** | 자동 작업 생성 | 높음 | 중간 | 💡 아이디어 |
| **A/B 테스트** | 기능 실험 | 높음 | 중간 | 🔮 장기 |
| **콘텐츠 관리** | 공지/이벤트 | 중간 | 높음 | 🚀 즉시 |
| **피드백 관리** | 사용자 의견 | 중간 | 높음 | 🚀 즉시 |
| **실시간 모니터링** | 라이브 대시보드 | 높음 | 중간 | 💡 아이디어 |

#### 상세: 콘텐츠 관리 시스템

```typescript
interface AdminContent {
  id: string;
  type: 'announcement' | 'event' | 'banner' | 'popup';
  title: string;
  content: string;
  image_url?: string;
  link_url?: string;
  target: 'all' | 'new_users' | 'active_users' | 'specific';
  target_users?: string[];
  start_date: Date;
  end_date?: Date;
  is_active: boolean;
  created_by: string;
  created_at: Date;
}

function ContentManager() {
  const { data: contents } = useAdminContents();

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">콘텐츠 관리</h2>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          새 콘텐츠
        </Button>
      </div>

      <Tabs defaultValue="announcements">
        <TabsList>
          <TabsTrigger value="announcements">공지사항</TabsTrigger>
          <TabsTrigger value="events">이벤트</TabsTrigger>
          <TabsTrigger value="banners">배너</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          <ContentTable
            contents={contents.filter(c => c.type === 'announcement')}
          />
        </TabsContent>
        {/* 다른 탭 */}
      </Tabs>
    </div>
  );
}
```

### 2.3 기술 품질

| 항목 | 현재 상태 | 목표 | 액션 |
|------|----------|------|------|
| **감사 로그** | 없음 | 전체 추적 | 트리거 설정 |
| **권한 관리** | 단일 | 역할 기반 | RBAC |
| **테스트** | 0% | 70% | 테스트 작성 |

#### 감사 로그 시스템

```sql
-- 감사 로그 테이블
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 자동 로깅 트리거 함수
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, entity_type, entity_id,
    old_values, new_values
  )
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```typescript
function AuditLogViewer() {
  const [filters, setFilters] = useState<AuditFilters>({});
  const { data: logs } = useAuditLogs(filters);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select
          value={filters.action}
          onValueChange={(v) => setFilters({ ...filters, action: v })}
        >
          <SelectItem value="all">모든 액션</SelectItem>
          <SelectItem value="INSERT">생성</SelectItem>
          <SelectItem value="UPDATE">수정</SelectItem>
          <SelectItem value="DELETE">삭제</SelectItem>
        </Select>

        <Select
          value={filters.entity_type}
          onValueChange={(v) => setFilters({ ...filters, entity_type: v })}
        >
          <SelectItem value="all">모든 테이블</SelectItem>
          <SelectItem value="users">users</SelectItem>
          <SelectItem value="books">books</SelectItem>
          <SelectItem value="notes">notes</SelectItem>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>시간</TableHead>
            <TableHead>사용자</TableHead>
            <TableHead>액션</TableHead>
            <TableHead>대상</TableHead>
            <TableHead>상세</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{format(log.created_at, 'yyyy-MM-dd HH:mm:ss')}</TableCell>
              <TableCell>{log.user?.email || 'System'}</TableCell>
              <TableCell>
                <Badge>{log.action}</Badge>
              </TableCell>
              <TableCell>{log.entity_type}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### 2.4 통합/연동

| 연동 대상 | 유형 | 데이터 흐름 | 우선순위 |
|----------|------|------------|---------|
| **auth** | 내부 | 사용자 관리 | ✅ 완료 |
| **모든 모듈** | 내부 | 통계 집계 | 🟡 중간 |
| **모니터링** | 외부 | 시스템 상태 | 🟢 낮음 |

---

## 3. 고도화 항목 상세

### 3.1 단기 개선 (Quick Wins)

#### QW-01: 사용자 검색 강화

```typescript
function UserSearchPanel() {
  const [search, setSearch] = useState<UserSearchParams>({
    query: '',
    status: 'all',
    sortBy: 'created_at',
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="이메일 또는 닉네임 검색..."
          value={search.query}
          onChange={(e) => setSearch({ ...search, query: e.target.value })}
        />
        <Select
          value={search.status}
          onValueChange={(v) => setSearch({ ...search, status: v })}
        >
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="active">활성</SelectItem>
          <SelectItem value="inactive">비활성</SelectItem>
          <SelectItem value="banned">차단됨</SelectItem>
        </Select>
      </div>
    </div>
  );
}
```

#### QW-02: 배치 작업 스케줄러

```typescript
interface BatchJob {
  id: string;
  name: string;
  type: 'daily_missions' | 'streak_update' | 'stats_aggregate' | 'cleanup';
  schedule: string;  // cron expression
  last_run?: Date;
  next_run: Date;
  status: 'active' | 'paused' | 'failed';
}

function BatchJobScheduler() {
  const { data: jobs } = useBatchJobs();

  return (
    <Card>
      <CardHeader>
        <CardTitle>배치 작업 스케줄</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>작업명</TableHead>
              <TableHead>스케줄</TableHead>
              <TableHead>마지막 실행</TableHead>
              <TableHead>다음 실행</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.name}</TableCell>
                <TableCell><code>{job.schedule}</code></TableCell>
                <TableCell>
                  {job.last_run ? format(job.last_run, 'MM-dd HH:mm') : '-'}
                </TableCell>
                <TableCell>{format(job.next_run, 'MM-dd HH:mm')}</TableCell>
                <TableCell>
                  <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => runJob(job.id)}>
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleJob(job.id)}>
                      {job.status === 'active' ? <Pause /> : <Play />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

### 3.2 중기 개선 (Planned)

#### PL-01: 역할 기반 접근 제어 (RBAC)

```typescript
type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'support';

interface RolePermissions {
  users: { read: boolean; write: boolean; delete: boolean };
  content: { read: boolean; write: boolean; delete: boolean };
  settings: { read: boolean; write: boolean };
  batch: { read: boolean; execute: boolean };
  audit: { read: boolean };
}

const rolePermissions: Record<AdminRole, RolePermissions> = {
  super_admin: {
    users: { read: true, write: true, delete: true },
    content: { read: true, write: true, delete: true },
    settings: { read: true, write: true },
    batch: { read: true, execute: true },
    audit: { read: true },
  },
  admin: {
    users: { read: true, write: true, delete: false },
    content: { read: true, write: true, delete: true },
    settings: { read: true, write: false },
    batch: { read: true, execute: true },
    audit: { read: true },
  },
  moderator: {
    users: { read: true, write: false, delete: false },
    content: { read: true, write: true, delete: false },
    settings: { read: false, write: false },
    batch: { read: false, execute: false },
    audit: { read: false },
  },
  support: {
    users: { read: true, write: false, delete: false },
    content: { read: true, write: false, delete: false },
    settings: { read: false, write: false },
    batch: { read: false, execute: false },
    audit: { read: false },
  },
};
```

### 3.3 장기 비전 (Vision)

#### VS-01: 실시간 모니터링 대시보드

```
┌─────────────────────────────────────────────────────────────┐
│                    실시간 모니터링                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 실시간 지표                                              │
│  ├── 현재 접속자: 142명                                     │
│  ├── API 응답 시간: 45ms (p95)                              │
│  ├── 에러율: 0.02%                                          │
│  └── DB 커넥션: 23/100                                      │
│                                                             │
│  📈 실시간 차트                                              │
│  ├── 요청량 추이 (1분 단위)                                 │
│  ├── 에러 발생 (실시간)                                     │
│  └── 사용자 활동 (실시간)                                   │
│                                                             │
│  🚨 알림                                                     │
│  ├── 에러율 임계치 초과 시 Slack 알림                       │
│  ├── 응답 시간 저하 시 알림                                 │
│  └── 비정상 트래픽 감지 시 알림                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 구현 가이드

### 4.1 기술 요구사항

| 기능 | 필요 기술 | 비고 |
|------|----------|------|
| 차트 | recharts | 이미 설치됨 |
| 테이블 | @tanstack/react-table | 이미 설치됨 |
| 실시간 | Supabase Realtime | - |
| 모니터링 | Vercel Analytics / Sentry | 외부 서비스 |

### 4.2 마이그레이션 계획

```sql
-- 관리자 콘텐츠 테이블
CREATE TABLE admin_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  link_url TEXT,
  target TEXT DEFAULT 'all',
  target_users UUID[],
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 감사 로그
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
```

---

## 5. 성공 지표 (KPIs)

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| **관리 작업 시간** | - | -30% | 작업당 소요 시간 |
| **문제 대응 시간** | - | <5분 | 이슈 감지 → 대응 |
| **감사 로그 커버리지** | 0% | 100% | 추적되는 액션 비율 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-30 | 최초 작성 |

---

*관련 문서: [메인 계획서](../MODULE_ENHANCEMENT_PLAN.md) | [Auth 모듈](./13-auth.md)*
