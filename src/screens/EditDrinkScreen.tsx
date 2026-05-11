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
import { colors, spacing, fontSize, borderRadius, iconSize } from '../constants/theme';
import { supabase } from '../lib/supabase';
import {
  DrinkLog,
  CATEGORY_LABELS,
  DrinkMood,
  MOOD_LABELS,
  MOOD_ICONS,
} from '../types';
import { uploadDrinkPhoto, uploadDrinkPhotos, deleteDrinkPhoto } from '../lib/storage';
import { getDrinkLogPhotos, buildDrinkLogPhotoFields } from '../lib/photos';
import { WEATHER_ICONS, WEATHER_LABELS, WeatherCode } from '../lib/weather';
import { listMyFriends, FriendRow } from '../lib/friends';
import { getCompanionsForLog, setCompanionsForLog } from '../lib/companions';
import Icon from '../components/Icon';
import EmptyState from '../components/EmptyState';

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
  // 사진 — 여러 장 지원
  // existingPhotos: DB에 이미 저장된 URL 목록
  // newPhotos: 새로 추가한 로컬 사진 (업로드 대기)
  // removedExistingUrls: 제거된 기존 사진 URL (저장 시 storage 정리)
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<{ uri: string; base64: string; key: string }[]>([]);
  const [removedExistingUrls, setRemovedExistingUrls] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // 친구 태깅 (회식 모드 v2)
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [taggedFriendIds, setTaggedFriendIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadLog();
    loadFriendsAndTags();
  }, [logId]);

  const loadFriendsAndTags = async () => {
    try {
      const [friendList, tagged] = await Promise.all([
        listMyFriends(),
        getCompanionsForLog(logId),
      ]);
      // 친구 관계 accepted만 노출
      setFriends(friendList.filter((f) => f.status === 'accepted'));
      setTaggedFriendIds(new Set(tagged.map((t) => t.user_id)));
    } catch {
      // 친구 시스템 사용 안 해도 화면은 동작해야 함 — 조용히 실패
    }
  };

  const toggleFriendTag = (userId: string) => {
    setTaggedFriendIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

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
      // 사진 — photo_urls(배열) 우선, 없으면 photo_url(legacy) fallback
      setExistingPhotos(getDrinkLogPhotos(l));
      setNewPhotos([]);
      setRemovedExistingUrls([]);

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
    // YYYY-MM-DD HH:MM → ISO. 한 자리 월·일·시·분도 허용 (예: 2026-4-5, 9:5).
    const dateMatch = dateStr.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    const timeMatch = timeStr.trim().match(/^(\d{1,2}):(\d{1,2})$/);
    if (!dateMatch || !timeMatch) return null;
    const [, y, mo, da] = dateMatch;
    const [, h, mi] = timeMatch;
    const month = parseInt(mo, 10);
    const day = parseInt(da, 10);
    const hour = parseInt(h, 10);
    const minute = parseInt(mi, 10);
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    if (hour < 0 || hour > 23) return null;
    if (minute < 0 || minute > 59) return null;
    const d = new Date(parseInt(y, 10), month - 1, day, hour, minute);
    if (isNaN(d.getTime())) return null;
    // 윤년 등으로 Date가 자동 wrap한 경우 차단 (예: 2/30 → 3/2)
    if (
      d.getFullYear() !== parseInt(y, 10) ||
      d.getMonth() !== month - 1 ||
      d.getDate() !== day
    ) {
      return null;
    }
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

      // 사진 처리 — 새 사진들 업로드 + 제거된 기존 사진 storage 정리
      let finalUrls: string[] = [...existingPhotos];
      if (newPhotos.length > 0) {
        setIsUploadingPhoto(true);
        try {
          const uploaded = await uploadDrinkPhotos(
            newPhotos.map((p) => ({ localUri: p.uri, base64: p.base64 })),
          );
          finalUrls = [...finalUrls, ...uploaded];
        } catch (upErr: any) {
          Alert.alert('사진 업로드 실패', '일부 사진은 저장되지 않을 수 있어요.');
        } finally {
          setIsUploadingPhoto(false);
        }
      }
      // 제거된 기존 사진은 storage에서도 삭제 (best-effort)
      for (const url of removedExistingUrls) {
        await deleteDrinkPhoto(url).catch(() => {});
      }

      // photo_url(legacy) + photo_urls(현행) 동시 업데이트로 backward compat 유지
      const photoFields = buildDrinkLogPhotoFields(finalUrls);

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
          ...photoFields,
        })
        .eq('id', logId);

      if (error) throw error;

      // 친구 태깅 동기화 (실패해도 본 저장은 성공으로 처리)
      try {
        await setCompanionsForLog(logId, Array.from(taggedFriendIds));
      } catch {
        // 본인 기록이 아닌 경우 등 정책상 실패 가능 — 사용자에게는 조용히
      }

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
              allowsMultipleSelection: true,
              selectionLimit: 0, // 0 = 무제한
              orderedSelection: true,
            });

      if (result.canceled) return;
      const assets = result.assets ?? [];
      const additions = assets
        .filter((a) => a.uri && a.base64)
        .map((a) => ({
          uri: a.uri!,
          base64: a.base64!,
          key: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        }));
      if (additions.length === 0) return;
      setNewPhotos((prev) => [...prev, ...additions]);
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

  const removeExistingPhoto = (url: string) => {
    setExistingPhotos((prev) => prev.filter((u) => u !== url));
    setRemovedExistingUrls((prev) => [...prev, url]);
  };
  const removeNewPhoto = (key: string) => {
    setNewPhotos((prev) => prev.filter((p) => p.key !== key));
  };

  // 사진 표시용 통합 리스트
  const photoList: { uri: string; kind: 'existing' | 'new'; ref: string }[] = [
    ...existingPhotos.map((url) => ({ uri: url, kind: 'existing' as const, ref: url })),
    ...newPhotos.map((p) => ({ uri: p.uri, kind: 'new' as const, ref: p.key })),
  ];

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
        <EmptyState
          title="기록을 찾을 수 없어요"
          subtitle="이미 삭제됐거나 접근 권한이 없는 기록일 수 있어요."
          actions={[
            {
              label: '뒤로 가기',
              onPress: () => navigation.goBack(),
              variant: 'secondary',
            },
          ]}
          variant="plain"
        />
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
          <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
            <Icon name="ChevronLeft" size={iconSize.sm} color={colors.primary} />
            <Text style={styles.backButton}>뒤로</Text>
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

          {/* 친구 태깅 (회식 모드 v2) */}
          {friends.length > 0 && (
            <>
              <Text style={styles.label}>
                함께한 친구 {taggedFriendIds.size > 0 ? `(${taggedFriendIds.size})` : ''}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.friendChipRow}
              >
                {friends.map((f) => {
                  const selected = taggedFriendIds.has(f.other.id);
                  return (
                    <TouchableOpacity
                      key={f.other.id}
                      style={[styles.friendChip, selected && styles.friendChipSelected]}
                      onPress={() => toggleFriendTag(f.other.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.friendChipText,
                          selected && styles.friendChipTextSelected,
                        ]}
                      >
                        {selected ? '✓ ' : ''}
                        {f.other.nickname ?? '익명'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* 같이 마신 사람 (친구 아닌 동행자 free-text) */}
          <Text style={styles.label}>
            {friends.length > 0 ? '그 외 동행자 (선택)' : '같이 마신 사람'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="지민, 준호"
            placeholderTextColor={colors.textTertiary}
            value={companions}
            onChangeText={setCompanions}
          />

          {/* 사진 — 여러 장 */}
          <Text style={styles.label}>사진 {photoList.length > 0 ? `(${photoList.length})` : ''}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoStrip}
          >
            {photoList.map((p) => (
              <View key={p.ref} style={styles.photoThumbBox}>
                <Image source={{ uri: p.uri }} style={styles.photoThumb} />
                <TouchableOpacity
                  style={styles.photoThumbRemove}
                  onPress={() =>
                    p.kind === 'existing'
                      ? removeExistingPhoto(p.ref)
                      : removeNewPhoto(p.ref)
                  }
                  hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                >
                  <Icon name="X" size={iconSize.xs} color={colors.textInverse} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.photoAddTile}
              onPress={presentPhotoPicker}
              activeOpacity={0.7}
            >
              <Icon name="Plus" size={iconSize.md} color={colors.textSecondary} />
              <Text style={styles.photoAddTileText}>추가</Text>
            </TouchableOpacity>
          </ScrollView>

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
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    // 헤더 영역 → 폼 본문 — md
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    // 정보 카드 → 폼 — md
    marginBottom: spacing.md,
  },
  infoCategory: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  infoName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
    fontSize: iconSize.xl,
  },
  weatherLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  weatherSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
    // 폼 끝 → 저장 버튼 (강조 위해 lg, xl은 과함)
    marginTop: spacing.lg,
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
    fontSize: iconSize.xs,
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
  // 사진 — 다중 첨부 (가로 스크롤 갤러리)
  photoStrip: {
    gap: spacing.sm,
    paddingVertical: 4,
  },
  photoThumbBox: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    overflow: 'visible',
    position: 'relative',
  },
  photoThumb: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
  },
  photoThumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.tone.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  photoAddTile: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddTileText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  // 친구 태깅 칩 (회식 모드 v2)
  friendChipRow: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  friendChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  friendChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  friendChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  friendChipTextSelected: {
    color: colors.textInverse,
    fontWeight: '700',
  },
});
