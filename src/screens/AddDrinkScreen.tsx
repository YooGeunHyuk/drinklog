import React, { useState, useEffect } from 'react';
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
import { colors, spacing, fontSize, borderRadius, iconSize } from '../constants/theme';
import {
  DrinkCategory,
  CATEGORY_LABELS,
  DrinkCatalog,
} from '../types';
import { supabase } from '../lib/supabase';
import { getCurrentWeather } from '../lib/weather';
import Icon from '../components/Icon';
import { CATEGORY_ICONS } from '../constants/categoryIcons';

type AddMode = 'select' | 'search' | 'manual';

const CATEGORIES: DrinkCategory[] = [
  'soju', 'beer', 'makgeolli', 'wine', 'whiskey', 'spirits', 'etc',
];

export default function AddDrinkScreen({ route, navigation }: any) {
  const [mode, setMode] = useState<AddMode>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DrinkCatalog[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  // 직접 입력 필드
  const [selectedCategory, setSelectedCategory] = useState<DrinkCategory | null>(null);
  const [name, setName] = useState('');
  const [abv, setAbv] = useState('');
  const [volumeMl, setVolumeMl] = useState('');
  const [bottles, setBottles] = useState('1');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [barcode, setBarcode] = useState<string | null>(null);

  // 스캔 화면에서 바코드 전달받으면 직접 입력 모드로 진입
  useEffect(() => {
    const prefill = route?.params?.prefillBarcode;
    if (prefill) {
      setBarcode(prefill);
      setMode('manual');
      navigation?.setParams?.({ prefillBarcode: undefined });
    }
  }, [route?.params?.prefillBarcode]);

  // 라벨 AI 인식 결과 prefill
  useEffect(() => {
    const ai = route?.params?.prefillFromAI;
    if (ai) {
      if (ai.name) setName(ai.name);
      if (ai.category) setSelectedCategory(ai.category);
      if (ai.abv != null) setAbv(String(ai.abv));
      if (ai.volume_ml != null) setVolumeMl(String(ai.volume_ml));
      setMode('manual');
      navigation?.setParams?.({ prefillFromAI: undefined });
    }
  }, [route?.params?.prefillFromAI]);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    setHasSearched(true);
    setLastQuery(q);
    try {
      // 이름(ko) + 브랜드(en) 동시 검색
      const { data, error } = await supabase
        .from('drink_catalog')
        .select('*')
        .or(`name.ilike.%${q}%,brand.ilike.%${q}%`)
        .order('verified', { ascending: false })
        .limit(30);
      if (error) throw error;
      setSearchResults(data || []);

      // 검색 실패 기록 (관리자 큐레이션용). 테이블 없으면 조용히 실패.
      if (!data || data.length === 0) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          await supabase
            .from('search_miss')
            .insert({ query: q, user_id: user?.id ?? null });
        } catch {
          // 테이블 없거나 권한 없으면 무시
        }
      }
    } catch (err: any) {
      Alert.alert('검색 실패', err.message ?? '검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  // 검색 결과에서 선택 → 바로 기록 생성 → EditDrink 모달로 이동(상세 입력 옵션)
  const handleSelectFromSearch = async (catalog: DrinkCatalog) => {
    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인 세션이 없습니다.');

      // ① 본인이 같은 술에 마지막으로 적은 가격을 우선 사용
      //    매장마다/상황마다 가격이 달라서 카탈로그 평균(avg_price)보다 정확
      const { data: lastLog } = await supabase
        .from('drink_log')
        .select('price_paid')
        .eq('user_id', user.id)
        .eq('catalog_id', catalog.id)
        .not('price_paid', 'is', null)
        .order('logged_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const resolvedPrice =
        lastLog?.price_paid ?? catalog.avg_price ?? null;

      // 날씨 자동 기록 (권한 거부 / 실패 시 null, 저장 진행은 그대로)
      const weatherInfo = await getCurrentWeather();

      const { data: inserted, error } = await supabase
        .from('drink_log')
        .insert({
          user_id: user.id,
          catalog_id: catalog.id,
          bottles: 1,
          quantity_ml: catalog.volume_ml,
          price_paid: resolvedPrice,
          input_method: 'search',
          weather: weatherInfo?.weather ?? null,
          temperature: weatherInfo?.temperature ?? null,
          location_name: weatherInfo?.locationName || null,
        })
        .select('id')
        .single();
      if (error) throw error;

      resetForm();
      // 상세(무드/사진/장소/동행자/메모) 입력 화면으로 자동 이동
      navigation.replace('EditDrink', { logId: inserted.id });
    } catch (err: any) {
      Alert.alert('저장 실패', err.message ?? '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (!selectedCategory || !name.trim()) {
      Alert.alert('입력 오류', '주종과 제품명은 필수입니다.');
      return;
    }
    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인 세션이 없습니다.');

      // 1. 카탈로그에 동일 제품이 있으면 재사용, 없으면 새로 생성
      const { data: existing } = await supabase
        .from('drink_catalog')
        .select('id')
        .eq('name', name.trim())
        .eq('category', selectedCategory)
        .limit(1);

      let catalogId: string;
      if (existing && existing.length > 0) {
        catalogId = existing[0].id;
      } else {
        const { data: newCatalog, error: catalogError } = await supabase
          .from('drink_catalog')
          .insert({
            name: name.trim(),
            category: selectedCategory,
            abv: abv ? parseFloat(abv) : null,
            volume_ml: volumeMl ? parseInt(volumeMl, 10) : null,
            avg_price: price ? parseInt(price, 10) : null,
            barcode: barcode || null,
            source: 'self',
          })
          .select('id')
          .single();
        if (catalogError) throw catalogError;
        catalogId = newCatalog.id;
      }

      // 2. 가격 결정
      //    - 사용자가 입력했으면 그 값
      //    - 비웠고 동일 카탈로그가 이미 있으면 본인의 마지막 가격으로 fallback
      let resolvedPrice: number | null = price ? parseInt(price, 10) : null;
      if (resolvedPrice == null && existing && existing.length > 0) {
        const { data: lastLog } = await supabase
          .from('drink_log')
          .select('price_paid')
          .eq('user_id', user.id)
          .eq('catalog_id', catalogId)
          .not('price_paid', 'is', null)
          .order('logged_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        resolvedPrice = lastLog?.price_paid ?? null;
      }

      // 3. 음주 기록 생성 (디테일은 EditDrink 화면에서 추가)
      const bottleCount = parseFloat(bottles) || 1;

      // 날씨 자동 기록
      const weatherInfo = await getCurrentWeather();

      const { data: inserted, error: logError } = await supabase
        .from('drink_log')
        .insert({
          user_id: user.id,
          catalog_id: catalogId,
          bottles: bottleCount,
          quantity_ml: volumeMl
            ? Math.round(parseInt(volumeMl, 10) * bottleCount)
            : null,
          price_paid: resolvedPrice,
          input_method: barcode ? 'scan' : 'manual',
          note: note || null,
          weather: weatherInfo?.weather ?? null,
          temperature: weatherInfo?.temperature ?? null,
          location_name: weatherInfo?.locationName || null,
        })
        .select('id')
        .single();
      if (logError) throw logError;

      resetForm();
      navigation.replace('EditDrink', { logId: inserted.id });
    } catch (err: any) {
      Alert.alert('저장 실패', err.message ?? '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
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
    setSearchResults([]);
    setBarcode(null);
    setHasSearched(false);
    setLastQuery('');
  };

  // 모드 선택 화면
  if (mode === 'select') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>기록 추가</Text>
          <Text style={styles.subtitle}>어떤 방법으로 추가할까요?</Text>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => setMode('search')}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeIcon, styles.modeEmoji]}>🔍</Text>
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
            <Text style={[styles.modeIcon, styles.modeEmoji]}>✏️</Text>
            <View style={styles.modeTextContainer}>
              <Text style={styles.modeTitle}>직접 입력</Text>
              <Text style={styles.modeDesc}>주종, 이름, 도수 등을 직접 입력</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => navigation.navigate('LabelScan')}
            activeOpacity={0.7}
          >
            <Icon name="Camera" size={iconSize.lg} color={colors.primary} style={styles.modeIcon} />
            <View style={styles.modeTextContainer}>
              <Text style={styles.modeTitle}>라벨 촬영 인식</Text>
              <Text style={styles.modeDesc}>
                사진으로 DB 매칭, 없으면 AI가 자동 분석
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
            <TouchableOpacity style={styles.backRow} onPress={() => setMode('select')}>
              <Icon name="ChevronLeft" size={iconSize.sm} color={colors.primary} />
              <Text style={styles.backButton}>뒤로</Text>
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
                disabled={isSearching}
              >
                <Text style={styles.searchButtonText}>
                  {isSearching ? '...' : '검색'}
                </Text>
              </TouchableOpacity>
            </View>

            {searchResults.length > 0 ? (
              <View style={{ marginTop: spacing.md }}>
                <Text style={styles.resultLabel}>
                  검색 결과 {searchResults.length}건
                </Text>
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.resultCard}
                    onPress={() => handleSelectFromSearch(item)}
                    disabled={isSaving}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>{item.name}</Text>
                      <Text style={styles.resultMeta}>
                        {CATEGORY_LABELS[item.category]}
                        {item.abv ? ` · ${item.abv}%` : ''}
                        {item.volume_ml ? ` · ${item.volume_ml}ml` : ''}
                      </Text>
                    </View>
                    <Icon name="Plus" size={iconSize.md} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : hasSearched && !isSearching ? (
              // 검색했는데 결과 없음 → CTA 3개 노출
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🕵️</Text>
                <Text style={styles.emptyText}>
                  "{lastQuery}" 검색 결과가 없어요
                </Text>
                <Text style={styles.emptySubtext}>
                  아직 DB에 없는 술이에요. 아래 방법으로 직접 등록해보세요.
                </Text>

                <TouchableOpacity
                  style={styles.ctaPrimary}
                  onPress={() =>
                    navigation?.getParent()?.navigate('LabelScan')
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.ctaPrimaryIcon}>🏷️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ctaPrimaryText}>
                      라벨 촬영으로 등록 (AI)
                    </Text>
                    <Text style={styles.ctaPrimarySub}>
                      라벨 사진을 찍으면 AI가 자동 인식
                    </Text>
                  </View>
                </TouchableOpacity>


                <TouchableOpacity
                  style={styles.ctaSecondary}
                  onPress={() => {
                    // 검색어를 제품명 기본값으로 미리 채우기
                    setName(lastQuery);
                    setMode('manual');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.ctaSecondaryIcon}>✏️</Text>
                  <Text style={styles.ctaSecondaryText}>
                    직접 입력 ("{lastQuery}" 으로 시작)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.ctaSecondary}
                  onPress={() =>
                    navigation?.getParent()?.navigate('RequestDrink', {
                      prefillName: lastQuery,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.ctaSecondaryIcon}>📮</Text>
                  <Text style={styles.ctaSecondaryText}>
                    이 술 등록 요청 보내기
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // 초기 상태 (검색 전)
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>술 이름을 검색해보세요</Text>
                <Text style={styles.emptySubtext}>
                  이름 또는 브랜드로 검색 (예: 참이슬, Heineken){'\n'}
                  없으면 라벨 촬영 / 바코드 / 직접 입력으로 추가
                </Text>
              </View>
            )}
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
          <TouchableOpacity style={styles.backRow} onPress={() => setMode('select')}>
            <Icon name="ChevronLeft" size={iconSize.sm} color={colors.primary} />
            <Text style={styles.backButton}>뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.title}>직접 입력</Text>

          {/* 스캔 후 진입한 경우 바코드 배너 */}
          {barcode && (
            <View style={styles.barcodeBanner}>
              <View style={styles.barcodeBannerLabelRow}>
                <Icon name="Camera" size={iconSize.xs} color={colors.textSecondary} />
                <Text style={styles.barcodeBannerLabel}>스캔된 바코드</Text>
              </View>
              <Text style={styles.barcodeBannerCode}>{barcode}</Text>
              <Text style={styles.barcodeBannerHint}>
                저장 시 이 바코드가 카탈로그에 등록되어 다음부터는 스캔만으로 기록됩니다.
              </Text>
            </View>
          )}

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
                <Icon
                  set={CATEGORY_ICONS[cat].set}
                  name={CATEGORY_ICONS[cat].name}
                  size={iconSize.md}
                  color={selectedCategory === cat ? colors.primary : colors.textSecondary}
                  style={styles.categoryIcon}
                />
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

          <Text style={styles.nextHint}>
            저장하면 무드 · 사진 · 장소 등 디테일을 이어서 추가할 수 있어요.
          </Text>

          {/* 저장 버튼 */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
            onPress={handleManualSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? '저장 중...' : '저장하고 디테일 추가 →'}
            </Text>
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  modalClose: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    padding: spacing.xs,
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
    // 헤더 영역 → 본문 — md (xl은 과함)
    marginBottom: spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  backButton: {
    fontSize: fontSize.md,
    color: colors.primary,
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
    marginRight: spacing.md,
    width: iconSize.lg,
    textAlign: 'center',
  },
  modeEmoji: {
    fontSize: iconSize.lg,
    lineHeight: iconSize.lg + 4,
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
    marginTop: spacing.xs,
  },
  disabledText: {
    color: colors.textTertiary,
  },
  // 검색
  searchContainer: {
    flexDirection: 'row',
    // 검색 → 결과 영역 — md
    marginBottom: spacing.md,
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
    // 폼 끝 → 저장 — lg (xl은 과함)
    marginTop: spacing.lg,
  },
  saveButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textInverse,
  },
  resultLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  resultMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  resultArrow: {
    fontSize: iconSize.md,
    color: colors.primary,
    marginLeft: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: iconSize.xxl,
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
  barcodeBanner: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  barcodeBannerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  barcodeBannerLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  barcodeBannerCode: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: spacing.xs,
  },
  barcodeBannerHint: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    lineHeight: 16,
  },
  // 검색 실패시 CTA
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    width: '100%',
  },
  ctaPrimaryIcon: {
    fontSize: iconSize.lg,
    marginRight: spacing.md,
  },
  ctaPrimaryText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textInverse,
  },
  ctaPrimarySub: {
    fontSize: fontSize.xs,
    color: colors.textInverse,
    opacity: 0.85,
    marginTop: 2,
  },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    width: '100%',
  },
  ctaSecondaryIcon: {
    fontSize: iconSize.md,
    marginRight: spacing.md,
  },
  ctaSecondaryText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  nextHint: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
});
