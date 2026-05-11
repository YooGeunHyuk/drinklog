// 친구 시스템 v1 화면.
//
// - 내 friend_code 표시 (공유용)
// - 친구 코드로 친구 추가
// - 받은 요청 / 보낸 요청 / 친구 목록 한 화면에 섹션별로
//
// v2에서 QR 코드 표시·스캔 추가 예정.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
  Share as RNShare,
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
  getMyFriendCode,
  findUserByFriendCode,
  sendFriendRequest,
  acceptFriendRequest,
  rejectOrCancelRequest,
  unfriend,
  listMyFriends,
  FriendRow,
} from '../lib/friends';

export default function FriendsScreen({ navigation }: any) {
  const [myCode, setMyCode] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [rows, setRows] = useState<FriendRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const [code, list] = await Promise.all([
      getMyFriendCode(),
      listMyFriends(),
    ]);
    if (code) setMyCode(code);
    setRows(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
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

  const handleAdd = async () => {
    const code = searchInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('친구 코드 입력', '8자리 친구 코드를 입력해 주세요.');
      return;
    }
    if (code === myCode) {
      Alert.alert('알림', '본인 친구 코드입니다.');
      return;
    }
    setAdding(true);
    try {
      const target = await findUserByFriendCode(code);
      if (!target) {
        Alert.alert('찾을 수 없음', '해당 코드의 사용자를 찾을 수 없어요.');
        return;
      }
      // 이미 친구이거나 보낸 요청이면 다시 보낼 필요 없음
      const existing = rows.find((r) => r.other.id === target.id);
      if (existing) {
        if (existing.status === 'accepted') {
          Alert.alert('이미 친구', `${target.nickname ?? '익명'}님과 이미 친구예요.`);
        } else if (existing.outgoing) {
          Alert.alert('요청 중', '이미 보낸 요청이 있어요. 상대 수락을 기다려 주세요.');
        } else {
          Alert.alert(
            '받은 요청',
            `${target.nickname ?? '익명'}님이 보낸 요청을 먼저 수락하시겠어요?`,
            [
              { text: '나중에', style: 'cancel' },
              {
                text: '수락',
                onPress: async () => {
                  await acceptFriendRequest(existing.id);
                  await load();
                },
              },
            ],
          );
        }
        return;
      }
      await sendFriendRequest(target.id);
      Alert.alert('요청 보냄', `${target.nickname ?? '익명'}님에게 친구 요청을 보냈어요.`);
      setSearchInput('');
      await load();
    } catch (e: any) {
      Alert.alert('실패', e?.message ?? '친구 요청을 보내지 못했어요.');
    } finally {
      setAdding(false);
    }
  };

  const handleShareCode = async () => {
    if (!myCode) return;
    try {
      await RNShare.share({
        message: `주로(酒路) DRINKLOG에서 친구 추가해요!\n친구 코드: ${myCode}`,
      });
    } catch {
      // 공유 취소 등은 조용히
    }
  };

  const handleAccept = async (row: FriendRow) => {
    try {
      await acceptFriendRequest(row.id);
      await load();
    } catch (e: any) {
      Alert.alert('실패', e?.message ?? '수락 실패');
    }
  };

  const handleReject = (row: FriendRow) => {
    const verb = row.outgoing ? '취소' : '거절';
    Alert.alert(
      `요청 ${verb}`,
      `${row.other.nickname ?? '익명'}님의 요청을 ${verb}할까요?`,
      [
        { text: '아니오', style: 'cancel' },
        {
          text: verb,
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectOrCancelRequest(row.id);
              await load();
            } catch (e: any) {
              Alert.alert('실패', e?.message ?? '처리 실패');
            }
          },
        },
      ],
    );
  };

  const handleUnfriend = (row: FriendRow) => {
    Alert.alert(
      '친구 끊기',
      `${row.other.nickname ?? '익명'}님과의 친구 관계를 끊을까요?`,
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '끊기',
          style: 'destructive',
          onPress: async () => {
            try {
              await unfriend(row.id);
              await load();
            } catch (e: any) {
              Alert.alert('실패', e?.message ?? '처리 실패');
            }
          },
        },
      ],
    );
  };

  const accepted = rows.filter((r) => r.status === 'accepted');
  const incoming = rows.filter((r) => r.status === 'pending' && !r.outgoing);
  const outgoing = rows.filter((r) => r.status === 'pending' && r.outgoing);

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
        <Text style={styles.headerTitle}>친구</Text>
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
        {/* 내 친구 코드 */}
        <Text style={styles.sectionTitle}>내 친구 코드</Text>
        <View style={styles.myCodeCard}>
          <Text style={styles.myCodeValue}>{myCode || '······'}</Text>
          <TouchableOpacity
            onPress={handleShareCode}
            style={styles.shareCodeBtn}
            disabled={!myCode}
          >
            <Icon
              set="lucide"
              name="Share2"
              size={iconSize.sm}
              color={colors.primary}
            />
            <Text style={styles.shareCodeText}>공유</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          이 코드를 친구에게 알려주면 친구가 본인을 추가할 수 있어요.
        </Text>

        {/* 친구 추가 */}
        <Text style={styles.sectionTitle}>친구 추가</Text>
        <View style={styles.addRow}>
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="친구의 8자리 코드 입력"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            maxLength={8}
            style={styles.addInput}
          />
          <TouchableOpacity
            onPress={handleAdd}
            disabled={adding}
            style={[styles.addBtn, adding && styles.addBtnDisabled]}
          >
            <Text style={styles.addBtnText}>{adding ? '확인 중' : '추가'}</Text>
          </TouchableOpacity>
        </View>

        {/* 받은 요청 */}
        {incoming.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>받은 요청 ({incoming.length})</Text>
            {incoming.map((row) => (
              <View key={row.id} style={styles.row}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>
                    {row.other.nickname ?? '익명'}
                  </Text>
                  <Text style={styles.rowSub}>코드 {row.other.friend_code}</Text>
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity
                    onPress={() => handleAccept(row)}
                    style={[styles.smallBtn, styles.smallBtnPrimary]}
                  >
                    <Text style={styles.smallBtnTextPrimary}>수락</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReject(row)}
                    style={styles.smallBtn}
                  >
                    <Text style={styles.smallBtnText}>거절</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        ) : null}

        {/* 보낸 요청 */}
        {outgoing.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>보낸 요청 ({outgoing.length})</Text>
            {outgoing.map((row) => (
              <View key={row.id} style={styles.row}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>
                    {row.other.nickname ?? '익명'}
                  </Text>
                  <Text style={styles.rowSub}>응답 대기 중</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleReject(row)}
                  style={styles.smallBtn}
                >
                  <Text style={styles.smallBtnText}>취소</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : null}

        {/* 친구 목록 */}
        <Text style={styles.sectionTitle}>친구 ({accepted.length})</Text>
        {accepted.length === 0 ? (
          <EmptyState
            title="아직 친구가 없어요"
            subtitle="친구 코드를 공유해서 첫 친구를 추가해 보세요."
          />
        ) : (
          accepted.map((row) => (
            <View key={row.id} style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>
                  {row.other.nickname ?? '익명'}
                </Text>
                <Text style={styles.rowSub}>코드 {row.other.friend_code}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleUnfriend(row)}
                style={styles.smallBtn}
              >
                <Text style={styles.smallBtnText}>끊기</Text>
              </TouchableOpacity>
            </View>
          ))
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  myCodeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  myCodeValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 4,
  },
  shareCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  shareCodeText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.6,
  },
  addBtnText: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowSub: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  smallBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
  },
  smallBtnPrimary: {
    backgroundColor: colors.primary,
  },
  smallBtnText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  smallBtnTextPrimary: {
    fontSize: fontSize.sm,
    color: colors.textInverse,
    fontWeight: '700',
  },
});
