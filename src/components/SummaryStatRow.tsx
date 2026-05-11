// 가로 3열 통계 행 — Home/Stats 등에서 같은 패턴 반복용.
//
// 한 행에 (값 + 라벨) 항목 N개를 균등 분할로 표시.
// 항목 사이 세로 divider 자동 삽입.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../constants/theme';

export interface SummaryStat {
  /** 큰 숫자/문구 */
  value: string;
  /** 보조 라벨 */
  label: string;
  /** 비용 강조 (좌우 패딩 약간 추가 — 긴 숫자 줄바꿈 완화) */
  isCost?: boolean;
}

interface Props {
  /** 행 위에 표시되는 소제목 (선택) */
  subTitle?: string;
  /** 2~3개 권장. 4개 이상은 좁아져서 가독성 떨어짐 */
  items: SummaryStat[];
}

export default function SummaryStatRow({ subTitle, items }: Props) {
  return (
    <View>
      {subTitle ? <Text style={styles.subTitle}>{subTitle}</Text> : null}
      <View style={styles.row}>
        {items.map((it, i) => (
          <React.Fragment key={`${it.label}-${i}`}>
            <View style={styles.item}>
              <Text
                style={[styles.value, it.isCost && styles.valueCost]}
                numberOfLines={1}
              >
                {it.value}
              </Text>
              <Text style={styles.label} numberOfLines={1}>
                {it.label}
              </Text>
            </View>
            {i < items.length - 1 ? <View style={styles.divider} /> : null}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subTitle: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: '600',
    // subTitle ↔ 숫자 행 = md (sm은 너무 좁아 그룹 식별 약함)
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  valueCost: {
    paddingHorizontal: spacing.sm,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
});
