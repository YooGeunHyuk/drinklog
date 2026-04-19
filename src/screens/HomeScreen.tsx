import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { DrinkLog, CATEGORY_LABELS, MOOD_ICONS } from '../types';
import { isCurrentUserAdmin } from '../lib/admin';
import { getCurrentBadge, getNextBadge } from '../constants/milestones';
import { WEATHER_ICONS, WeatherCode } from '../lib/weather';

export default function HomeScreen({ navigation }: any) {
  const [nickname, setNickname] = useState<string>('');
  const [weekStats, setWeekStats] = useState({
    bottles: 0,
    cost: 0,
    days: 0,
  });
  const [streak, setStreak] = useState(0); // 연속 음주일 (오늘 기준 역산)
  const [vsLastWeek, setVsLastWeek] = useState<{
    bottles: number | null;
    cost: number | null;
  }>({ bottles: null, cost: null });
  const [totalLifetimeMl, setTotalLifetimeMl] = useState(0);
  const [recentLogs, setRecentLogs] = useState<DrinkLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 관리자 뱃지 — 한 번만 체크
  React.useEffect(() => {
    isCurrentUserAdmin().then(setIsAdmin);
  }, []);

  // 🛠 관리자 메뉴 — 酒路 로고 길게 누르면 표시
  const openAdminMenu = () => {
    if (!isAdmin) return;
    Alert.alert('🛠 관리자 메뉴', '원하는 작업을 선택하세요.', [
      {
        text: '📥 CSV 카탈로그 업로드',
        onPress: () => navigation.getParent()?.navigate('AdminCSVUpload'),
      },
      {
        text: '📮 등록 요청 검토',
        onPress: () => navigation.getParent()?.navigate('AdminRequests'),
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 닉네임 로드
      const { data: profile } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', user.id)
        .single();
      setNickname(profile?.nickname ?? '');

      // 날짜 계산
      const now = new Date();
      const day = now.getDay(); // 0=일, 1=월, ..., 6=토
      const diff = day === 0 ? 6 : day - 1;

      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - diff);
      weekStart.setHours(0, 0, 0, 0);

      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      // ① 이번 주 기록
      const { data: logs } = await supabase
        .from('drink_log')
        .select('logged_at, bottles, price_paid, drink_catalog(*)')
        .eq('user_id', user.id)
        .gte('logged_at', weekStart.toISOString())
        .order('logged_at', { ascending: false });

      const thisBottles = (logs ?? []).reduce((s, l) => s + (l.bottles || 0), 0);
      const thisCost = (logs ?? []).reduce((s, l) => s + (l.price_paid || 0), 0);
      const uniqueDays = new Set((logs ?? []).map((l) => new Date(l.logged_at).toDateString()));
      setWeekStats({ bottles: thisBottles, cost: thisCost, days: uniqueDays.size });

      // ② 지난주 기록 (증감 계산)
      const { data: lastWeekLogs } = await supabase
        .from('drink_log')
        .select('bottles, price_paid')
        .eq('user_id', user.id)
        .gte('logged_at', lastWeekStart.toISOString())
        .lt('logged_at', weekStart.toISOString());

      const lwBottles = (lastWeekLogs ?? []).reduce((s, l) => s + (l.bottles || 0), 0);
      const lwCost = (lastWeekLogs ?? []).reduce((s, l) => s + (l.price_paid || 0), 0);
      setVsLastWeek({
        bottles: lwBottles === 0 ? null : thisBottles - lwBottles,
        cost: lwCost === 0 ? null : thisCost - lwCost,
      });

      // ③ 전체 기록 (뱃지 + 연속 음주일 — 한 번만 쿼리)
      const { data: allLogs } = await supabase
        .from('drink_log')
        .select('logged_at, quantity_ml, bottles, drink_catalog(volume_ml)')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (allLogs) {
        // 누적 음주량
        const total = allLogs.reduce((s: number, l: any) => {
          const ml = l.quantity_ml ?? (l.drink_catalog?.volume_ml ?? 0) * (l.bottles || 0);
          return s + ml;
        }, 0);
        setTotalLifetimeMl(total);

        // 연속 음주일 계산
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMs = today.getTime();
        const DAY = 86400000;

        const drinkDaySet = new Set(
          allLogs.map((l) => {
            const d = new Date(l.logged_at);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
          })
        );

        // 오늘부터 역산, 오늘 기록 없으면 어제부터
        let startMs = drinkDaySet.has(todayMs) ? todayMs : drinkDaySet.has(todayMs - DAY) ? todayMs - DAY : null;
        let count = 0;
        if (startMs !== null) {
          let cursor = startMs;
          while (drinkDaySet.has(cursor)) {
            count++;
            cursor -= DAY;
          }
        }
        setStreak(count);
      }

      // 최근 기록 3건
      const { data: recent } = await supabase
        .from('drink_log')
        .select('*, drink_catalog(*)')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(3);
      setRecentLogs((recent as DrinkLog[]) ?? []);
    } catch (err: any) {
      console.error('홈 데이터 로드 실패:', err.message);
    }
  }, []);

  // 탭이 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours();
    const minute = d.getMinutes().toString().padStart(2, '0');
    return `${m}/${day} ${hour}:${minute}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {/* 좌: 닉네임의 + 酒路 */}
            <TouchableOpacity
              onLongPress={openAdminMenu}
              delayLongPress={800}
              activeOpacity={1}
            >
              <Text style={styles.nicknameOf}>
                <Text style={{ color: getCurrentBadge(totalLifetimeMl).textColor }}>{nickname || '나'}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>의</Text>
              </Text>
              <Text style={styles.appName}>酒路{isAdmin ? ' 🛠' : ''}</Text>
            </TouchableOpacity>

            {/* 우: 뱃지 박스 + 누적량 */}
            {(() => {
              const badge = getCurrentBadge(totalLifetimeMl);
              const totalLabel = totalLifetimeMl >= 1000
                ? `${(totalLifetimeMl / 1000).toFixed(1)}L`
                : `${Math.round(totalLifetimeMl)}ml`;
              return (
                <TouchableOpacity
                  style={styles.badgeBlock}
                  onPress={() => navigation.getParent()?.navigate('Settings')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.badgeBox, { backgroundColor: badge.color }]}>
                    <Text style={styles.badgePillEmoji}>{badge.emoji}</Text>
                    <Text style={[styles.badgePillTitle, { color: badge.textColor }]}>
                      {badge.title}
                    </Text>
                  </View>
                  <Text style={styles.badgeTotalMl}>누적 {totalLabel}</Text>
                </TouchableOpacity>
              );
            })()}
          </View>
        </View>

        {/* 이번 주 요약 카드 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>이번 주 요약</Text>
          {/* 1행: 병 수 / 비용 / 음주일 */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {weekStats.bottles.toFixed(1).replace(/\.0$/, '')}
              </Text>
              <Text style={styles.summaryLabel}>총 병 수</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                ₩{weekStats.cost.toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>총 비용</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{weekStats.days}일</Text>
              <Text style={styles.summaryLabel}>음주 일수</Text>
            </View>
          </View>

          {/* 구분선 */}
          <View style={styles.summaryHDivider} />

          {/* 2행: 연속 음주일 / 지난주 대비 */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.streakRow}>
                <Text style={styles.summaryValue}>{streak}</Text>
                <Text style={styles.streakFlame}>{streak >= 3 ? '🔥' : '💧'}</Text>
              </View>
              <Text style={styles.summaryLabel}>연속 음주일</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              {vsLastWeek.bottles === null ? (
                <>
                  <Text style={styles.summaryValue}>—</Text>
                  <Text style={styles.summaryLabel}>지난주 대비 병</Text>
                </>
              ) : (
                <>
                  <Text style={[
                    styles.summaryValue,
                    vsLastWeek.bottles > 0 ? styles.increaseText : vsLastWeek.bottles < 0 ? styles.decreaseText : null,
                  ]}>
                    {vsLastWeek.bottles > 0 ? '+' : ''}{vsLastWeek.bottles.toFixed(1).replace(/\.0$/, '')}
                  </Text>
                  <Text style={styles.summaryLabel}>지난주 대비 병</Text>
                </>
              )}
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              {vsLastWeek.cost === null ? (
                <>
                  <Text style={styles.summaryValue}>—</Text>
                  <Text style={styles.summaryLabel}>지난주 대비 비용</Text>
                </>
              ) : (
                <>
                  <Text style={[
                    styles.summaryValue,
                    vsLastWeek.cost > 0 ? styles.increaseText : vsLastWeek.cost < 0 ? styles.decreaseText : null,
                  ]}>
                    {vsLastWeek.cost > 0 ? '+' : ''}₩{Math.abs(vsLastWeek.cost).toLocaleString()}{vsLastWeek.cost < 0 ? ' ↓' : vsLastWeek.cost > 0 ? ' ↑' : ''}
                  </Text>
                  <Text style={styles.summaryLabel}>지난주 대비 비용</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* 최근 기록 */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>최근 기록</Text>
          {recentLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🍶</Text>
              <Text style={styles.emptyText}>아직 기록이 없어요</Text>
              <Text style={styles.emptySubtext}>
                첫 번째 술을 기록해보세요!
              </Text>
            </View>
          ) : (
            recentLogs.map((log) => (
              <TouchableOpacity
                key={log.id}
                style={styles.logItem}
                onPress={() =>
                  navigation
                    .getParent()
                    ?.navigate('EditDrink', { logId: log.id })
                }
                activeOpacity={0.7}
              >
                {log.photo_url ? (
                  <Image
                    source={{ uri: log.photo_url }}
                    style={styles.logThumb}
                  />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.logName}>
                    {log.mood ? `${MOOD_ICONS[log.mood]} ` : ''}
                    {log.weather ? `${WEATHER_ICONS[log.weather as WeatherCode] ?? ''} ` : ''}
                    {log.drink_catalog?.name ?? '이름 없음'}
                  </Text>
                  <Text style={styles.logMeta}>
                    {log.drink_catalog
                      ? CATEGORY_LABELS[log.drink_catalog.category]
                      : ''}
                    {` · ${log.bottles}병`}
                    {log.price_paid ? ` · ₩${log.price_paid.toLocaleString()}` : ''}
                    {log.temperature != null ? ` · ${log.temperature.toFixed(0)}°C` : ''}
                  </Text>
                  {(log.location || log.companions) && (
                    <Text style={styles.logSub} numberOfLines={1}>
                      {log.location ? `📍 ${log.location}` : ''}
                      {log.location && log.companions ? '  ' : ''}
                      {log.companions ? `👥 ${log.companions}` : ''}
                    </Text>
                  )}
                </View>
                <Text style={styles.logDate}>{formatDate(log.logged_at)}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* 플로팅 기록 추가 버튼 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.getParent()?.navigate('기록추가')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>기록 추가</Text>
      </TouchableOpacity>
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
  header: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appName: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 4,
  },
  nicknameOf: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: 2,
  },
  badgeBlock: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  badgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    gap: 5,
  },
  badgePillEmoji: {
    fontSize: 16,
  },
  badgePillTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  badgeTotalMl: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  summaryHDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakFlame: {
    fontSize: fontSize.md,
  },
  increaseText: {
    color: '#E53935',
  },
  decreaseText: {
    color: '#43A047',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textInverse,
  },
  recentSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  logItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  logMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  logThumb: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
    backgroundColor: colors.surfaceLight,
  },
  logSub: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
