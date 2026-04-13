import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { DrinkCategory, CATEGORY_LABELS } from '../types';

type AddMode = 'select' | 'search' | 'manual';

const CATEGORIES: DrinkCategory[] = [
  'soju', 'beer', 'makgeolli', 'wine', 'whiskey', 'spirits', 'etc',
];

const CATEGORY_ICONS: Record<DrinkCategory, string> = {
  soju: '🍶',
  beer: '🍺',
  makgeolli: '🥛',
  wine: '🍷',
  whiskey: '🥃',
  spirits: '🍸',
  etc: '🍹',
};

export default function AddDrinkScreen() {
  const [mode, setMode] = useState<AddMode>('select');
  const [searchQuery, setSearchQuery] = useState('');

  // 직접 입력 필드
  const [selectedCategory, setSelectedCategory] = useState<DrinkCategory | null>(null);
  const [name, setName] = useState('');
  const [abv, setAbv] = useState('');
  const [volumeMl, setVolumeMl] = useState('');
  const [bottles, setBottles] = useState('1');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    // TODO: 3단 Fallback 검색 구현
    Alert.alert('검색', `"${searchQuery}" 검색 결과는 Supabase 연동 후 표시됩니다.`);
  };

  const handleManualSave = () => {
    if (!selectedCategory || !name.trim()) {
      Alert.alert('입력 오류', '주종과 제품명은 필수입니다.');
      return;
    }
    // TODO: Supabase에 저장
    Alert.alert('저장 완료', `${name}이(가) 기록되었습니다.`, [
      { text: '확인', onPress: () => resetForm() },
    ]);
  };

  const resetForm = () => {
    setMode('select');
    setSelectedCategory(null);
    setName('');
    setAbv('');
    setVolumeMl('');
    setBottles('1');
    setPrice('');
    setNote('');
    setSearchQuery('');
  };

  // 모드 선택 화면
  if (mode === 'select') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>기록 추가</Text>
          <Text style={styles.subtitle}>어떤 방법으로 추가할까요?</Text>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => setMode('search')}
            activeOpacity={0.7}
          >
            <Text style={styles.modeIcon}>🔍</Text>
            <View style={styles.modeTextContainer}>
              <Text style={styles.modeTitle}>검색으로 추가</Text>
              <Text style={styles.modeDesc}>술 이름으로 검색해서 추가</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => setMode('manual')}
            activeOpacity={0.7}
          >
            <Text style={styles.modeIcon}>✏️</Text>
            <View style={styles.modeTextContainer}>
              <Text style={styles.modeTitle}>직접 입력</Text>
              <Text style={styles.modeDesc}>주종, 이름, 도수 등을 직접 입력</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, styles.modeCardDisabled]}
            activeOpacity={0.5}
          >
            <Text style={styles.modeIcon}>📷</Text>
            <View style={styles.modeTextContainer}>
              <Text style={[styles.modeTitle, styles.disabledText]}>
                스캔으로 추가
              </Text>
              <Text style={[styles.modeDesc, styles.disabledText]}>
                Phase 2에서 추가 예정
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 검색 모드
  if (mode === 'search') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity onPress={() => setMode('select')}>
              <Text style={styles.backButton}>← 뒤로</Text>
            </TouchableOpacity>
            <Text style={styles.title}>검색으로 추가</Text>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="술 이름을 입력하세요 (예: 참이슬)"
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoFocus
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearch}
              >
                <Text style={styles.searchButtonText}>검색</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>술 이름을 검색해보세요</Text>
              <Text style={styles.emptySubtext}>
                DB → 외부 API → AI 순으로 자동 검색됩니다
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // 직접 입력 모드
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={() => setMode('select')}>
            <Text style={styles.backButton}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.title}>직접 입력</Text>

          {/* 주종 선택 */}
          <Text style={styles.label}>주종 *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={styles.categoryIcon}>
                  {CATEGORY_ICONS[cat]}
                </Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === cat && styles.categoryLabelActive,
                  ]}
                >
                  {CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 제품명 */}
          <Text style={styles.label}>제품명 *</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 참이슬 후레쉬"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
          />

          {/* 도수 & 용량 */}
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>도수 (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="16.0"
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
                placeholder="360"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                value={volumeMl}
                onChangeText={setVolumeMl}
              />
            </View>
          </View>

          {/* 병 수 & 가격 */}
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>병 수</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                value={bottles}
                onChangeText={setBottles}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>결제 금액 (₩)</Text>
              <TextInput
                style={styles.input}
                placeholder="5000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          {/* 메모 */}
          <Text style={styles.label}>메모</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="오늘의 한 마디..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            value={note}
            onChangeText={setNote}
          />

          {/* 저장 버튼 */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleManualSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>기록 저장</Text>
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
  backButton: {
    fontSize: fontSize.md,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  // 모드 선택 카드
  modeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modeCardDisabled: {
    opacity: 0.4,
  },
  modeIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modeDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  disabledText: {
    color: colors.textTertiary,
  },
  // 검색
  searchContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: colors.textInverse,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  // 직접 입력
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
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
  categoryIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  categoryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  categoryLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textInverse,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
