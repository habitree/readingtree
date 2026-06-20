# Habitree 포인트 트리 이미지 고도화 — 디자인 기획서

> ⚠️ **현행 기준은 [tree-image-system.md](./tree-image-system.md)(v5)입니다.** 본 문서는 초기 종합 기획(아트 디렉션·토큰·코드 적용)이며, 일부 초기 버전 세부(레벨 형태·512px 등)는 현행 사양으로 대체되었습니다. 근거 문서로 참조하세요.

> 목적: 포인트 레벨별로 보여지는 "성장 나무" 이미지를 **하나의 통일된 고품질 아트 세트**로 재구축하기 위한 종합 기획서.
> 이 문서는 ① 아트 디렉션 + 레벨별 생성 프롬프트(Claude Design / 이미지 생성용)와 ② 디자인 토큰·export·코드 적용(개발 핸드오프)을 한 번에 담는다.
> 작성 기준일: 2026-06-20 · 대상 버전: Habitree Reading Hub v4.x

---

## 1. 배경 & 현황 진단

현재 트리 이미지는 대시보드 히어로(`home-hero-section.tsx`), 리딩트리 카드(`reading-tree.tsx`), 게스트 배너(`guest-banner-client.tsx`)에서 노출된다. AI로 일괄 생성된 일러스트 10단계(`level-1~10.webp`)를 사용 중이며, 다음 한계가 "저퀄" 인상의 핵심 원인이다.

| 구분 | 현재 상태 | 문제 |
|------|-----------|------|
| 배경 | 미색(오프화이트)이 이미지에 구워짐 | 다크/그라데이션 카드 위에서 "붙여넣은 스티커"처럼 분리되어 보임 |
| 일관성 | 배치 생성 드리프트(화풍·조명·앵글·스케일 제각각) | 레벨이 올라가도 "같은 나무가 자라는" 연속성이 없음 |
| 해상도 | 512×512 단일 소스 | 모달·공유카드 등 큰 노출 시 흐릿. 레티나/밀도 대응 부재 |
| 포맷 | WebP/PNG 래스터만 | 확대 한계, 테마·애니메이션 변형 불가 |
| 밀도 대응 | full(512) + thumb(96) 2종 | `sizes`/AVIF/@2x 미적용 |

> 결론: 해상도 문제가 아니라 **(1) 배경 분리, (2) 화풍 비일관성**이 체감 품질을 가장 크게 떨어뜨린다. 재구축은 이 둘을 1순위로 해결한다.

---

## 2. 목표 & 품질 기준(Acceptance Criteria)

- **통일성**: 10개 레벨이 같은 화풍·구도·광원·접지 기준을 공유하며, 1→10이 한 그루가 성장하는 서사로 읽힌다.
- **합성성**: 배경 투명. 어떤 카드 배경(라이트/다크/그라데이션) 위에도 자연스럽게 얹힌다.
- **확장성**: 벡터(SVG) 우선 → 무한 확대, 수 KB, 테마/애니메이션 변형 가능. 래스터(PNG/WebP/AVIF)는 파생물.
- **밀도 대응**: 96px 썸네일부터 512px+ 대형까지 선명. `next/image` `sizes` + AVIF/WebP 자동.
- **브랜드 정합**: 앱의 forest 그린 팔레트 및 레벨별 액센트 색(`LEVEL_STYLES`)과 일치.

**완료 판정 체크리스트(레벨당):**
- [ ] 투명 배경(알파), 캔버스 1024×1024, 안전영역 준수
- [ ] 접지선(흙더미 baseline) 동일 위치, 줄기 중심 X=512 정렬
- [ ] 공통 광원(좌상단) · 잎 그라데이션 · 줄기 그라데이션 규칙 일치
- [ ] 레벨 액센트 색 반영(글로우/열매/꽃 등)
- [ ] SVG + PNG(1024) + WebP(full/thumb) + AVIF export 완비
- [ ] 다크 카드 목업에서 분리감 없이 합성됨

---

## 3. 아트 디렉션 (공통 화풍 규칙)

전체 세트가 반드시 공유하는 규칙. **레벨별 프롬프트보다 이 규칙이 우선한다.**

