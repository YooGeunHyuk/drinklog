# DRINKLOG (주로) — 픽셀 아트 디자인 시스템 가이드 v1

> **목적:** Retro Diffusion으로 LEVELS 99 + 마일스톤 + 업적 + UI 픽셀 아이콘 시리즈를 일관되게 생성하기 위한 단일 source-of-truth.
>
> **이 문서가 모든 픽셀 아트 생성의 기준점.** Style Seed를 모든 프롬프트의 공통 prefix로 사용 → 시리즈 일관성 확보. Arc별 톤 modifier + 항목별 서브젝트 프롬프트는 그 뒤에 붙는 차별화 부분.

---

## 0. 핵심 결정 사항

| 결정 | 내용 |
|---|---|
| **메인 등급 시스템** | **LEVELS 99 (9 Arc × 11 레벨)** 만 사용 |
| **흡수 완료** | BADGES 47 + MEDALS 20 → 이미 LEVELS 99에 통합됨 ([`milestones.ts`](../src/constants/milestones.ts) 4번 줄: "47 뱃지 + 20 훈장 + 32 신규 흑역사"). `Badge`, `Medal`은 `Level`의 alias |
| **별도 자산 생성 X** | BADGES·MEDALS는 LEVELS 99 자산이 그대로 커버 (`badges-final-v3.md`는 참고용 보존) |
| **유지** | MILESTONES 34 · CATEGORY_MILESTONES 47 · ACHIEVEMENTS 101 |
| **생성 도구** | Retro Diffusion (RD Plus / RD Flux 권장) |
| **소스 데이터** | [`levels-milestones-achievements-final.md`](./levels-milestones-achievements-final.md) |
| **자산 위치/명명** | [`assets/icons/README.md`](../assets/icons/README.md) |

---

## 1. Style Seed (모든 프롬프트 공통 prefix)

모든 항목 프롬프트는 아래 시드 + Arc 톤 modifier + 항목별 서브젝트로 조립.

```
pixel art icon, 64x64 retro game style, centered single subject,
limited 16-color palette, dark navy background or transparent,
amber accent #FF6B35, clean pixel shading with 1-pixel outline,
soft dithering for transitions, isolated subject with clear silhouette,
mobile achievement icon, consistent series style,
Korean drinking culture motif where applicable
```

**사이즈가 다를 경우** `64x64` 부분만 교체:
- UI utility: `32x32 retro game style`
- 마일스톤 축하 일러: `128x128 detailed pixel art`
- 공유 카드 배경: `1080x1920 pixel art scene`

---

## 2. Negative Prompt (모든 항목 공통)

```
text, letters, words, watermark, signature, multiple subjects,
3D render, photorealistic, anti-aliased, smooth gradients, blurry,
modern flat illustration, vector graphics, harsh contrast,
NSFW, sexual content, gore, violence, depressing tone, dark/sad mood
```

> Arc 4(무너진다) · Arc 5(이불킥)는 부정적 정서를 다루지만 **코믹·자조적**으로 표현해야 하므로 "depressing tone"과 "dark/sad mood"를 negative에 명시해 둠.

---

## 3. 팔레트

### 3.1 베이스 8색 (UI · 구조)
| 역할 | Hex | 비고 |
|---|---|---|
| 깊은 검정 | `#0A0A0A` | 외곽선·고정 그림자 |
| UI 배경 | `#1A1A1A` | 다크 배경 |
| 보더 | `#333333` | 카드/구획선 |
| 비활성 | `#707070` | 잠금·secondary 텍스트 |
| 부드러운 텍스트 | `#B0B0B0` | 밝은 회색 |
| 화이트 | `#FFFFFF` | 하이라이트 |
| 브랜드 오렌지 | `#FF6B35` | 액센트 |
| 오렌지 그림자 | `#E55A25` | 음영 |

