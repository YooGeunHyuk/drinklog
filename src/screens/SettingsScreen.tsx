import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { supabase } from '../lib/supabase';

interface Props {
  navigation: any;
}

export default function SettingsScreen({ navigation }: Props) {
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 전화번호 마스킹 (예: +821012345678 → 010-****-5678)
      const raw = user.phone ?? '';
      if (raw) {
        const digits = raw.replace(/^\+82/, '0').replace(/\D/g, '');
        if (digits.length === 11) {
          setPhone(`${digits.slice(0, 3)}-****-${digits.slice(7)}`);
        } else {
          setPhone(raw);
        }
      }

      const { data: profile } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', user.id)
        .single();
      setNickname(profile?.nickname ?? '');
    } catch (err: any) {
      console.error('프로필 로드 실패:', err.message);
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('닉네임 필요', '닉네임을 입력해주세요.');
      return;
    }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인 세션이 없습니다.');

      const { error } = await supabase
        .from('users')
        .update({ nickname: nickname.trim() })
        .eq('id', user.id);
      if (error) throw error;

      Alert.alert('저장 완료', '닉네임이 변경되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('저장 실패', err.message ?? '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await supabase.auth.signOut();
          } catch (err: any) {
            Alert.alert('오류', err.message ?? '로그아웃 중 오류가 발생했습니다.');
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← 닫기</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>설정</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            <Text style={[styles.saveBtn, isSaving && { opacity: 0.4 }]}>
              {isSaving ? '저장 중' : '저장'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 프로필 섹션 */}
          <Text style={styles.sectionTitle}>프로필</Text>
          <View style={styles.card}>
            <View style={styles.fieldRowEdit}>
              <Text style={styles.fieldLabel}>닉네임</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임 입력"
                placeholderTextColor={colors.textTertiary}
                maxLength={20}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* 계정 정보 */}
          {phone ? (
            <>
              <Text style={styles.sectionTitle}>계정 정보</Text>
              <View style={styles.card}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>전화번호</Text>
                  <Text style={styles.fieldValue}>{phone}</Text>
                </View>
              </View>
            </>
          ) : null}

          {/* 계정 섹션 */}
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.dangerRow}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              <Text style={styles.dangerText}>
                {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  backBtn: {
    fontSize: fontSize.md,
    color: colors.primary,
    width: 60,
  },
  headerTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  saveBtn: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
    width: 60,
    textAlign: 'right',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  fieldRowEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fieldLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    width: 80,
  },
  fieldValue: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    textAlign: 'right',
    paddingVertical: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  dangerRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dangerText: {
    fontSize: fontSize.md,
    color: colors.tone.terracotta,
    fontWeight: '500',
  },
});
