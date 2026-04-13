import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

type Period = 'week' | 'month' | 'year' | 'all';

interface StatsData {
  totalBottles: number;
  totalCost: number;
  drinkingDays: number;
  totalDays: number;
  categoryBreakdown: { category: string; count: number; percentage: number }[];
  dailyData: { date: string; bottles: number }[];
}

export default function StatsScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('week');
  const [stats, setStats] = useState<StatsData>({
    totalBottles: 0,
    totalCost: 0,
    drinkingDays: 0,
    totalDays: 7,
    categoryBreakdown: [],
    dailyData: [],
  });

  useFocusEffect(
    useCallback(() => {
      if (user) fetchStats();
    }, [user, period])
  );

  async function fetchStats() {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(2020, 0, 1);
    }

    const { data: logs } = await supabase
      .from('drink_log')
      .select('bottles, price_paid, logged_at, drink_catalog(category)')
      .eq('user_id', user!.id)
      .gte('logged_at', startDate.toISOString())
      .order('logged_at', { ascending: true });

    if (!logs) return;

    const uniqueDays = new Set(logs.map(d => new Date(d.logged_at).toDateString()));

    // 주종별 집계
    const catMap = new Map<string, number>();
    logs.forEach(log => {
      const cat = (log.drink_catalog as any)?.category || '기타';
      catMap.set(cat, (catMap.get(cat) || 0) + (log.bottles || 0));
    });

    const totalBottles = logs.reduce((s, d) => s + (d.bottles || 0), 0);
    const breakdown = Array.from(catMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: totalBottles > 0 ? Math.round((count / totalBottles) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 일별 데이터
    const dayMap = new Map<string, number>();
    logs.forEach(log => {
      const dateStr = new Date(log.logged_at).toLocaleDateString('ko-KR');
      dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + (log.bottles || 0));
    });

    setStats({
      totalBottles,
      totalCost: logs.reduce((s, d) => s + (d.price_paid || 0), 0),
      drinkingDays: uniqueDays.size,
      totalDays: Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
      categoryBreakdown: breakdown,
      dailyData: Array.from(dayMap.entries()).map(([date, bottles]) => ({ date, bottles })),
    });
  }

  const getCategoryColor = (category: string) => {
    const map: Record<string, string> = {
      '소주': colors.soju,
      '맥주': colors.beer,
      '막걸리': colors.makgeolli,
      '와인': colors.wine,
      '위스키': colors.whiskey,
      '양주': colors.spirit,
    };
    return map[category] || colors.etc;
  };

  const periods: { key: Period; label: string }[] = [
    { key: 'week', label: '주간' },
    { key: 'month', label: '월간' },
    { key: 'year', label: '연간' },
    { key: 'all', label: '전체' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 기간 토글 */}
      <View style={styles.periodRow}>
        {periods.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodChip, period === p.key && styles.periodChipActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text
              style={[
                styles.periodText,
                period === p.key && styles.periodTextActive,
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 요약 카드 */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{stats.totalBottles}</Text>
          <Text style={styles.summaryLabel}>총 병 수</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {stats.totalCost.toLocaleString()}
          </Text>
          <Text style={styles.summaryLabel}>총 비용 (원)</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{stats.drinkingDays}</Text>
          <Text style={styles.summaryLabel}>음주 일수</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {stats.totalDays > 0
              ? Math.round((stats.drinkingDays / stats.totalDays) * 100)
              : 0}%
          </Text>
          <Text style={styles.summaryLabel}>음주 비율</Text>
        </View>
      </View>

      {/* 주종별 비율 - 간단한 바 차트 */}
      <Text style={styles.sectionTitle}>주종별 비율</Text>
      {stats.categoryBreakdown.length === 0 ? (
        <Text style={styles.emptyText}>데이터가 없습니다</Text>
      ) : (
        stats.categoryBreakdown.map(item => (
          <View key={item.category} style={styles.barRow}>
            <Text style={styles.barLabel}>{item.category}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${item.percentage}%`,
                    backgroundColor: getCategoryColor(item.category),
                  },
                ]}
              />
            </View>
            <Text style={styles.barValue}>{item.percentage}%</Text>
          </View>
        ))
      )}

      {/* 최근 기록 일별 */}
      <Text style={styles.sectionTitle}>일별 음주량</Text>
      {stats.dailyData.length === 0 ? (
        <Text style={styles.emptyText}>데이터가 없습니다</Text>
      ) : (
        stats.dailyData.slice(-7).map(item => (
          <View key={item.date} style={styles.dayRow}>
            <Text style={styles.dayDate}>{item.date}</Text>
            <View style={styles.dayBarTrack}>
              <View
                style={[
                  styles.dayBarFill,
                  {
                    width: `${Math.min(item.bottles * 20, 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.dayValue}>{item.bottles}병</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  periodChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  periodChipActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  periodTextActive: {
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  barLabel: {
    width: 50,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 20,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  barValue: {
    width: 40,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'right',
    fontWeight: '600',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  dayDate: {
    width: 90,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  dayBarTrack: {
    flex: 1,
    height: 16,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  dayBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  dayValue: {
    width: 40,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'right',
  },
});
