import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';

type Step = 'phone' | 'otp';

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<TextInput>(null);

  const formatPhone = (raw: string) => {
    // 한국 번호: 01012345678 → +821012345678
    const cleaned = raw.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      return '+82' + cleaned.slice(1);
    }
    return '+82' + cleaned;
  };

  async function handleSendOtp() {
    if (phone.length < 10) {
      Alert.alert('알림', '올바른 휴대폰 번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: formatPhone(phone),
    });
    setLoading(false);

    if (error) {
      Alert.alert('오류', error.message);
      return;
    }

    setStep('otp');
    setTimeout(() => otpRef.current?.focus(), 300);
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      Alert.alert('알림', '6자리 인증번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: formatPhone(phone),
      token: otp,
      type: 'sms',
    });
    setLoading(false);

    if (error) {
      Alert.alert('인증 실패', '인증번호가 올바르지 않습니다. 다시 시도해주세요.');
    }
    // 성공 시 AuthContext에서 자동으로 감지하여 라우팅
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* 앱 로고 영역 */}
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>주로</Text>
          <Text style={styles.logoSubText}>DRINKLOG</Text>
          <Text style={styles.slogan}>나의 술 여정을 기록하다</Text>
        </View>

        {step === 'phone' ? (
          <View style={styles.form}>
            <Text style={styles.label}>휴대폰 번호</Text>
            <TextInput
              style={styles.input}
              placeholder="01012345678"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={11}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '전송 중...' : '인증번호 받기'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>인증번호 6자리</Text>
            <TextInput
              ref={otpRef}
              style={styles.input}
              placeholder="000000"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '확인 중...' : '확인'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                setOtp('');
                setStep('phone');
              }}
            >
              <Text style={styles.resendText}>번호 다시 입력</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoText: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 4,
  },
  logoSubText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    letterSpacing: 6,
    marginTop: spacing.xs,
  },
  slogan: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  form: {
    gap: spacing.md,
  },
  label: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.lg,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    letterSpacing: 2,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  resendButton: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  resendText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textDecorationLine: 'underline',
  },
});
