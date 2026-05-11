# Procreate 픽셀 아이콘 작업 가이드

> Procreate로 시드 아이콘을 정성스럽게 만들고, 그 결과를 Retro Diffusion의 reference로 넘겨 나머지를 일괄 생성하는 하이브리드 워크플로우.

## 🎯 무엇을 Procreate로 만들 것인가

| 우선순위 | 항목 | 사이즈 | 개수 | 이유 |
|---|---|---|---|---|
| 1 | **앱 아이콘** | 1024×1024 | 1 | 가장 임팩트 큼, 1개라 시간 투자 가치 |
| 2 | **9 Arc 시드** | 32×32 (또는 64×64) | 9 | 시리즈 톤을 잡는 anchor |
| 3 | **공유 카드 액자** | 1080×1920 | 1 | 자랑 카드의 시각적 차별점 |

나머지 90 LEVELS + 마일스톤 + 업적은 Retro Diffusion에 위 결과를 reference로 넘겨 일괄 생성.

---

## 1️⃣ Procreate 캔버스 셋업

### 새 캔버스 만들기
1. Procreate 열기 → 우상단 **+** → 사용자 정의
2. **Width**: 32, **Height**: 32 (px), **DPI**: 72
3. 색 공간: **sRGB** (출시용 표준)
4. **Create**

> 캔버스가 작아서 잘 안 보이면 두 손가락으로 핀치해서 확대. 픽셀 grid가 자연스럽게 보임.

### Drawing Guide 활성화 (픽셀 그리드)
1. **Actions (스패너) → Canvas → Drawing Guide** ON
2. **Edit Drawing Guide** 클릭
3. **2D Grid** 선택
4. Grid size: **1px**, Thickness: **50%**, Opacity: **30%**
5. Done

이제 각 픽셀 단위가 보임. 정확하게 1픽셀씩 찍을 수 있어요.

---

## 2️⃣ 팔레트 등록 (24색)

스타일 가이드의 팔레트를 Procreate에 등록:

1. 우상단 **색상 원** 탭
2. **Palettes** 탭으로 이동
3. 우상단 **+** → **Create new palette**
4. 이름: "DRINKLOG"
5. 아래 색을 하나씩 등록 (탭하면 슬롯에 색 추가):

### 베이스 8색
```
#0A0A0A  깊은 검정
#1A1A1A  UI 배경
#333333  보더
#707070  비활성
#B0B0B0  부드러운 텍스트
#FFFFFF  화이트
#FF6B35  브랜드 오렌지
#E55A25  오렌지 그림자
```

### 카테고리 7색
```
#4FC3F7  소주 (하늘색)
#FFD54F  맥주 (황금색)
#E0E0E0  막걸리 (유백색)
#CE93D8  와인 (보라)
#FFB74D  위스키 (앰버)
#A1887F  양주 (브라운)
#90A4AE  기타 (블루그레이)
```

### Arc별 액센트 9색 (대표값)
```
#8BC34A  Arc 1 모른다 (새싹 그린)
#64B5F6  Arc 2 배운다 (페일 블루)
#FFB74D  Arc 3 설친다 (앰버 / 위스키와 같음)
#EF5350  Arc 4 무너진다 (코럴)
#90A4AE  Arc 5 이불킥 (그레이 / 기타와 같음)
#4DB6AC  Arc 6 회복 (티얼)
#5C6BC0  Arc 7 즐긴다 (인디고)
#9575CD  Arc 8 달관 (바이올렛)
#F0C75E  Arc 9 전설 (골드)
```

> 중복 색은 한 번만 등록해도 OK. 전체 ~24개 슬롯.

팔레트 만들면 색 선택할 때 본인 등록한 색만 쓸 수 있어요. **임의의 색 사용 금지** — 일관성 핵심.

---

## 3️⃣ 브러시 선택

픽셀 아트 전용 브러시:
- **Drawing → Pencil → 6B Pencil** 또는
- **Procreate 무료 픽셀 브러시 다운로드** (예: "Pixelista", "Lospec")

브러시 설정:
- **StreamLine**: 0% (픽셀은 정확해야 함)
- **Spacing**: 8% 이하
- **Jitter**: 0%
- **Brush size**: 1픽셀 (작업 중 [/]키로 조절)

알파 채널 보존을 위해 배경 레이어는 비워두기.

---

## 4️⃣ 9 Arc 시드 디자인 가이드

각 시드는 **한 가지 핵심 심볼만**. 사이즈가 작으니 욕심내지 마세요.

