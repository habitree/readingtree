# 기록 공유 카드 디자인 및 기능 개선 프롬프트

이 문서는 `ShareNoteCard` 컴포넌트의 디자인 개선과 레이아웃 로직 수정을 위한 실행 프롬프트입니다.

## 실행 프롬프트 (Execution Prompt)

> **Note**: 아래의 내용은 실행 에이전트가 즉시 수행해야 할 작업 명령서입니다.

**Role**: Expert Frontend Developer (Next.js, Tailwind CSS)

**Objective**: `components/share/share-note-card.tsx`를 중심으로 기록 공유 카드의 디자인을 개선하고, 이미지 유무에 따른 레이아웃 처리를 완벽하게 구현하십시오.

**Constraints & Rules**:
1. **Language**: 한국어로 주석과 설명을 작성하십시오.
2. **Framework**: Next.js (App Router), Tailwind CSS.
3. **Consistency**: 기존 디자인 시스템과 조화를 이루되, 요청된 디자인 개선사항(가독성, 비율 등)을 최우선으로 반영하십시오.

**Tasks**:

### 기록 공유 화면 (Share Record) 수정 및 디자인 개선
- **Target**: `components/share/share-note-card.tsx` (핵심), `app/(main)/notes/[id]/page.tsx`, `components/share/simple-share-dialog.tsx`, `app/share/notes/[id]/page.tsx`
- **Goal**: 단일 컴포넌트(`ShareNoteCard`) 내에서 이미지 유무(`hasImage`)에 따라 최적화된 두 가지 레이아웃을 제공하고, 시각적 완성도를 높이는 것.

- **Action Items**:
    1. **Single Component Refactoring**: 
        - `ShareNoteCard` 컴포넌트가 `hasImage` prop(또는 이미지 데이터 존재 여부)에 따라 조건부 렌더링을 깔끔하게 처리하도록 로직을 정비하십시오.
    
    2. **Design Improvement (Image 없음)**:
        - **Layout**: 왼쪽 '인용구(Quote)' 섹션의 텍스트 영역 폭을 넓혀 가독성을 대폭 개선하십시오. (너무 좁아서 읽기 힘든 문제 해결)
        - **Visual**: 인용구 시작 부분에 스타일리시한 '큰 따옴표(Quote Icon)' 아이콘을 추가하여, 이미지가 있을 때와 유사한 브랜드 아이덴티티를 유지하십시오.
        - **Background**: 텍스트 뒤의 불필요하거나 산만한 배경(Background) 요소를 제거하고, 깔끔한 텍스트 중심 디자인으로 변경하여 자연스럽고 세련된 느낌을 주십시오.

    3. **Design Improvement (Image 있음)**:
        - **Structure**: 기존의 [왼쪽: 이미지 + 오른쪽: 인용구/감상] 2단 레이아웃 구조를 유지하십시오.
        - **Fix**: 책 표지 이미지가 세로로 지나치게 좁거나 찌그러져 보이는 문제를 `object-fit: cover` 또는 `contain` 및 적절한 Aspect Ratio 설정을 통해 해결하십시오. 책 표지 비율이 자연스러워야 합니다.

    4. **Bug Fix (Profile)**:
        - 하단 `by [Profile]` 영역(`ShareFooter` 등)에서 사용자 프로필 이미지와 닉네임이 로딩되지 않거나 깨지는 현상을 해결하십시오. props 전달 과정이나 데이터 페칭 로직을 점검하십시오.