- **스타일**: 모던 플랫 일러스트 + 부드러운 셰이딩(soft gradient shading). 사실적 텍스처/사진톤 금지. 두꺼운 외곽선 없음.
- **구도(앵커)**: 정면, 살짝 위에서 본 3/4 시점. 나무는 항상 중앙(X=512), 뿌리는 동일한 흙더미 baseline(Y≈872)에 안착. 레벨이 커져도 접지선은 고정, 위로 자란다.
- **광원**: 좌상단 단일 광원. 잎/줄기 하이라이트는 좌상단, 그림자는 우하단·캐노피 하단(드롭섀도).
- **실루엣 우선**: 멀리서도 레벨이 구분되도록 캐노피 실루엣과 크기로 성장을 표현(잎 개수보다 덩어리 형태).
- **금지 요소(negative)**: 박힌 배경/바닥 박스, 화분(레벨7 이하), 텍스트·숫자, 사람·동물, 강한 원근, 사실적 사진 질감, 외곽 검은 라인, 워터마크.

---

## 4. 디자인 토큰

### 4.1 캔버스 · 구도 규격

| 항목 | 값 |
|------|----|
| 캔버스(viewBox) | `0 0 1024 1024` |
| 줄기 중심 | X = 512 |
| 접지 baseline(흙더미 중심) | Y ≈ 872 |
| 접지 그림자 | `ellipse cx=512 cy=902 rx≈250 ry≈46`, 색 `#16321f` opacity 0.30, blur |
| 안전영역(여백) | 상하좌우 최소 80px(잎/글로우가 잘리지 않게) |
| 캐노피 상단 한계 | Y ≥ 90 (글로우 포함) |

### 4.2 핵심 컬러 토큰(공통 자연 요소)

| 토큰 | HEX | 용도 |
|------|-----|------|
| leaf-dark | `#2E7D52` | 캐노피 뒤층/음영 |
| leaf-mid | `#46A06A` | 잎 기본 |
| leaf-light | `#86C98C` | 잎 밝은면 |
| leaf-hi | `#C7ECB6` | 잎 하이라이트(좌상단) |
| trunk-dark | `#6E4A2B` | 줄기 우측 음영 |
| trunk-mid | `#8A5E38` | 줄기 기본 |
| trunk-light | `#B5894F` | 줄기 좌측 하이라이트 |
| soil-dark | `#5E3D26` | 흙더미 음영 |
| soil-light | `#8A5E3C` | 흙더미 상단 |
| grass | `#5FB06A` | 잔디 프린지 |

### 4.3 레벨 액센트 색(코드 `LEVEL_STYLES.color`와 동일 — 글로우 링/특수효과에 사용)

| Lv | 액센트 | effect |
|----|--------|--------|
| 1 | `#a3785d` | none |
| 2 | `#86efac` | none |
| 3 | `#4ade80` | none |
| 4 | `#34d399` | subtle |
| 5 | `#22c55e` | subtle |
| 6 | `#15803d` | subtle |
| 7 | `#f472b6` | glow |
| 8 | `#f97316` | glow |
| 9 | `#2dd4bf` | glow |
| 10 | `#fbbf24` | premium |

### 4.4 셰이딩 규칙

- **잎 그라데이션**: radial, 좌상단(38%,30%) leaf-hi → leaf-light → leaf-mid.
- **줄기 그라데이션**: linear 가로, 좌 trunk-light → trunk-mid → 우 trunk-dark.
- **하이라이트**: 잎 덩어리 좌상단에 radial-fade(leaf-hi, 중심 불투명→가장자리 0). **불투명 원("거품")으로 그리지 말 것.**
- **캐노피 드롭섀도**: dy≈14, blur≈16, `#1c3a26` opacity 0.28.
- **글로우(Lv7+)**: 액센트 색 radial을 캐노피 뒤에 blur로 배치(가장자리 0 페이드, 하드 디스크 금지).

---

## 5. 10레벨 성장 시스템

명칭·임계포인트·설명은 코드(`types/points.ts` `LEVEL_DEFAULTS`)와 1:1 일치. "신규 비주얼 사양"이 이번 재구축의 디자인 지시다.

