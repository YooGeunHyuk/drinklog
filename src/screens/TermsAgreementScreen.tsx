import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import {
  colors,
  spacing,
  fontSize,
  borderRadius,
  iconSize,
} from '../constants/theme';
import { supabase } from '../lib/supabase';
import {
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
} from '../constants/termsContent';

interface Props {
  onComplete: () => void;
}

type ModalKind = 'terms' | 'privacy' | null;

export default function TermsAgreementScreen({ onComplete }: Props) {
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openModal, setOpenModal] = useState<ModalKind>(null);

  const canProceed = agreedTerms && agreedPrivacy;

  const handleAgreeAll = () => {
    const next = !(agreedTerms && agreedPrivacy);
    setAgreedTerms(next);
    setAgreedPrivacy(next);
  };

  const handleProceed = async () => {
    if (!canProceed) return;
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('로그인 세션이 없습니다.');
      }
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('users')
        .upsert(
          {
            id: user.id,
            terms_agreed_at: now,
            privacy_agreed_at: now,
          },
          { onConflict: 'id' },
        );
      if (error) throw error;
      onComplete();
    } catch (err: any) {
      Alert.alert(
        '저장 실패',
        err.message ?? '동의 정보 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent =
    openModal === 'terms'
      ? { title: '이용약관', body: TERMS_OF_SERVICE }
      : openModal === 'privacy'
        ? { title: '개인정보처리방침', body: PRIVACY_POLICY }
        : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>약관 동의</Text>
        <Text style={styles.subtitle}>
          서비스를 이용하시려면 아래 약관에 동의해 주세요.
        </Text>

        <TouchableOpacity
          style={styles.agreeAllRow}
          onPress={handleAgreeAll}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              canProceed && styles.checkboxChecked,
            ]}
          >
            {canProceed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.agreeAllText}>전체 동의</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.itemRow}>
          <TouchableOpacity
            style={styles.itemCheckArea}
            onPress={() => setAgreedTerms((v) => !v)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                agreedTerms && styles.checkboxChecked,
              ]}
            >
              {agreedTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.itemLabel}>
              <Text style={styles.required}>(필수) </Text>
              이용약관 동의
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setOpenModal('terms')}>
            <Text style={styles.viewLink}>보기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.itemRow}>
          <TouchableOpacity
            style={styles.itemCheckArea}
            onPress={() => setAgreedPrivacy((v) => !v)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                agreedPrivacy && styles.checkboxChecked,
              ]}
            >
              {agreedPrivacy && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.itemLabel}>
              <Text style={styles.required}>(필수) </Text>
              개인정보 수집·이용 동의
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setOpenModal('privacy')}>
            <Text style={styles.viewLink}>보기</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          만 19세 미만은 서비스를 이용할 수 없습니다.
        </Text>

        <TouchableOpacity
          style={[
            styles.proceedButton,
            (!canProceed || isLoading) && styles.proceedButtonDisabled,
          ]}
          onPress={handleProceed}
          disabled={!canProceed || isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.proceedButtonText}>
            {isLoading ? '저장 중...' : '동의하고 계속'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={openModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpenModal(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalContent?.title}</Text>
            <TouchableOpacity onPress={() => setOpenModal(null)}>
              <Text style={styles.modalClose}>닫기</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.modalText}>{modalContent?.body}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  agreeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  agreeAllText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  itemCheckArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    flex: 1,
  },
  required: {
    color: colors.primary,
    fontWeight: '600',
  },
  viewLink: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
    paddingLeft: spacing.sm,
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
  note: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  proceedButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  proceedButtonDisabled: {
    opacity: 0.4,
  },
  proceedButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textInverse,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  modalBody: {
    padding: spacing.lg,
  },
  modalText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: fontSize.md * 1.6,
  },
});
