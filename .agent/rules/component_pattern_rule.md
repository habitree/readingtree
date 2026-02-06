# 컴포넌트 패턴 규칙

> React 컴포넌트 작성 시 성능과 유지보수성을 위한 패턴 규칙

---

## 1. 메모이제이션 규칙

### 1.1 useCallback 적용 기준

```tsx
// 필수 적용 케이스
// 1. 자식 컴포넌트에 props로 전달되는 함수
const handleClick = useCallback(() => {
  // ...
}, [dependency]);

// 2. useEffect의 dependency로 사용되는 함수
const fetchData = useCallback(async () => {
  // ...
}, []);

// 3. 이벤트 핸들러가 내부에서 상태를 사용할 때
const handleSubmit = useCallback(() => {
  doSomething(formData);
}, [formData]);
```

### 1.2 useMemo 적용 기준

```tsx
// 필수 적용 케이스
// 1. 비용이 큰 계산
const sortedList = useMemo(() =>
  items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// 2. 객체/배열 생성 (자식에게 props로 전달 시)
const options = useMemo(() => ({
  page: 1,
  limit: 10,
  filter: selectedFilter
}), [selectedFilter]);
```

### 1.3 적용하지 않아도 되는 케이스

- 원시값(string, number, boolean) 연산
- 렌더링당 한 번만 실행되는 간단한 로직
- 컴포넌트 내부에서만 사용하는 함수

---

## 2. 이벤트 핸들러 규칙

### 2.1 인라인 함수 금지

```tsx
// 금지 - 매 렌더링마다 새 함수 생성
{items.map((item) => (
  <Button onClick={() => handleClick(item.id)}>
    {item.name}
  </Button>
))}

// 권장 - useCallback + 아이템 컴포넌트 분리
function ItemButton({ item, onItemClick }: Props) {
  const handleClick = useCallback(() => {
    onItemClick(item.id);
  }, [item.id, onItemClick]);

  return <Button onClick={handleClick}>{item.name}</Button>;
}
```

### 2.2 허용되는 인라인 함수

```tsx
// 허용 - 단순 setter 호출
<Button onClick={() => setIsOpen(true)}>열기</Button>

// 허용 - 단순 상태 토글
<Switch checked={enabled} onCheckedChange={setEnabled} />
```

---

## 3. 리스트 렌더링 규칙

### 3.1 key={index} 사용 금지

```tsx
// 금지 - 리렌더링 성능 저하 및 상태 버그
{items.map((item, index) => (
  <Item key={index} {...item} />
))}

// 권장 - 고유 ID 사용
{items.map((item) => (
  <Item key={item.id} {...item} />
))}

// 허용 - 정적 리스트 (순서/개수 변경 없음)
{staticOptions.map((option, index) => (
  <Option key={`option-${index}`} {...option} />
))}
```

### 3.2 리스트 아이템 컴포넌트 분리

```tsx
// 권장 - 각 아이템을 별도 컴포넌트로
function BookList({ books }: Props) {
  return (
    <div>
      {books.map((book) => (
        <BookItem key={book.id} book={book} />
      ))}
    </div>
  );
}

// React.memo로 불필요한 리렌더링 방지
const BookItem = memo(function BookItem({ book }: { book: Book }) {
  return <Card>{book.title}</Card>;
});
```

---

## 4. React.memo 적용 기준

### 4.1 필수 적용

```tsx
// 1. 리스트 아이템 컴포넌트
export const ListItem = memo(function ListItem(props) { ... });

// 2. 자주 리렌더링되는 부모의 자식
export const ExpensiveChild = memo(function ExpensiveChild(props) { ... });

// 3. props가 자주 변경되지 않는 컴포넌트
export const StaticCard = memo(function StaticCard(props) { ... });
```

### 4.2 커스텀 비교 함수

```tsx
// 복잡한 props 비교 시
const areEqual = (prevProps: Props, nextProps: Props) => {
  return prevProps.id === nextProps.id
    && prevProps.name === nextProps.name;
};

export const OptimizedComponent = memo(Component, areEqual);
```

---

## 5. 상태 관리 단순화

### 5.1 상태 분리 원칙

```tsx
// 금지 - 관련 없는 상태 묶기
const [state, setState] = useState({
  user: null,
  theme: 'light',
  isModalOpen: false,
});

// 권장 - 관련된 상태만 묶기
const [user, setUser] = useState(null);
const [theme, setTheme] = useState('light');
const [isModalOpen, setIsModalOpen] = useState(false);
```

### 5.2 파생 상태 사용 금지

```tsx
// 금지 - 동기화 필요
const [items, setItems] = useState([]);
const [count, setCount] = useState(0);

useEffect(() => {
  setCount(items.length);
}, [items]);

// 권장 - 계산된 값 사용
const [items, setItems] = useState([]);
const count = items.length; // 또는 useMemo
```

---

## 6. 컴포넌트 구조 패턴

### 6.1 단일 책임 원칙

```tsx
// 금지 - 하나의 컴포넌트가 너무 많은 역할
function UserDashboard() {
  // 사용자 정보 fetch
  // 통계 계산
  // 그래프 렌더링
  // 알림 표시
  // 설정 관리
  return (...);
}

// 권장 - 역할별 분리
function UserDashboard() {
  return (
    <DashboardLayout>
      <UserInfo />
      <UserStats />
      <ActivityChart />
      <NotificationList />
    </DashboardLayout>
  );
}
```

### 6.2 컴포넌트 크기 가이드

| 기준 | 권장 |
|------|------|
| 라인 수 | 150줄 이하 |
| JSX depth | 5단계 이하 |
| Props 개수 | 8개 이하 |
| useState 개수 | 5개 이하 |

---

## 7. Hooks 사용 패턴

### 7.1 커스텀 Hook 추출 기준

```tsx
// 추출 권장 케이스
// 1. 3개 이상의 useState가 관련된 로직
// 2. useEffect + useState 조합
// 3. 재사용 가능한 로직

// 예시
function useBookProgress(bookId: string) {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProgress(bookId).then(setProgress);
  }, [bookId]);

  return { progress, isLoading };
}
```

### 7.2 useEffect 최소화

```tsx
// 피해야 할 패턴 - 체이닝 effect
useEffect(() => { setA(...) }, [x]);
useEffect(() => { setB(...) }, [a]);
useEffect(() => { setC(...) }, [b]);

// 권장 - 하나의 effect 또는 로직 통합
useEffect(() => {
  const result = computeAll(x);
  setA(result.a);
  setB(result.b);
  setC(result.c);
}, [x]);
```

---

## 8. Props 전달 패턴

### 8.1 Spread 연산자 주의

```tsx
// 주의 - 불필요한 props 전달 가능
<ChildComponent {...props} />

// 권장 - 명시적 전달
<ChildComponent
  title={props.title}
  onClick={props.onClick}
/>
```

### 8.2 children 활용

```tsx
// 권장 - 합성 패턴
<Card>
  <CardHeader>제목</CardHeader>
  <CardContent>내용</CardContent>
</Card>

// 피해야 할 패턴 - 과도한 props
<Card
  headerTitle="제목"
  headerIcon={<Icon />}
  headerAction={<Button />}
  content="내용"
  footerLeft={<Text />}
  footerRight={<Button />}
/>
```

---

## 변경 로그

| 날짜 | 변경 내용 |
|------|----------|
| 2025-02-06 | 최초 생성 |
