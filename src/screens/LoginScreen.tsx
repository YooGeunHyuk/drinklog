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
  ActivityIndicator,
} from 'react-native';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { supabase } from '../lib/supabase';

type Step = 'phone' | 'verify';

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold });
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

  // 국제 표기(+82)로 변환: 010-1234-5678 → +821012345678
  const toE164 = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.startsWith('0')) return `+82${cleaned.slice(1)}`;
    if (cleaned.startsWith('82')) return `+${cleaned}`;
    return `+82${cleaned}`;
  };

  const handleSendCode = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      Alert.alert('입력 오류', '올바른 휴대폰 번호를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    console.log('[Login] signInWithOtp 시작:', toE164(phone));
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: toE164(phone),
      });
      console.log('[Login] signInWithOtp 응답:', { data, error });
      if (error) throw error;
      setStep('verify');
      Alert.alert('인증번호 발송', '인증번호가 발송되었습니다.');
    } catch (err: any) {
      console.error('[Login] OTP 전송 실패:', err);
      Alert.alert('전송 실패', err.message ?? '인증번호 발송에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('입력 오류', '6자리 인증번호를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: toE164(phone),
        token: code,
        type: 'sms',
      });
      if (error) throw error;
      onLogin();
    } catch (err: any) {
      Alert.alert('인증 실패', err.message ?? '인증번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
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
            <Text style={styles.logoText}>酒路</Text>
            <Text
              style={[
                styles.logoSubtext,
                fontsLoaded && { fontFamily: 'PlayfairDisplay_700Bold' },
              ]}
            >
              DRINKLOG
            </Text>
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
  logoText: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 8,
  },
  logoSubtext: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    letterSpacing: 6,
    marginTop: spacing.sm,
  },
  slogan: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.lg,
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
