import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

export default function CatalogScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>주류 카탈로그</Text>
        <Text style={styles.subtitle}>내가 마셔본 술 컬렉션</Text>

        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🗃️</Text>
          <Text style={styles.emptyText}>아직 카탈로그가 비어있어요</Text>
          <Text style={styles.emptySubtext}>
            기록을 추가하면 자동으로 카탈로그가 채워집니다
          </Text>

          <View style={styles.badgePreview}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🏅 1번째 술</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🎯 10번째 술</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>👑 50번째 술</Text>
            </View>
          </View>
        </View>
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
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
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
    marginBottom: spacing.xl,
  },
  badgePreview: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
