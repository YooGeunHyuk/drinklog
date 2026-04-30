import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius, iconSize } from '../constants/theme';
import { Gender } from '../types';
import { supabase } from '../lib/supabase';
import Icon from '../components/Icon';

interface Props {
  onComplete: () => void;
}

export default function ProfileSetupScreen({ onComplete }: Props) {
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [birthYear, setBirthYear] = useState('');
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const GENDER_OPTIONS: { key: Gender; label: string }[] = [
    { key: 'male', label: '남성' },
    { key: 'female', label: '여성' },
    { key: 'none', label: '선택 안 함' },
  ];

  const handleComplete = async () => {
    // 만 19세 미만 체크
    if (birthYear) {
      const year = parseInt(birthYear, 10);
      const currentYear = new Date().getFullYear();
      if (currentYear - year < 19) {
        Alert.alert('가입 불가', '만 19세 미만은 이용할 수 없습니다.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('로그인 세션이 없습니다.');
      }
      const { error } = await supabase
        .from('users')
        .update({
          nickname: nickname || null,
          gender: gender,
          birth_year: birthYear ? parseInt(birthYear, 10) : null,
          marketing_agreed: marketingAgreed,
        })
        .eq('id', user.id);
      if (error) throw error;
      onComplete();
    } catch (err: any) {
      Alert.alert('저장 실패', err.message ?? '프로필 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>프로필 설정</Text>
          <Text style={styles.subtitle}>
            간단한 정보를 입력해주세요 (모두 선택사항)
          </Text>

          {/* 프로필 사진 */}
          <TouchableOpacity style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Icon name="Camera" size={iconSize.lg} color={colors.textSecondary} />
            </View>
            <Text style={styles.avatarLabel}>사진 추가</Text>
          </TouchableOpacity>

          {/* 닉네임 */}
          <Text style={styles.label}>닉네임</Text>
          <TextInput
            style={styles.input}
            placeholder="닉네임을 입력하세요"
            placeholderTextColor={colors.textTertiary}
            value={nickname}
            onChangeText={setNickname}
            maxLength={20}
          />

          {/* 성별 */}
          <Text style={styles.label}>성별</Text>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.genderButton,
                  gender === opt.key && styles.genderButtonActive,
                ]}
                onPress={() => setGender(opt.key)}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === opt.key && styles.genderTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 출생연도 */}
          <Text style={styles.label}>출생연도</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 1995"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            value={birthYear}
            onChangeText={setBirthYear}
            maxLength={4}
          />

          {/* 마케팅 수신 동의 */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setMarketingAgreed(!marketingAgreed)}
          >
            <View
              style={[
                styles.checkbox,
                marketingAgreed && styles.checkboxChecked,
              ]}
            >
              {marketingAgreed && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              마케팅 정보 수신에 동의합니다 (선택)
            </Text>
          </TouchableOpacity>

          {/* 완료 버튼 */}
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
            activeOpacity={0.8}
          >
            <Text style={styles.completeButtonText}>시작하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={onComplete}
          >
            <Text style={styles.skipText}>건너뛰기</Text>
          </TouchableOpacity>
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  avatarText: {
    fontSize: iconSize.xl,
  },
  avatarLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  genderButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },
  genderText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  genderTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.textInverse,
    fontSize: iconSize.xs,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    flex: 1,
  },
  completeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  completeButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textInverse,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  skipText: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
});
