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
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { supabase } from '../lib/supabase';
import {
  DrinkLog,
  CATEGORY_LABELS,
  DrinkMood,
  MOOD_LABELS,
  MOOD_ICONS,
} from '../types';
import { uploadDrinkPhoto, deleteDrinkPhoto } from '../lib/storage';
import { WEATHER_ICONS, WEATHER_LABELS, WeatherCode } from '../lib/weather';

const MOODS: DrinkMood[] = [
  'alone',
  'casual',
  'party',
  'date',
  'business',
  'celebration',
];

interface Props {
  route: {
    params: {
      logId: string;
    };
  };
  navigation: any;
}

export default function EditDrinkScreen({ route, navigation }: Props) {
  const { logId } = route.params;

  const [log, setLog] = useState<DrinkLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 편집 가능한 필드
  const [bottles, setBottles] = useState('');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [dateStr, setDateStr] = useState(''); // YYYY-MM-DD
  const [timeStr, setTimeStr] = useState(''); // HH:MM
  const [location, setLocation] = useState('');
  const [companions, setCompanions] = useState('');
  const [mood, setMood] = useState<DrinkMood | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [newPhotoLocalUri, setNewPhotoLocalUri] = useState<string | null>(null);
  const [newPhotoBase64, setNewPhotoBase64] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    loadLog();
  }, [logId]);

  const loadLog = async () => {
    try {
      const { data, error } = await supabase
        .from('drink_log')
        .select('*, drink_catalog(*)')
        .eq('id', logId)
        .single();

      if (error) throw error;
      const l = data as DrinkLog;
      setLog(l);
      setBottles(String(l.bottles ?? ''));
      setPrice(l.price_paid ? String(l.price_paid) : '');
      setNote(l.note ?? '');
      setLocation(l.location ?? '');
      setCompanions(l.companions ?? '');
      setMood(l.mood ?? null);
      setExistingPhotoUrl(l.photo_url ?? null);
      setPhotoRemoved(false);
      setNewPhotoLocalUri(null);
      setNewPhotoBase64(null);

      const d = new Date(l.logged_at);
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      setDateStr(`${y}-${mo}-${da}`);
      setTimeStr(`${h}:${mi}`);
    } catch (err: any) {
      Alert.alert('로드 실패', err.message ?? '기록을 불러오지 못했습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseLoggedAt = (): string | null => {
    // YYYY-MM-DD HH:MM → ISO
    const dateMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!dateMatch || !timeMatch) return null;
    const [, y, mo, da] = dateMatch;
    const [, h, mi] = timeMatch;
    const d = new Date(
      parseInt(y, 10),
      parseInt(mo, 10) - 1,
      parseInt(da, 10),
      parseInt(h, 10),
      parseInt(mi, 10),
    );
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const handleSave = async () => {
    const bottleNum = parseFloat(bottles);
    if (isNaN(bottleNum) || bottleNum <= 0) {
      Alert.alert('입력 오류', '병 수는 0보다 큰 숫자여야 합니다.');
      return;
    }

    const loggedAt = parseLoggedAt();
    if (!loggedAt) {
      Alert.alert(
        '입력 오류',
        '날짜는 YYYY-MM-DD, 시간은 HH:MM 형식으로 입력해주세요.',
      );
      return;
    }

    setIsSaving(true);
    try {
      const volumeMl = log?.drink_catalog?.volume_ml;

      // 사진 업로드 (새 사진이 있으면)
      let photoUrlToSet: string | null = existingPhotoUrl;
      if (newPhotoLocalUri && newPhotoBase64) {
        setIsUploadingPhoto(true);
        try {
          const uploaded = await uploadDrinkPhoto(newPhotoLocalUri, newPhotoBase64);
          // 기존 사진 있으면 삭제 (best-effort)
          if (existingPhotoUrl) {
            await deleteDrinkPhoto(existingPhotoUrl).catch(() => {});
          }
          photoUrlToSet = uploaded;
        } catch (upErr: any) {
          Alert.alert('사진 업로드 실패', '사진은 저장되지 않고 나머지만 저장됩니다.');
          photoUrlToSet = existingPhotoUrl;
        } finally {
          setIsUploadingPhoto(false);
        }
      } else if (photoRemoved && existingPhotoUrl) {
        // 사진 제거 요청만 있고 새 업로드 없음
        await deleteDrinkPhoto(existingPhotoUrl).catch(() => {});
        photoUrlToSet = null;
      }

      const { error } = await supabase
        .from('drink_log')
        .update({
          bottles: bottleNum,
          quantity_ml: volumeMl ? Math.round(volumeMl * bottleNum) : null,
          price_paid: price ? parseInt(price, 10) : null,
          note: note.trim() || null,
          logged_at: loggedAt,
          location: location.trim() || null,
          companions: companions.trim() || null,
          mood: mood,
          photo_url: photoUrlToSet,
        })
        .eq('id', logId);

      if (error) throw error;
      Alert.alert('저장 완료', '기록이 수정되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('저장 실패', err.message ?? '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 사진 선택
  const pickPhoto = async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('권한 필요', '카메라 권한을 허용해주세요.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('권한 필요', '사진 접근 권한을 허용해주세요.');
          return;
        }
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.7,
              base64: true,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.7,
              base64: true,
            });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri || !asset.base64) return;

      setNewPhotoLocalUri(asset.uri);
      setNewPhotoBase64(asset.base64);
      setPhotoRemoved(false);
    } catch (err: any) {
      Alert.alert('사진 선택 실패', err.message ?? 'Unknown error');
    }
  };

  const presentPhotoPicker = () => {
    Alert.alert('사진 선택', '어디에서 가져올까요?', [
      { text: '📷 카메라', onPress: () => pickPhoto('camera') },
      { text: '🖼 앨범', onPress: () => pickPhoto('library') },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const removePhoto = () => {
    setNewPhotoLocalUri(null);
    setNewPhotoBase64(null);
    setPhotoRemoved(true);
  };

  // 표시용 현재 사진 URI (preview)
  const displayedPhotoUri =
    newPhotoLocalUri ?? (photoRemoved ? null : existingPhotoUrl);

  const handleDelete = () => {
    Alert.alert(
      '기록 삭제',
      `${log?.drink_catalog?.name ?? '이 기록'}을(를) 정말 삭제할까요?\n삭제된 기록은 복구할 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { error } = await supabase
                .from('drink_log')
                .delete()
                .eq('id', logId);
              if (error) throw error;
              navigation.goBack();
            } catch (err: any) {
              Alert.alert(
                '삭제 실패',
                err.message ?? '삭제 중 오류가 발생했습니다.',
              );
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!log) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>기록을 찾을 수 없어요</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← 뒤로</Text>
          </TouchableOpacity>

          <Text style={styles.title}>기록 디테일</Text>
          <Text style={styles.subtitle}>
            필요한 항목만 채우고 저장하세요. 비워두면 그대로 유지돼요.
          </Text>

          {/* 읽기 전용 정보 */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCategory}>
              {log.drink_catalog
                ? CATEGORY_LABELS[log.drink_catalog.category]
                : '기타'}
            </Text>
            <Text style={styles.infoName}>
              {log.drink_catalog?.name ?? '이름 없음'}
            </Text>
            {log.drink_catalog && (
              <Text style={styles.infoMeta}>
                {log.drink_catalog.abv
                  ? `${log.drink_catalog.abv}% · `
                  : ''}
                {log.drink_catalog.volume_ml
                  ? `${log.drink_catalog.volume_ml}ml`
                  : ''}
              </Text>
            )}
          </View>

          {/* 날짜 & 시간 */}
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>날짜 (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-04-14"
                placeholderTextColor={colors.textTertiary}
                value={dateStr}
                onChangeText={setDateStr}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>시간 (HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="20:30"
                placeholderTextColor={colors.textTertiary}
                value={timeStr}
                onChangeText={setTimeStr}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
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

          {/* 기분/상황 */}
          <Text style={styles.label}>기분 · 상황</Text>
          <View style={styles.moodGrid}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.moodChip, mood === m && styles.moodChipActive]}
                onPress={() => setMood(mood === m ? null : m)}
                activeOpacity={0.7}
              >
                <Text style={styles.moodIcon}>{MOOD_ICONS[m]}</Text>
                <Text
                  style={[styles.moodLabel, mood === m && styles.moodLabelActive]}
                >
                  {MOOD_LABELS[m]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 날씨 (자동 기록) */}
          {log?.weather && (
            <>
              <Text style={styles.label}>그날의 날씨</Text>
              <View style={styles.weatherBox}>
                <Text style={styles.weatherIcon}>
                  {WEATHER_ICONS[log.weather as WeatherCode] ?? '🌡'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.weatherLabel}>
                    {WEATHER_LABELS[log.weather as WeatherCode] ?? log.weather}
                    {log.temperature != null ? `  ·  ${log.temperature.toFixed(1)}°C` : ''}
                  </Text>
                  {log.location_name && (
                    <Text style={styles.weatherSub}>📍 {log.location_name}</Text>
                  )}
                </View>
              </View>
            </>
          )}

          {/* 장소 */}
          <Text style={styles.label}>장소</Text>
          <TextInput
            style={styles.input}
            placeholder="홍대 요고야, 집..."
            placeholderTextColor={colors.textTertiary}
            value={location}
            onChangeText={setLocation}
          />

          {/* 같이 마신 사람 */}
          <Text style={styles.label}>같이 마신 사람</Text>
          <TextInput
            style={styles.input}
            placeholder="지민, 준호"
            placeholderTextColor={colors.textTertiary}
            value={companions}
            onChangeText={setCompanions}
          />

          {/* 사진 */}
          <Text style={styles.label}>사진</Text>
          {displayedPhotoUri ? (
            <View style={styles.photoPreviewBox}>
              <Image source={{ uri: displayedPhotoUri }} style={styles.photoPreview} />
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={styles.photoActionBtn}
                  onPress={presentPhotoPicker}
                >
                  <Text style={styles.photoActionText}>🔄 변경</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoActionBtn, styles.photoRemoveBtn]}
                  onPress={removePhoto}
                >
                  <Text style={[styles.photoActionText, { color: colors.error }]}>
                    🗑 제거
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.photoAddBtn}
              onPress={presentPhotoPicker}
              activeOpacity={0.7}
            >
              <Text style={styles.photoAddIcon}>📷</Text>
              <Text style={styles.photoAddText}>사진 추가</Text>
            </TouchableOpacity>
          )}

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

          {/* 저장 */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (isSaving || isUploadingPhoto) && { opacity: 0.6 },
            ]}
            onPress={handleSave}
            disabled={isSaving || isDeleting || isUploadingPhoto}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {isUploadingPhoto
                ? '사진 업로드 중...'
                : isSaving
                  ? '저장 중...'
                  : '저장'}
            </Text>
          </TouchableOpacity>

          {/* 삭제 */}
          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && { opacity: 0.6 }]}
            onPress={handleDelete}
            disabled={isSaving || isDeleting}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteButtonText}>
              {isDeleting ? '삭제 중...' : '🗑️ 기록 삭제'}
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoCategory: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  // 날씨
  weatherBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  weatherIcon: {
    fontSize: 32,
  },
  weatherLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  weatherSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
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
  deleteButton: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#D32F2F',
  },
  deleteButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#E57373',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  // 기분
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  moodChip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  moodChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },
  moodIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  moodLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  moodLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  // 사진
  photoAddBtn: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  photoAddIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  photoAddText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  photoPreviewBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  photoActions: {
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  photoActionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  photoRemoveBtn: {
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: 'transparent',
  },
  photoActionText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});
