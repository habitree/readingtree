# 포인트 트리 성장 시각화 — 리서치·벤치마킹 & 차별화 설계

> ℹ️ 현행 자산 기준은 [tree-image-system.md](./tree-image-system.md)(v5)입니다. 본 문서는 그 **설계 근거**(심리학·앱 벤치마킹)입니다.

> 목적: "레벨마다 의미 있게 달라지고, 사용자가 변화에 관심(다음이 궁금)을 갖게" 하기 위한 근거 정리와 레벨별 차별화 설계.
> 작성: 2026-06-20 · 적용 대상: `public/images/trees/level-{1..10}`

---

## 1. 심리학적 근거

- **목표구배 효과(Goal-Gradient)**: 목표에 가까워질수록 동기가 커진다. 진척이 "보이게" 시각화하면 보상회로가 자극된다. 뇌는 시각 정보를 텍스트보다 훨씬 빠르게 처리하므로, 단계가 채워지는 "움직임"을 보면 완성에 다가간다고 느낀다.
- **부여된 진척(Endowed Progress)**: 이미 일부 진척했다고 느끼면 완료 동기가 커진다 → 초반 레벨도 "성장 중"으로 보여야 한다.
- **마일스톤 언락(Milestone Unlock)**: 단계 달성은 도파민 자극의 "서프라이즈 & 디라이트" 모먼트. **달성 직후 다음 마일스톤이 바로 보여야** 이탈하지 않고 다음 루프로 이어진다.
- **과잉정당화 회피(Overjustification)**: 외적 보상이 과하면 내적 동기가 줄어든다 → 화려함보다 "사랑스럽고 의미 있는" 변화로 절제.

## 2. 벤치마킹 사례

| 사례 | 핵심 메커니즘 | 우리 설계에 적용 |
|------|---------------|------------------|
| **Forest** | 나무 성장 자체가 집중의 보상 마커. 단순하지만 "키운다"는 성취 | 나무를 성장의 상징으로 유지, 성장 가시성 강화 |
| **Duolingo** | 스트릭·시그니처 캐릭터·단계별 시각 에스컬레이션, 손실 회피 | 레벨마다 시그니처 요소로 "정체성" 부여 |
| **Tamagotchi / Pokémon 진화** | 알→유아→성체 등 **단계별로 실루엣·신체 특징이 뚜렷이 달라** 변화가 한눈에 인식·수집 욕구 자극 | 크기만 키우지 않고 **형태·구조·요소를 단계별로 변형** |
| **마일스톤 언락(Yu-kai Chou)** | 달성 후 즉시 다음 목표 노출 = 참여 루프 | 레벨마다 확연히 달라 "다음 모습"이 기대되게 |

## 3. 도출된 디자인 원칙

1. **실루엣 차별화**: 레벨마다 캐노피 비율·줄기 높이·전체 형태를 다르게(가는 묘목 → 둥근 나무 → 넓게 퍼진 수관 → 언덕 위 거대수 → 숲).
2. **시그니처 요소**: 각 레벨에 고유한 "발견 포인트"(이슬·지지대·나비·새·둥지·꽃잎·수확 바구니·새 떼·태양·반딧불) → 디테일이 변화에 대한 관심을 만든다.
3. **마일스톤 모먼트**: 분기 레벨(5 첫 나무, 7 개화, 8 결실, 9 세계수, 10 황금숲)에 특별 연출.
4. **카드 합성 안전**: 다크 히어로 카드에서 묻히지 않게 시그니처 요소는 밝은/유채색으로(예: 새는 밝은 톤).
5. **절제된 매력**: 과한 이펙트 대신 자연스러운 디테일로 내적 동기 보호.

## 4. 레벨별 차별화 매핑

