import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

type Gender = 'male' | 'female' | 'none';

export default function ProfileSetupScreen() {
  const { user, setProfileComplete } = useAuth();
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [birthYear, setBirthYear] = useState('');
  const [marketingAgreed, setMarketingAgreed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    // 만 19세 미만 체크
    if (birthYear) {
      const age = currentYear - parseInt(birthYear);
      if (age < 19) {
        Alert.alert('가입 불가', '만 19세 미만은 서비스를 이용할 수 없습니다.');
        return;
      }
    }

    if (marketingAgreed === null) {
      Alert.alert('알림', '마케팅 수신 동의 여부를 선택해주세요.');
      return;
    }

    setLoading(true);

    let avatarUrl = null;
    if (avatar) {
      const fileName = `${user?.id}/avatar.jpg`;
      const response = await fetch(avatar);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatarUrl = data.publicUrl;
      }
    }

    const { error } = await supabase.from('users').upsert({
      id: user?.id,
      phone: user?.phone,
      auth_provider: 'phone',
      nickname: nickname || null,
      avatar_url: avatarUrl,
      gender: gender || 'none',
      birth_year: birthYear ? parseInt(birthYear) : null,
      marketing_agreed: marketingAgreed,
    });

    setLoading(false);

    if (error) {
      Alert.alert('오류', '프로필 저장에 실패했습니다. 다시 시도해주세요.');
      return;
    }

    setProfileComplete(true);
  }

  const genderOptions: { value: Gender; label: string }[] = [
    { value: 'male', label: '남성' },
    { value: 'female', label: '여성' },
    { value: 'none', label: '선택 안 함' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>프로필 설정</Text>
      <Text style={styles.subtitle}>간단한 정보를 입력해주세요</Text>

      {/* 프로필 사진 */}
      <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>+</Text>
          </View>
        )}
        <Text style={styles.avatarLabel}>사진 선택 (선택)</Text>
      </TouchableOpacity>

      {/* 닉네임 */}
      <View style={styles.field}>
        <Text style={styles.label}>닉네임 <Text style={styles.optional}>(선택)</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="닉네임을 입력하세요"
          placeholderTextColor={colors.textMuted}
          value={nickname}
          onChangeText={setNickname}
          maxLength={20}
        />
      </View>

      {/* 성별 */}
      <View style={styles.field}>
        <Text style={styles.label}>성별 <Text style={styles.optional}>(선택)</Text></Text>
        <View style={styles.optionRow}>
          {genderOptions.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.optionButton,
                gender === opt.value && styles.optionSelected,
              ]}
              onPress={() => setGender(opt.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  gender === opt.value && styles.optionTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 출생연도 */}
      <View style={styles.field}>
        <Text style={styles.label}>출생연도 <Text style={styles.optional}>(선택)</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="예: 1990"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          value={birthYear}
          onChangeText={setBirthYear}
          maxLength={4}
        />
      </View>

      {/* 마케팅 수신 동의 */}
      <View style={styles.field}>
        <Text style={styles.label}>마케팅 수신 동의 <Text style={styles.required}>(필수)</Text></Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              marketingAgreed === true && styles.optionSelected,
            ]}
            onPress={() => setMarketingAgreed(true)}
          >
            <Text
              style={[
                styles.optionText,
                marketingAgreed === true && styles.optionTextSelected,
              ]}
            >
              동의
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.optionButton,
              marketingAgreed === false && styles.optionSelected,
            ]}
            onPress={() => setMarketingAgreed(false)}
          >
            <Text
              style={[
                styles.optionText,
                marketingAgreed === false && styles.optionTextSelected,
              ]}
            >
              비동의
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitText}>
          {loading ? '저장 중...' : '시작하기'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 36,
    color: colors.textMuted,
  },
  avatarLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  optional: {
    color: colors.textMuted,
    fontWeight: '400',
    fontSize: fontSize.sm,
  },
  required: {
    color: colors.primary,
    fontWeight: '400',
    fontSize: fontSize.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDark + '30',
  },
  optionText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
