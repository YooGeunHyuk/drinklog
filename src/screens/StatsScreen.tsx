import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

type Period = 'week' | 'month' | 'year' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  week: '주간',
  month: '월간',
  year: '연간',
  all: '전체',
};

export default function StatsScreen() {
  const [period, setPeriod] = useState<Period>('week');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>통계</Text>

        {/* 기간 토글 */}
        <View style={styles.periodToggle}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                period === p && styles.periodButtonActive,
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodText,
                  period === p && styles.periodTextActive,
                ]}
              >
                {PERIOD_LABELS[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 요약 카드 */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>총 병 수</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₩0</Text>
            <Text style={styles.statLabel}>총 비용</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0일</Text>
            <Text style={styles.statLabel}>음주 일수</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0ml</Text>
            <Text style={styles.statLabel}>총 음주량</Text>
          </View>
        </View>

        {/* 차트 영역 (플레이스홀더) */}
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartTitle}>
            {PERIOD_LABELS[period]} 음주량 차트
          </Text>
          <View style={styles.chartArea}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>
              기록이 쌓이면 차트가 표시됩니다
            </Text>
          </View>
        </View>

        {/* 주종 비율 */}
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartTitle}>주종별 비율</Text>
          <View style={styles.chartArea}>
            <Text style={styles.emptyIcon}>🥧</Text>
            <Text style={styles.emptyText}>
              기록을 추가하면 주종 비율을 볼 수 있어요
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  periodTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '47%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  chartPlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  chartTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chartArea: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
