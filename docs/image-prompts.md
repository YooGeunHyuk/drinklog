# DRINKLOG (酒路) — 47 뱃지 이미지 생성 프롬프트

> **대상:** Nano Banana (Gemini Image), Midjourney, SDXL, DALL·E 등 이미지 생성 AI
>
> **사용법:** "Style Seed"를 모든 프롬프트의 공통 prefix로 사용 → 시리즈 일관성 확보. 단계별 프롬프트는 그 뒤에 붙는 차별화 부분.
>
> **마스터 데이터:** `docs/badges-final-v3.md` 참조

---

## Style Seed (공통 prefix — 47개 모두 동일)

```
A circular achievement badge icon, flat illustration with subtle gradient shading,
soft hand-drawn line, centered single subject, square composition 1024x1024,
no text, no letters, clean iconographic, slight Korean ink painting (수묵화) accent,
warm storytelling tone, mobile app badge series, consistent art style across set.
```

**Negative (모든 프롬프트 공통):** `text, letters, watermark, multiple subjects, 3D render, photorealistic, harsh shadows, gritty, gore, sexual content`

---

## Arc별 톤 가이드

| Arc | 분위기 키워드 | 컬러 팔레트 |
|-----|--------------|-----------|
| 1 모른다 | naive, soft, hesitant, pastel | mint, soft green, blue-grey |
| 2 배운다 | respectful, traditional Korean etiquette | sky blue, lavender, pale violet |
| 3 설친다 | bold, dynamic, overconfident, warm | amber, orange, ochre |
| 4 무너진다 | wobbly, comic mishap, *playfully* drunk (not dark) | salmon pink, dusty rose, lilac |
| 5 이불킥 | morning regret, embarrassed, soft shame | warm beige, taupe, cool grey |
| 6 회복한다 | zen, dawn calm, recovery | sage, teal, soft cyan |
| 7 즐긴다 | refined connoisseur, mature warmth | deep blue, indigo, forest |
| 8 달관한다 | mythic epic, oriental fantasy | ember, ocean, starry indigo |
| 9 전설이 된다 | cosmic, 수묵화 ink-wash, gold accents | navy, deep purple, black + gold |

---

## 47 Badge Prompts

각 항목은 **Style Seed + 아래 내용**을 합쳐 사용.
색상 코드는 `BG` 컬러 (참고용 — AI가 정확히 못 맞춰도 톤만 비슷하면 OK).

### Arc 1 · 모른다

**#1 물만 마시던 자** · BG `#E8F5E9`
> A small sprouting seedling next to an empty water glass, innocent newcomer character, mint pastel background, naive and pure mood.

**#2 볼 빨간 새내기** · BG `#F1F8E9`
> A young character with rosy red cheeks and shy bubbles around their face, holding a tiny soju glass with one tentative sip, soft green pastel background, embarrassed first-sip charm.

**#3 초보운전 주당** · BG `#E0F2F1`
> A "beginner driver" yellow-green leaf decal repurposed onto a soju bottle, wobbly steering wheel made of bottle cap, cautious but proud rookie energy, teal pastel.

**#4 책으로 배운 주도** · BG `#E0F7FA`
> An open old book with diagrams of how to pour and receive Korean drinks, reading glasses resting on it, theory-heavy bookish vibe, cool blue pastel background.

**#5 선무당이 사람 잡기 전** · BG `#E8EAF6`
> A swirling spiral 🌀 motif over a tipsy character about to make a bad decision, warning-yellow halo, "the calm before the chaos" tension, indigo pastel background, slightly comic.

### Arc 2 · 배운다

**#6 첫 병의 추억** · BG `#E3F2FD`
> A single empty soju bottle (소주병) glowing softly with sunset light, small flag of "first" planted in it, nostalgic blue pastel background, achievement of finishing one's first solo bottle.

**#7 두 손으로 따르는 견습** · BG `#E1F5FE`
> A young apprentice character carefully pouring soju with both hands toward a senior's cup, traditional Korean drinking etiquette pose, respectful bow at slight angle, sky blue background.

**#8 선배의 잔을 보고 배우는 자** · BG `#F3E5F5`
> A junior peeking at a senior's drinking cup as if studying it, observant student vibe, mirror motif behind shoulder, soft lavender background, learning-by-watching mood.

**#9 곁들이의 달인** · BG `#EDE7F6`
> A pair of chopsticks 🥢 hovering thoughtfully over an array of Korean side dishes (안주), connoisseur of pairings, light violet pastel.

**#10 잔을 정확히 비우는 명사수** · BG `#E8EAF6`
> A small tilted soju glass with a target/bullseye pattern at the bottom, last drop suspended mid-air, sharpshooter precision, indigo pastel.

### Arc 3 · 설친다

**#11 주도(酒道)에 눈뜬 자** · BG `#FFF8E1`
> A traditional Korean ceramic 술병 (sool-byeong) with a small glowing third-eye opening on its surface, "self-proclaimed master" smug aura, amber background.

