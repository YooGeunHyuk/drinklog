# DRINKLOG — 픽셀 아이콘 프롬프트 모음

> Retro Diffusion에 그대로 붙여넣을 수 있는 **완전체 프롬프트**가 누적되는 파일.
>
> - 시스템 가이드: [`pixel-art-style-guide.md`](./pixel-art-style-guide.md)
> - 체크리스트: [`icons-todo.md`](./icons-todo.md)
> - 자산 명명: [`assets/icons/README.md`](../assets/icons/README.md)
>
> **사용법:** 각 항목의 `Prompt`를 RD에 입력 → 4 variation 생성 → best 1 선택 → 저장 경로에 PNG 저장 → 이 파일의 `Status`를 `[x] 채택`으로 갱신.

---

## 항목 템플릿

```
### {ID} — {Emoji} {Title} ({Arc / 분류})

**Prompt:**
{Style Seed + Arc 톤 + Subject 합본}

**Negative:**
{공통 negative + 항목별 추가 제외어}

**RD 설정:** Model / CFG / Steps / Sampler / Size / Seed / Variations

**저장:** `assets/icons/.../<id>.png` (+ `@2x.png`)
**Status:** [ ] 생성중 / [x] 채택 / [~] 보류

**Notes:** (재생성 사유, 채택한 variation, 색감 메모 등)
```

---

## LEVELS

### Lv 1 — 🌱 물만 마시던 자 (Arc 1 모른다)

> 시리즈 전체 톤을 결정하는 **Arc 1 시드**. 이 결과가 Lv 2~11의 reference가 됨.

**Prompt:**
```
pixel art icon, 32x32, a sprout, transparent background
```

**Negative:**
```
text, watermark, photorealistic, background, scenery
```

**RD 설정:**
| 파라미터 | 값 |
|---|---|
| Model | RD_FLUX |
| CFG | 5 |
| Steps | 28 |
| Sampler | Euler |
| Size | **32×32** (native) |
| Seed | **1100** (Arc 1 고정) |
| Variations | 4 |

**저장:**
- `assets/icons/levels/lv01.png` (32×32 원본)
- `assets/icons/levels/lv01@2x.png` (64×64 nearest 업스케일)

**Status:** `[ ] 생성중`

**Notes:**
- 🌱 새싹 한 형태만. 화분·물·캐릭터·잎 디테일 추가 X.
- 이 자산이 **Arc 1 (Lv 2~11) 전체의 reference image**. 이후 레벨의 색감·외곽선 굵기 기준.

---

### Lv 2 — 🤔 첫 잔의 망설임 (Arc 1 모른다)

> 받아든 잔을 한참 들여다본 자.

**Prompt:**
```
pixel art icon, 32x32, an empty shot glass, transparent background
```

**Negative:**
```
text, watermark, photorealistic, background, scenery
```

> **Note:** 칭호 "🤔 첫 잔의 망설임" 중 **"첫 잔"** 부분을 단일 심볼로 채택. thinking face는 32×32에서 안 읽히고, "잔"이 시리즈 정체성(드링크 앱)과도 부합. 비어있는 소주잔으로 "아직 마시지 않은 첫 잔"의 의미 표현.

**RD 설정:** Lv 1과 동일 (Size 32×32, Seed `1100`)

**저장:**
- `assets/icons/levels/lv02.png` (32×32)
- `assets/icons/levels/lv02@2x.png` (64×64)

**Status:** `[ ] 생성중`

**Notes:**
- 빈 소주잔 한 형태만. 안에 액체 X, 손 X, 다른 소품 X.
- Lv 1 채택본을 reference image로 첨부 (시리즈 색감·외곽선 굵기 fixation).
- 만약 출력이 와인잔/맥주잔 형태로 나오면 `a small Korean soju shot glass` 또는 `a small clear shot glass`로 시도.

---

### Lv 3 — 🫧 볼 빨간 새내기 (Arc 1 모른다)

> 첫 모금에 볼이 발그레해졌어요.

**Prompt:**
```
pixel art icon, 64x64 retro game style, centered single subject, limited 16-color palette, transparent background, clean pixel shading with 1-pixel outline, soft dithering for color transitions, isolated subject with clear silhouette, mobile achievement icon, consistent series style. Arc 1 mood: naive, hesitant, shy first-sip blush, fresh-sprout green palette (#2E7D32 main, #8BC34A accent, mint pastel #E8F5E9 hints) with warm rosy pink (#F48FB1) cheek accent. Subject: a young chibi character with two prominent rosy-pink blushed circles on their cheeks, holding a tiny soju glass at chin level after one tentative first sip, three small bubble shapes floating gently around their face, shy embarrassed half-smile, soft mint pastel background, charming first-sip blush — NOT drunk, just innocently flushed.
```

**Negative · RD 설정:** Lv 1과 동일 (Seed `1100`)

**저장:** `assets/icons/levels/lv03.png` (+ `@2x.png`)

**Status:** `[ ] 생성중`

**Notes:** 볼빨간 효과를 너무 진하게 하면 "취함"으로 보임 → Arc 1 톤 깸. 부드러운 분홍 동그라미 2개로 한정.

