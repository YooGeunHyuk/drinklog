# Spacing 위계 가이드

> 텍스트가 많은 화면에서도 그룹·항목 위계가 한눈에 보이도록 하는 5단계 spacing 규칙.

## 5단계 위계

| 토큰 | 값 | 용도 | 예시 |
|---|---:|---|---|
| `spacing.xl` | **32** | 큰 섹션끼리, 별개 화면 영역 | 날짜 그룹끼리, 화면 상단 헤더와 본문 |
| `spacing.lg` | **24** | 카드 내 그룹 사이, 헤더↔본문, 섹션↔섹션 | "나의 음주 여정" 안의 배지 그룹↔진행바 그룹 |
| `spacing.md` | **16** | 같은 그룹 안 항목 사이, 그룹 헤더↔첫 항목 | 진행바 라벨↔진행바, "이번 달" subtitle↔숫자 행 |
| `spacing.sm` | **8** | 항목 내부 (라벨↔값) | "Lv 12" 배지↔ "첫 병의 추억" 텍스트 |
| `spacing.xs` | **4** | 인라인 micro 간격 | 작은 라벨↔숫자, 텍스트 위 미세한 hint |

## 적용 규칙

### 큰 카드 사이
```ts
marginBottom: spacing.lg  // 보통은 lg
```
짙은 분리가 필요하면 (예: 통계 내 완전 다른 주제) `xl`.

### 카드 내부
1. **헤더 → 본문 첫 그룹**: `marginBottom: spacing.lg`
2. **그룹 → 다음 그룹**: `marginBottom: spacing.lg`
3. **그룹 안 항목 사이**: `gap: spacing.md` 또는 `marginBottom: spacing.md`
4. **항목 내부 (라벨↔값)**: `gap: spacing.sm`
5. **인라인 micro**: `marginTop: spacing.xs` (예: subMsg가 헤드라인 바로 아래)

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
