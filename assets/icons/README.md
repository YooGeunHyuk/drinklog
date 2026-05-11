# 픽셀 아이콘 자산 가이드

> 모든 픽셀 아트 자산의 보관소. 생성 가이드는 [`docs/pixel-art-style-guide.md`](../../docs/pixel-art-style-guide.md), 진행 상황은 [`docs/icons-todo.md`](../../docs/icons-todo.md) 참조.

---

## 폴더 구조

```
assets/icons/
  README.md                    # 이 파일
  
  categories/                  # 7주종 — 32×32 + 64×64 (가장 자주 노출)
  tabs/                        # 5개 탭 — 32×32
  ui/                          # UI 헬퍼 (back/search/share 등) — 16×16, 32×32
  
  levels/                      # LEVELS 99 (메인 등급) — 64×64 + 128×128
  milestones/                  # 전역 부피 마일스톤 34 — 64×64
  category-milestones/         # 주종별 마일스톤 47 — 64×64
  
  achievements/                # 공개 업적 86 — 64×64
  achievements-hidden/         # 히든 업적 해금 일러 15 — 64×64
  
  drinks/                      # 추가 주종 10 (사케·하이볼·IPA 등) — 64×64
  locations/                   # 장소 8 (포차·이자카야 등) — 64×64
  food/                        # 안주 4 (치킨·회·파전·라면) — 64×64
  
  moods/                       # 분위기 6 (혼술·회식 등) — 32×32 + 64×64
  weather/                     # 날씨 4 — 32×32
  time/                        # 시간대 5 — 32×32
  
  ornaments/                   # UI 장식 (불꽃·반짝임 등) — 32×32 (선택)
  
  share-card/                  # 액자형 공유 카드 자산
                               #  - frame-square.png    1080×1080
                               #  - frame-vertical.png  1080×1920
                               #  - watermark.png
                               #  - pattern-bg.png
  
  empty-states/                # Empty state 일러 — 256×256
```

---

## 명명 규칙

### 공통
- 모두 **소문자 + kebab-case**
- 기본 자산: `<id>.png` (1× 해상도)
- 2× 자산: `<id>@2x.png` (nearest-neighbor 업스케일, 가능한 모든 자산에 함께 저장)

### 카테고리 / 탭 / UI
- `<name>.png` — 직관적 영문명
- 예: `soju.png`, `home.png`, `back.png`, `search.png`

### LEVELS (99개)
- `lv01.png` ~ `lv99.png` — **2자리 zero-padded**
- `lv01@2x.png` 함께 저장
- 코드 매핑: `LEVELS[i].rank` → `lv${rank.toString().padStart(2,'0')}.png`

### 부피 마일스톤 (전역 34개)
- `vol-<ml값>.png` — ml 단위 (1L 이상은 L로)
- 예: `vol-360ml.png`, `vol-1L.png`, `vol-100L.png`, `vol-2000L.png`, `vol-50000L.png`
- 코드 매핑: `MILESTONES[i].ml` → ml 변환

### 카테고리 마일스톤 (주종별 47개)
- `<category>-<ml값>.png`
- 예: `soju-360ml.png`, `soju-3.6L.png`, `beer-500ml.png`, `whiskey-200L.png`

### 업적 (공개 86 + 히든 15)
- `achievements/<id>.png` — `achievements.ts`의 `id` 그대로 사용
- 예: `first-log.png`, `streak-7.png`, `variety-100.png`, `master-soju-100.png`
- 히든은 `achievements-hidden/<id>.png` (예: `egg-ocean.png`, `egg-pajeon.png`)

### 추가 주종 / 장소 / 안주 / 무드 / 날씨 / 시간대
- 영문 단일 단어 또는 kebab-case
- 예: `drinks/sake.png`, `locations/pocha.png`, `food/chicken.png`, `moods/alone.png`, `weather/rain.png`, `time/dawn.png`

---

## 저장 포맷

- **PNG 24/32-bit** + 투명 배경
- 픽셀 보간 없음 (nearest-neighbor)
- 컬러 프로파일: sRGB
- 메타데이터 제거 (용량 최적화)

---

## 코드 연동

### React Native에서 사용
```ts
// assets/icons/index.ts (이후 생성 권장)
export const ICONS = {
  categories: {
    soju: require('./categories/soju.png'),
    beer: require('./categories/beer.png'),
    // ...
  },
  levels: {
    // 동적 require는 Metro에서 안 되므로 수동 매핑
    1: require('./levels/lv01.png'),
    2: require('./levels/lv02.png'),
    // ... (99개)
  },
  // ...
};
```

> 99개 require가 부담스러우면, Lv별 자산을 sprite sheet 1장으로 묶어 좌표로 자르는 방식도 고려 가능 (Stage 3 이후 결정).

### 데이터 매핑
- `categoryIcons.ts` — 현재 MaterialCommunityIcons → 픽셀 자산 require로 교체
- `milestones.ts` — `Level.iconAsset?: string` 필드 추가해 매핑
- `achievements.ts` — `Achievement.iconAsset?: string` 필드 추가

---

## 변경 이력

- **2026-05-10**: 초기 폴더 구조 + 명명 규칙 정의.