### 3.2 카테고리 7색 (주종)
| 카테고리 | Hex | 모티프 |
|---|---|---|
| 소주 | `#4FC3F7` | 초록·하늘색 톤 |
| 맥주 | `#FFD54F` | 황금색 |
| 막걸리 | `#E0E0E0` | 유백색 |
| 와인 | `#CE93D8` | 버건디·보라 |
| 위스키 | `#FFB74D` | 앰버 |
| 양주 | `#A1887F` | 브라운 |
| 기타 | `#90A4AE` | 블루그레이 |

### 3.3 Arc별 액센트 팔레트
> [`badges-final-v3.md`](./badges-final-v3.md)와 [`levels-…final.md`](./levels-milestones-achievements-final.md)의 BG/Text 페어 기반. LEVELS 9 Arc에 1:1 매핑.

| Arc | 톤 | 메인 | 액센트 | BG (참고) |
|---|---|---|---|---|
| 1 모른다 (Lv 1–11) | 새싹 그린 | `#2E7D32` | `#8BC34A` | `#E8F5E9` |
| 2 배운다 (Lv 12–22) | 페일 블루 | `#1565C0` | `#64B5F6` | `#E3F2FD` |
| 3 설친다 (Lv 23–33) | 앰버 | `#F57F17` | `#FFB74D` | `#FFF8E1` |
| 4 무너진다 (Lv 34–44) | 코럴 | `#C62828` | `#EF5350` | `#FFEBEE` |
| 5 이불킥 (Lv 45–55) | 토프 그레이 | `#37474F` | `#90A4AE` | `#ECEFF1` |
| 6 회복한다 (Lv 56–66) | 세이지·티얼 | `#004D40` | `#4DB6AC` | `#E0F2F1` |
| 7 즐긴다 (Lv 67–77) | 인디고 | `#1A237E` | `#5C6BC0` | `#E8EAF6` |
| 8 달관한다 (Lv 78–88) | 바이올렛 | `#311B92` | `#9575CD` | `#D1C4E9` |
| 9 전설 (Lv 89–99) | 코스믹 + 골드 | `#0D0D2E` | `#F0C75E` | 검정+금 |

> 후반 아크(8–9)는 어두운 BG + 금색/보라 액센트 — 신화·서예 톤. 픽셀 아트에서는 **딥 컬러 외곽 + 골드 1픽셀 하이라이트**로 표현.

---

## 4. 그리드 사이즈

| 사이즈 | 용도 | 비고 |
|---|---|---|
| 16×16 | 작은 UI 유틸 (back, close, x) | 가급적 32로 통일 권장 |
| **32×32** | 탭 아이콘 · 카테고리 필터 · UI 헬퍼 | UI 표준 |
| **64×64** | LEVELS · MILESTONES · ACHIEVEMENTS | **메인 자산** |
| 128×128 | 마일스톤 축하·고해상 뱃지 | showcase·공유 카드 내부 |
| 256×256 | Empty state 일러 | 스토리텔링 일러 |
| 1024×1024 | 앱 아이콘 · 스플래시 | 픽셀 + 외곽 안티앨리어싱 OK |
| **1080×1080** | 공유 카드 정사각 (카카오톡) | |
| **1080×1920** | 공유 카드 9:16 (인스타 스토리) | 메인 공유 포맷 |

> **저장 포맷:** 모든 자산 PNG 24/32-bit + 투명 배경. 64×64 이하는 **2× 업스케일 nearest-neighbor 버전**도 함께 저장 (다양한 화면 밀도 대응).

---

## 5. Arc별 톤 가이드 (LEVELS 9 Arc)

