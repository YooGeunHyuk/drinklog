// Admin 전용 — CSV 텍스트를 붙여넣어 drink_catalog 에 일괄 삽입.
// 1~7단계 프리셋 샘플 탑재.
// UNIQUE (name, category, volume_ml) 기반 conflict 는 insert ... on conflict do nothing 로 DB 에서 처리하므로
// 클라이언트는 upsert 말고 그냥 insert (ignoreDuplicates 로).

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system/next';
import { colors, spacing, fontSize, borderRadius, iconSize } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { parseCatalogCsv, type CatalogRow } from '../lib/csvParser';
import { PRESET_CATALOGS, type CatalogPreset } from '../constants/catalogPresets';

const CSV_HEADER = 'name,brand,category,abv,volume_ml,origin,avg_price,tasting_notes,source,verified';

export default function AdminCSVUploadScreen({ navigation }: any) {
  const [csvText, setCsvText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    inserted: number;
    skipped: number;
    failed: number;
    total: number;
  } | null>(null);

  const parsed = useMemo(() => {
    if (!csvText.trim()) return null;
    return parseCatalogCsv(csvText);
  }, [csvText]);

  const loadPreset = (preset: CatalogPreset) => {
    setCsvText(preset.csv);
    setResult(null);
  };

  const clearAll = () => {
    setCsvText('');
    setResult(null);
  };

  const pickCsvFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file?.uri) return;

      const f = new File(file.uri);
      const content = await f.text();
      setCsvText(content);
      setResult(null);
      Alert.alert('파일 로드 완료', `${file.name} (${content.split('\n').length - 1}행)`);
    } catch (err: any) {
      Alert.alert('파일 열기 실패', err.message ?? '파일을 읽지 못했습니다.');
    }
  };

  const upload = async () => {
    if (!parsed || parsed.rows.length === 0) {
      Alert.alert('오류', '업로드할 유효한 행이 없습니다.');
      return;
    }
    if (parsed.errors.length > 0) {
      Alert.alert(
        '경고',
        `파싱 에러 ${parsed.errors.length}건이 있습니다. 에러 행은 제외하고 ${parsed.rows.length}건만 업로드할까요?`,
        [
          { text: '취소', style: 'cancel' },
          { text: '계속', onPress: () => doUpload(parsed.rows) },
        ],
      );
      return;
    }
    Alert.alert(
      '확인',
      `${parsed.rows.length}건을 drink_catalog 에 업로드합니다. 진행할까요?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '업로드', onPress: () => doUpload(parsed.rows) },
      ],
    );
  };

  const doUpload = async (rows: CatalogRow[]) => {
    setUploading(true);
    setResult(null);

    let inserted = 0;
    let failed = 0;
    const CHUNK = 10; // 작은 청크로 응답 멈춤 방지
    const TIMEOUT_MS = 15000;

    const withTimeout = <T,>(p: PromiseLike<T>, ms: number): Promise<T> =>
      Promise.race<T>([
        Promise.resolve(p),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('타임아웃')), ms),
        ),
      ]);

    try {
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        console.log(`[admin upload] chunk ${i / CHUNK + 1}/${Math.ceil(rows.length / CHUNK)} (size=${chunk.length})`);
        try {
          const { data, error } = await withTimeout(
            supabase
              .from('drink_catalog')
              .upsert(chunk as any, {
                onConflict: 'name,category,volume_ml',
                ignoreDuplicates: true,
              })
              .select('id'),
            TIMEOUT_MS,
          ) as { data: { id: any }[] | null; error: any };

          if (error) {
            console.error('[admin upload] chunk error:', error);
            failed += chunk.length;
          } else {
            inserted += data?.length ?? 0;
          }
        } catch (chunkErr: any) {
          console.error('[admin upload] chunk timeout/exception:', chunkErr?.message);
          failed += chunk.length;
        }
      }

      const skipped = rows.length - inserted - failed;
      setResult({ inserted, skipped, failed, total: rows.length });

      Alert.alert(
        '완료',
        `총 ${rows.length}건\n삽입: ${inserted}\n중복 스킵: ${skipped}\n실패: ${failed}${
          failed > 0 ? '\n\n실패 원인 — RLS 권한 또는 네트워크 확인 필요.' : ''
        }`,
      );
    } catch (err: any) {
      Alert.alert('업로드 실패', err?.message ?? 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerBtn}>닫기</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🛠 CSV 업로드 (Admin)</Text>
        <TouchableOpacity onPress={clearAll}>
          <Text style={styles.headerBtn}>초기화</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* 프리셋 템플릿 */}
        <Text style={styles.sectionTitle}>📦 프리셋 불러오기</Text>
        <Text style={styles.sectionDesc}>
          버튼을 누르면 해당 단계 샘플 CSV 가 아래 입력창에 채워집니다.
        </Text>
        <View style={styles.presetGrid}>
          {PRESET_CATALOGS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.presetBtn}
              onPress={() => loadPreset(p)}
              activeOpacity={0.8}
            >
              <Text style={styles.presetTitle}>{p.title}</Text>
              <Text style={styles.presetCount}>{p.count}종</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CSV 파일 선택 */}
        <Text style={styles.sectionTitle}>📂 CSV 파일 불러오기</Text>
        <TouchableOpacity
          style={styles.filePickBtn}
          onPress={pickCsvFile}
          activeOpacity={0.8}
        >
          <Text style={styles.filePickIcon}>📁</Text>
          <Text style={styles.filePickText}>파일에서 CSV 불러오기</Text>
        </TouchableOpacity>

        {/* 스키마 힌트 */}
        <Text style={styles.sectionTitle}>📋 CSV 형식</Text>
        <View style={styles.schemaBox}>
          <Text style={styles.schemaText}>{CSV_HEADER}</Text>
          <Text style={styles.schemaHint}>
            필수: name, category (soju|beer|makgeolli|wine|whiskey|spirits|etc){'\n'}
            선택: brand, abv, volume_ml, origin, avg_price, tasting_notes, source, verified{'\n'}
            # 로 시작하는 행은 주석, null 또는 빈값 = NULL
          </Text>
        </View>

        {/* CSV 입력창 */}
        <Text style={styles.sectionTitle}>📝 CSV 붙여넣기 / 편집</Text>
        <TextInput
          style={styles.csvInput}
          multiline
          value={csvText}
          onChangeText={setCsvText}
          placeholder={`${CSV_HEADER}\n참이슬 후레쉬,하이트진로,soju,16.9,360,한국,2000,,self,true`}
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
          textAlignVertical="top"
        />

        {/* 파싱 결과 미리보기 */}
        {parsed && (
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>
              파싱 결과: {parsed.rows.length}건 유효
              {parsed.errors.length > 0 ? ` · ${parsed.errors.length}건 에러` : ''}
            </Text>
            {parsed.errors.slice(0, 5).map((e, i) => (
              <Text key={i} style={styles.errorLine}>
                ❌ line {e.line}: {e.message}
              </Text>
            ))}
            {parsed.errors.length > 5 && (
              <Text style={styles.errorLine}>… 그리고 {parsed.errors.length - 5}건 더</Text>
            )}
            {parsed.rows.slice(0, 3).map((r, i) => (
              <Text key={i} style={styles.previewLine}>
                ✓ {r.name} · {r.category}
                {r.abv !== null ? ` · ${r.abv}%` : ''}
                {r.volume_ml !== null ? ` · ${r.volume_ml}ml` : ''}
              </Text>
            ))}
            {parsed.rows.length > 3 && (
              <Text style={styles.previewLine}>… 그리고 {parsed.rows.length - 3}건 더</Text>
            )}
          </View>
        )}

        {/* 업로드 결과 */}
        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>✅ 업로드 완료</Text>
            <Text style={styles.resultLine}>총 시도: {result.total}</Text>
            <Text style={styles.resultLine}>신규 삽입: {result.inserted}</Text>
            <Text style={styles.resultLine}>중복 스킵: {result.skipped}</Text>
            {result.failed > 0 && (
              <Text style={[styles.resultLine, { color: colors.error }]}>
                실패: {result.failed}
              </Text>
            )}
          </View>
        )}

        {/* 업로드 버튼 */}
        <TouchableOpacity
          style={[
            styles.uploadBtn,
            (uploading || !parsed || parsed.rows.length === 0) && styles.uploadBtnDisabled,
          ]}
          onPress={upload}
          disabled={uploading || !parsed || parsed.rows.length === 0}
          activeOpacity={0.8}
        >
          {uploading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.uploadBtnText}>
              {parsed && parsed.rows.length > 0
                ? `🚀 ${parsed.rows.length}건 업로드`
                : '업로드할 행 없음'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
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
  scrollContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  presetBtn: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: '47%',
    flexGrow: 1,
  },
  presetTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  presetCount: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  filePickBtn: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginBottom: spacing.md,
  },
  filePickIcon: {
    fontSize: iconSize.md,
    marginRight: spacing.sm,
  },
  filePickText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  schemaBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  schemaText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontFamily: 'Courier',
    marginBottom: spacing.sm,
  },
  schemaHint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  csvInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.xs,
    fontFamily: 'Courier',
    minHeight: 120,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  previewBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  previewTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  previewLine: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  errorLine: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: 2,
  },
  resultBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  resultTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.success,
    marginBottom: spacing.sm,
  },
  resultLine: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  uploadBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  uploadBtnDisabled: {
    opacity: 0.4,
  },
  uploadBtnText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
