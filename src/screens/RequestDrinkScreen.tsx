// 사용자 제보: 검색해도 없는 술을 "등록 요청" 으로 제출.
// 관리자가 AdminRequestsScreen 에서 보고 승인하면 drink_catalog 에 삽입.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius, iconSize } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { DrinkCategory, CATEGORY_LABELS } from '../types';
import Icon from '../components/Icon';
import { CATEGORY_ICONS } from '../constants/categoryIcons';

const CATEGORIES: DrinkCategory[] = [
  'soju',
  'beer',
  'makgeolli',
  'wine',
  'whiskey',
  'spirits',
  'etc',
];

export default function RequestDrinkScreen({ route, navigation }: any) {
  const prefillName: string = route?.params?.prefillName ?? '';

  const [name, setName] = useState(prefillName);
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<DrinkCategory | null>(null);
  const [abv, setAbv] = useState('');
  const [volumeMl, setVolumeMl] = useState('');
  const [origin, setOrigin] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert('입력 오류', '제품명은 필수입니다.');
      return;
    }
    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인 세션이 없습니다.');

      const { error } = await supabase.from('drink_request').insert({
        user_id: user.id,
        name: name.trim(),
        brand: brand.trim() || null,
        category: category || null,
        abv: abv ? parseFloat(abv) : null,
        volume_ml: volumeMl ? parseInt(volumeMl, 10) : null,
        origin: origin.trim() || null,
        note: note.trim() || null,
      });
      if (error) throw error;

      Alert.alert(
        '요청 완료 🎉',
        '검토 후 DB 에 등록됩니다.\n감사합니다!',
        [{ text: '확인', onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      Alert.alert('요청 실패', err.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerBtn}>닫기</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📮 술 등록 요청</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>💡 어떻게 쓰는 건가요?</Text>
            <Text style={styles.hintText}>
              DB 에 없는 술을 알려주시면 관리자가 검토 후 추가합니다.{'\n'}
              아는 정보만 채우고 모르는 건 비워두셔도 돼요.
            </Text>
          </View>

          {/* 제품명 */}
          <Text style={styles.label}>제품명 *</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 한맥"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
          />

          {/* 브랜드 */}
          <Text style={styles.label}>브랜드 / 제조사</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 오비맥주"
            placeholderTextColor={colors.textTertiary}
            value={brand}
            onChangeText={setBrand}
          />

          {/* 주종 */}
          <Text style={styles.label}>주종</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(category === cat ? null : cat)}
              >
                <Icon
                  set={CATEGORY_ICONS[cat].set}
                  name={CATEGORY_ICONS[cat].name}
                  size={iconSize.md}
                  color={category === cat ? colors.primary : colors.textSecondary}
                  style={styles.categoryIcon}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    category === cat && styles.categoryLabelActive,
                  ]}
                >
                  {CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 도수 & 용량 */}
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>도수 (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="4.6"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                value={abv}
                onChangeText={setAbv}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>용량 (ml)</Text>
              <TextInput
                style={styles.input}
                placeholder="500"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                value={volumeMl}
                onChangeText={setVolumeMl}
              />
            </View>
          </View>

          {/* 원산지 */}
          <Text style={styles.label}>원산지 / 국가</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 한국, 프랑스, 미국"
            placeholderTextColor={colors.textTertiary}
            value={origin}
            onChangeText={setOrigin}
          />

          {/* 메모 */}
          <Text style={styles.label}>추가 설명 (선택)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="어디서 샀는지, 어떤 특징이 있는지 등 자유롭게..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            value={note}
            onChangeText={setNote}
          />

          {/* 제출 */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.5 }]}
            onPress={submit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>
              {submitting ? '제출 중...' : '📮 요청 보내기'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerHint}>
            ⓘ 승인되면 다음에 검색 시 바로 나타납니다. 요청 내역은 마이페이지 등에서 추후 확인 가능.
          </Text>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: { padding: spacing.lg },
  hintBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  hintTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  hintText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.md },
  halfField: { flex: 1 },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },
  categoryIcon: { marginRight: spacing.xs },
  categoryLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  categoryLabelActive: { color: colors.primary, fontWeight: '600' },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textInverse,
  },
  footerHint: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