| Lv | 명칭 | 실루엣/형태 차별화 | 시그니처 요소 | 심리 트리거 |
|----|------|--------------------|----------------|-------------|
| 1 | 씨앗 | **나무 아님 — 흙 속 씨앗**(씨앗 본체+새 뿌리+발아 힌트) | 어린 뿌리·트임 새싹 | 시작점·부여된 진척 |
| 2 | 새싹 | **나무 아님 — 발아한 새싹**(씨앗 껍질+줄기+떡잎 2장) | 씨앗 껍질 | 초기 성장 가시화 |
| 3 | 떡잎 | **나무 아님 — 떡잎+첫 본잎**(떡잎 2장 + 본잎 3장) | 본잎 등장 | "키우는 중" 단서 |
| 4 | 어린나무 | **세로로 길쭉한 오벌**(뚜렷이 다른 실루엣) | 나비 | 변화 인식 |
| 5 | 나무 | 첫 둥근 '진짜 나무', 풍성 | **새 2마리**(마일스톤) | 첫 큰 성취 모먼트 |
| 6 | 큰나무 | **가로로 넓게 퍼진 수관**+가지 | 새 둥지(알) | 발견의 디테일 |
| 7 | 꽃나무 | 개화한 수관 + 핑크 오라 | 꽃·나비·떨어지는 꽃잎 | 서프라이즈&디라이트 |
| 8 | 열매나무 | 결실한 수관 + 주황 오라 | 열매·**수확 바구니**·낙과 | 보상의 구체화 |
| 9 | 세계수 | **신화적 거목**(거대 줄기+사방으로 뻗은 노출 뿌리)+청록 오라 | 코스믹 빛 입자(별빛) | 경외·희소성 |
| 10 | 황금숲 | **단일 나무가 아닌 실제 숲**(앞뒤열 5그루 + 깊이감) | 태양·반딧불·황금 잎·반짝임 | 최종 보상의 압도감 |

> 핵심: 1→10이 "같은 나무가 커지는" 수준을 넘어, **형태가 바뀌고 새 요소가 등장**하므로 매 단계가 수집·기대의 대상이 된다.

## 5. 적용 결과 & 후속

- 적용본: `public/images/trees/level-{1..10}.webp`(1024px 투명) + `-thumb.webp`(96px) + `.svg` 마스터. 생성기 `doc/design/tree-samples/gen_trees_v3.py`.
- 백업: 직전 버전 `public/images/trees/_backup_v2_20260620/`, 최초 AI 이미지 `_backup_20260620/`.
- **후속 제안**:
  - **레벨업 모먼트 연출**(코드): 레벨 상승 시 스케일 pop + 파티클 1회(`framer-motion` 보유). 마일스톤 언락 원칙의 핵심.
  - **다음 단계 미리보기**: 진척 바 옆에 "다음 Lv 실루엣" 흐릿하게 노출 → 목표구배·기대 강화.
  - `next/image` `sizes`/AVIF + 레벨 액센트 글로우 래퍼 적용.

---

## 참고 출처

- [Goal-Gradient Effect and the Psychology of Progress Bars (Bootcamp/Medium)](https://medium.com/design-bootcamp/goal-gradient-effect-and-the-psychology-of-progress-bars-df6fd889fd8e)
- [The goal gradient effect: Boosting user engagement (LogRocket)](https://blog.logrocket.com/ux-design/goal-gradient-effect/)
- [Progress Bars and Visual Rewards — Psychology (Cohorty)](https://www.cohorty.app/blog/progress-bars-and-visual-rewards-psychology)
- [How Gamification Catapulted Duolingo, Strava, and Forest (CitrusBits)](https://citrusbits.com/how-gamification-has-catapulted-duolingo-strava-and-forest-to-the-top-of-their-respective-app-categories/)
- [The Power of Milestone Unlocks in Gamification (Yu-kai Chou)](https://yukaichou.com/advanced-gamification/the-power-of-milestone-unlocks-in-gamification-design/)
- [Tamagotchi Evolution / Life Cycle (Tamagotchi Wiki)](https://tamagotchi.fandom.com/wiki/Evolution)
- [Streaks and Milestones for Gamification in Mobile Apps (Plotline)](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps)
