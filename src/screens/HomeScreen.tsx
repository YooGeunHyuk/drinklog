import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius, iconSize } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { DrinkLog, CATEGORY_LABELS, MOOD_ICONS, DrinkCategory } from '../types';
import { isCurrentUserAdmin } from '../lib/admin';
import {
  getLevel,
  getNextLevel,
  getCategoryProgress,
  computeJudoScore,
  computeStreakBonus,
  countUniqueDrinks,
} from '../constants/milestones';
import { WEATHER_ICONS, WeatherCode } from '../lib/weather';
import { topCategory } from '../lib/patterns';
import Icon from '../components/Icon';
import { getCategoryIcon } from '../constants/categoryIcons';
import { ErrorBanner } from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import SummaryStatRow from '../components/SummaryStatRow';
import { buildMonthlyBrag, shareBrag } from '../lib/share';
import CelebrationModal, {
  CelebrationPayload,
} from '../components/CelebrationModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMilestoneProgress } from '../constants/milestones';

const CELEBRATION_SEEN_KEY = '@drinklog/celebration/last-seen-v1';
interface LastSeen {
  milestoneMl: number; // 가장 최근 본 마일스톤 ml
  levelRank: number; // 가장 최근 본 레벨
}

export default function HomeScreen({ navigation }: any) {
  const [nickname, setNickname] = useState<string>('');
  const [weekStats, setWeekStats] = useState({
    bottles: 0,
    cost: 0,
    days: 0,
  });
  const [monthStats, setMonthStats] = useState({
    bottles: 0,
    cost: 0,
    days: 0,
  });
  const [streak, setStreak] = useState(0); // 연속 음주일 (오늘 기준 역산)
  const [totalLifetimeMl, setTotalLifetimeMl] = useState(0);
  const [judoScore, setJudoScore] = useState(0);
  const [mainCategory, setMainCategory] = useState<{
    category: DrinkCategory;
    ml: number;
  } | null>(null);
  const [recentLogs, setRecentLogs] = useState<DrinkLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<CelebrationPayload | null>(
    null,
  );

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

  // 축하 트리거 — AsyncStorage에 마지막으로 본 milestone/level을 저장하고
  // 새 값과 비교해서 변화가 있으면 CelebrationModal을 띄움.
  // 첫 로드 시에는 비교 없이 baseline만 저장.
  const checkCelebration = async (
    totalMl: number,
    score: number,
    nick: string,
  ) => {
    try {
      const ms = getMilestoneProgress(totalMl);
      const lvl = getLevel(score);
      const currentMilestone = ms.current;

      const seenRaw = await AsyncStorage.getItem(CELEBRATION_SEEN_KEY);
      const seen: LastSeen | null = seenRaw ? JSON.parse(seenRaw) : null;

      if (seen) {
        // 우선순위: 레벨업 > 마일스톤 (둘 다 발생 시 레벨업 먼저)
        if (lvl.rank > seen.levelRank) {
          setCelebration({
            kind: 'levelup',
            emoji: lvl.emoji,
            title: `Lv ${lvl.rank} ${lvl.title}`,
            subtitle: lvl.desc,
            level: lvl.rank,
            nickname: nick || undefined,
          });
        } else if (
          currentMilestone &&
          currentMilestone.ml > seen.milestoneMl
        ) {
          setCelebration({
            kind: 'milestone',
            emoji: currentMilestone.emoji,
            title: `${currentMilestone.icon} 돌파!`,
            subtitle: currentMilestone.msg,
            milestoneLabel: currentMilestone.icon,
            nickname: nick || undefined,
          });
        }
      }

      const newSeen: LastSeen = {
        milestoneMl: currentMilestone?.ml ?? 0,
        levelRank: lvl.rank,
      };
      await AsyncStorage.setItem(
        CELEBRATION_SEEN_KEY,
        JSON.stringify(newSeen),
      );
    } catch {
      // 축하는 부가 기능 — 실패해도 메인 흐름에 영향 없게 조용히 무시
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoadError(null);
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
      const nick = profile?.nickname ?? '';
      setNickname(nick);

      // 날짜 계산
      const now = new Date();
      const day = now.getDay(); // 0=일, 1=월, ..., 6=토
      const diff = day === 0 ? 6 : day - 1;

      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - diff);
      weekStart.setHours(0, 0, 0, 0);

      // 이번 달 시작일 (1일 00:00)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

      // ① 이번 달 기록 (주 단위는 월 단위 안에 포함되므로 함께 처리)
      const { data: monthLogs } = await supabase
        .from('drink_log')
        .select('logged_at, bottles, price_paid, drink_catalog(*)')
        .eq('user_id', user.id)
        .gte('logged_at', monthStart.toISOString())
        .order('logged_at', { ascending: false });

      const list = monthLogs ?? [];

      // 이번 달 집계
      const mBottles = list.reduce((s, l) => s + (l.bottles || 0), 0);
      const mCost = list.reduce((s, l) => s + (l.price_paid || 0), 0);
      const mDays = new Set(list.map((l) => new Date(l.logged_at).toDateString())).size;
      setMonthStats({ bottles: mBottles, cost: mCost, days: mDays });

      // 이번 주 집계 (월 데이터에서 필터)
      const weekStartMs = weekStart.getTime();
      const weekList = list.filter((l) => new Date(l.logged_at).getTime() >= weekStartMs);
      const wBottles = weekList.reduce((s, l) => s + (l.bottles || 0), 0);
      const wCost = weekList.reduce((s, l) => s + (l.price_paid || 0), 0);
      const wDays = new Set(weekList.map((l) => new Date(l.logged_at).toDateString())).size;
      setWeekStats({ bottles: wBottles, cost: wCost, days: wDays });

      // ③ 전체 기록 (뱃지 + 연속 음주일 + 메인 주종 — 한 번만 쿼리)
      const { data: allLogs } = await supabase
        .from('drink_log')
        .select('logged_at, quantity_ml, bottles, drink_catalog(category, volume_ml)')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (allLogs) {
        // 누적 음주량
        const total = allLogs.reduce((s: number, l: any) => {
          const ml = l.quantity_ml ?? (l.drink_catalog?.volume_ml ?? 0) * (l.bottles || 0);
          return s + ml;
        }, 0);
        setTotalLifetimeMl(total);

        // 주도 점수 = ml + 술자리 수 × 1000 + 연속 음주 보너스
        const sessionKeys = new Set<string>();
        allLogs.forEach((l: any) => {
          const d = new Date(l.logged_at);
          sessionKeys.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
        });
        const streakBonus = computeStreakBonus(allLogs as unknown as DrinkLog[]);
        const unique = countUniqueDrinks(allLogs as unknown as DrinkLog[]);
        const score = computeJudoScore(
          total,
          sessionKeys.size,
          streakBonus,
          unique,
        );
        setJudoScore(score);

        // 축하 트리거 — 마일스톤·레벨 변화 감지
        await checkCelebration(total, score, nick);

        // 메인 주종 (가장 많이 마신 카테고리 누적 ml)
        const catMl: Partial<Record<DrinkCategory, number>> = {};
        allLogs.forEach((l: any) => {
          const cat = l.drink_catalog?.category as DrinkCategory | undefined;
          if (!cat) return;
          const ml = l.quantity_ml ?? (l.drink_catalog?.volume_ml ?? 0) * (l.bottles || 0);
          catMl[cat] = (catMl[cat] || 0) + ml;
        });
        const entries = Object.entries(catMl) as [DrinkCategory, number][];
        if (entries.length > 0) {
          const [topCat, topMl] = entries.sort((a, b) => b[1] - a[1])[0];
          setMainCategory({ category: topCat, ml: topMl });
        } else {
          setMainCategory(null);
        }

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
      setLoadError(err?.message ?? '알 수 없는 오류가 발생했어요.');
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
        <ErrorBanner
          error={loadError}
          onRetry={loadData}
          onDismiss={() => setLoadError(null)}
        />
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
                <Text style={{ color: getLevel(judoScore).textColor }}>{nickname || '나'}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>의</Text>
              </Text>
              <Text style={styles.appName}>酒路{isAdmin ? ' 🛠' : ''}</Text>
            </TouchableOpacity>

            {/* 우: 프로필 버튼 + 레벨 박스 + 누적량 */}
            {(() => {
              const lvl = getLevel(judoScore);
              const totalLabel = totalLifetimeMl >= 1000
                ? `${(totalLifetimeMl / 1000).toFixed(1)}L`
                : `${Math.round(totalLifetimeMl)}ml`;
              return (
                <View style={styles.badgeBlock}>
                  <TouchableOpacity
                    style={styles.profileBtn}
                    onPress={() => navigation.getParent()?.navigate('Settings')}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <Icon name="UserCog" size={iconSize.md} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <Text style={styles.badgeTotalMl}>누적 {totalLabel}</Text>
                  <View style={[styles.badgeBox, { backgroundColor: lvl.color }]}>
                    <Text style={styles.badgePillEmoji}>{lvl.emoji}</Text>
                    <Text style={[styles.badgePillTitle, { color: lvl.textColor }]}>
                      Lv {lvl.rank} · {lvl.title}
                    </Text>
                  </View>
                </View>
              );
            })()}
          </View>
        </View>

        {/* 음주 요약 카드 — 이번 달 / 이번 주 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>음주 요약</Text>
            <View style={styles.summaryHeaderRight}>
              <View style={styles.streakChip}>
                <Text style={styles.streakChipFlame}>{streak >= 3 ? '🔥' : '💧'}</Text>
                <Text style={styles.streakChipText}>연속 {streak}일</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  shareBrag(
                    buildMonthlyBrag({
                      bottles: monthStats.bottles,
                      cost: monthStats.cost,
                      days: monthStats.days,
                      nickname: nickname || undefined,
                    }),
                    '이번 달 음주 기록',
                  )
                }
                style={styles.shareBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon
                  set="lucide"
                  name="Share2"
                  size={iconSize.sm}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <SummaryStatRow
            subTitle="이번 달 (현재까지)"
            items={[
              {
                value: monthStats.bottles.toFixed(1).replace(/\.0$/, ''),
                label: '비운 병 수',
              },
              {
                value: monthStats.cost.toLocaleString(),
                label: '쓴 금액 (원)',
                isCost: true,
              },
              { value: `${monthStats.days}일`, label: '마신 일수' },
            ]}
          />

          <View style={styles.summaryHDivider} />

          <SummaryStatRow
            subTitle="이번 주"
            items={[
              {
                value: weekStats.bottles.toFixed(1).replace(/\.0$/, ''),
                label: '비운 병 수',
              },
              {
                value: weekStats.cost.toLocaleString(),
                label: '쓴 금액 (원)',
                isCost: true,
              },
              { value: `${weekStats.days}일`, label: '마신 일수' },
            ]}
          />
        </View>

        {/* 🎯 메인 주종 마일스톤 배너 */}
        {mainCategory && (() => {
          const prog = getCategoryProgress(mainCategory.category, mainCategory.ml);
          if (!prog.next) return null;
          const remainMl = prog.next.ml - mainCategory.ml;
          const remainLabel = remainMl >= 1000
            ? `${(remainMl / 1000).toFixed(1)}L`
            : `${Math.round(remainMl)}ml`;
          return (
            <TouchableOpacity
              style={styles.catBanner}
              onPress={() => navigation.navigate('통계')}
              activeOpacity={0.8}
            >
              <Text style={styles.catBannerEmoji}>{prog.next.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.catBannerTitle}>
                  {CATEGORY_LABELS[mainCategory.category]} {prog.next.icon}까지
                </Text>
                <Text style={styles.catBannerSub}>
                  {remainLabel} 남았어요 · {Math.round(prog.progressPercent)}%
                </Text>
                <View style={styles.catBannerBg}>
                  <View
                    style={[
                      styles.catBannerFill,
                      { width: `${Math.max(prog.progressPercent, 2)}%` },
                    ]}
                  />
                </View>
              </View>
              <Icon set="fa5" name="caret-right" size={iconSize.sm} color={colors.textTertiary} />
            </TouchableOpacity>
          );
        })()}

        {/* 최근 기록 */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>최근 기록</Text>
          {recentLogs.length === 0 ? (
            <EmptyState
              icon={
                <Icon
                  set="mci"
                  name="bottle-tonic-outline"
                  size={iconSize.xxl}
                  color={colors.textTertiary}
                />
              }
              title="아직 기록이 없어요"
              subtitle="첫 번째 술을 기록해보세요!"
            />
          ) : (
            recentLogs.map((log) => (
              <View key={log.id} style={styles.logBlock}>
                {/* 카드 위 날짜·시간 라벨 */}
                <Text style={styles.logDateAboveCard}>{formatDate(log.logged_at)}</Text>
                <TouchableOpacity
                  style={styles.logItem}
                  onPress={() =>
                    navigation
                      .getParent()
                      ?.navigate('EditDrink', { logId: log.id })
                  }
                  activeOpacity={0.7}
                >
                  {/* 좌측: 아이콘 컬럼 (세로 중앙 정렬) */}
                  {log.drink_catalog && (() => {
                    const ci = getCategoryIcon(log.drink_catalog.category);
                    return (
                      <View style={styles.logIconCol}>
                        <Icon
                          set={ci.set}
                          name={ci.name}
                          size={iconSize.sm}
                          color={colors.textSecondary}
                        />
                      </View>
                    );
                  })()}

                  {/* 중앙: 텍스트 컬럼 */}
                  <View style={styles.logContentCol}>
                    <Text style={styles.logName} numberOfLines={1}>
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
                    {/* 동행자(companions)는 리스트에선 숨기고 상세 화면에서만 노출 */}
                  </View>

                  {/* 우측: 날씨 + 장소 (날짜는 카드 위로 이동) */}
                  <View style={styles.logRight}>
                    {log.weather && (
                      <Text style={styles.logWeather}>
                        {WEATHER_ICONS[log.weather as WeatherCode] ?? ''}
                      </Text>
                    )}
                    {log.location && (
                      <Text style={styles.logLocation} numberOfLines={1}>
                        📍 {log.location}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <CelebrationModal
        visible={celebration !== null}
        payload={celebration}
        onClose={() => setCelebration(null)}
      />
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  profileBtn: {
    padding: 4,
    marginBottom: 4,
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
    paddingVertical: 1,
    paddingHorizontal: 5,
    gap: 2,
  },
  badgePillEmoji: {
    fontSize: 12,
  },
  badgePillTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    lineHeight: fontSize.xs + 4,
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
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shareBtn: {
    padding: spacing.xs,
  },
  summaryTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  streakChipFlame: {
    fontSize: iconSize.xs,
  },
  streakChipText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  summaryHDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
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
  logBlock: {
    marginBottom: spacing.sm,
  },
  logDateAboveCard: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: 4,
    marginLeft: 2,
  },
  logItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logIconCol: {
    width: 22,
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  logContentCol: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  logName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  logRight: {
    alignItems: 'flex-end',
    gap: 2,
    marginLeft: spacing.sm,
    maxWidth: 120,
  },
  logWeather: {
    fontSize: iconSize.sm,
  },
  logLocation: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
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

  // ── 메인 주종 배너 ──
  catBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  catBannerEmoji: {
    fontSize: iconSize.xl,
  },
  catBannerTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  catBannerSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  catBannerBg: {
    height: 5,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  catBannerFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  catBannerChevron: {
    fontSize: iconSize.lg,
    color: colors.textTertiary,
  },
});
