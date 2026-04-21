import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { DrinkLog, DrinkCategory, CATEGORY_LABELS } from '../types';
import {
  getCurrentBadge,
  getNextBadge,
  getMilestoneProgress,
  getCategoryProgress,
  getCurrentMedal,
  getNextMedal,
  getMedalProgress,
  computeJudoScore,
  countSessions,
  BADGES,
  MEDALS,
} from '../constants/milestones';
import {
  evaluateAchievements,
  CATEGORY_LABELS as ACH_CATEGORY_LABELS,
  AchievementCategory,
} from '../constants/achievements';
import { extractInsights } from '../lib/patterns';
import { buildCollection, collectionStats } from '../lib/collection';

type Period = 'week' | 'month' | 'year' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  week: '주간',
  month: '월간',
  year: '연간',
  all: '전체',
};

// 카테고리별 색상
const CATEGORY_COLORS: Record<DrinkCategory, string> = {
  soju: '#7FB3D5',
  beer: '#F7CA18',
  makgeolli: '#F5E6D3',
  wine: '#922B3E',
  whiskey: '#D4A574',
  spirits: '#A074D4',
  etc: '#808080',
};

export default function StatsScreen() {
  const [period, setPeriod] = useState<Period>('week');
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [badgeRoadmapOpen, setBadgeRoadmapOpen] = useState(false);
  const [medalRoadmapOpen, setMedalRoadmapOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('drink_log')
        .select('*, drink_catalog(*)')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (error) throw error;
      setLogs((data as DrinkLog[]) ?? []);
    } catch (err: any) {
      console.error('통계 로드 실패:', err.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [loadLogs]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  // 기간별 시작 시각
  const periodStart = useMemo(() => {
    const now = new Date();
    if (period === 'week') {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const start = new Date(now);
      start.setDate(now.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    if (period === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    if (period === 'year') {
      return new Date(now.getFullYear(), 0, 1);
    }
    return new Date(0); // all
  }, [period]);

  // 기간 필터링된 로그
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => new Date(l.logged_at) >= periodStart);
  }, [logs, periodStart]);

  // 요약 통계
  const stats = useMemo(() => {
    const bottles = filteredLogs.reduce((s, l) => s + (l.bottles || 0), 0);
    const cost = filteredLogs.reduce((s, l) => s + (l.price_paid || 0), 0);
    const uniqueDays = new Set(
      filteredLogs.map((l) => new Date(l.logged_at).toDateString()),
    );
    const totalMl = filteredLogs.reduce((s, l) => {
      const ml = l.quantity_ml ?? (l.drink_catalog?.volume_ml ?? 0) * (l.bottles || 0);
      return s + ml;
    }, 0);
    return {
      bottles,
      cost,
      days: uniqueDays.size,
      totalMl,
    };
  }, [filteredLogs]);

  // ── 전체 누적 음주량 (마일스톤/뱃지용, 기간 무관) ──
  const totalLifetimeMl = useMemo(() => {
    return logs.reduce((s, l) => {
      const ml = l.quantity_ml ?? (l.drink_catalog?.volume_ml ?? 0) * (l.bottles || 0);
      return s + ml;
    }, 0);
  }, [logs]);

  // 주도 점수 = 누적 ml + 술자리 수 × 1000
  const totalSessions = useMemo(() => countSessions(logs), [logs]);
  const judoScore = useMemo(
    () => computeJudoScore(totalLifetimeMl, totalSessions),
    [totalLifetimeMl, totalSessions],
  );

  const badge = useMemo(() => getCurrentBadge(judoScore), [judoScore]);
  const nextBadge = useMemo(() => getNextBadge(judoScore), [judoScore]);
  const milestone = useMemo(() => getMilestoneProgress(totalLifetimeMl), [totalLifetimeMl]);

  // 주연(酒緣) 훈장 — 술자리 수 기반
  const medal = useMemo(() => getCurrentMedal(totalSessions), [totalSessions]);
  const nextMedal = useMemo(() => getNextMedal(totalSessions), [totalSessions]);
  const medalProgress = useMemo(() => getMedalProgress(totalSessions), [totalSessions]);

  // ── 주종별 누적 음주량 (마일스톤용, 전체 기간) ──
  const categoryLifetimeMl = useMemo(() => {
    const map: Partial<Record<DrinkCategory, number>> = {};
    logs.forEach((l) => {
      const cat = l.drink_catalog?.category;
      if (!cat) return;
      const ml = l.quantity_ml ?? (l.drink_catalog?.volume_ml ?? 0) * (l.bottles || 0);
      map[cat] = (map[cat] || 0) + ml;
    });
    return map;
  }, [logs]);

  // 기록이 있는 주종만 (내림차순)
  const activeCategories = useMemo(() => {
    return (Object.entries(categoryLifetimeMl) as [DrinkCategory, number][])
      .filter(([, ml]) => ml > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [categoryLifetimeMl]);

  // 주종별 비율
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLogs.forEach((l) => {
      const cat = l.drink_catalog?.category ?? 'etc';
      map[cat] = (map[cat] || 0) + (l.bottles || 0);
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    if (total === 0) return [];
    return Object.entries(map)
      .map(([key, value]) => ({
        category: key as DrinkCategory,
        value,
        percent: (value / total) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredLogs]);

  // ── 업적 / 패턴 / 도감 (전체 기간 기준) ──
  const achievements = useMemo(() => evaluateAchievements(logs), [logs]);
  const insights = useMemo(() => extractInsights(logs), [logs]);
  const collection = useMemo(() => {
    const entries = buildCollection(logs);
    return collectionStats(entries);
  }, [logs]);
  const [achievementFilter, setAchievementFilter] = useState<AchievementCategory | 'all'>('all');
  const [collectionExpanded, setCollectionExpanded] = useState(false);

  const visibleAchievements = useMemo(() => {
    if (achievementFilter === 'all') return achievements.all;
    return achievements.all.filter((a) => a.category === achievementFilter);
  }, [achievements, achievementFilter]);

  // 기간별 일자/월자 차트 데이터
  const chartData = useMemo(() => {
    if (filteredLogs.length === 0) return [];
    const now = new Date();

    if (period === 'week') {
      // 최근 7일
      const days: { label: string; bottles: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setDate(d.getDate() + 1);
        const bottles = filteredLogs
          .filter((l) => {
            const t = new Date(l.logged_at);
            return t >= d && t < end;
          })
          .reduce((s, l) => s + (l.bottles || 0), 0);
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        days.push({ label: dayNames[d.getDay()], bottles });
      }
      return days;
    }

    if (period === 'month') {
      // 이번 달 일자별 (주 단위로 압축)
      const weeks: { label: string; bottles: number }[] = [];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      for (let w = 0; w < 5; w++) {
        const start = new Date(monthStart);
        start.setDate(1 + w * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        if (start.getMonth() !== now.getMonth()) break;
        const bottles = filteredLogs
          .filter((l) => {
            const t = new Date(l.logged_at);
            return t >= start && t < end;
          })
          .reduce((s, l) => s + (l.bottles || 0), 0);
        weeks.push({ label: `${w + 1}주`, bottles });
      }
      return weeks;
    }

    if (period === 'year') {
      // 올해 월별
      const months: { label: string; bottles: number }[] = [];
      for (let m = 0; m < 12; m++) {
        const start = new Date(now.getFullYear(), m, 1);
        const end = new Date(now.getFullYear(), m + 1, 1);
        const bottles = filteredLogs
          .filter((l) => {
            const t = new Date(l.logged_at);
            return t >= start && t < end;
          })
          .reduce((s, l) => s + (l.bottles || 0), 0);
        months.push({ label: `${m + 1}`, bottles });
      }
      return months;
    }

    // 전체: 월별 (최근 12개월)
    const months: { label: string; bottles: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const bottles = filteredLogs
        .filter((l) => {
          const t = new Date(l.logged_at);
          return t >= start && t < end;
        })
        .reduce((s, l) => s + (l.bottles || 0), 0);
      months.push({ label: `${start.getMonth() + 1}`, bottles });
    }
    return months;
  }, [filteredLogs, period]);

  const maxBottles = Math.max(...chartData.map((d) => d.bottles), 1);

  return (
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.statValue}>
              {stats.bottles.toFixed(1).replace(/\.0$/, '')}
            </Text>
            <Text style={styles.statLabel}>총 병 수</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ₩{stats.cost.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>총 비용</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.days}일</Text>
            <Text style={styles.statLabel}>음주 일수</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats.totalMl >= 1000
                ? `${(stats.totalMl / 1000).toFixed(1)}L`
                : `${Math.round(stats.totalMl)}ml`}
            </Text>
            <Text style={styles.statLabel}>총 음주량</Text>
          </View>
        </View>

        {/* 음주량 차트 */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {PERIOD_LABELS[period]} 음주량
          </Text>
          {filteredLogs.length === 0 ? (
            <View style={styles.chartArea}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>
                이 기간에 기록이 없어요
              </Text>
            </View>
          ) : (
            <View style={styles.barChart}>
              {chartData.map((d, i) => {
                const barHeight = (d.bottles / maxBottles) * 120;
                return (
                  <View key={i} style={styles.barColumn}>
                    <View style={styles.barBackground}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: Math.max(barHeight, d.bottles > 0 ? 4 : 0),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{d.label}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 📊 패턴 인사이트 — 주간 음주량 바로 아래 */}
        {insights.length > 0 && (
          <View style={styles.milestoneCard}>
            <Text style={styles.milestoneHeader}>📊 나의 음주 패턴</Text>
            {insights.map((ins, i) => (
              <View key={i} style={styles.insightRow}>
                <Text style={styles.insightIcon}>{ins.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightHeadline}>{ins.headline}</Text>
                  {ins.detail ? (
                    <Text style={styles.insightDetail}>{ins.detail}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 🏆 나의 음주 여정 카드 */}
        <View style={styles.milestoneCard}>
          <Text style={styles.milestoneHeader}>🏆 나의 음주 여정</Text>

          {/* 현재 뱃지 + 누적량 */}
          <View style={styles.badgeRow}>
            <View style={[styles.badgePill, { backgroundColor: badge.color }]}>
              <Text style={styles.badgePillEmoji}>{badge.emoji}</Text>
              <Text style={[styles.badgePillTitle, { color: badge.textColor }]}>
                {badge.title}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            <View>
              <Text style={styles.milestoneTotalLabel}>누적 음주량</Text>
              <Text style={styles.milestoneTotal}>
                {totalLifetimeMl >= 1000
                  ? `${(totalLifetimeMl / 1000).toFixed(1)}L`
                  : `${Math.round(totalLifetimeMl)}ml`}
              </Text>
            </View>
          </View>
          {/* 등급 설명 */}
          <Text style={styles.badgeDesc}>{badge.desc}</Text>

          {/* 현재 마일스톤 달성 문구 */}
          <View style={styles.milestoneAchieved}>
            <Text style={styles.milestoneEmoji}>
              {milestone.current ? milestone.current.emoji : '🌱'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.milestoneMsg}>
                {milestone.current ? milestone.current.msg : '첫 잔을 기록해보세요!'}
              </Text>
              {milestone.current?.subMsg ? (
                <Text style={styles.milestoneSubMsg}>{milestone.current.subMsg}</Text>
              ) : null}
            </View>
          </View>

          {/* 다음 마일스톤 프로그레스 */}
          {milestone.next && (
            <View style={styles.milestoneNextBox}>
              <View style={styles.milestoneProgressRow}>
                <Text style={styles.milestoneNextLabel}>
                  다음: {milestone.next.emoji} {milestone.next.icon}
                </Text>
                <Text style={styles.milestoneNextPct}>
                  {Math.round(milestone.progressPercent)}%
                </Text>
              </View>
              <View style={styles.milestoneProgressBg}>
                <View
                  style={[
                    styles.milestoneProgressFill,
                    { width: `${Math.max(milestone.progressPercent, 2)}%` },
                  ]}
                />
              </View>
              <Text style={styles.milestoneNextSub}>
                {milestone.next.ml >= 1000
                  ? `${(milestone.next.ml / 1000).toFixed(0)}L`
                  : `${milestone.next.ml}ml`} 달성 시
              </Text>
            </View>
          )}

          {/* 다음 등급까지 */}
          {nextBadge && (
            <View style={styles.nextBadgeRow}>
              <Text style={styles.nextBadgeLabel}>다음 등급</Text>
              <View style={[styles.badgePillSm, { backgroundColor: nextBadge.color }]}>
                <Text style={styles.badgePillSmEmoji}>{nextBadge.emoji}</Text>
                <Text style={[styles.badgePillSmTitle, { color: nextBadge.textColor }]}>
                  {nextBadge.title}
                </Text>
              </View>
              <Text style={styles.nextBadgeMl}>
                (주도 점수 {nextBadge.score.toLocaleString()} 달성)
              </Text>
            </View>
          )}

          {/* 전체 등급 로드맵 (접기/펼치기) */}
          <TouchableOpacity
            style={styles.roadmapToggle}
            onPress={() => setBadgeRoadmapOpen((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.roadmapToggleText}>
              전체 47단계 로드맵 {badgeRoadmapOpen ? '접기 ▲' : '보기 ▼'}
            </Text>
          </TouchableOpacity>
          {badgeRoadmapOpen && (
          <View style={styles.badgeRoadmap}>
            {BADGES.map((b) => {
              const achieved = judoScore >= b.score;
              return (
                <View key={b.rank} style={styles.roadmapItem}>
                  <View
                    style={[
                      styles.roadmapDot,
                      achieved
                        ? { backgroundColor: badge.color === b.color ? colors.primary : b.color }
                        : { backgroundColor: colors.surfaceLight },
                    ]}
                  >
                    <Text style={styles.roadmapEmoji}>{b.emoji}</Text>
                  </View>
                  <Text
                    style={[
                      styles.roadmapLabel,
                      achieved && { color: colors.textPrimary, fontWeight: '600' },
                    ]}
                  >
                    {b.title}
                  </Text>
                </View>
              );
            })}
          </View>
          )}

          {/* 주도 점수 한 줄 */}
          <Text style={styles.judoScoreLine}>
            주도 점수 <Text style={styles.judoScoreValue}>{judoScore.toLocaleString()}</Text>
            <Text style={styles.judoScoreHint}>  ·  누적 ml + 술자리 × 1,000</Text>
          </Text>
        </View>

        {/* 🎖 주연(酒緣) 훈장 — 술자리 수 기반 */}
        <View style={styles.milestoneCard}>
          <Text style={styles.milestoneHeader}>🎖 주연(酒緣) 훈장</Text>
          <Text style={styles.medalIntro}>
            함께한 술자리의 기록 — 지금까지 {totalSessions.toLocaleString()}회
          </Text>

          {/* 현재 훈장 */}
          <View style={styles.badgeRow}>
            {medal ? (
              <View style={[styles.badgePill, { backgroundColor: medal.color }]}>
                <Text style={styles.badgePillEmoji}>{medal.emoji}</Text>
                <Text style={[styles.badgePillTitle, { color: medal.textColor }]}>
                  {medal.title}
                </Text>
              </View>
            ) : (
              <View style={[styles.badgePill, { backgroundColor: colors.surfaceLight }]}>
                <Text style={styles.badgePillEmoji}>✨</Text>
                <Text style={[styles.badgePillTitle, { color: colors.textSecondary }]}>
                  첫 건배를 기다리는 중
                </Text>
              </View>
            )}
          </View>
          {medal && <Text style={styles.badgeDesc}>{medal.desc}</Text>}

          {/* 다음 훈장 진행률 */}
          {nextMedal && (
            <View style={styles.milestoneNextBox}>
              <View style={styles.milestoneProgressRow}>
                <Text style={styles.milestoneNextLabel}>
                  다음: {nextMedal.emoji} {nextMedal.title}
                </Text>
                <Text style={styles.milestoneNextPct}>
                  {Math.round(medalProgress.progressPercent)}%
                </Text>
              </View>
              <View style={styles.milestoneProgressBg}>
                <View
                  style={[
                    styles.milestoneProgressFill,
                    { width: `${Math.max(medalProgress.progressPercent, 2)}%` },
                  ]}
                />
              </View>
              <Text style={styles.milestoneNextSub}>
                {nextMedal.sessions.toLocaleString()}회 달성 시 · 앞으로 {Math.max(nextMedal.sessions - totalSessions, 0)}회
              </Text>
            </View>
          )}

          {/* 훈장 로드맵 (접기/펼치기) */}
          <TouchableOpacity
            style={styles.roadmapToggle}
            onPress={() => setMedalRoadmapOpen((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.roadmapToggleText}>
              전체 20단계 훈장 {medalRoadmapOpen ? '접기 ▲' : '보기 ▼'}
            </Text>
          </TouchableOpacity>
          {medalRoadmapOpen && (
          <View style={styles.badgeRoadmap}>
            {MEDALS.map((m) => {
              const achieved = totalSessions >= m.sessions;
              return (
                <View key={m.rank} style={styles.roadmapItem}>
                  <View
                    style={[
                      styles.roadmapDot,
                      achieved
                        ? { backgroundColor: m.color }
                        : { backgroundColor: colors.surfaceLight },
                    ]}
                  >
                    <Text style={styles.roadmapEmoji}>{m.emoji}</Text>
                  </View>
                  <Text
                    style={[
                      styles.roadmapLabel,
                      achieved && { color: colors.textPrimary, fontWeight: '600' },
                    ]}
                  >
                    {m.title}
                  </Text>
                </View>
              );
            })}
          </View>
          )}
        </View>

        {/* 🎯 주종별 여정 */}
        {activeCategories.length > 0 && (
          <View style={styles.milestoneCard}>
            <Text style={styles.milestoneHeader}>🎯 주종별 여정</Text>
            {activeCategories.map(([cat, ml]) => {
              const prog = getCategoryProgress(cat, ml);
              const color = CATEGORY_COLORS[cat];
              const totalLabel = ml >= 1000
                ? `${(ml / 1000).toFixed(1)}L`
                : `${Math.round(ml)}ml`;
              return (
                <View key={cat} style={styles.catProgressBlock}>
                  {/* 상단: 주종 + 누적 */}
                  <View style={styles.catProgressHeader}>
                    <View style={[styles.catDot, { backgroundColor: color }]} />
                    <Text style={styles.catProgressName}>{CATEGORY_LABELS[cat]}</Text>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.catProgressTotal}>{totalLabel}</Text>
                  </View>

                  {/* 현재 달성 마일스톤 */}
                  {prog.current && (
                    <View style={styles.catAchieved}>
                      <Text style={styles.catAchievedEmoji}>{prog.current.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.catAchievedMsg}>{prog.current.msg}</Text>
                        {prog.current.subMsg ? (
                          <Text style={styles.catAchievedSub}>{prog.current.subMsg}</Text>
                        ) : null}
                      </View>
                    </View>
                  )}

                  {/* 다음 마일스톤 + 진행바 */}
                  {prog.next && (
                    <View style={styles.catNextBox}>
                      <View style={styles.catNextRow}>
                        <Text style={styles.catNextLabel}>
                          다음: {prog.next.emoji} {prog.next.icon}
                        </Text>
                        <Text style={[styles.catNextPct, { color }]}>
                          {Math.round(prog.progressPercent)}%
                        </Text>
                      </View>
                      <View style={styles.catProgressBg}>
                        <View
                          style={[
                            styles.catProgressFill,
                            {
                              width: `${Math.max(prog.progressPercent, 2)}%`,
                              backgroundColor: color,
                            },
                          ]}
                        />
                      </View>
                      {(() => {
                        const remainMl = prog.next.ml - ml;
                        const remainLabel = remainMl >= 1000
                          ? `${(remainMl / 1000).toFixed(1)}L`
                          : `${Math.round(remainMl)}ml`;
                        return (
                          <Text style={styles.catNextSub}>
                            {remainLabel} 남음
                          </Text>
                        );
                      })()}
                    </View>
                  )}
                  {!prog.next && prog.current && (
                    <Text style={styles.catMaxed}>🎉 이 주종 최고 단계 달성!</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* 🏆 업적 (토글) */}
        <View style={styles.milestoneCard}>
          <TouchableOpacity
            onPress={() => setAchievementsOpen((v) => !v)}
            activeOpacity={0.7}
            style={styles.achHeaderRow}
          >
            <Text style={styles.milestoneHeader}>🏆 업적</Text>
            <Text style={styles.achCountText}>
              {achievements.unlockedCount} / {achievements.totalCount}
            </Text>
            <Text style={styles.collectionChevron}>
              {achievementsOpen ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          {/* 진행률 바 (항상 보임) */}
          <View style={styles.achOverallBg}>
            <View
              style={[
                styles.achOverallFill,
                { width: `${Math.max(achievements.unlockedPercent, 2)}%` },
              ]}
            />
          </View>
          {/* 이스터에그 카운트 (숨김 업적 해금 현황) */}
          <Text style={styles.achSecretCount}>
            🥚 숨겨진 업적 {achievements.secretUnlocked} / {achievements.secretTotal} 해금
          </Text>

          {achievementsOpen && (
          <>
          {/* 카테고리 필터 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: spacing.md, marginBottom: spacing.sm }}
          >
            <TouchableOpacity
              onPress={() => setAchievementFilter('all')}
              style={[
                styles.achFilterChip,
                achievementFilter === 'all' && styles.achFilterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.achFilterText,
                  achievementFilter === 'all' && styles.achFilterTextActive,
                ]}
              >
                전체
              </Text>
            </TouchableOpacity>
            {(Object.keys(ACH_CATEGORY_LABELS) as AchievementCategory[]).map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setAchievementFilter(cat)}
                style={[
                  styles.achFilterChip,
                  achievementFilter === cat && styles.achFilterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.achFilterText,
                    achievementFilter === cat && styles.achFilterTextActive,
                  ]}
                >
                  {ACH_CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 업적 리스트 */}
          {visibleAchievements.map((a) => {
            const pct = a.target > 0 ? (a.progress / a.target) * 100 : 0;
            return (
              <View
                key={a.id}
                style={[
                  styles.achItem,
                  a.unlocked && styles.achItemUnlocked,
                ]}
              >
                <Text
                  style={[
                    styles.achEmoji,
                    !a.unlocked && styles.achEmojiLocked,
                  ]}
                >
                  {a.emoji}
                </Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.achTitleRow}>
                    <Text
                      style={[
                        styles.achTitle,
                        !a.unlocked && styles.achTitleLocked,
                      ]}
                    >
                      {a.title}
                    </Text>
                    {a.unlocked ? (
                      <Text style={styles.achBadgeDone}>✓ 달성</Text>
                    ) : (
                      <Text style={styles.achBadgeProgress}>
                        {a.progress}
                        {a.unit ? a.unit : ''} / {a.target}
                        {a.unit ? a.unit : ''}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.achDesc}>{a.desc}</Text>
                  {!a.unlocked && (
                    <View style={styles.achProgressBg}>
                      <View
                        style={[
                          styles.achProgressFill,
                          { width: `${Math.max(pct, 2)}%` },
                        ]}
                      />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
          </>
          )}
        </View>

        {/* 📚 도감 */}
        {collection.totalUnique > 0 && (
          <View style={styles.milestoneCard}>
            <TouchableOpacity
              onPress={() => setCollectionExpanded(!collectionExpanded)}
              activeOpacity={0.7}
              style={styles.collectionHeaderRow}
            >
              <Text style={styles.milestoneHeader}>📚 주류 도감</Text>
              <Text style={styles.collectionCount}>
                {collection.totalUnique}종
              </Text>
              <Text style={styles.collectionChevron}>
                {collectionExpanded ? '⌃' : '⌄'}
              </Text>
            </TouchableOpacity>

            {/* 주종별 집계 */}
            <View style={styles.collectionChips}>
              {collection.categoryCounts.map((c) => (
                <View
                  key={c.category}
                  style={[
                    styles.collectionChip,
                    { backgroundColor: CATEGORY_COLORS[c.category] + '33' },
                  ]}
                >
                  <View
                    style={[
                      styles.collectionChipDot,
                      { backgroundColor: CATEGORY_COLORS[c.category] },
                    ]}
                  />
                  <Text style={styles.collectionChipText}>
                    {CATEGORY_LABELS[c.category]} {c.count}종
                  </Text>
                </View>
              ))}
            </View>

            {/* 펼치면 전체 목록 표시 */}
            {collectionExpanded && (
              <View style={styles.collectionList}>
                {(Object.entries(collection.byCategory) as any[])
                  .filter(([, list]) => list.length > 0)
                  .map(([cat, list]) => (
                    <View key={cat} style={styles.collectionGroup}>
                      <Text style={styles.collectionGroupTitle}>
                        {CATEGORY_LABELS[cat as DrinkCategory]}
                      </Text>
                      {list.map((e: any) => (
                        <View key={e.catalog.id} style={styles.collectionEntry}>
                          <Text style={styles.collectionEntryName}>
                            {e.catalog.name}
                          </Text>
                          <Text style={styles.collectionEntryMeta}>
                            {e.timesDrunk}회 · {e.totalBottles.toFixed(1).replace(/\.0$/, '')}병
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}

        {/* 주종 비율 */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>주종별 비율</Text>
          {categoryBreakdown.length === 0 ? (
            <View style={styles.chartArea}>
              <Text style={styles.emptyIcon}>🥧</Text>
              <Text style={styles.emptyText}>
                기록을 추가하면 주종 비율을 볼 수 있어요
              </Text>
            </View>
          ) : (
            <>
              {/* 스택형 바 */}
              <View style={styles.stackBar}>
                {categoryBreakdown.map((c, i) => (
                  <View
                    key={i}
                    style={{
                      width: `${c.percent}%`,
                      backgroundColor: CATEGORY_COLORS[c.category],
                      height: '100%',
                    }}
                  />
                ))}
              </View>
              {/* 범례 */}
              <View style={styles.legend}>
                {categoryBreakdown.map((c, i) => (
                  <View key={i} style={styles.legendRow}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: CATEGORY_COLORS[c.category] },
                      ]}
                    />
                    <Text style={styles.legendLabel}>
                      {CATEGORY_LABELS[c.category]}
                    </Text>
                    <Text style={styles.legendValue}>
                      {c.value.toFixed(1).replace(/\.0$/, '')}병 (
                      {c.percent.toFixed(1)}%)
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
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
  chartCard: {
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
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingTop: spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barBackground: {
    height: 120,
    width: '60%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  barLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  stackBar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  legend: {
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  legendLabel: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    flex: 1,
  },
  legendValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // ── 마일스톤 & 뱃지 ──
  milestoneCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  milestoneHeader: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  badgePillEmoji: {
    fontSize: 22,
  },
  badgePillTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  milestoneTotalLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  milestoneTotal: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'right',
  },
  milestoneAchieved: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  milestoneEmoji: {
    fontSize: 34,
  },
  milestoneMsg: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500',
    lineHeight: 20,
  },
  milestoneSubMsg: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  milestoneNextBox: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  milestoneProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneNextLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  milestoneNextPct: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '700',
  },
  milestoneProgressBg: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  milestoneProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  milestoneNextSub: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  nextBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextBadgeLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  badgePillSm: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  badgePillSmEmoji: {
    fontSize: 14,
  },
  badgePillSmTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  nextBadgeMl: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  // 등급 로드맵
  judoScoreLine: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  judoScoreValue: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  judoScoreHint: {
    fontSize: fontSize.xs,
    color: colors.textTertiary ?? colors.textSecondary,
  },
  medalIntro: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  roadmapToggle: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  roadmapToggleText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  badgeRoadmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  roadmapItem: {
    alignItems: 'center',
    width: '17%',
    gap: 4,
  },
  roadmapDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadmapEmoji: {
    fontSize: 20,
  },
  roadmapLabel: {
    fontSize: 9,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  // ── 주종별 여정 ──
  catProgressBlock: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  catProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catProgressName: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  catProgressTotal: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  catAchieved: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  catAchievedEmoji: {
    fontSize: 24,
  },
  catAchievedMsg: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500',
    lineHeight: 18,
  },
  catAchievedSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  catNextBox: {
    gap: 4,
  },
  catNextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catNextLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  catNextPct: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  catProgressBg: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  catProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  catNextSub: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'right',
  },
  catMaxed: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },

  // ── 패턴 인사이트 ──
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  insightIcon: {
    fontSize: 28,
  },
  insightHeadline: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '600',
    lineHeight: 20,
  },
  insightDetail: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // ── 업적 ──
  achHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  achCountText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '700',
  },
  achOverallBg: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  achOverallFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  achSecretCount: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'right',
  },
  achFilterChip: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
  },
  achFilterChipActive: {
    backgroundColor: colors.primary,
  },
  achFilterText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  achFilterTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  achItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: 4,
  },
  achItemUnlocked: {
    backgroundColor: colors.surfaceLight,
  },
  achEmoji: {
    fontSize: 28,
  },
  achEmojiLocked: {
    opacity: 0.35,
  },
  achTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achTitle: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  achTitleLocked: {
    color: colors.textSecondary,
  },
  achBadgeDone: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '700',
  },
  achBadgeProgress: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  achDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 4,
  },
  achProgressBg: {
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  achProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },

  // ── 도감 ──
  collectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  collectionCount: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '700',
    flex: 1,
  },
  collectionChevron: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  collectionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  collectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  collectionChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  collectionChipText: {
    fontSize: fontSize.xs,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  collectionList: {
    marginTop: spacing.md,
  },
  collectionGroup: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  collectionGroupTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  collectionEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  collectionEntryName: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    flex: 1,
  },
  collectionEntryMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
