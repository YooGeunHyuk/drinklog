// 달성 축하 모달.
//
// 레벨업 / 마일스톤 통과 / 업적 해금 같은 "자랑할 순간"에 풀스크린으로 띄움.
// "자랑하기" 버튼을 누르면 시스템 공유 시트로 텍스트 메시지 전달.
//
// 시각적으로 화려해 보이도록 큰 emoji + 그라데이션 + 메인 컬러 강조.
// 후속 단계에서 confetti·haptic·픽셀 일러 추가 가능.

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import {
  buildLevelUpBrag,
  buildMilestoneBrag,
  buildAchievementBrag,
  shareBrag,
} from '../lib/share';

export type CelebrationKind = 'levelup' | 'milestone' | 'achievement';

export interface CelebrationPayload {
  kind: CelebrationKind;
  /** 큰 이모지 (예: 🌱 🍶 🏆) */
  emoji: string;
  /** 제목 (예: "Lv 12 첫 병의 추억") */
  title: string;
  /** 부제 / 설명 한 줄 */
  subtitle?: string;
  /** 레벨 번호 — levelup 전용 */
  level?: number;
  /** 마일스톤 라벨 (예: "63빌딩 1/3") — milestone 전용 */
  milestoneLabel?: string;
  /** 닉네임 — 공유 텍스트용 */
  nickname?: string;
}

interface Props {
  visible: boolean;
  payload: CelebrationPayload | null;
  onClose: () => void;
}

const KIND_BADGE: Record<CelebrationKind, string> = {
  levelup: '레벨 업',
  milestone: '마일스톤 돌파',
  achievement: '업적 해금',
};

export default function CelebrationModal({ visible, payload, onClose }: Props) {
  if (!payload) return null;

  const handleShare = () => {
    let message: string;
    if (payload.kind === 'levelup' && payload.level) {
      message = buildLevelUpBrag({
        level: payload.level,
        title: payload.title,
        emoji: payload.emoji,
        nickname: payload.nickname,
      });
    } else if (payload.kind === 'milestone' && payload.milestoneLabel) {
      message = buildMilestoneBrag({
        emoji: payload.emoji,
        label: payload.milestoneLabel,
        msg: payload.subtitle ?? payload.title,
        nickname: payload.nickname,
      });
    } else {
      message = buildAchievementBrag({
        emoji: payload.emoji,
        title: payload.title,
        desc: payload.subtitle ?? '',
        nickname: payload.nickname,
      });
    }
    shareBrag(message, payload.title).catch(() => {
      // 공유 실패는 조용히 무시 (시스템 시트 취소 등)
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={[colors.primary, colors.surface]}
            style={styles.cardGradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          >
            <SafeAreaView style={styles.cardInner}>
              <View style={styles.kindBadge}>
                <Text style={styles.kindBadgeText}>{KIND_BADGE[payload.kind]}</Text>
              </View>

              <Text style={styles.emoji}>{payload.emoji}</Text>

              <Text style={styles.title} numberOfLines={3}>
                {payload.title}
              </Text>

              {payload.subtitle ? (
                <Text style={styles.subtitle}>{payload.subtitle}</Text>
              ) : null}

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={handleShare}
                  style={styles.shareCta}
                  activeOpacity={0.85}
                >
                  <Text style={styles.shareCtaText}>친구에게 자랑하기</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.closeCta}>
                  <Text style={styles.closeCtaText}>닫기</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  cardGradient: {
    paddingHorizontal: spacing.xl,
  },
  cardInner: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  kindBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  kindBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textInverse,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emoji: {
    fontSize: 96,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textInverse,
    opacity: 0.85,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: fontSize.md * 1.5,
  },
  actions: {
    width: '100%',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  shareCta: {
    backgroundColor: colors.textInverse,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  shareCtaText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
  closeCta: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  closeCtaText: {
    fontSize: fontSize.sm,
    color: colors.textInverse,
    opacity: 0.85,
  },
});