| Arc | Lv 범위 | 분위기 키워드 | 표현 톤 |
|---|---|---|---|
| 1 모른다 | 1–11 | naive, hesitant, soft | 새싹·물잔·작은 캐릭터, 파스텔 |
| 2 배운다 | 12–22 | respectful, traditional Korean etiquette | 술병·잔 인사·공손한 자세 |
| 3 설친다 | 23–33 | bold, dynamic, overconfident, warm | 호기 부리는 자세·도구·실험 |
| 4 무너진다 | 34–44 | wobbly, *playfully* drunk, comic mishap | 빙글빙글 눈·갈지자·통화 zzz |
| 5 이불킥 | 45–55 | morning regret, embarrassed, soft shame | 이불 속·발차기·핸드폰 정독 |
| 6 회복한다 | 56–66 | zen, dawn calm, recovery | 해장국·명상·아침 햇살 |
| 7 즐긴다 | 67–77 | refined connoisseur, mature warmth | 향 음미·페어링·달빛 |
| 8 달관한다 | 78–88 | mythic, oriental fantasy | 용·산·바다·잔 위 걷기 |
| 9 전설 | 89–99 | cosmic, ink-wash, gold | 우주·은하·서예 골드 |

**Arc 4–5 가이드:** 자조적 코미디 톤 유지. 우울·공격적·파괴적 묘사 금지. "취해서 사고치는 것"이 아니라 "취해서 귀여운 실수"로.

**Arc 8–9 가이드:** 신화·서예 톤이라 픽셀 아트의 거친 도트가 무드를 깰 수 있음 → **128×128 또는 그 이상 해상도**로 작업해서 디테일 확보.

---

## 6. 일관성 워크플로우

### 6.1 Arc 단위 시드 → 체이닝 전략

1. **Arc 1 시드 = Lv 1 (`🌱 물만 마시던 자`) 먼저 생성** → 마음에 들 때까지 반복 (시리즈 톤 결정)
2. **Lv 1 결과 PNG를 reference image로 첨부**해서 Lv 2~11 차례로 생성. seed 값도 재사용해 색감 유지
3. **Arc 전환 시 (Lv 11 → 12)**: 톤이 바뀌어야 하므로 reference도 교체. Arc 2 시드 (`🍶 첫 병의 추억`)를 새로 생성하고, 그걸 기준으로 Lv 13~22 진행
4. **이런 식으로 9 Arc 모두 완주.** 각 Arc 시드는 9개 (Lv 1, 12, 23, 34, 45, 56, 67, 78, 89 — 자세한 프롬프트는 §8)
5. **검수 그리드:** 11개씩 한 그리드에 모아 Arc 내 일관성 확인 → 마지막에 99개 풀그리드로 시리즈 일관성 최종 검수

### 6.2 시드값 정책

- **Arc 1**: seed `1100`
- **Arc 2**: seed `2200`
- **Arc 3**: seed `3300`
- ...
- **Arc 9**: seed `9900`

> Retro Diffusion은 같은 seed + 같은 prompt에서 거의 같은 결과를 냄. Arc 시드 재사용으로 톤 fixation.

### 6.3 한 항목당 4 variation 생성 → 1개 선택

리트리는 비싸지 않으니 매 항목마다 4개 받아서 best 1 선택. 못 쓰는 3개는 폐기. 시간 절약보다 일관성·완성도 우선.

---

## 7. Retro Diffusion 권장 설정

| 파라미터 | 값 | 비고 |
|---|---|---|
| 모델 | RD_FLUX 또는 RD_PLUS | 디테일 표현 좋음. RD_FAST는 검수용 |
| 프롬프트 스케일 (CFG) | 4–6 | 너무 높으면 밋밋 / 너무 낮으면 산만 |
| 스텝 수 | 25–30 | 디테일 충분 |
| Sampler | Euler / DPM++ 2M | 일관성 ↑ |
| 사이즈 | 64×64 (직접) 또는 128×128 후 다운스케일 nearest | 후자가 디테일 많이 나옴 |
| reference 가중치 | 0.4–0.6 | 너무 높으면 시드 똑같아짐, 낮으면 시리즈 흩어짐 |
| 팔레트 lock | 16-color palette 옵션 켜기 | 색감 통일 |

---

## 8. 9 Arc 대표 시드 프롬프트 (Lv 1, 12, 23, 34, 45, 56, 67, 78, 89)

> 각 항목 프롬프트 = **§1 Style Seed + §5 Arc 톤 키워드 + 아래 서브젝트** 합쳐 사용.
> Negative는 §2 그대로.