**#12 맛을 탐구하는 자** · BG `#FFF3E0`
> A small chemistry flask ⚗️ filled with soju, three thermometers showing different temperatures, taste-research scientist mood, warm orange background.

**#13 한 병이 가벼운 견습** · BG `#FFECB3`
> A character casually flipping a soju bottle like a feather, bottle weighing as much as a sheet of paper on a tiny scale, "warm-up only" attitude, golden yellow.

**#14 두 병을 예열로 쓰는 자** · BG `#FFE0B2`
> A heavy hammer 🔨 striking two soju bottles like an anvil, sparks flying, warm-up before the real match, ochre orange background.

**#15 주석(酒席)의 단골** · BG `#FFD180`
> A small medal 🎖 hanging from the corner of a reserved drinking table seat, "always-prepared spot" energy, deep amber background.

### Arc 4 · 무너진다 *(comic, not dark)*

**#16 눈이 풀린 장인** · BG `#FFF3E0`
> A craftsman character with charming dazed swirly eyes 😵‍💫, half-smile of honesty, slightly tilted halo, dusty peach background, gentle comic confusion.

**#17 "나 안 취했어" 선언가** · BG `#FBE9E7`
> A character making a confident "no!" hand gesture 🙅 while clearly tipsy, denial speech bubble (no text — just motion lines), salmon pink background, ironic comic tone.

**#18 말이 꼬이는 명인** · BG `#FFEBEE`
> A character with tongue tied in a literal knot, speech wavy lines getting lost in a maze, woozy face 🥴, pastel pink background, gentle slapstick.

**#19 했던 말 또 하는 자** · BG `#FCE4EC`
> A loop arrow 🔁 swirling around a character's head with three identical speech bubbles stacking, repeating-the-story gag, soft rose background.

**#20 갈지자 보행 마스터** · BG `#F8BBD0`
> A duck 🦆-shaped trail of footprints zigzagging across the badge in a "之" character pattern, diagonal walking, light coral background, comic wobble.

**#21 새벽 3시의 작문가** · BG `#E1BEE7`
> A glowing phone screen at 3 AM with a tangled scribble of long messages, moon outside the window, the moment-of-regret-yet-to-come, lilac purple background.

**#22 어제가 흐릿한 명인** · BG `#D1C4E9`
> A foggy 🌫 cloud erasing yesterday's calendar page, blurred memory motif, dusty violet background, blackout collector charm.

### Arc 5 · 이불킥의 아침

**#23 아침 반성 전문가** · BG `#FFF8E1`
> A character buried under a thick blanket with only eyes peeking, replaying yesterday in a thought bubble, morning regret, warm beige background.

**#24 이불킥 유단자** · BG `#EFEBE9`
> A martial-arts black-belt foot 🦶 kicking out from under a blanket, "kick-of-shame" black belt earned, taupe background, comic exasperation.

**#25 새벽 문자의 주인** · BG `#ECEFF1`
> A phone with no-signal 📵 icon next to a "sent at 3:42 AM" envelope sealed with wax, regretful aura, cool grey background.

**#26 택시기사님의 증언이 필요한 자** · BG `#CFD8DC`
> A small taxi 🚕 driving through morning fog, with a speech bubble of question marks rising from the back seat, witness-needed mystery, slate grey.

**#27 다시는 안 마신다 맹세한 자** · BG `#B0BEC5`
> A character with a zipped-mouth 🤐 making a solemn pinky-promise, seven crumpled "this time I mean it" papers around them, foggy blue-grey background, ironic vow.

### Arc 6 · 회복한다

**#28 해장의 달인** · BG `#E0F2F1`
> A steaming bowl of haejang-guk (해장국) with chopsticks, healing aura, jade green background, hangover designer mood.

**#29 장문 사과 전문가** · BG `#E0F7FA`
> A long handwritten letter 📝 with morning sunlight streaming on it, atonement for last night's messages, soft cyan background, sincere repentance.

**#30 다음 날 멀쩡 기술자** · BG `#E8F5E9`
> A meditating 🧘 figure dusting off invisible hangover particles, calm posture, jade green background, "perfectly fine the next day" technician.

**#31 해가 뜨면 다른 사람** · BG `#F1F8E9`
> Two figures back-to-back: one tipsy silhouette in moonlight, one composed silhouette in dawn light, transformation motif, fresh green background.

**#32 취기 속의 명상가** · BG `#EDE7F6`
> A monk-like figure meditating beneath a single floating sake cup with stars 🌌 in the cup, finding zen in tipsiness, lavender background.

### Arc 7 · 즐긴다

**#33 향부터 보는 감식가** · BG `#E8EAF6`
> A connoisseur's nose 👃 hovering over a wine glass, swirling aroma lines rising up, refined sniffing pose, deep indigo background, classy.

