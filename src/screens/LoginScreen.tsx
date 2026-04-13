import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

type Step = 'phone' | 'verify';

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handleSendCode = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      Alert.alert('입력 오류', '올바른 휴대폰 번호를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    // TODO: Supabase SMS OTP 발송
    setTimeout(() => {
      setIsLoading(false);
      setStep('verify');
      Alert.alert('인증번호 발송', '인증번호가 발송되었습니다.\n(개발 중: 아무 6자리 입력)');
    }, 1000);
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('입력 오류', '6자리 인증번호를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    // TODO: Supabase OTP 검증
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* 로고 영역 */}
          <View style={styles.logoSection}>
            <Text style={styles.logoEmoji}>🍶</Text>
            <Text style={styles.logoText}>주로</Text>
            <Text style={styles.logoSubtext}>DRINKLOG</Text>
            <Text style={styles.slogan}>나의 술 여정을 기록하다</Text>
          </View>

          {/* 입력 영역 */}
          {step === 'phone' ? (
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>휴대폰 번호</Text>
              <TextInput
                style={styles.input}
                placeholder="010-1234-5678"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text) => setPhone(formatPhone(text))}
                maxLength={13}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? '발송 중...' : '인증번호 받기'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>인증번호 6자리</Text>
              <TextInput
                style={styles.codeInput}
                placeholder="000000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
                maxLength={6}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? '확인 중...' : '확인'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => {
                  setStep('phone');
                  setCode('');
                }}
              >
                <Text style={styles.resendText}>번호 다시 입력</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 소셜 로그인 (Phase 2) */}
          <View style={styles.socialSection}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#FEE500' }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.socialButtonText, { color: '#191919' }]}>
                  카카오 로그인
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#03C75A' }]}
                activeOpacity={0.7}
              >
                <Text style={styles.socialButtonText}>네이버 로그인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.primary,
  },
  logoSubtext: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    letterSpacing: 4,
    marginTop: spacing.xs,
  },
  slogan: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  codeInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    fontSize: 32,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 12,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textInverse,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  resendText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  socialSection: {
    marginTop: spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginHorizontal: spacing.md,
  },
  socialButtons: {
    gap: spacing.sm,
  },
  socialButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  socialButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
