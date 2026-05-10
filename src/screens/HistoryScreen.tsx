import React, { useState, useCallback, useMemo } from 'react';
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
import { DrinkCategory, CATEGORY_LABELS, DrinkLog, MOOD_ICONS } from '../types';
import { supabase } from '../lib/supabase';
import { WEATHER_ICONS, WeatherCode } from '../lib/weather';
import Icon from '../components/Icon';
import { getCategoryIcon } from '../constants/categoryIcons';
import EmptyState from '../components/EmptyState';

type FilterCategory = 'all' | DrinkCategory;

const FILTERS: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'soju', label: '소주' },
  { key: 'beer', label: '맥주' },
  { key: 'makgeolli', label: '막걸리' },
  { key: 'wine', label: '와인' },
  { key: 'whiskey', label: '위스키' },
  { key: 'spirits', label: '양주' },
  { key: 'etc', label: '기타' },
];

export default function HistoryScreen({ navigation }: any) {
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('drink_log')
        .select('*, drink_catalog(*)')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (error) throw error;
      setLogs((data as DrinkLog[]) ?? []);
    } catch (err: any) {
      Alert.alert('로드 실패', err.message ?? '기록을 불러오지 못했습니다.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
      // 화면 벗어나면 편집모드 해제
      return () => {
        setIsEditMode(false);
        setSelectedIds(new Set());
      };
    }, [loadLogs]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  // 편집모드 진입/해제
  const enterEditMode = () => {
    setIsEditMode(true);
    setSelectedIds(new Set());
  };
  const exitEditMode = () => {
    setIsEditMode(false);
    setSelectedIds(new Set());
  };

  // 체크박스 토글
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // 전체 선택 / 전체 해제
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLogs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLogs.map((l) => l.id)));
    }
  };

  // 선택 삭제
  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      '기록 삭제',
      `선택한 ${selectedIds.size}개의 기록을 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { error } = await supabase
                .from('drink_log')
                .delete()
                .in('id', Array.from(selectedIds));
              if (error) throw error;
              setLogs((prev) => prev.filter((l) => !selectedIds.has(l.id)));
              exitEditMode();
            } catch (err: any) {
              Alert.alert('삭제 실패', err.message ?? '삭제 중 오류가 발생했습니다.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs;
    return logs.filter((l) => l.drink_catalog?.category === filter);
  }, [logs, filter]);

  const groupedLogs = useMemo(() => {
    const groups: { [date: string]: DrinkLog[] } = {};
    filteredLogs.forEach((log) => {
      const d = new Date(log.logged_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });
    return Object.entries(groups).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filteredLogs]);

  const formatDateHeader = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const isToday = date.getTime() === today.getTime();
    const isYesterday = date.getTime() === yesterday.getTime();
    if (isToday) return `오늘 (${m}/${d} ${dayNames[date.getDay()]})`;
    if (isYesterday) return `어제 (${m}/${d} ${dayNames[date.getDay()]})`;
    return `${m}/${d} (${dayNames[date.getDay()]})`;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const allSelected = filteredLogs.length > 0 && selectedIds.size === filteredLogs.length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>기록 목록</Text>
        {isEditMode ? (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleSelectAll} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>
                {allSelected ? '전체 해제' : '전체 선택'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={exitEditMode} style={styles.headerBtn}>
              <Text style={[styles.headerBtnText, { color: colors.textSecondary }]}>완료</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={enterEditMode} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>편집</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* 주종 필터 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 편집 모드 안내 */}
        {isEditMode && (
          <View style={styles.editBanner}>
            <Text style={styles.editBannerText}>
              {selectedIds.size > 0
                ? `${selectedIds.size}개 선택됨`
                : '삭제할 기록을 선택하세요'}
            </Text>
          </View>
        )}

        {/* 빈 상태 or 목록 */}
        {filteredLogs.length === 0 ? (
          <EmptyState
            icon={
              <Icon
                name="ListChecks"
                size={iconSize.xxl}
                color={colors.textTertiary}
              />
            }
            title={
              filter === 'all' ? '아직 기록이 없어요' : '해당 주종 기록이 없어요'
            }
            subtitle="술을 마신 후 기록을 추가해보세요"
          />
        ) : (
          groupedLogs.map(([dateKey, dayLogs]) => {
            const dayBottles = dayLogs.reduce((sum, l) => sum + (l.bottles || 0), 0);
            const dayCost = dayLogs.reduce((sum, l) => sum + (l.price_paid || 0), 0);
            return (
              <View key={dateKey} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateTitle}>{formatDateHeader(dateKey)}</Text>
                  <Text style={styles.dateSummary}>
                    {dayBottles.toFixed(1).replace(/\.0$/, '')}병
                    {dayCost > 0 ? ` · ₩${dayCost.toLocaleString()}` : ''}
                  </Text>
                </View>

                {dayLogs.map((log) => {
                  const isSelected = selectedIds.has(log.id);
                  return (
                    <View key={log.id} style={styles.logBlock}>
                      {/* 카드 위 시간 라벨 */}
                      <Text style={styles.logTimeAboveCard}>{formatTime(log.logged_at)}</Text>
                      <TouchableOpacity
                        style={[styles.logItem, isSelected && styles.logItemSelected]}
                        onPress={() => {
                          if (isEditMode) {
                            toggleSelect(log.id);
                          } else {
                            navigation.getParent()?.navigate('EditDrink', { logId: log.id });
                          }
                        }}
                        onLongPress={() => {
                          if (!isEditMode) {
                            enterEditMode();
                            setSelectedIds(new Set([log.id]));
                          }
                        }}
                        delayLongPress={400}
                        activeOpacity={0.7}
                      >
                        {/* 체크박스 */}
                        {isEditMode && (
                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                        )}

                        {/* 좌측: 아이콘 컬럼 */}
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

                        {/* 중앙: 텍스트 컬럼 (name과 meta가 같은 좌정렬) */}
                        <View style={styles.logContentCol}>
                          <Text style={styles.logName} numberOfLines={1}>
                            {log.drink_catalog?.name ?? '이름 없음'}
                          </Text>
                          <Text style={styles.logMeta}>
                            {log.drink_catalog ? CATEGORY_LABELS[log.drink_catalog.category] : ''}
                            {` · ${log.bottles}병`}
                            {log.price_paid ? ` · ₩${log.price_paid.toLocaleString()}` : ''}
                            {log.temperature != null ? ` · ${log.temperature.toFixed(0)}°C` : ''}
                          </Text>
                          {/* 동행자(companions)는 리스트에선 숨기고 상세 화면에서만 노출 */}
                        </View>

                        {/* 우측: 날씨 + 장소 */}
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

                        {!isEditMode && (
                          <Icon
                            set="fa5"
                            name="caret-right"
                            size={iconSize.sm}
                            color={colors.textTertiary}
                            style={styles.chevron}
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}

        {/* 하단 여백 (삭제 버튼 가리지 않게) */}
        {/* deleteBar 높이만큼 하단 여백 (button + paddingBottom + border) */}
        {isEditMode && <View style={{ height: spacing.xxl + spacing.xl }} />}
      </ScrollView>

      {/* 선택 삭제 버튼 (편집 모드 + 선택된 항목 있을 때) */}
      {isEditMode && (
        <View style={styles.deleteBar}>
          <TouchableOpacity
            style={[
              styles.deleteBtn,
              selectedIds.size === 0 && styles.deleteBtnDisabled,
            ]}
            onPress={deleteSelected}
            disabled={selectedIds.size === 0 || isDeleting}
          >
            <Text style={styles.deleteBtnText}>
              {isDeleting
                ? '삭제 중...'
                : selectedIds.size > 0
                  ? `${selectedIds.size}개 삭제`
                  : '삭제'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // ── 헤더 ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  headerBtnText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  // ── 편집 안내 배너 ──
  editBanner: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  editBannerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  filterContainer: {
    marginBottom: spacing.lg,
    marginHorizontal: -spacing.lg,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  dateGroup: {
    marginBottom: spacing.lg,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  dateTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dateSummary: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  // ── 로그 아이템 ──
  logItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logItemSelected: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  // ── 체크박스 ──
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: iconSize.xs,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: spacing.sm,
  },
  logBlock: {
    marginBottom: spacing.sm,
  },
  logTimeAboveCard: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: 4,
    marginLeft: 2,
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
  },
  logMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logMemo: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  logThumb: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
    backgroundColor: colors.surfaceLight,
  },
  logSub: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  // ── 하단 삭제 바 ──
  deleteBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deleteBtn: {
    backgroundColor: colors.tone.terracotta,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  deleteBtnDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