| Lv | 명칭(KO/EN) | 임계P | 모티프(현행 설명) | 신규 비주얼 사양 |
|----|-------------|------|------|------------------|
| 1 | 씨앗 / Seed | 0 | 독서의 씨앗을 심었어요 | 흙 위 새싹 떡잎 2장 + 씨앗 껍질. 줄기 없음. 매우 작게 |
| 2 | 새싹 / Sprout | 50 | 작은 새싹이 돋아났어요 | 짧은 줄기 + 잎 3~4장. 캐노피 미형성 |
| 3 | 떡잎 / Seedling | 150 | 첫 잎이 자라나고 있어요 | 가는 줄기 + 작은 캐노피 1덩어리(잎 5~6) |
| 4 | 어린나무 / Sapling | 350 | 줄기가 튼튼해지고 있어요 | 줄기 굵어짐 + 캐노피 2덩어리. subtle 액센트 |
| 5 | 나무 / Tree | 650 | 어엿한 나무로 성장했어요 | 균형 잡힌 둥근 캐노피, 첫 가지 분기 |
| 6 | 큰나무 / Big Tree | 1,100 | 풍성한 가지를 뻗고 있어요 | 풍성한 다층 캐노피 + 좌우 가지 2 |
| 7 | 꽃나무 / Blossom Tree | 1,800 | 아름다운 꽃이 피었어요 | 큰 캐노피 + 분홍 꽃 점경 + 핑크 글로우(`#f472b6`) |
| 8 | 열매나무 / Fruit Tree | 2,800 | 지혜의 열매가 맺혔어요 | 캐노피 + 주황 열매 + 오렌지 글로우(`#f97316`) |
| 9 | 세계수 / World Tree | 4,200 | 하늘을 향해 뻗은 거대한 나무 | 웅장·키 큰 줄기, 다중 가지, 청록 오라(`#2dd4bf`) |
| 10 | 황금숲 / Golden Forest | 6,500 | 전설의 황금빛 숲을 이뤘어요 | 황금빛 잎 톤 + 금색 열매 + 반짝임 + 골드 글로우(`#fbbf24`), premium |

성장 규칙: **접지선 고정 / 줄기 높이·굵기·캐노피 반경이 레벨에 비례 증가 / 7부터 액센트 점경(꽃·열매)·글로우 추가 / 10은 황금 변주.**

---

## 6. 레벨별 생성 프롬프트 (Claude Design / 이미지 생성용)

> 사용법: 아래 **공통 스타일 앵커**를 모든 레벨에 동일하게 prepend 하고, 레벨별 문장을 이어 붙인다. 동일 seed/스타일 고정으로 일관성을 확보한다. 영어 프롬프트 권장.

### 6.1 공통 스타일 앵커 (Style Anchor — 전 레벨 공통)

```
A single stylized tree, modern flat illustration with soft gradient shading,
front view from a slightly high 3/4 angle, centered, rooted on a small rounded
soil mound at the bottom. Single top-left light source: leaf highlights upper-left,
soft shadow under the canopy. Leaf palette greens #2E7D52/#46A06A/#86C98C with
#C7ECB6 highlights; trunk browns #8A5E38 with #B5894F left highlight; soil #8A5E3C.
Clean rounded leaf clusters (not realistic foliage), no thick outlines.
Transparent background. Square 1:1 canvas, generous padding, tree fully inside frame.
Cohesive series art — the same tree growing across levels, consistent proportions and anchor.
```

**Negative(공통):** `baked background, ground box, flower pot, text, numbers, people, animals, photoreal texture, harsh perspective, black outline, watermark, drop shadow on a white card`

### 6.2 레벨별 문장 (앵커에 이어 붙임)

```
Lv1 씨앗:   Just-sprouted seedling: two small cotyledon leaves on a tiny short stem,
            a cracked seed shell in the soil. No trunk yet. Very small subject.
Lv2 새싹:   Young sprout: short slender stem with 3–4 small leaves, no full canopy.
Lv3 떡잎:   Small seedling: thin trunk with one small rounded canopy cluster (5–6 leaves).
Lv4 어린나무: Sapling: thicker trunk, two leaf clusters forming a small canopy.
Lv5 나무:    Balanced young tree: rounded full canopy, first branch split.
Lv6 큰나무:  Lush mature tree: layered full canopy, two side branches, rich greens.
Lv7 꽃나무:  Large tree in bloom: full canopy dotted with soft pink blossoms,
            gentle pink aura (#f472b6) behind the canopy.
Lv8 열매나무: Fruit tree: full canopy with small orange fruits, warm orange glow (#f97316).
Lv9 세계수:  Majestic world tree: tall thick trunk, multiple branches, grand canopy,
            soft teal aura (#2dd4bf), awe-inspiring scale.
Lv10 황금숲: Legendary golden tree: golden-tinted leaves, gold fruits, sparkles,
            radiant golden glow (#fbbf24), premium and luminous.
```

> 비고: 본 기획서와 함께 제공되는 `doc/design/tree-samples/`의 벡터 샘플(Lv1·3·6·10)은 위 규칙을 코드로 구현한 레퍼런스다. 이미지 생성 결과가 샘플의 구도·접지·광원과 어긋나면 프롬프트보다 샘플 기준을 따른다.

