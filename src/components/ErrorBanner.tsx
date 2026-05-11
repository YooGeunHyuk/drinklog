// 데이터 로드 실패 등 사용자에게 알려야 할 비치명적 에러를 표시하는 배너.
// 화면 최상단(헤더 아래)에 살짝 들어가는 형태. 닫기 + 재시도 버튼 옵션.
//
// 사용 예:
//   const [err, setErr] = useState<string | null>(null);
//   try { ... } catch (e) { setErr(e.message); }
//   ...
//   <ErrorBanner error={err} onRetry={loadData} onDismiss={() => setErr(null)} />

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';

interface ErrorBannerProps {
  /** 표시할 에러 메시지. null이면 렌더링 안 함. */
  error: string | null;
  /** "다시 시도" 버튼을 누르면 호출. 없으면 버튼 숨김. */
  onRetry?: () => void;
  /** 닫기(X) 버튼을 누르면 호출. 없으면 버튼 숨김. */
  onDismiss?: () => void;
  /** 추가 스타일 (margin 등 컨테이너 위치 조정용). */
  style?: ViewStyle;
  /** 메시지 앞에 붙일 prefix. 기본: "⚠️ 불러오기 실패 — " */
  prefix?: string;
}

export function ErrorBanner({
  error,
  onRetry,
  onDismiss,
  style,
  prefix = '⚠️ 불러오기 실패 — ',
}: ErrorBannerProps) {
  if (!error) return null;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.message} numberOfLines={3}>
        {prefix}
        {error}
      </Text>
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            style={styles.retryButton}
            accessibilityLabel="다시 시도"
          >
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.dismissButton}
            accessibilityLabel="닫기"
            hitSlop={8}
          >
            <Text style={styles.dismissText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.tone.terracotta + '22', // 12% opacity
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
  message: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  retryButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.error,
    borderRadius: 6,
  },
  retryText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    marginLeft: 6,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: colors.textSecondary,
    fontSize: 18,
    lineHeight: 18,
  },
});
