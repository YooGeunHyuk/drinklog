import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

const CATEGORIES = ['전체', '소주', '맥주', '막걸리', '와인', '위스키', '양주', '기타'];

interface DrinkLog {
  id: string;
  logged_at: string;
  bottles: number;
  price_paid: number;
  note: string | null;
  input_method: string;
  drink_catalog: {
    name: string;
    category: string;
    abv: number;
  };
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [filter, setFilter] = useState('전체');
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) fetchLogs();
    }, [user, filter])
  );

  async function fetchLogs() {
    setLoading(true);
    let query = supabase
      .from('drink_log')
      .select('id, logged_at, bottles, price_paid, note, input_method, drink_catalog(name, category, abv)')
      .eq('user_id', user!.id)
      .order('logged_at', { ascending: false })
      .limit(50);

    const { data } = await query;
    let results = (data as unknown as DrinkLog[]) || [];

    if (filter !== '전체') {
      results = results.filter(log => log.drink_catalog?.category === filter);
    }

    setLogs(results);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    Alert.alert('삭제 확인', '이 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('drink_log').delete().eq('id', id);
          setLogs(prev => prev.filter(l => l.id !== id));
        },
      },
    ]);
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

  const renderLog = ({ item }: { item: DrinkLog }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View
          style={[
            styles.categoryDot,
            { backgroundColor: getCategoryColor(item.drink_catalog?.category) },
          ]}
        />
        <View style={styles.logInfo}>
          <Text style={styles.logName}>{item.drink_catalog?.name}</Text>
          <Text style={styles.logMeta}>
            {item.drink_catalog?.category} · {item.drink_catalog?.abv}%
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.logDetails}>
        <Text style={styles.logDate}>
          {new Date(item.logged_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.logBottles}>{item.bottles}병</Text>
        <Text style={styles.logPrice}>
          {(item.price_paid || 0).toLocaleString()}원
        </Text>
      </View>

      {item.note && <Text style={styles.logNote}>{item.note}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 필터 */}
      <FlatList
        horizontal
        data={CATEGORIES}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text
              style={[
                styles.filterText,
                filter === item && styles.filterTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
      />

      {/* 기록 목록 */}
      <FlatList
        data={logs}
        renderItem={renderLog}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>기록이 없습니다</Text>
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
  filterRow: {
    maxHeight: 50,
    paddingVertical: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.text,
  },
  listContent: {
    padding: spacing.lg,
  },
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  logInfo: {
    flex: 1,
  },
  logName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  logMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  logDetails: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  logDate: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  logBottles: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
  },
  logPrice: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  logNote: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
