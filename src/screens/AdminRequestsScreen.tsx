// 관리자 — 사용자 제보 검토/승인 화면.
// pending 요청을 리스트로 보여주고, 각 카드에서 승인(→ drink_catalog insert) / 반려 / 편집 가능.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius, iconSize } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { CATEGORY_LABELS, DrinkCategory } from '../types';
import EmptyState from '../components/EmptyState';

interface DrinkRequest {
  id: string;
  user_id: string | null;
  name: string;
  brand: string | null;
  category: DrinkCategory | null;
  abv: number | null;
  volume_ml: number | null;
  origin: string | null;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
}

type FilterTab = 'pending' | 'approved' | 'rejected';

export default function AdminRequestsScreen({ navigation }: any) {
  const [requests, setRequests] = useState<DrinkRequest[]>([]);
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [working, setWorking] = useState<string | null>(null); // 작업 중인 req id

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drink_request')
        .select('*')
        .eq('status', filter)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setRequests((data as DrinkRequest[]) ?? []);
    } catch (err: any) {
      Alert.alert('조회 실패', err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const approve = async (req: DrinkRequest) => {
    if (!req.category) {
      Alert.alert(
        '승인 불가',
        '주종(category) 이 비어있어 카탈로그에 넣을 수 없습니다. 편집에서 주종을 지정 후 다시 시도하세요.',
      );
      return;
    }

    Alert.alert(
      '승인 확인',
      `"${req.name}" 을(를) drink_catalog 에 추가합니다. 진행할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '승인',
          onPress: () => doApprove(req),
        },
      ],
    );
  };

  const doApprove = async (req: DrinkRequest) => {
    setWorking(req.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 1) catalog 에 insert. 중복이면 (name,category,volume_ml) UNIQUE 로 스킵
      const { data: inserted, error: insErr } = await supabase
        .from('drink_catalog')
        .upsert(
          [
            {
              name: req.name,
              brand: req.brand,
              category: req.category,
              abv: req.abv,
              volume_ml: req.volume_ml,
              origin: req.origin,
              source: 'self',
              verified: true,
            },
          ],
          { onConflict: 'name,category,volume_ml', ignoreDuplicates: false },
        )
        .select('id')
        .single();

      if (insErr) throw insErr;

      const catalogId = inserted?.id ?? null;

      // 2) request row 업데이트
      const { error: updErr } = await supabase
        .from('drink_request')
        .update({
          status: 'approved',
          approved_catalog_id: catalogId,
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', req.id);
      if (updErr) throw updErr;

      Alert.alert('✅ 승인 완료', `${req.name} 이(가) 카탈로그에 추가되었습니다.`);
      await load();
    } catch (err: any) {
      Alert.alert('승인 실패', err.message ?? 'Unknown error');
    } finally {
      setWorking(null);
    }
  };

  const reject = (req: DrinkRequest) => {
    Alert.prompt?.(
      '반려 사유',
      '사용자에게 보일 사유를 입력하세요 (선택)',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '반려',
          style: 'destructive',
          onPress: async (reason?: string) => {
            setWorking(req.id);
            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();
              const { error } = await supabase
                .from('drink_request')
                .update({
                  status: 'rejected',
                  admin_note: reason?.trim() || null,
                  reviewed_by: user?.id ?? null,
                  reviewed_at: new Date().toISOString(),
                })
                .eq('id', req.id);
              if (error) throw error;
              await load();
            } catch (err: any) {
              Alert.alert('반려 실패', err.message ?? 'Unknown error');
            } finally {
              setWorking(null);
            }
          },
        },
      ],
      'plain-text',
    );

    // Android 는 Alert.prompt 미지원 — 간단 fallback
    if (!Alert.prompt) {
      doReject(req, null);
    }
  };

  const doReject = async (req: DrinkRequest, reason: string | null) => {
    setWorking(req.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('drink_request')
        .update({
          status: 'rejected',
          admin_note: reason?.trim() || null,
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', req.id);
      if (error) throw error;
      await load();
    } catch (err: any) {
      Alert.alert('반려 실패', err.message ?? 'Unknown error');
    } finally {
      setWorking(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerBtn}>닫기</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🛠 등록 요청 검토</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Text style={styles.headerBtn}>새로고침</Text>
        </TouchableOpacity>
      </View>

      {/* 탭 */}
      <View style={styles.tabs}>
        {(['pending', 'approved', 'rejected'] as FilterTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, filter === t && styles.tabActive]}
            onPress={() => setFilter(t)}
          >
            <Text style={[styles.tabLabel, filter === t && styles.tabLabelActive]}>
              {t === 'pending' ? '대기' : t === 'approved' ? '승인됨' : '반려됨'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<Text style={{ fontSize: iconSize.xxl }}>📭</Text>}
            title={
              filter === 'pending'
                ? '대기 중인 요청이 없어요'
                : filter === 'approved'
                  ? '승인한 요청이 없어요'
                  : '반려한 요청이 없어요'
            }
            variant="plain"
          />
        ) : (
          requests.map((req) => (
            <View key={req.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{req.name}</Text>
                <Text style={styles.cardDate}>{formatDate(req.created_at)}</Text>
              </View>
              {req.brand && <Text style={styles.cardBrand}>{req.brand}</Text>}
              <View style={styles.chipRow}>
                {req.category && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{CATEGORY_LABELS[req.category]}</Text>
                  </View>
                )}
                {req.abv !== null && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{req.abv}%</Text>
                  </View>
                )}
                {req.volume_ml !== null && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{req.volume_ml}ml</Text>
                  </View>
                )}
                {req.origin && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{req.origin}</Text>
                  </View>
                )}
              </View>
              {req.note && (
                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>💬 {req.note}</Text>
                </View>
              )}
              {req.admin_note && (
                <View style={styles.adminNoteBox}>
                  <Text style={styles.adminNoteText}>🛠 {req.admin_note}</Text>
                </View>
              )}

              {filter === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => reject(req)}
                    disabled={working === req.id}
                  >
                    <Text style={styles.rejectBtnText}>반려</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => approve(req)}
                    disabled={working === req.id}
                  >
                    <Text style={styles.approveBtnText}>
                      {working === req.id ? '처리 중...' : '승인'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
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
  headerBtn: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  cardBrand: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  noteBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  noteText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  adminNoteBox: {
    backgroundColor: colors.surfaceLight,
    borderLeftWidth: 2,
    borderLeftColor: colors.warning,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  adminNoteText: {
    fontSize: fontSize.sm,
    color: colors.warning,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: colors.primary,
  },
  approveBtnText: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  rejectBtn: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rejectBtnText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
});
