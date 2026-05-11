// DRINKLOG (주로) — InfoBubble
//
// 뱃지/훈장/업적 아이템을 탭했을 때 탭한 위치 바로 위에 뜨는 말풍선.
// - Modal 기반: 바깥 탭 → 닫힘
// - anchor(탭한 아이템의 화면 좌표)를 받아 그 위에 꼬리를 정확히 맞춤
// - 아이템이 화면 위쪽에 있으면 자동으로 아래로 뒤집어 표시
//
// 사용 예:
//   ref.current?.measureInWindow((x, y, w, h) => {
//     setBubble({ emoji, title, desc, anchor: { x, y, width: w, height: h } });
//   });
//   <InfoBubble data={bubble} onClose={() => setBubble(null)} />
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
  LayoutChangeEvent,
  Dimensions,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius, iconSize } from '../constants/theme';
import Icon from './Icon';

export interface BubbleAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BubbleData {
  emoji: string;
  title: string;
  desc: string;
  meta?: string;
  achieved?: boolean;
  locked?: boolean;
  anchor?: BubbleAnchor;
}

interface Props {
  data: BubbleData | null;
  onClose: () => void;
}

const SCREEN_PAD = 12;
const TAIL = 7;
const GAP = 8; // 말풍선과 아이콘 사이 간격

export function InfoBubble({ data, onClose }: Props) {
  const { width: screenW, height: screenH } = Dimensions.get('window');
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // data가 바뀌면 사이즈 초기화 (재계산 필요)
  React.useEffect(() => {
    setSize(null);
  }, [data?.title, data?.desc]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (!size || Math.abs(size.w - w) > 1 || Math.abs(size.h - h) > 1) {
      setSize({ w, h });
    }
  };

  // 위치 계산
  let left = 0;
  let top = 0;
  let tailPlacement: 'bottom' | 'top' = 'bottom';
  let tailLeft = 0;
  const ready = !!(data?.anchor && size);

  if (data?.anchor && size) {
    const a = data.anchor;
    const anchorCx = a.x + a.width / 2;
    // 좌우 클램프
    left = Math.max(
      SCREEN_PAD,
      Math.min(screenW - size.w - SCREEN_PAD, anchorCx - size.w / 2),
    );
    // 기본은 아이콘 위. 위 공간이 부족하면 아래로.
    const aboveTop = a.y - size.h - GAP;
    if (aboveTop < SCREEN_PAD + 40) {
      // 아래로 뒤집기
      top = a.y + a.height + GAP;
      tailPlacement = 'top';
    } else {
      top = aboveTop;
      tailPlacement = 'bottom';
    }
    // 클램프 (아래로 갈 때 화면 밖 방지)
    top = Math.min(top, screenH - size.h - SCREEN_PAD);
    // 꼬리의 가로 위치 (말풍선 기준)
    tailLeft = Math.max(14, Math.min(size.w - 14 - TAIL * 2, anchorCx - left - TAIL));
  }

  return (
    <Modal
      visible={data !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* 바깥 탭 → 닫기. 배경은 살짝만 어둡게. */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View
            onLayout={onLayout}
            style={[
              styles.bubble,
              {
                position: 'absolute',
                left: ready ? left : -9999,
                top: ready ? top : 0,
                opacity: ready ? 1 : 0,
              },
            ]}
          >
            <View style={styles.titleRow}>
              <Text style={styles.emoji}>{data?.emoji ?? '✨'}</Text>
              <Text style={styles.title} numberOfLines={1}>
                {data?.title ?? ''}
              </Text>
              {data?.achieved && (
                <Icon name="Check" size={iconSize.xs} color={colors.tone.sage} strokeWidth={2.5} />
              )}
              {data?.locked && (
                <Icon name="Lock" size={iconSize.xs} color={colors.textTertiary} strokeWidth={2} />
              )}
            </View>
            <Text style={styles.desc}>{data?.desc ?? ''}</Text>
            {data?.meta && <Text style={styles.meta}>{data.meta}</Text>}

            {/* 꼬리 — anchor가 없으면 안 그림 */}
            {ready && tailPlacement === 'bottom' && (
              <>
                <View
                  style={[
                    styles.tailOuter,
                    { bottom: -TAIL, left: tailLeft },
                    {
                      borderTopColor: colors.border,
                      borderBottomWidth: 0,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.tailInner,
                    { bottom: -(TAIL - 2), left: tailLeft + 1 },
                    {
                      borderTopColor: BUBBLE_BG,
                      borderBottomWidth: 0,
                    },
                  ]}
                />
              </>
            )}
            {ready && tailPlacement === 'top' && (
              <>
                <View
                  style={[
                    styles.tailOuter,
                    { top: -TAIL, left: tailLeft },
                    {
                      borderBottomColor: colors.border,
                      borderTopWidth: 0,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.tailInner,
                    { top: -(TAIL - 2), left: tailLeft + 1 },
                    {
                      borderBottomColor: BUBBLE_BG,
                      borderTopWidth: 0,
                    },
                  ]}
                />
              </>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Pressable>
    </Modal>
  );
}

const BUBBLE_BG = colors.surfaceElevated;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  bubble: {
    maxWidth: 260,
    minWidth: 160,
    backgroundColor: BUBBLE_BG,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emoji: { fontSize: iconSize.xs },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'center',
  },
  desc: {
    marginTop: 4,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    textAlign: 'center',
  },
  meta: {
    marginTop: 4,
    fontSize: 10,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  pillDone: { fontSize: 11, color: colors.tone.sage, fontWeight: '700' },
  pillLocked: { fontSize: 11, color: colors.textTertiary },
  tailOuter: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: TAIL,
    borderRightWidth: TAIL,
    borderTopWidth: TAIL,
    borderBottomWidth: TAIL,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  tailInner: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: TAIL - 1,
    borderRightWidth: TAIL - 1,
    borderTopWidth: TAIL - 1,
    borderBottomWidth: TAIL - 1,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});

export default InfoBubble;
