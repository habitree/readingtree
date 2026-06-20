# 포인트 트리 이미지 시스템 사양서 (정식 기준 · v5)

> **이 문서가 포인트 트리 이미지의 단일 기준(Source of Truth)입니다.**
> 레벨 데이터(`types/points.ts`)와 시각 자산(`public/images/trees/`)의 매핑·생성·교체 기준을 정의합니다.
> 최종 갱신: 2026-06-20 · 적용 버전: **v5** · 관련 근거: [design-brief](./tree-image-design-brief.md) · [benchmark](./tree-progression-benchmark.md)

---

## 1. 개요

사용자의 누적 포인트 레벨(1~10)에 따라 성장하는 트리 이미지를 노출한다. 이미지는 **레벨 번호로 키잉**되어 데이터(`LEVEL_DEFAULTS`)와 1:1로 묶인다. 코드 변경 없이 자산만 교체하면 반영된다.

설계 목표(근거 문서 참조): 레벨마다 **의미 있게 다른 표현**(실루엣·색감·시그니처)으로 변화에 대한 관심·동기를 유발하고, 다크/라이트 카드 어디서나 자연스럽게 합성되도록 **투명 배경 벡터 기반**으로 유지한다.

---

## 2. 레벨 ↔ 자산 매핑 (데이터 반영 기준)

명칭·임계포인트·액센트색·effect는 코드와 **반드시 일치**해야 한다 (원본: `types/points.ts`의 `LEVEL_DEFAULTS`, `LEVEL_STYLES`). "잎 톤/형태/시그니처"가 v5 시각 기준이다.

| Lv | 명칭(KO/EN) | 임계P | 액센트색 | effect | 잎 톤(v5) | 형태 | 시그니처 요소 |
|----|-------------|------:|----------|--------|-----------|------|----------------|
| 1 | 씨앗 / Seed | 0 | `#a3785d` | none | — | **흙 속 씨앗**(나무 아님) | 어린 뿌리·발아 힌트 |
| 2 | 새싹 / Sprout | 50 | `#86efac` | none | leafLin | **발아 새싹**(껍질+떡잎2) | 씨앗 껍질 |
| 3 | 떡잎 / Seedling | 150 | `#4ade80` | none | leafLin | **떡잎2+첫 본잎3** | 본잎 등장 |
| 4 | 어린나무 / Sapling | 350 | `#34d399` | subtle | Spring(연두) | 세로 컬럼(오벌) | 나비 |
| 5 | 나무 / Tree | 650 | `#22c55e` | subtle | Fresh(신록) | 둥근 | 새 2마리·그네 |
| 6 | 큰나무 / Big Tree | 1,100 | `#15803d` | subtle | Emerald(에메랄드) | **우산형**(넓고 납작) | 새 둥지 |
| 7 | 꽃나무 / Blossom Tree | 1,800 | `#f472b6` | glow | Fresh+분홍 개화 | 풍성 둥근 | 꽃·나비·꽃잎 |
| 8 | 열매나무 / Fruit Tree | 2,800 | `#f97316` | glow | Mature(올리브/만추) | 풍성 둥근 | 열매·수확 바구니 |
| 9 | 세계수 / World Tree | 4,200 | `#2dd4bf` | glow | Teal(청록) | **3단 적층 거목**+노출 뿌리 | 코스믹 별빛 |
| 10 | 황금숲 / Golden Forest | 6,500 | `#fbbf24` | premium | Gold(황금) | **숲(5그루)** | 태양·반딧불·반짝임 |

> 데이터 정합 규칙: 레벨 명칭·임계포인트·색을 바꾸면 본 표와 자산도 함께 갱신한다. 레벨 추가/삭제 시 자산 파일·생성기·본 표를 동기화한다.

---

## 3. 잎 색 팔레트 (v5)

생성기 `PALS` 딕셔너리와 일치. 레벨별 색 정체성을 만든다.

| 톤 | 사용 레벨 | grad(top→mid→bot) |
|----|-----------|-------------------|
| Spring | 4 | `#BCEB9C` → `#7FCB7A` → `#4FA85E` |
| Fresh | 5, 7 | `#7FC68A` → `#46A06A` → `#2C7A4F` |
| Emerald | 6 | `#5FB97E` → `#2E9460` → `#176B42` |
| Mature | 8 | `#9FC773` → `#5E9A4A` → `#3E7A38` |
| Teal | 9 | `#6FCBB0` → `#2E9E86` → `#1B6E62` |
| Gold | 10 | `#EAD46A` → `#C9A227` → `#8A7A2E` |