---

## 7. Export & 파일 규격

| 포맷 | 사이즈 | 용도 | 비고 |
|------|--------|------|------|
| SVG | 벡터 | 마스터 소스 | 우선 포맷, 테마/애니메이션 변형 |
| PNG | 1024×1024 | 고해상 래스터 마스터 | 알파 |
| WebP | 1024 / 512 / 96(thumb) | 웹 노출 | quality 85~90 |
| AVIF | 1024 / 512 | 우선 서빙(용량↓) | `next/image` 자동 가능 |

- **네이밍(현행 유지)**: `level-{n}.webp`, `level-{n}-thumb.webp`, 추가 `level-{n}.svg`, `level-{n}.avif`.
- **경로**: `public/images/trees/`.
- **투명 배경 필수**, 캔버스/접지 baseline 규격(4.1) 통일.

---

## 8. 코드 적용 가이드(개발 핸드오프)

### 8.1 교체 대상

| 파일 | 위치 | 처리 |
|------|------|------|
| `components/dashboard/sections/home-hero-section.tsx` | L336–343 `<Image src="/images/trees/level-${safeLevel}.webp">` | 투명 소스 교체 + `sizes` + 글로우 래퍼 |
| `components/dashboard/sections/reading-tree.tsx` | L40 동일 패턴 | 동일 |
| `components/dashboard/guest-banner-client.tsx` | L24 `level-3.webp` 고정 | 신규 자산으로 교체 |

### 8.2 권장 변경

- **투명 배경**: 신규 자산은 알파 포함. 카드 위 미색 박스 제거.
- **반응형 서빙**: `next/image`에 `sizes="(max-width:640px) 96px, 112px"` 지정, AVIF 우선(`next.config.js` `images.formats`에 `image/avif` 포함 확인), `placeholder="blur"`로 로딩 깜빡임 제거.
- **레벨 글로우 링**: 트리 컨테이너 뒤에 액센트 색 radial 글로우. `getLevelStyle(level).effect`로 강도 분기:
  - `none`/`subtle`: 약한 글로우 또는 생략
  - `glow`: 액센트 색 중간 글로우
  - `premium`(Lv10): 골드 글로우 + 미세 펄스 애니메이션
- **(선택) 레벨업 모션**: 레벨 상승 시 스케일 pop + 파티클 1회. `framer-motion` 이미 사용 중(`reading-tree.tsx`).

### 8.3 글로우 래퍼 예시(개념)

```tsx
const { color, effect } = getLevelStyle(safeLevel);
<div className="relative w-24 h-24 sm:w-28 sm:h-28">
  {effect !== "none" && (
    <div
      aria-hidden
      className="absolute inset-0 rounded-full blur-xl opacity-60"
      style={{ background: `radial-gradient(circle, ${color}55 0%, transparent 70%)` }}
    />
  )}
  <Image
    src={`/images/trees/level-${safeLevel}.webp`}
    alt={`ReadingTree Lv.${safeLevel}`}
    fill sizes="(max-width:640px) 96px, 112px"
    className="object-contain drop-shadow-md" priority
  />
</div>
```

---

## 9. 작업 단계

1. **아트 확정**: 본 기획 + 샘플로 화풍 승인 → 10레벨 마스터 제작(SVG 우선 또는 생성 후 정리).
2. **Export 파이프라인**: SVG→PNG/WebP/AVIF/thumb 일괄(재생성 스크립트 `gen_trees.py` 확장 가능).
3. **자산 교체**: `public/images/trees/` 반영, 게스트 배너 포함.
4. **코드 반영**: 투명 배경·`sizes`/AVIF·글로우 래퍼 적용(8.1~8.3).
5. **QA**: 라이트/다크 카드, 모바일/레티나, 각 레벨 목업 검수(2장 체크리스트).

---

## 10. 참고 자료

- 레퍼런스 벡터 샘플: `doc/design/tree-samples/level-{1,3,6,10}.svg` (+ png/webp/thumb)
- 비교 목업: `doc/design/tree-samples/mockup_new_set.png`, `compare_lv3.png`
- 재생성 스크립트(파라미터 조정형): `doc/design/tree-samples/gen_trees.py`
- 레벨 정의 원본: `types/points.ts` (`LEVEL_DEFAULTS`, `LEVEL_STYLES`)
- 현행 렌더링: `home-hero-section.tsx`, `reading-tree.tsx`, `guest-banner-client.tsx`
