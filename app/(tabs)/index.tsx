import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

interface WeeklySummary {
  totalBottles: number;
  totalCost: number;
  drinkingDays: number;
}

interface RecentLog {
  id: string;
  logged_at: string;
  bottles: number;
  price_paid: number;
  drink_catalog: {
    name: string;
    category: string;
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [summary, setSummary] = useState<WeeklySummary>({
    totalBottles: 0,
    totalCost: 0,
    drinkingDays: 0,
  });
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchWeeklySummary();
        fetchRecentLogs();
      }
    }, [user])
  );

  async function fetchWeeklySummary() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data } = await supabase
      .from('drink_log')
      .select('bottles, price_paid, logged_at')
      .eq('user_id', user!.id)
      .gte('logged_at', weekAgo.toISOString());

    if (data) {
      const uniqueDays = new Set(
        data.map(d => new Date(d.logged_at).toDateString())
      );
      setSummary({
        totalBottles: data.reduce((sum, d) => sum + (d.bottles || 0), 0),
        totalCost: data.reduce((sum, d) => sum + (d.price_paid || 0), 0),
        drinkingDays: uniqueDays.size,
      });
    }
  }

  async function fetchRecentLogs() {
    const { data } = await supabase
      .from('drink_log')
      .select('id, logged_at, bottles, price_paid, drink_catalog(name, category)')
      .eq('user_id', user!.id)
      .order('logged_at', { ascending: false })
      .limit(3);

    if (data) {
      setRecentLogs(data as unknown as RecentLog[]);
    }
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>주로</Text>
          <Text style={styles.greetingSub}>이번 주 기록</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* 이번 주 요약 카드 */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{summary.totalBottles}</Text>
          <Text style={styles.summaryLabel}>총 병 수</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {summary.totalCost.toLocaleString()}
          </Text>
          <Text style={styles.summaryLabel}>총 비용 (원)</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{summary.drinkingDays}</Text>
          <Text style={styles.summaryLabel}>음주 일수</Text>
        </View>
      </View>

      {/* 기록 추가 버튼 */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/(tabs)/add')}
      >
        <Ionicons name="add-circle" size={28} color={colors.text} />
        <Text style={styles.addButtonText}>기록 추가</Text>
      </TouchableOpacity>

      {/* 최근 기록 */}
      <Text style={styles.sectionTitle}>최근 기록</Text>
      {recentLogs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="wine-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>아직 기록이 없어요</Text>
          <Text style={styles.emptySubText}>첫 번째 술을 기록해보세요!</Text>
        </View>
      ) : (
        recentLogs.map(log => (
          <View key={log.id} style={styles.logItem}>
            <View
              style={[
                styles.logDot,
                { backgroundColor: getCategoryColor(log.drink_catalog?.category) },
              ]}
            />
            <View style={styles.logInfo}>
              <Text style={styles.logName}>{log.drink_catalog?.name}</Text>
              <Text style={styles.logMeta}>
                {new Date(log.logged_at).toLocaleDateString('ko-KR')} · {log.bottles}병
              </Text>
            </View>
            <Text style={styles.logPrice}>
              {(log.price_paid || 0).toLocaleString()}원
            </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.primary,
  },
  greetingSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    padding: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
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
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  addButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  logDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  logInfo: {
    flex: 1,
  },
  logName: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
  },
  logMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logPrice: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '700',
  },
});