### Lv 1 — 🌱 물만 마시던 자 (Arc 1 모른다)
- 새싹 한 개 (잎 2장)
- 색: Arc 1 그린 (#8BC34A) + 흙갈색 1픽셀
- 화분이나 배경 추가 X
- **Anchor seed** — 시리즈 전체 톤을 결정하는 가장 중요한 1개

### Lv 12 — 🍶 첫 병의 추억 (Arc 2 배운다)
- 작은 소주병 1개 (초록색)
- 단순한 사다리꼴/원기둥 형태
- 라벨이나 디테일 추가 X

### Lv 23 — 🏺 주도(酒道)에 눈뜬 자 (Arc 3 설친다)
- 한국 전통 도자기 술병 (둥근 형태)
- 색: Arc 3 앰버 (#FFB74D)
- 상단에 작은 점 (코르크/뚜껑)

### Lv 34 — 😵‍💫 눈이 풀린 장인 (Arc 4 무너진다)
- 단순한 둥근 얼굴 + 소용돌이 눈 (X자 또는 동그라미)
- 색: Arc 4 코럴 (#EF5350) — 볼은 분홍
- **코믹 톤**, 어두운 톤 절대 X

### Lv 45 — 🛏 아침 반성 전문가 (Arc 5 이불킥)
- 이불 안에 얼굴만 빼꼼
- 색: Arc 5 그레이 (#90A4AE)
- 이불 위에 작은 그림자

### Lv 56 — 🍵 해장의 달인 (Arc 6 회복)
- 김 나는 그릇 (해장국)
- 색: Arc 6 티얼 (#4DB6AC)
- 김은 점 2~3개로 추상화

### Lv 67 — 👃 향부터 보는 감식가 (Arc 7 즐긴다)
- 와인잔
- 색: Arc 7 인디고 (#5C6BC0) + 와인색
- 잔 안에 점 1개 (향 추상)

### Lv 78 — ⚖ 잔의 무게를 아는 자 (Arc 8 달관)
- 작은 잔 + 떠 있는 별·점 1~2개
- 색: Arc 8 바이올렛 (#9575CD)

### Lv 89 — 🖌 취필(醉筆)의 장인 (Arc 9 전설)
- 한국 서예 붓 (대각선)
- 색: Arc 9 골드 (#F0C75E) + 깊은 보라 배경 (#311B92)
- 끝에서 한 방울 떨어지는 형태

---

## 5️⃣ 앱 아이콘 (별도 진행)

### 사이즈
- 1024×1024 (스토어 등록용)
- iOS/Android 자동 리사이즈 (Expo가 처리)

### 디자인 아이디어 (택 1)
| 컨셉 | 설명 |
|---|---|
| **A. 한자 "酒" 픽셀화** | 가장 한국적, 인지도 높음, 단순 |
| B. 새싹 → 술잔 변환 모티프 | 앱 컨셉 (성장) 반영, 복잡 |
| C. 픽셀 술병 + DRINKLOG 약자 | 일반적, 안전 |

추천: **A** — 시그니처 명확, 작은 크기에서도 식별 가능.

### 작업 팁
- 1024×1024 캔버스 새로 만들기 (시드와 분리)
- 픽셀 grid를 16x16 또는 32x32로 설정 (1024를 N으로 나눈 값) → 결국 큰 픽셀 아트
- 또는 32×32로 만든 후 nearest-neighbor 업스케일 (Procreate Export 시)

---

## 6️⃣ 내보내기 (PNG)

작업 끝나면:

1. **Actions (스패너) → Share → PNG**
2. 파일명: `lv01.png`, `lv12.png` 등 (zero-padded 2자리)
3. 저장 위치: `assets/icons/levels/`
4. **@2x도 함께 저장**:
   - Procreate에서 Image Size를 2배로 (Actions → Canvas → Crop & Resize → 64×64)
   - **반드시 Interpolation을 "Nearest neighbor"** 선택 (픽셀 깨짐 방지)
   - 이름: `lv01@2x.png`

> 또는 Procreate가 nearest neighbor 옵션이 없으면 외부 도구로 업스케일 (예: `sips` macOS 내장 명령어, ImageMagick).

### 앱 아이콘 내보내기
- `assets/icon.png` (1024×1024) 덮어쓰기
- `assets/adaptive-icon.png` (Android, 1024×1024 with safe zone)
- `assets/splash-icon.png` (1024×1024)
- `assets/favicon.png` (48×48)

---

## 7️⃣ Retro Diffusion으로 나머지 확장

9 Arc 시드 완성 후:

1. **Lv 1 PNG를 reference image로 업로드**
2. 프롬프트: `pixel art icon, 32x32, [Lv 2 서브젝트], transparent background`
3. Reference 가중치: 0.4~0.6
4. Seed: 1100 (Arc 1 고정)
5. 4 variation 받아 best 1 선택
6. Lv 11까지 Lv 1 reference 유지
7. Lv 12 (Arc 2 시드) 도달 시 reference를 Procreate로 만든 Lv 12로 교체
8. ... 반복

각 시드는 [`docs/icons-prompts.md`](./icons-prompts.md) 참고.

---

## 8️⃣ 코드에 통합

PNG 파일을 `assets/icons/levels/`에 두면 자동으로 require 가능:

```ts
// src/constants/levelIcons.ts (이후 생성 권장)
export const LEVEL_ICONS = {
  1: require('../../assets/icons/levels/lv01.png'),
  2: require('../../assets/icons/levels/lv02.png'),
  // ... 99까지
};
```

> Metro는 동적 require 안 지원이라 99개를 수동 매핑하거나 sprite sheet 1장으로 통합 (Stage 3 이후 결정).

---

## ⏱️ 예상 시간

| 작업 | Procreate | Retro Diffusion |
|---|---|---|
| 9 Arc 시드 | 9개 × 30분 = **4.5시간** | - |
| 앱 아이콘 | **1~2시간** | - |
| 나머지 90 LEVELS | - | 시드 + 30초/개 × 90 = **45분** |
| 마일스톤·업적 | - | 약 **2시간** |

총 **~8시간** 작업으로 핵심 자산 완성. 디테일·재작업 포함하면 **이틀 정도**.

---

## 변경 이력

- **2026-05-11**: 초안. Procreate + RD 하이브리드 워크플로우.
