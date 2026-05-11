# Spacing 위계 가이드

> 텍스트가 많은 화면에서도 그룹·항목 위계가 한눈에 보이도록 하는 5단계 spacing 규칙.

## 5단계 위계

| 토큰 | 값 | 용도 | 예시 |
|---|---:|---|---|
| `spacing.xl` | **32** | 명확히 다른 섹션·날짜 | 다른 날짜 그룹끼리, 다른 화면 영역 |
| `spacing.lg` | **24** | **카드끼리만** (서로 다른 카드 사이) | 음주 요약 카드 ↔ 나의 음주 여정 카드 |
| `spacing.md` | **16** | 카드 안의 모든 그룹 분리 (헤더↔본문, 그룹↔그룹) | 카드 제목 ↔ 본문, 진행바 그룹들 사이 |
| `spacing.sm` | **8** | 같은 그룹 안 작은 분리, 항목 사이 | subTitle ↔ 숫자, 라벨 ↔ 진행바 |
| `spacing.xs` | **4** | **같은 그룹 내 묶기**, 인라인 | 배지 ↔ 그 설명, 메인 값 ↔ hint |

## 핵심 원칙

> **같은 그룹은 가까이 (xs~sm), 다른 그룹은 위계 있게(md), 카드끼리만 크게(lg).**
>
> 카드 안에서 `lg`를 쓰면 빈 공간이 많아져서 스크롤 압박이 커진다. 카드 안 모든 분리는 `md` 이하로.

## 적용 규칙

### 카드끼리 (밖)
```ts
marginBottom: spacing.lg
```
다른 카테고리·다른 날짜는 `xl`.

### 카드 안 (모든 분리 md 이하)
1. **카드 헤더 → 본문**: `marginBottom: spacing.md`
2. **그룹 → 다음 그룹**: `marginBottom: spacing.md`
3. **그룹 안 항목 사이**: `gap: spacing.sm` 또는 `marginBottom: spacing.sm`
4. **같은 그룹 묶기 (배지+설명 등)**: `marginBottom: spacing.xs`
5. **인라인 micro (메인↔hint)**: `marginTop: spacing.xs`

### Divider 사용
긴 카드에서 그룹 분리가 spacing만으로 약하면 `borderTop` + `paddingTop: spacing.md` 조합. 단 남용 X.

## 안티 패턴 ❌

- `marginTop: 2`, `marginBottom: 3` 같은 **하드코드 숫자** — 무조건 토큰 사용
- 그룹 내·외 모두 `spacing.md` 사용 → 위계 안 보임
- 카드 헤더와 본문이 `marginBottom: spacing.sm` → 너무 붙어서 헤더가 본문 일부로 보임

## Lint 권장

ESLint 룰로 강제하지는 않지만, PR 리뷰 시 `marginTop|marginBottom|gap|padding\w*: \d+` 패턴이 보이면 지적 (`spacing.*` 사용해야).

## 변경 이력

- **2026-05-11**: 초안. StatsScreen·HomeScreen·HistoryScreen에 1차 적용.
