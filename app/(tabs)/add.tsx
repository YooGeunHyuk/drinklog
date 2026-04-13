import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

type InputMethod = 'search' | 'manual';

const CATEGORIES = ['소주', '맥주', '막걸리', '와인', '위스키', '양주', '기타'] as const;

interface SearchResult {
  id: string;
  name: string;
  category: string;
  brand: string;
  abv: number;
  volume_ml: number;
  avg_price: number;
}

export default function AddScreen() {
  const { user } = useAuth();
  const [method, setMethod] = useState<InputMethod | null>(null);

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);

  // 직접 입력 상태
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualAbv, setManualAbv] = useState('');
  const [manualVolume, setManualVolume] = useState('');
  const [manualPrice, setManualPrice] = useState('');

  // 공통 기록 상태
  const [bottles, setBottles] = useState('1');
  const [pricePaid, setPricePaid] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSearch() {
    if (!searchQuery.trim()) return;

    setSearching(true);
    // 1단계: 자체 카탈로그 검색
    const { data } = await supabase
      .from('drink_catalog')
      .select('*')
      .ilike('name', `%${searchQuery}%`)
      .limit(10);

    setSearchResults((data as SearchResult[]) || []);
    setSearching(false);

    // TODO: 2단계 외부 API, 3단계 Claude AI fallback
  }

  async function handleSave() {
    if (!user) return;

    let catalogId = selectedDrink?.id;

    // 직접 입력 시 카탈로그에 먼저 등록
    if (method === 'manual') {
      if (!manualName || !manualCategory) {
        Alert.alert('알림', '제품명과 주종은 필수입니다.');
        return;
      }

      const { data, error } = await supabase
        .from('drink_catalog')
        .insert({
          name: manualName,
          category: manualCategory,
          abv: manualAbv ? parseFloat(manualAbv) : null,
          volume_ml: manualVolume ? parseInt(manualVolume) : null,
          avg_price: manualPrice ? parseInt(manualPrice) : null,
          source: 'self',
          verified: false,
        })
        .select('id')
        .single();

      if (error || !data) {
        Alert.alert('오류', '술 정보 저장에 실패했습니다.');
        return;
      }
      catalogId = data.id;
    }

    if (!catalogId) {
      Alert.alert('알림', '기록할 술을 선택해주세요.');
      return;
    }

    setSaving(true);
    const bottleCount = parseFloat(bottles) || 1;
    const drinkVolume = selectedDrink?.volume_ml || (manualVolume ? parseInt(manualVolume) : 0);

    const { error } = await supabase.from('drink_log').insert({
      user_id: user.id,
      catalog_id: catalogId,
      logged_at: new Date().toISOString(),
      bottles: bottleCount,
      quantity_ml: drinkVolume * bottleCount,
      price_paid: pricePaid ? parseInt(pricePaid) : (selectedDrink?.avg_price || 0) * bottleCount,
      input_method: method === 'manual' ? 'manual' : 'search',
      note: note || null,
    });
    setSaving(false);

    if (error) {
      Alert.alert('오류', '기록 저장에 실패했습니다.');
      return;
    }

    Alert.alert('완료', '기록이 저장되었습니다!');
    resetForm();
  }

  function resetForm() {
    setMethod(null);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedDrink(null);
    setManualName('');
    setManualCategory('');
    setManualAbv('');
    setManualVolume('');
    setManualPrice('');
    setBottles('1');
    setPricePaid('');
    setNote('');
  }

  // 메소드 선택 화면
  if (!method) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>기록 추가</Text>
          <Text style={styles.subtitle}>어떤 방법으로 추가할까요?</Text>

          <TouchableOpacity
            style={styles.methodCard}
            onPress={() => setMethod('search')}
          >
            <Ionicons name="search" size={32} color={colors.primary} />
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>검색으로 추가</Text>
              <Text style={styles.methodDesc}>술 이름으로 검색해서 기록</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.methodCard}
            onPress={() => setMethod('manual')}
          >
            <Ionicons name="create" size={32} color={colors.primary} />
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>직접 입력</Text>
              <Text style={styles.methodDesc}>주종, 이름, 도수 직접 타이핑</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 검색 화면
  if (method === 'search' && !selectedDrink) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => setMethod(null)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
          <Text style={styles.backText}>뒤로</Text>
        </TouchableOpacity>

        <Text style={styles.title}>술 검색</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="술 이름을 입력하세요"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            autoFocus
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="search" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {searching && <Text style={styles.searchingText}>검색 중...</Text>}

        {searchResults.map(drink => (
          <TouchableOpacity
            key={drink.id}
            style={styles.resultCard}
            onPress={() => {
              setSelectedDrink(drink);
              setPricePaid(drink.avg_price?.toString() || '');
            }}
          >
            <Text style={styles.resultName}>{drink.name}</Text>
            <Text style={styles.resultMeta}>
              {drink.category} · {drink.abv}% · {drink.volume_ml}ml
            </Text>
            {drink.brand && (
              <Text style={styles.resultBrand}>{drink.brand}</Text>
            )}
          </TouchableOpacity>
        ))}

        {!searching && searchResults.length === 0 && searchQuery.length > 0 && (
          <View style={styles.noResult}>
            <Text style={styles.noResultText}>검색 결과가 없습니다</Text>
            <TouchableOpacity
              style={styles.manualFallback}
              onPress={() => {
                setManualName(searchQuery);
                setMethod('manual');
              }}
            >
              <Text style={styles.manualFallbackText}>직접 입력하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  }

  // 직접 입력 화면 또는 선택 후 기록 입력
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        onPress={() => {
          if (selectedDrink) {
            setSelectedDrink(null);
          } else {
            setMethod(null);
          }
        }}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
        <Text style={styles.backText}>뒤로</Text>
      </TouchableOpacity>

      {method === 'manual' ? (
        <>
          <Text style={styles.title}>직접 입력</Text>

          <Text style={styles.label}>주종</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  manualCategory === cat && styles.categoryChipSelected,
                ]}
                onPress={() => setManualCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    manualCategory === cat && styles.categoryChipTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>제품명</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 참이슬 후레쉬"
            placeholderTextColor={colors.textMuted}
            value={manualName}
            onChangeText={setManualName}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>도수 (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="16.0"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={manualAbv}
                onChangeText={setManualAbv}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>용량 (ml)</Text>
              <TextInput
                style={styles.input}
                placeholder="360"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={manualVolume}
                onChangeText={setManualVolume}
              />
            </View>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>{selectedDrink?.name}</Text>
          <Text style={styles.selectedMeta}>
            {selectedDrink?.category} · {selectedDrink?.abv}% · {selectedDrink?.volume_ml}ml
          </Text>
        </>
      )}

      {/* 공통 기록 입력 */}
      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>병 수</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={bottles}
            onChangeText={setBottles}
          />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>결제 금액 (원)</Text>
          <TextInput
            style={styles.input}
            placeholder="가격"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={pricePaid}
            onChangeText={setPricePaid}
          />
        </View>
      </View>

      <Text style={styles.label}>메모 (선택)</Text>
      <TextInput
        style={[styles.input, styles.noteInput]}
        placeholder="오늘의 한 줄 메모"
        placeholderTextColor={colors.textMuted}
        value={note}
        onChangeText={setNote}
        multiline
      />

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? '저장 중...' : '기록 저장'}
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
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  methodDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  resultMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  resultBrand: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  noResult: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noResultText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  manualFallback: {
    marginTop: spacing.md,
    padding: spacing.md,
  },
  manualFallbackText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  selectedMeta: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  label: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
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
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDark + '30',
  },
  categoryChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
