import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

interface CatalogItem {
  catalog_id: string;
  count: number;
  drink_catalog: {
    name: string;
    category: string;
    brand: string | null;
    abv: number;
    volume_ml: number;
    tasting_notes: string | null;
  };
}

export default function CatalogScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<CatalogItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (user) fetchCatalog();
    }, [user])
  );

  async function fetchCatalog() {
    // 내가 마신 술 목록 (중복 제거 + 횟수 포함)
    const { data } = await supabase
      .from('drink_log')
      .select('catalog_id, drink_catalog(name, category, brand, abv, volume_ml, tasting_notes)')
      .eq('user_id', user!.id);

    if (!data) return;

    // catalog_id 별로 그룹화
    const grouped = new Map<string, CatalogItem>();
    data.forEach(log => {
      const existing = grouped.get(log.catalog_id);
      if (existing) {
        existing.count++;
      } else {
        grouped.set(log.catalog_id, {
          catalog_id: log.catalog_id,
          count: 1,
          drink_catalog: log.drink_catalog as any,
        });
      }
    });

    setItems(
      Array.from(grouped.values()).sort((a, b) => b.count - a.count)
    );
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

  const renderItem = ({ item, index }: { item: CatalogItem; index: number }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: getCategoryColor(item.drink_catalog?.category) + '30' },
          ]}
        >
          <Text
            style={[
              styles.categoryText,
              { color: getCategoryColor(item.drink_catalog?.category) },
            ]}
          >
            {item.drink_catalog?.category}
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{item.count}회</Text>
        </View>
      </View>

      <Text style={styles.drinkName}>{item.drink_catalog?.name}</Text>

      {item.drink_catalog?.brand && (
        <Text style={styles.brand}>{item.drink_catalog.brand}</Text>
      )}

      <View style={styles.infoRow}>
        <Text style={styles.infoText}>{item.drink_catalog?.abv}%</Text>
        <Text style={styles.infoDivider}>·</Text>
        <Text style={styles.infoText}>{item.drink_catalog?.volume_ml}ml</Text>
      </View>

      {item.drink_catalog?.tasting_notes && (
        <Text style={styles.tastingNotes}>{item.drink_catalog.tasting_notes}</Text>
      )}

      <Text style={styles.badge}>{index + 1}번째 술</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.catalog_id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.headerText}>
            내가 마셔본 술 {items.length}종
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="wine-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>아직 기록한 술이 없어요</Text>
            <Text style={styles.emptySubText}>
              기록을 추가하면 나만의 카탈로그가 만들어집니다
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
  },
  row: {
    gap: spacing.sm,
  },
  headerText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: colors.primaryDark + '40',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  countText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  drinkName: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  brand: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  infoDivider: {
    color: colors.textMuted,
  },
  tastingNotes: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  badge: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
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
    textAlign: 'center',
  },
});