---

### Lv 4 — 🌡 알콜 도수에 놀라는 자 (Arc 1 모른다)

> "이거 진짜 술이에요?"

**Prompt:**
```
pixel art icon, 64x64 retro game style, centered single subject, limited 16-color palette, transparent background, clean pixel shading with 1-pixel outline, soft dithering for color transitions, isolated subject with clear silhouette, mobile achievement icon, consistent series style. Arc 1 mood: naive, surprised innocent disbelief, fresh-sprout green palette (#2E7D32 main, #8BC34A accent, mint pastel #E8F5E9 hints) with shock-orange (#FF7043) thermometer accent. Subject: a tall vertical pixel-art thermometer with red-orange mercury rising sharply near the top, a small chibi character peeking out from behind the thermometer with O-shaped surprised round mouth and wide circular eyes, single sweat drop hovering near temple, comic shock pose, soft mint pastel background — innocent disbelief, NOT scared or terrified.
```

**Negative · RD 설정:** Lv 1과 동일 (Seed `1100`)

**저장:** `assets/icons/levels/lv04.png` (+ `@2x.png`)

**Status:** `[ ] 생성중`

**Notes:** 캐릭터가 너무 겁먹은 표정이면 Arc 4 톤으로 흘러가니 주의. "innocent surprise" 유지.

---

### Lv 5 — 🏁 초보운전 주당 (Arc 1 모른다)

> 자신감이 붙기 시작할 때가 제일 위험해요.

**Prompt:**
```
pixel art icon, 64x64 retro game style, centered single subject, limited 16-color palette, transparent background, clean pixel shading with 1-pixel outline, soft dithering for color transitions, isolated subject with clear silhouette, mobile achievement icon, consistent series style. Arc 1 mood: naive, overconfident-but-clumsy rookie energy, fresh-sprout green palette (#2E7D32 main, #8BC34A accent, mint pastel #E8F5E9 hints) with Korean novice-driver yellow-green leaf accent (#9CCC65) and a small red dot accent (#E57373). Subject: a small green soju bottle standing upright with a Korean "초보운전" beginner-driver yellow-green leaf shape decal stuck on its body, a tiny checkered black-and-white racing flag planted next to the bottle, three short curved motion lines suggesting wobbly novice steering, a small bottle-cap "steering wheel" lying on the ground, soft mint pastel background, cautious-but-proud rookie energy.
```

**Negative · RD 설정:** Lv 1과 동일 (Seed `1100`)

**저장:** `assets/icons/levels/lv05.png` (+ `@2x.png`)

**Status:** `[ ] 생성중`

**Notes:** 한국 "초보운전" 잎사귀 마크는 노랑+초록 반반인 V자 잎 모양. RD가 못 맞추면 단순 leaf shape으로도 OK.

---

### Lv 6 — 📚 책으로 배운 주도 (Arc 1 모른다)

> 이론은 빠삭한데 실전에선 좀 흔들려요.

**Prompt:**
```
pixel art icon, 64x64 retro game style, centered single subject, limited 16-color palette, transparent background, clean pixel shading with 1-pixel outline, soft dithering for color transitions, isolated subject with clear silhouette, mobile achievement icon, consistent series style. Arc 1 mood: naive, bookish, theory-over-practice scholarly, fresh-sprout green palette (#2E7D32 main, #8BC34A accent, mint pastel #E8F5E9 hints) with muted brown-tan (#A1887F) book accent. Subject: an open thick old hardcover book lying flat at slight 3/4 angle, the visible pages showing simplified silhouette diagrams (small bottle-and-cup shapes connected by dotted arrow lines indicating pour direction, NO actual readable text or letters), a pair of round reading glasses resting on the corner of the book, soft mint pastel background, scholarly bookish vibe with gentle warmth.
```

**Negative · RD 설정:** Lv 1과 동일 (Seed `1100`) — Negative에 `text, letters` 강조

**저장:** `assets/icons/levels/lv06.png` (+ `@2x.png`)

**Status:** `[ ] 생성중`

**Notes:** 책 펼친 페이지 위 다이어그램이 글자처럼 보이면 안 됨 (Negative에 text, letters 이미 포함되어 있지만 이 항목은 특히 주의). 도형 + 화살표만.

---

### Lv 7 — 🙏 받기만 하는 막내 (Arc 1 모른다)

> 따라드릴 줄 몰라 죄송한 자.

**Prompt:**
```
pixel art icon, 64x64 retro game style, centered single subject, limited 16-color palette, transparent background, clean pixel shading with 1-pixel outline, soft dithering for color transitions, isolated subject with clear silhouette, mobile achievement icon, consistent series style. Arc 1 mood: naive, humble apologetic, beginner Korean drinking etiquette, fresh-sprout green palette (#2E7D32 main, #8BC34A accent, mint pastel #E8F5E9 hints) with soft warm peach (#FFAB91) embarrassment accent. Subject: a small chibi character figure receiving an empty soju glass with both hands cupped together respectfully (a key Korean drinking etiquette pose), head bowed slightly forward at humble angle, a small sweat drop hovering near temple, the glass shown as small and empty, soft mint pastel background, apprentice mood — gentle apologetic shyness.
```