공통: 캔버스 `viewBox 0 0 1024 1024`, 줄기 중심 X=512, 접지 baseline Y≈874, 좌상단 광원, 투명 배경.

---

## 4. 자산 파일 규격

- **위치**: `public/images/trees/`
- **레벨당 파일**:
  - `level-{n}.webp` — 1024×1024, quality 88, **투명 배경** (서비스 노출용 마스터)
  - `level-{n}-thumb.webp` — 96×96 (썸네일)
  - `level-{n}.svg` — 벡터 마스터(재렌더·확대용)
- **네이밍**: `{n}` = 레벨 번호(1~10), `LEVEL_DEFAULTS.level`과 동일
- **용량 기준**: full webp 약 14~70KB

---

## 5. 생성 · 교체 절차 (재현 가이드)

**정식 생성기**: `doc/design/tree-samples/gen_trees_v5.py` (단독 실행, 외부 의존 없음)
**의존성**: `python3`, `cairosvg`, `Pillow`

```bash
cd doc/design/tree-samples
pip install cairosvg Pillow --break-system-packages    # 최초 1회

# 1) SVG 생성 → ./v5/level-{1..10}.svg
python3 gen_trees_v5.py

# 2) 1024 PNG → WebP(full/thumb) 렌더 + SVG 동봉
mkdir -p v5/out
for lv in $(seq 1 10); do
  python3 -c "import cairosvg; cairosvg.svg2png(url='v5/level-$lv.svg', write_to='v5/out/level-$lv.png', output_width=1024, output_height=1024)"
  python3 -c "from PIL import Image; im=Image.open('v5/out/level-$lv.png'); im.save('v5/out/level-$lv.webp','WEBP',quality=88,method=6); t=im.copy(); t.thumbnail((96,96),Image.LANCZOS); t.save('v5/out/level-$lv-thumb.webp','WEBP',quality=86)"
  cp "v5/level-$lv.svg" "v5/out/level-$lv.svg"
done

# 3) (교체 전) 현재 자산 백업 후 반영
cd ../../../public/images/trees
mkdir -p _backup_$(date +%Y%m%d) && cp level-*.webp level-*.svg _backup_$(date +%Y%m%d)/
cp ../../../doc/design/tree-samples/v5/out/level-*.webp .
cp ../../../doc/design/tree-samples/v5/out/level-*.svg .
```

> 색감/형태/시그니처 조정은 `gen_trees_v5.py`의 `PALS`(팔레트), `build()`(레벨 분기), 요소 함수(`canopy`/`world_tree`/`golden_forest` 등)에서 수정한다.

---

## 6. 코드 연동 지점

이미지는 아래에서 `src="/images/trees/level-${level}.webp"` 형태로 참조된다.

| 파일 | 위치 | 비고 |
|------|------|------|
| `components/dashboard/sections/home-hero-section.tsx` | L336–343 | 히어로 트리(우측) |
| `components/dashboard/sections/reading-tree.tsx` | L40 | 리딩트리 카드 |
| `components/dashboard/guest-banner-client.tsx` | L24 | 게스트 배너(level-3 고정) |

**후속(미적용) 권장**: `next/image` `sizes`/AVIF, `getLevelStyle(level).effect` 기반 액센트 글로우 래퍼, 레벨업 pop/파티클, "다음 레벨 미리보기".

---

## 7. 버전 · 백업 이력

`public/images/trees/` 내 백업 폴더로 모든 단계가 보존된다.

| 단계 | 설명 | 백업 폴더 |
|------|------|-----------|
| 최초 | AI 일러스트 512px(미색 배경) | `_backup_20260620/` |
| v2 | 자연스러운 고퀄 벡터(투명) | `_backup_v2_20260620/` |
| v3 | 레벨별 차별화(시그니처) | `_backup_v3_20260620/` |
| v4 | 씨앗/새싹/떡잎·세계수/황금숲 개념 정합 | `_backup_v4_20260620/` |
| **v5 (현재)** | 레벨별 색감·형태 분화 | — (적용 중) |

롤백: 해당 백업 폴더의 `level-*.webp/.svg`를 `public/images/trees/`로 복사.

---

## 8. 관련 문서

- [tree-image-design-brief.md](./tree-image-design-brief.md) — 초기 종합 기획(아트 디렉션·토큰·코드 적용)
- [tree-progression-benchmark.md](./tree-progression-benchmark.md) — 심리학·앱 벤치마킹 근거와 레벨 차별화 매핑
- 생성기/샘플: [tree-samples/](./tree-samples/) (정식 생성기 `gen_trees_v5.py`)
