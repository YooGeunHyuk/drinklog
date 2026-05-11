import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, spacing, fontSize, borderRadius, iconSize } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { DrinkCatalog, CATEGORY_LABELS } from '../types';
import { fetchFromOpenFoodFacts } from '../lib/openFoodFacts';
import Icon from '../components/Icon';

interface Props {
  navigation: any;
}

export default function ScanDrinkScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [foundItem, setFoundItem] = useState<DrinkCatalog | null>(null);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('조회 중...');
  const [autoAddedBadge, setAutoAddedBadge] = useState(false);
  const handledRef = useRef(false);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (handledRef.current) return;
    handledRef.current = true;
    setScanned(true);
    setIsLoading(true);
    setAutoAddedBadge(false);
    setLoadingMessage('DB 조회 중...');

    try {
      // 1. 로컬 DB 조회
      const { data: catalogs, error } = await supabase
        .from('drink_catalog')
        .select('*')
        .eq('barcode', data)
        .limit(1);

      if (error) throw error;

      if (catalogs && catalogs.length > 0) {
        setFoundItem(catalogs[0] as DrinkCatalog);
        setNotFoundCode(null);
        return;
      }

      // 2. Open Food Facts 에서 조회 (DB에 없을 때)
      setLoadingMessage('전세계 DB 조회 중...');
      const offResult = await fetchFromOpenFoodFacts(data);

      if (offResult) {
        // 3. OFF에서 찾음 → drink_catalog 에 자동 등록
        setLoadingMessage('카탈로그에 추가 중...');
        const { data: inserted, error: insertError } = await supabase
          .from('drink_catalog')
          .insert({
            name: offResult.name,
            brand: offResult.brand,
            category: offResult.category,
            abv: offResult.abv,
            volume_ml: offResult.volume_ml,
            origin: offResult.origin,
            barcode: offResult.barcode,
            image_url: offResult.image_url,
            source: 'api',
            verified: false,
          })
          .select()
          .single();

        if (insertError) {
          // 중복이면 이미 있는 것 다시 조회
          const { data: existing } = await supabase
            .from('drink_catalog')
            .select('*')
            .eq('name', offResult.name)
            .eq('category', offResult.category)
            .eq('volume_ml', offResult.volume_ml)
            .limit(1);
          if (existing && existing.length > 0) {
            setFoundItem(existing[0] as DrinkCatalog);
            setAutoAddedBadge(false);
            return;
          }
          throw insertError;
        }

        setFoundItem(inserted as DrinkCatalog);
        setAutoAddedBadge(true);
        setNotFoundCode(null);
        return;
      }

      // 4. 어디에도 없음 → 직접 입력 유도
      setFoundItem(null);
      setNotFoundCode(data);
    } catch (err: any) {
      Alert.alert('조회 실패', err.message ?? '바코드 조회 중 오류가 발생했습니다.');
      resetScan();
    } finally {
      setIsLoading(false);
    }
  };

  const resetScan = () => {
    handledRef.current = false;
    setScanned(false);
    setFoundItem(null);
    setNotFoundCode(null);
    setIsLoading(false);
    setAutoAddedBadge(false);
    setLoadingMessage('조회 중...');
  };

  const handleQuickLog = async () => {
    if (!foundItem) return;
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인 세션이 없습니다.');

      const { error } = await supabase.from('drink_log').insert({
        user_id: user.id,
        catalog_id: foundItem.id,
        bottles: 1,
        quantity_ml: foundItem.volume_ml,
        price_paid: foundItem.avg_price,
        input_method: 'scan',
      });
      if (error) throw error;

      Alert.alert('저장 완료', `${foundItem.name}이(가) 기록되었습니다.`, [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('저장 실패', err.message ?? '저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 권한 요청
  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Icon name="Camera" size={iconSize.xxl} color={colors.textTertiary} style={styles.permissionIcon} />
        <Text style={styles.permissionTitle}>카메라 권한이 필요해요</Text>
        <Text style={styles.permissionText}>
          바코드를 스캔하려면 카메라 접근 권한이 필요합니다.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={requestPermission}
        >
          <Text style={styles.primaryButtonText}>권한 허용</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>취소</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 바 */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Icon name="ChevronLeft" size={iconSize.sm} color={colors.primary} />
          <Text style={styles.backButton}>닫기</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>바코드 스캔</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 카메라 뷰 */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: [
              'ean13',
              'ean8',
              'upc_a',
              'upc_e',
              'code128',
              'code39',
              'qr',
            ],
          }}
        />

        {/* 스캔 가이드 프레임 */}
        {!scanned && (
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.guideText}>
              바코드를 프레임 안에 맞춰주세요
            </Text>
          </View>
        )}
      </View>

      {/* 하단 결과 패널 */}
      <View style={styles.bottomPanel}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        ) : foundItem ? (
          <>
            <View style={styles.resultHeader}>
              <Text style={styles.successBadge}>
                {autoAddedBadge ? '🌐 새로 등록됨 (Open Food Facts)' : '✓ 등록된 제품'}
              </Text>
            </View>
            <Text style={styles.resultName}>{foundItem.name}</Text>
            <Text style={styles.resultMeta}>
              {CATEGORY_LABELS[foundItem.category]}
              {foundItem.abv ? ` · ${foundItem.abv}%` : ''}
              {foundItem.volume_ml ? ` · ${foundItem.volume_ml}ml` : ''}
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={resetScan}
              >
                <Text style={styles.secondaryButtonText}>다시 스캔</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleQuickLog}
              >
                <Text style={styles.primaryButtonText}>1병 바로 기록</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : notFoundCode ? (
          <>
            <View style={styles.resultHeader}>
              <Text style={styles.warningBadge}>⚠ 등록되지 않은 제품</Text>
            </View>
            <Text style={styles.notFoundText}>
              바코드: {notFoundCode}
            </Text>
            <Text style={styles.notFoundSubtext}>
              아직 DB에 없는 제품이에요. 직접 입력으로 추가해주세요.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={resetScan}
              >
                <Text style={styles.secondaryButtonText}>다시 스캔</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  navigation.navigate('Tabs', {
                    screen: '기록추가',
                    params: { prefillBarcode: notFoundCode },
                  })
                }
              >
                <Text style={styles.primaryButtonText}>직접 입력</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.hintText}>
            바코드를 카메라에 비추면 자동으로 인식됩니다
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    width: 60,
  },
  backButton: {
    fontSize: fontSize.md,
    color: colors.primary,
  },
  topTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 260,
    height: 180,
    borderRadius: borderRadius.md,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: borderRadius.md,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: borderRadius.md,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: borderRadius.md,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: borderRadius.md,
  },
  guideText: {
    color: '#fff',
    fontSize: fontSize.sm,
    marginTop: spacing.lg,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomPanel: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    minHeight: 180,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  resultHeader: {
    marginBottom: spacing.sm,
  },
  successBadge: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  warningBadge: {
    fontSize: fontSize.sm,
    color: '#E0A800',
    fontWeight: '600',
  },
  resultName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  resultMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  notFoundText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  notFoundSubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  hintText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  primaryButton: {
    flex: 1,
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
    flex: 1,
    backgroundColor: colors.surface,
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
  permissionIcon: {
    marginBottom: spacing.lg,
  },
  permissionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  permissionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
