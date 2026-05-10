// 표준 Empty State 컴포넌트.
//
// 빈 상태(기록 없음, 검색 결과 없음 등)를 모든 화면에서 동일한 호흡으로 보이게.
// 화면별로 흩어진 emptyState/emptyText/emptySubtext 스타일을 통합.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

type Variant = 'primary' | 'secondary' | 'tertiary';

interface Action {
  label: string;
  onPress: () => void;
  variant?: Variant; // 기본: 'primary'
}

interface Props {
  /** 아이콘 — Icon 컴포넌트, 이모지 텍스트, 또는 ReactNode 자유롭게 */
  icon?: React.ReactNode;
  /** 굵은 메인 문구 */
  title: string;
  /** 보조 설명 */
  subtitle?: string;
  /** 0~3개 CTA. 첫 번째가 가장 강조됨 */
  actions?: Action[];
  /** card(surface 배경) vs plain(투명 배경). 기본 card */
  variant?: 'card' | 'plain';
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  actions,
  variant = 'card',
}: Props) {
  return (
    <View
      style={[
        styles.container,
        variant === 'card' && styles.cardVariant,
      ]}
    >
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actions && actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((a, i) => (
            <TouchableOpacity
              key={`${a.label}-${i}`}
              onPress={a.onPress}
              activeOpacity={0.8}
              style={[
                styles.actionBtn,
                buttonStyleFor(a.variant ?? (i === 0 ? 'primary' : 'secondary')),
              ]}
            >
              <Text
                style={[
                  styles.actionLabel,
                  buttonTextStyleFor(a.variant ?? (i === 0 ? 'primary' : 'secondary')),
                ]}
              >
                {a.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function buttonStyleFor(v: Variant) {
  if (v === 'primary') return styles.btnPrimary;
  if (v === 'secondary') return styles.btnSecondary;
  return styles.btnTertiary;
}

function buttonTextStyleFor(v: Variant) {
  if (v === 'primary') return styles.btnPrimaryText;
  if (v === 'secondary') return styles.btnSecondaryText;
  return styles.btnTertiaryText;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  cardVariant: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  iconWrap: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: fontSize.sm * 1.5,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  actionBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    color: colors.textInverse,
  },
  btnSecondary: {
    backgroundColor: colors.surfaceLight,
  },
  btnSecondaryText: {
    color: colors.textPrimary,
  },
  btnTertiary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnTertiaryText: {
    color: colors.textSecondary,
  },
});
