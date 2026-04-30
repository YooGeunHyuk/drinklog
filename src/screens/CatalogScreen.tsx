import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius, iconSize } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { DrinkLog, DrinkCatalog, DrinkCategory, CATEGORY_LABELS } from '../types';
import Icon from '../components/Icon';
import { ErrorBanner } from '../components/ErrorBanner';

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

interface CatalogItem extends DrinkCatalog {
  count: number; // 내가 기록한 횟수
  totalBottles: number;
  lastLoggedAt: string | null;
}

export default function CatalogScreen() {
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [searchText, setSearchText] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoadError(null);
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
      console.error('카탈로그 로드 실패:', err.message);
      setLoadError(err?.message ?? '알 수 없는 오류가 발생했어요.');
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

  // 내가 마셔본 카탈로그 집계
  const myCatalog: CatalogItem[] = useMemo(() => {
    const map = new Map<string, CatalogItem>();
    logs.forEach((log) => {
      if (!log.drink_catalog) return;
      const c = log.drink_catalog;
      const existing = map.get(c.id);
      if (existing) {
        existing.count += 1;
        existing.totalBottles += log.bottles || 0;
        if (
          !existing.lastLoggedAt ||
          log.logged_at > existing.lastLoggedAt
        ) {
          existing.lastLoggedAt = log.logged_at;
        }
      } else {
        map.set(c.id, {
          ...c,
          count: 1,
          totalBottles: log.bottles || 0,
          lastLoggedAt: log.logged_at,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [logs]);

  // 필터 + 검색
  const filteredCatalog = useMemo(() => {
    let list = myCatalog;
    if (filter !== 'all') {
      list = list.filter((c) => c.category === filter);
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [myCatalog, filter, searchText]);

  const uniqueCount = myCatalog.length;

  const formatDate = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
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
          onRetry={loadLogs}
          onDismiss={() => setLoadError(null)}
        />
        <Text style={styles.title}>주류 카탈로그</Text>
        <Text style={styles.subtitle}>
          내가 마셔본 술 {uniqueCount}종
        </Text>

        {myCatalog.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="Library" size={iconSize.xxl} color={colors.textTertiary} />
            <Text style={styles.emptyText}>아직 카탈로그가 비어있어요</Text>
            <Text style={styles.emptySubtext}>
              기록을 추가하면 자동으로 카탈로그가 채워집니다
            </Text>
          </View>
        ) : (
          <>
            {/* 검색 */}
            <TextInput
              style={styles.searchInput}
              placeholder="이름으로 검색"
              placeholderTextColor={colors.textTertiary}
              value={searchText}
              onChangeText={setSearchText}
            />

            {/* 필터 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterContainer}
              contentContainerStyle={styles.filterContent}
            >
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.filterChip,
                    filter === f.key && styles.filterChipActive,
                  ]}
                  onPress={() => setFilter(f.key)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filter === f.key && styles.filterTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 카탈로그 목록 */}
            {filteredCatalog.length === 0 ? (
              <View style={styles.emptySmall}>
                <Text style={styles.emptyText}>검색 결과가 없어요</Text>
              </View>
            ) : (
              filteredCatalog.map((item) => (
                <View key={item.id} style={styles.catalogCard}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.categoryPill,
                          { backgroundColor: colors.surfaceLight },
                        ]}
                      >
                        <Text style={styles.categoryPillText}>
                          {CATEGORY_LABELS[item.category]}
                        </Text>
                      </View>
                      {item.verified && (
                        <Text style={styles.verifiedBadge}>✓ 공식</Text>
                      )}
                    </View>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardMetaText}>
                        {item.brand ? `${item.brand} · ` : ''}
                        {item.abv ? `${item.abv}% · ` : ''}
                        {item.volume_ml ? `${item.volume_ml}ml` : ''}
                      </Text>
                    </View>
                    <View style={styles.cardStats}>
                      <Text style={styles.cardStatText}>
                        총 {item.totalBottles.toFixed(1).replace(/\.0$/, '')}병
                      </Text>
                      <Text style={styles.cardStatText}>·</Text>
                      <Text style={styles.cardStatText}>
                        {item.count}회 기록
                      </Text>
                      {item.lastLoggedAt && (
                        <>
                          <Text style={styles.cardStatText}>·</Text>
                          <Text style={styles.cardStatText}>
                            최근 {formatDate(item.lastLoggedAt)}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}
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
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  emptySmall: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: iconSize.xxl,
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
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  filterContainer: {
    marginBottom: spacing.md,
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
  catalogCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  categoryPill: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  categoryPillText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  verifiedBadge: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  cardName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardMeta: {
    marginBottom: spacing.xs,
  },
  cardMetaText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  cardStats: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  cardStatText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
});