**#34 취향 있는 미식가** · BG `#E3F2FD`
> A wine glass 🍷 paired with a small plate of cheese and Korean side dish, harmony of pairing, navy background, mature foodie vibe.

**#35 단골집 문을 아는 자** · BG `#E1F5FE`
> A traditional Korean lantern 🏮 above a wooden door slightly ajar, character standing first in line before opening hours, midnight blue background, regular's pride.

**#36 새벽 편지에 답장이 오는 자** · BG `#E0F2F1`
> A handwritten letter ✉️ with a returning envelope flying back at dawn, two birds carrying messages, teal background, reciprocated late-night sincerity.

**#37 오래 묵힐 술을 고르는 자** · BG `#E8F5E9`
> A wooden oak cask 🪵 with a "10 years later" hourglass beside it, patient connoisseur's eye, deep forest green background, long-game collector.

### Arc 8 · 달관한다 *(mythic, oriental fantasy)*

**#38 잔을 다루는 용** · BG `#FFF8E1`
> A graceful Eastern dragon 🐉 coiling around a single sake cup, clouds moving with each pour, ember orange background, mythic elegance.

**#39 산을 비운 자** · BG `#FFECB3`
> A drained mountain peak 🏔 (Hallasan silhouette) being lifted as if it were a giant cup, last drop falling, golden background, "drank a mountain dry" myth.

**#40 바다를 마신 자** · BG `#B3E5FC`
> An ocean wave 🌊 curling into a giant chalice, character holding it up calmly, deep aquamarine background, "drank the sea" boldness.

**#41 별을 담은 잔의 주인** · BG `#C5CAE9`
> A wine glass holding a swirling constellation ✨ inside, tiny galaxy shimmering at the rim, dusty indigo background, celestial collector.

**#42 술잔 위를 걷는 자** · BG `#D1C4E9`
> A serene figure 🕊 walking lightly across rims of floating sake cups, gravity-defying poise, deep violet background, transcendent calm.

### Arc 9 · 전설이 된다 *(수묵화 ink-wash + gold)*

**#43 취필(醉筆)의 장인** · BG `#311B92` · Text `#FFD54F`
> A traditional Korean calligraphy brush 🖌 dripping with sake instead of ink, single bold gold stroke across deep purple silk, 수묵화 ink-wash style with gold leaf accents.

**#44 월하독작(月下獨酌)** · BG `#1A237E` · Text `#FFECB3`
> A solitary figure pouring drink under a full moon 🌕, two extra silhouettes (moon shadow + own shadow) joining as drinking companions, ink-wash painting style on deep blue silk, gold moon.

**#45 이태백의 술벗** · BG `#0D0D2E` · Text `#C5A3FF`
> Two figures across 1,300 years of time toasting through a swirling time portal, one in Tang dynasty robes (Li Bai 이태백), one modern silhouette, deep cosmic purple background, ink-wash mythic style with violet glow.

**#46 은하수를 한 모금에 담은 자** · BG `#0A0A1F` · Text `#F0C75E`
> A figure tilting back a giant cup as the entire Milky Way 🌠 pours into their mouth, stars falling like edible garnish, deep cosmic black background, ink-wash style with golden stars.

**#47 잔 속에 우주를 담은 자** · BG `#000000` · Text `#F0C75E`
> A simple round sake cup floating in absolute black void, the cup containing a swirling miniature universe with galaxies and nebulae inside, ultimate cosmic 수묵화 finale, golden ink rim, monumental stillness.

---

## 사용 팁

### Nano Banana (Gemini Image)
- 자연어 길이 OK. Style Seed + 단계 프롬프트 + Negative를 하나의 문단으로 합쳐 입력
- "make 4 variations" 추가하면 한 번에 변형 4개 받기 좋음
- 시리즈 일관성: 첫 번째 생성 결과를 reference로 attach하고 다음 단계 프롬프트 입력

### Midjourney
- `--ar 1:1 --stylize 250 --v 6` 권장
- Style Seed를 `--sref <url>`로 첫 번째 결과 이미지 url을 reference 삼아 두 번째부터 일관성 강화
- `--no text, letters, watermark` 추가

### SDXL / SD3
- LoRA 활용 시: Korean ink wash + flat illustration LoRA 조합
- ControlNet으로 원형 마스크 적용하면 뱃지 형태 일정해짐

### 일관성 관리 워크플로우
1. **Arc 1 #1을 먼저 생성** → 마음에 드는 스타일 결정
2. 그 결과를 reference로 #2, #3, #4… 순서대로 생성
3. 아크 전환 시(예: #5→#6) 톤이 점진적으로 바뀌도록 reference도 점진 교체
4. **최종 검수:** 47개를 한 그리드에 배치해서 시리즈로 어울리는지 확인

---

## 변경 이력

- **v3 (2026-04-25):** 47단계 + 9 아크 구조 확정. Arc 4 재배치, Arc 2/6/7 교체, 점수 1/2 다운스케일 반영.
