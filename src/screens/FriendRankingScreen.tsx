// 친구 랭킹 v2 화면.
//
// - 기간 토글: 주/월/년/전체
// - 축 토글: 병수 / 마신 일수 / 쓴 금액 / 누적 ml
// - 본인 row는 강조 표시 + 정렬 동률 시 위로
//
// 데이터: Edge Function `friend-ranking` (서버 집계)

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  colors,
  spacing,
  fontSize,
  borderRadius,
  iconSize,
} from '../constants/theme';
import Icon from '../components/Icon';
import EmptyState from '../components/EmptyState';
import {
  fetchFriendRanking,
  sortByAxis,
  RankingPeriod,
  RankingAxis,
  RankingRow,
} from '../lib/friendRanking';

const PERIOD_LABELS: Record<RankingPeriod, string> = {
  week: '주간',
  month: '월간',
  year: '연간',
  all: '전체',
};

const AXIS_LABELS: Record<RankingAxis, string> = {
  bottles: '병수',
  days: '마신 일수',
  cost: '쓴 금액',
  totalMl: '누적 ml',
};

export default function FriendRankingScreen({ navigation }: any) {
  const [period, setPeriod] = useState<RankingPeriod>('month');
  const [axis, setAxis] = useState<RankingAxis>('bottles');
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchFriendRanking(period);
      setRows(result.rows);
    } catch (e: any) {
      setError(e?.message ?? '랭킹을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const sorted = sortByAxis(rows, axis);
  const myRow = sorted.find((r) => r.isMe);
  const myRank = sorted.findIndex((r) => r.isMe) + 1;

  const formatValue = (row: RankingRow): string => {
    switch (axis) {
      case 'bottles':
        return `${row.bottles.toFixed(1).replace(/\.0$/, '')}병`;
      case 'days':
        return `${row.days}일`;
      case 'cost':
        return `${row.cost.toLocaleString()}원`;
      case 'totalMl':
        return row.totalMl >= 1000
          ? `${(row.totalMl / 1000).toFixed(1)}L`
          : `${Math.round(row.totalMl)}ml`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon
            set="lucide"
            name="ChevronLeft"
            size={iconSize.md}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>친구 랭킹</Text>
        <View style={{ width: iconSize.md }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* 기간 토글 */}
        <View style={styles.toggleRow}>
          {(Object.keys(PERIOD_LABELS) as RankingPeriod[]).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.toggleChip, period === p && styles.toggleChipActive]}
            >
              <Text
                style={[
                  styles.toggleText,
                  period === p && styles.toggleTextActive,
                ]}
              >
                {PERIOD_LABELS[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 축 토글 (병수/일수/금액/ml) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -spacing.lg }}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            gap: spacing.xs,
          }}
        >
          {(Object.keys(AXIS_LABELS) as RankingAxis[]).map((a) => (
            <TouchableOpacity
              key={a}
              onPress={() => setAxis(a)}
              style={[styles.axisChip, axis === a && styles.axisChipActive]}
            >
              <Text
                style={[styles.axisText, axis === a && styles.axisTextActive]}
              >
                {AXIS_LABELS[a]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 내 순위 요약 (친구 있을 때만) */}
        {myRow && sorted.length > 1 ? (
          <View style={styles.mySummary}>
            <Text style={styles.mySummaryLabel}>내 순위</Text>
            <View style={styles.mySummaryRow}>
              <Text style={styles.myRank}>{myRank}위</Text>
              <Text style={styles.myValue}>{formatValue(myRow)}</Text>
            </View>
          </View>
        ) : null}

        {/* 본문 */}
        {loading && rows.length === 0 ? (
          <ActivityIndicator
            style={{ marginTop: spacing.xxl }}
            color={colors.primary}
          />
        ) : error ? (
          <EmptyState
            title="랭킹을 불러오지 못했어요"
            subtitle={error}
            actions={[{ label: '다시 시도', onPress: load }]}
          />
        ) : sorted.length === 1 && sorted[0].isMe ? (
          <EmptyState
            title="아직 친구가 없어요"
            subtitle="친구를 추가하면 같이 마신 양을 비교할 수 있어요."
            actions={[
              {
                label: '친구 추가하러 가기',
                onPress: () => navigation.replace('Friends'),
              },
            ]}
          />
        ) : (
          sorted.map((row, idx) => (
            <View
              key={row.user_id}
              style={[styles.row, row.isMe && styles.rowMe]}
            >
              <Text style={[styles.rank, row.isMe && styles.rankMe]}>
                {idx + 1}
              </Text>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowName, row.isMe && styles.rowNameMe]}>
                  {row.isMe ? '나' : row.nickname ?? '익명'}
                </Text>
              </View>
              <Text style={[styles.rowValue, row.isMe && styles.rowValueMe]}>
                {formatValue(row)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },

  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  toggleChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  toggleChipActive: { backgroundColor: colors.primary },
  toggleText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: { color: colors.textInverse },

  axisChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  axisChipActive: { backgroundColor: colors.surfaceLight },
  axisText: { fontSize: fontSize.sm, color: colors.textSecondary },
  axisTextActive: { color: colors.primary, fontWeight: '700' },

  mySummary: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  mySummaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  mySummaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  myRank: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.primary },
  myValue: { fontSize: fontSize.lg, color: colors.textPrimary, fontWeight: '600' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  rowMe: { backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.primary },
  rank: {
    width: 32,
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  rankMe: { color: colors.primary },
  rowInfo: { flex: 1 },
  rowName: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: '600' },
  rowNameMe: { color: colors.primary },
  rowValue: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: '700' },
  rowValueMe: { color: colors.primary },
});
