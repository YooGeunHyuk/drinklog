import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { getCurrentWeather } from '../lib/weather';
import { DrinkCatalog, DrinkCategory, CATEGORY_LABELS } from '../types';

interface Props {
  navigation: any;
}

interface ExtractedInfo {
  name: string | null;
  brand: string | null;
  category: DrinkCategory | null;
  abv: number | null;
  volume_ml: number | null;
  origin: string | null;
  confidence: 'high' | 'medium' | 'low';
}

export default function LabelScanScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedInfo | null>(null);
  const [matchedCatalog, setMatchedCatalog] = useState<DrinkCatalog | null>(null);
  const [candidates, setCandidates] = useState<DrinkCatalog[]>([]);
  const [scanInfo, setScanInfo] = useState<{
    aiUsed: boolean;
    aiTier?: string;
    mode?: string;
  } | null>(null);

  // ── 사진 선택 ──
  const pickImage = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        '권한 필요',
        source === 'camera'
          ? '카메라 권한이 필요합니다.'
          : '사진 접근 권한이 필요합니다.',
      );
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            base64: true,
            allowsEditing: false,  // 크롭 편집 제거 → 찍은 그대로
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            base64: true,
            allowsEditing: false,
          });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setImageUri(asset.uri);
    setExtracted(null);
    setMatchedCatalog(null);
    setCandidates([]);
    setScanInfo(null);

    if (asset.base64) {
      analyzeLabel(asset.base64);
    }
  };

  // ── 라벨 분석 (2-tier: 경량 이름 추출 → DB 매칭 → 풀 AI 분석) ──
  const analyzeLabel = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const SUPABASE_URL = 'https://bqkujvvlccgutscncnfo.supabase.co';
      const SUPABASE_ANON_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa3VqdnZsY2NndXRzY25jbmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODQ0MjEsImV4cCI6MjA5MTY2MDQyMX0.ndnrM658mrdfnrqeNBrq-TvVjzASyJf4ZXRBrIy5r5Y';

      const res = await fetch(`${SUPABASE_URL}/functions/v1/scan-label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: 'image/jpeg',
        }),
      });

      const bodyText = await res.text();
      let body: any = null;
      try {
        body = JSON.parse(bodyText);
      } catch {
        // 파싱 실패
      }

      if (!res.ok) {
        console.error('[LabelScan] Edge Function error:', res.status, bodyText);
        const errorMsg = body?.error || body?.message || body?.msg;
        throw new Error(`[HTTP ${res.status}] ${errorMsg || bodyText.slice(0, 300)}`);
      }

      // 2-tier 응답 처리
      setScanInfo({
        aiUsed: body.aiUsed ?? true,
        aiTier: body.aiTier,
        mode: body.mode,
      });

      if (body.matched && body.catalog) {
        setMatchedCatalog(body.catalog as DrinkCatalog);
        if (body.candidates) {
          setCandidates(body.candidates as DrinkCatalog[]);
        }
      }

      if (body.data) {
        setExtracted(body.data as ExtractedInfo);
      }

      // DB 매칭 안 되고, 추출된 데이터도 없는 경우
      if (!body.matched && !body.data) {
        setExtracted({
          name: body.extractedName ?? null,
          brand: null,
          category: null,
          abv: null,
          volume_ml: null,
          origin: null,
          confidence: 'low',
        });
      }
    } catch (err: any) {
      Alert.alert(
        '분석 실패',
        err.message ?? '라벨 분석 중 오류가 발생했습니다.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── DB 매칭된 카탈로그로 기록 ──
  const handleQuickLogFromCatalog = async (catalog?: DrinkCatalog) => {
    const target = catalog ?? matchedCatalog;
    if (!target) return;
    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인 세션이 없습니다.');

      // 마지막 결제 금액 조회
      const { data: lastLog } = await supabase
        .from('drink_log')
        .select('price_paid')
        .eq('user_id', user.id)
        .eq('catalog_id', target.id)
        .not('price_paid', 'is', null)
        .order('logged_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // 날씨 자동 기록
      const weatherInfo = await getCurrentWeather();

      const { data: inserted, error } = await supabase
        .from('drink_log')
        .insert({
          user_id: user.id,
          catalog_id: target.id,
          bottles: 1,
          quantity_ml: target.volume_ml,
          price_paid: lastLog?.price_paid ?? target.avg_price,
          input_method: 'scan',
          weather: weatherInfo?.weather ?? null,
          temperature: weatherInfo?.temperature ?? null,
          location_name: weatherInfo?.locationName || null,
        })
        .select('id')
        .single();
      if (error) throw error;

      // EditDrink로 이동 (2-step 플로우)
      navigation.replace('EditDrink', { logId: inserted.id });
    } catch (err: any) {
      Alert.alert('저장 실패', err.message ?? '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── 새 제품 등록 + 기록 ──
  const handleCreateAndLog = async () => {
    if (!extracted || !extracted.name || !extracted.category) {
      Alert.alert('정보 부족', '이름 또는 카테고리가 인식되지 않았어요.');
      return;
    }
    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인 세션이 없습니다.');

      const { data: newCatalog, error: catalogError } = await supabase
        .from('drink_catalog')
        .insert({
          name: extracted.name,
          category: extracted.category,
          brand: extracted.brand,
          abv: extracted.abv,
          volume_ml: extracted.volume_ml,
          origin: extracted.origin,
          source: 'ai_generated',
        })
        .select('id')
        .single();
      if (catalogError) throw catalogError;

      // 날씨 자동 기록
      const weatherInfo = await getCurrentWeather();

      const { data: inserted, error: logError } = await supabase
        .from('drink_log')
        .insert({
          user_id: user.id,
          catalog_id: newCatalog.id,
          bottles: 1,
          quantity_ml: extracted.volume_ml,
          input_method: 'scan',
          weather: weatherInfo?.weather ?? null,
          temperature: weatherInfo?.temperature ?? null,
          location_name: weatherInfo?.locationName || null,
        })
        .select('id')
        .single();
      if (logError) throw logError;

      // EditDrink로 이동 (2-step 플로우)
      navigation.replace('EditDrink', { logId: inserted.id });
    } catch (err: any) {
      Alert.alert('저장 실패', err.message ?? '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetAll = () => {
    setImageUri(null);
    setExtracted(null);
    setMatchedCatalog(null);
    setCandidates([]);
    setScanInfo(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 닫기</Text>
        </TouchableOpacity>
        <Text style={styles.title}>라벨 촬영 인식</Text>
        <Text style={styles.subtitle}>
          라벨을 찍으면 DB에서 먼저 찾고, 없으면 AI가 분석해요
        </Text>

        {/* ── 이미지 선택 전 ── */}
        {!imageUri && (
          <>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => pickImage('camera')}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>📷</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>사진 찍기</Text>
                <Text style={styles.actionDesc}>
                  카메라로 라벨을 직접 촬영
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => pickImage('library')}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>🖼️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>앨범에서 선택</Text>
                <Text style={styles.actionDesc}>
                  이미 찍어둔 사진에서 선택
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.tipBox}>
              <Text style={styles.tipTitle}>💡 스마트 인식 안내</Text>
              <Text style={styles.tipText}>
                • DB에 1,300종+ 등록되어 있어 대부분 바로 매칭돼요{'\n'}
                • DB에 있으면 AI 없이 빠르게, 없으면 AI가 분석해요{'\n'}
                • 새로 등록된 술은 다음부터 바로 매칭돼요{'\n'}
                • 라벨이 잘 보이게 찍을수록 정확해요
              </Text>
            </View>
          </>
        )}

        {/* ── 이미지 선택 후 ── */}
        {imageUri && (
          <>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />

            {isAnalyzing && (
              <View style={styles.analyzingBox}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.analyzingText}>
                  DB에서 찾는 중...
                </Text>
              </View>
            )}

            {!isAnalyzing && (matchedCatalog || extracted) && (
              <View style={styles.resultCard}>
                {/* 스캔 모드 배지 */}
                {scanInfo && (
                  <View style={styles.scanModeBadge}>
                    <Text style={styles.scanModeText}>
                      {scanInfo.mode === 'db_match'
                        ? '⚡ DB 매칭 완료'
                        : scanInfo.mode === 'db_match_after_full'
                          ? '🔍 DB에서 발견'
                          : '🤖 새로운 술 발견'}
                    </Text>
                  </View>
                )}

                {matchedCatalog ? (
                  <>
                    {/* DB 매칭 결과 */}
                    <View style={styles.matchedBox}>
                      <Text style={styles.matchedLabel}>🎯 DB 매칭 결과</Text>
                      <Text style={styles.resultName}>{matchedCatalog.name}</Text>
                      {matchedCatalog.brand && (
                        <Text style={styles.resultBrand}>{matchedCatalog.brand}</Text>
                      )}
                      <View style={styles.resultMetaRow}>
                        <View style={styles.metaPill}>
                          <Text style={styles.metaPillText}>
                            {CATEGORY_LABELS[matchedCatalog.category]}
                          </Text>
                        </View>
                        {matchedCatalog.abv != null && (
                          <View style={styles.metaPill}>
                            <Text style={styles.metaPillText}>
                              {matchedCatalog.abv}%
                            </Text>
                          </View>
                        )}
                        {matchedCatalog.volume_ml != null && (
                          <View style={styles.metaPill}>
                            <Text style={styles.metaPillText}>
                              {matchedCatalog.volume_ml}ml
                            </Text>
                          </View>
                        )}
                        {matchedCatalog.origin && (
                          <View style={styles.metaPill}>
                            <Text style={styles.metaPillText}>
                              {matchedCatalog.origin}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => handleQuickLogFromCatalog()}
                      disabled={isSaving}
                    >
                      <Text style={styles.primaryButtonText}>
                        {isSaving ? '저장 중...' : '이 제품으로 기록하기'}
                      </Text>
                    </TouchableOpacity>

                    {/* 다른 후보가 있으면 보여주기 */}
                    {candidates.length > 1 && (
                      <View style={styles.candidatesBox}>
                        <Text style={styles.candidatesTitle}>
                          혹시 다른 제품? ({candidates.length - 1}개)
                        </Text>
                        {candidates.slice(1, 5).map((c) => (
                          <TouchableOpacity
                            key={c.id}
                            style={styles.candidateRow}
                            onPress={() => {
                              setMatchedCatalog(c);
                              setCandidates([]);
                            }}
                          >
                            <Text style={styles.candidateName}>{c.name}</Text>
                            <Text style={styles.candidateMeta}>
                              {CATEGORY_LABELS[c.category]}
                              {c.volume_ml ? ` · ${c.volume_ml}ml` : ''}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* 매칭이 틀렸을 때 */}
                    {extracted && (
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleCreateAndLog}
                        disabled={isSaving}
                      >
                        <Text style={styles.secondaryButtonText}>
                          아니에요, 새 제품으로 등록
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : extracted ? (
                  <>
                    {/* 새로운 술 — AI 분석 결과 */}
                    {extracted.name ? (
                      <>
                        <View style={styles.confidenceBadge}>
                          <Text
                            style={[
                              styles.confidenceText,
                              extracted.confidence === 'high' && {
                                color: colors.primary,
                              },
                              extracted.confidence === 'low' && {
                                color: '#E0A800',
                              },
                            ]}
                          >
                            {extracted.confidence === 'high'
                              ? '✓ 높은 신뢰도'
                              : extracted.confidence === 'medium'
                                ? '△ 중간 신뢰도'
                                : '⚠ 낮은 신뢰도'}
                          </Text>
                        </View>

                        <Text style={styles.resultName}>{extracted.name}</Text>
                        {extracted.brand && (
                          <Text style={styles.resultBrand}>{extracted.brand}</Text>
                        )}

                        <View style={styles.resultMetaRow}>
                          {extracted.category && (
                            <View style={styles.metaPill}>
                              <Text style={styles.metaPillText}>
                                {CATEGORY_LABELS[extracted.category]}
                              </Text>
                            </View>
                          )}
                          {extracted.abv != null && (
                            <View style={styles.metaPill}>
                              <Text style={styles.metaPillText}>
                                {extracted.abv}%
                              </Text>
                            </View>
                          )}
                          {extracted.volume_ml != null && (
                            <View style={styles.metaPill}>
                              <Text style={styles.metaPillText}>
                                {extracted.volume_ml}ml
                              </Text>
                            </View>
                          )}
                          {extracted.origin && (
                            <View style={styles.metaPill}>
                              <Text style={styles.metaPillText}>
                                {extracted.origin}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.newDrinkNotice}>
                          <Text style={styles.newDrinkNoticeText}>
                            DB에 없는 새로운 술이에요. 등록하면 다음부터 바로 매칭돼요!
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.primaryButton}
                          onPress={handleCreateAndLog}
                          disabled={isSaving}
                        >
                          <Text style={styles.primaryButtonText}>
                            {isSaving ? '저장 중...' : '새 제품으로 등록하고 기록'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.secondaryButton}
                          onPress={() =>
                            navigation.navigate('Tabs', {
                              screen: '기록추가',
                              params: { prefillFromAI: extracted },
                            })
                          }
                          disabled={isSaving}
                        >
                          <Text style={styles.secondaryButtonText}>
                            직접 입력 화면에서 확인/수정
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <Text style={styles.emptyIcon}>🤔</Text>
                        <Text style={styles.emptyText}>
                          라벨을 인식하지 못했어요
                        </Text>
                        <Text style={styles.emptySubtext}>
                          더 밝은 곳에서 라벨 전체가 보이게 찍어주세요
                        </Text>
                      </>
                    )}
                  </>
                ) : null}
              </View>
            )}

            <TouchableOpacity style={styles.retakeButton} onPress={resetAll}>
              <Text style={styles.retakeText}>다른 사진으로 다시</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
  backButton: {
    fontSize: fontSize.md,
    color: colors.primary,
    marginBottom: spacing.md,
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

  // ── 선택 카드 ──
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  actionIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  actionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tipBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  tipTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // ── 결과 ──
  previewImage: {
    width: '100%',
    height: 380,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  analyzingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  analyzingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  // 스캔 모드 배지
  scanModeBadge: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  scanModeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  confidenceBadge: {
    marginBottom: spacing.sm,
  },
  confidenceText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  resultName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  resultBrand: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  resultMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  metaPill: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  metaPillText: {
    fontSize: fontSize.xs,
    color: colors.textPrimary,
  },
  matchedBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  matchedLabel: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },

  // 후보 목록
  candidatesBox: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  candidatesTitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  candidateRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  candidateName: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  candidateMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // 새 술 안내
  newDrinkNotice: {
    backgroundColor: '#FFF8E1',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  newDrinkNoticeText: {
    fontSize: fontSize.sm,
    color: '#F57F17',
    fontWeight: '500',
  },

  // 버튼
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  retakeButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  retakeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  emptyIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