**Negative · RD 설정:** Lv 1과 동일 (Seed `1100`)

**저장:** `assets/icons/levels/lv07.png` (+ `@2x.png`)

**Status:** `[ ] 생성중`

**Notes:** 한국 예절의 "두 손 잔 받기" 자세가 명확하게 보여야 — 양 손바닥이 위로 향해 잔을 받치는 형태.

---

### Lv 8 — 🥂 첫 건배 (Arc 1 모른다)

> 잔을 맞댄 기억이 시작된 날.

**Prompt:**
```
pixel art icon, 64x64 retro game style, centered single subject, limited 16-color palette, transparent background, clean pixel shading with 1-pixel outline, soft dithering for color transitions, isolated subject with clear silhouette, mobile achievement icon, consistent series style. Arc 1 mood: naive, innocent first-toast warmth, fresh-sprout green palette (#2E7D32 main, #8BC34A accent, mint pastel #E8F5E9 hints) with subtle gold sparkle (#FFD54F) accent. Subject: two small soju glasses clinking together at the center of frame, a single small star-shaped golden sparkle right at the contact point between the glass rims, three short motion lines radiating outward from the impact, NO liquid spilling or splashing out, soft mint pastel background, gentle first-toast moment — warm and innocent, NOT rowdy or boisterous.
```

**Negative · RD 설정:** Lv 1과 동일 (Seed `1100`)

**저장:** `assets/icons/levels/lv08.png` (+ `@2x.png`)

**Status:** `[ ] 생성중`

**Notes:** sparkle은 1점만. 화려해지면 Arc 1 (모른다) 톤이 깨지고 Arc 7-9의 "거장" 톤처럼 보임.

---

### Lv 9 — 🍿 안주만 야무지게 먹는 자 (Arc 1 모른다)

> 술보단 안주가 본업인 사람.

**Prompt:**
```
pixel art icon, 64x64 retro game style, centered single subject, limited 16-color palette, transparent background, clean pixel shading with 1-pixel outline, soft dithering for color transitions, isolated subject with clear silhouette, mobile achievement icon, consistent series style. Arc 1 mood: naive, food-focused, drink-ignored cuteness, fresh-sprout green palette (#2E7D32 main, #8BC34A accent, mint pastel #E8F5E9 hints) with warm food-color accents (#FFB74D amber and #8D6E63 brown). Subject: a small chibi character figure eagerly holding chopsticks picking up a piece of Korean side dish (a small jeon pancake or piece of banchan), a tiny full untouched soju glass placed BESIDE them on a surface (NOT held by character), focused happy expression on the food, soft mint pastel background, food-priority charm — drink completely ignored.
```

**Negative · RD 설정:** Lv 1과 동일 (Seed `1100`)

**저장:** `assets/icons/levels/lv09.png` (+ `@2x.png`)

**Status:** `[ ] 생성중`

**Notes:** 잔이 캐릭터의 손에 들려있으면 의미가 깨짐 (술 우선이 됨). 반드시 옆에 따로 놓여있어야.

---

### Lv 10 — 🧴 한 잔에 얼굴 바뀌는 자 (Arc 1 모른다)

> 표정 관리에 실패하는 단계.

**Prompt:**
```
pixel art icon, 64x64 retro game style, centered single subject, limited 16-color palette, transparent background, clean pixel shading with 1-pixel outline, soft dithering for color transitions, isolated subject with clear silhouette, mobile achievement icon, consistent series style. Arc 1 mood: naive, comic before-after-one-sip transformation, charming face-control-failure, fresh-sprout green palette (#2E7D32 main, #8BC34A accent, mint pastel #E8F5E9 hints) with split contrast (cool mint left half, warm rosy-pink right half #F48FB1). Subject: a single chibi character's round face viewed front-on, the face vertically split exactly down the middle — left half pale skin tone with calm closed-eye expression, right half visibly flushed bright pink with crossed-eyes and silly half-grin, a small soju glass held below the chin at center, soft mint pastel background, comic before-after transformation — charming and humorous, NOT creepy or horror-style.
```

**Negative · RD 설정:** Lv 1과 동일 (Seed `1100`)

**저장:** `assets/icons/levels/lv10.png` (+ `@2x.png`)

**Status:** `[ ] 생성중`

**Notes:** 좌우 분할이 너무 sharp/horror style이면 부정적 정서. 부드러운 fade-line 또는 단순 색 차이로.

---

## 다음 작업 후보 (작성 전)

순서대로 추가 예정.

- [ ] **Lv 11** 🌀 선무당이 사람 잡기 전 (Arc 1 모른다 마지막)
- [ ] **Lv 12** 🍶 첫 병의 추억 (**Arc 2 시드** — 톤 전환점)
- [ ] **Lv 13~22** Arc 2 배운다
- [ ] **Lv 23** 🏺 주도(酒道)에 눈뜬 자 (**Arc 3 시드**)
- … (이후 99까지 동일 양식)

---

## 변경 이력

- **2026-05-10**: 초안. Lv 1 (🌱 물만 마시던 자) 프롬프트 추가.