### Arc 1 시드 — Lv 1 🌱 물만 마시던 자
> A tiny green sprout growing from a clay pot, an empty water glass beside it,
> innocent newcomer mood, mint pastel highlights, no alcohol shown yet.

### Arc 2 시드 — Lv 12 🍶 첫 병의 추억
> A single empty soju bottle (소주병) glowing softly with sunset warmth,
> a small triangular flag planted on top labeled "first" (no actual text — just shape),
> nostalgic blue pastel background, achievement of finishing one's first solo bottle.

### Arc 3 시드 — Lv 23 🏺 주도(酒道)에 눈뜬 자
> A traditional Korean ceramic 술병 (sool-byeong) with a glowing golden third-eye motif on its surface,
> smug self-proclaimed master aura, amber radiating background.

### Arc 4 시드 — Lv 34 😵‍💫 눈이 풀린 장인
> A craftsman character with charming dazed swirly eyes, half-smile of honest tipsiness,
> slightly tilted halo above head, dusty peach background, gentle comic confusion (NOT dark).

### Arc 5 시드 — Lv 45 🛏 아침 반성 전문가
> A character buried under a thick blanket with only eyes peeking out,
> a thought bubble showing yesterday's tipsy silhouette,
> warm beige background, soft morning regret (comic, not depressing).

### Arc 6 시드 — Lv 56 🍵 해장의 달인
> A steaming bowl of haejang-guk (해장국) with chopsticks and a spoon,
> healing aura rising from the bowl, jade green background, hangover-designer mood.

### Arc 7 시드 — Lv 67 👃 향부터 보는 감식가
> A connoisseur's nose hovering over a wine glass,
> swirling aroma lines rising up like calligraphy strokes,
> refined sniffing pose, deep indigo background, classy.

### Arc 8 시드 — Lv 78 ⚖ 잔의 무게를 아는 자
> An Eastern dragon coiling around a sake cup with a balance scale floating beside,
> cloud motifs flowing, ember-orange and violet background, mythic elegance.

### Arc 9 시드 — Lv 89 🖌 취필(醉筆)의 장인
> A traditional Korean calligraphy brush dripping with sake instead of ink,
> a single bold gold stroke arcing across deep purple silk,
> ink-wash style with gold leaf accents, navy + gold palette.

> **나머지 90개 LEVELS 프롬프트는 [`levels-milestones-achievements-final.md`](./levels-milestones-achievements-final.md) §3.4–3.12의 칭호·설명을 §1 Style Seed에 붙여 생성.**
> 예: Lv 2 (`🤔 첫 잔의 망설임`) = Style Seed + Arc 1 키워드 + "a hesitant young character holding a soju glass at arm's length, staring at it cautiously, mint pastel."

---

## 9. 검수 체크리스트 (각 자산 통과 기준)

각 픽셀 아이콘이 통과해야 하는 8가지 — 안 맞으면 재생성 또는 후보정.

- [ ] **사이즈**: 정확한 그리드 (32/64/128)
- [ ] **팔레트**: §3 팔레트 안에서만 색 사용 (외부 색은 가까운 색으로 대체)
- [ ] **외곽선**: 1px 외곽 (배경과 명도 대비 충분)
- [ ] **실루엣**: 카테고리별 색을 다 빼고도 형태로 인식 가능한가
- [ ] **중앙 정렬**: 주제가 중앙. 여백 균일
- [ ] **시리즈 정합**: 같은 Arc 내 인접 레벨과 디자인 언어 일관 (선 굵기·셰이딩 패턴·디테일 밀도)
- [ ] **금지 요소 없음**: 텍스트 글자·워터마크·복수 주체 없음
- [ ] **Arc 톤**: §5 분위기 키워드와 부합

검수는 **11개 Arc 묶음 단위**로. 한 Arc 끝나야 다음 Arc로.

---

## 10. 변경 이력

- **v1 (2026-05-10)**: 초안. BADGES 폐기·LEVELS 99 채택 결정 반영.
