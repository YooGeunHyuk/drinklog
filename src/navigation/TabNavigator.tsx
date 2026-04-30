import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, iconSize, spacing } from '../constants/theme';
import Icon, { IconSet } from '../components/Icon';

import HomeScreen from '../screens/HomeScreen';
import StatsScreen from '../screens/StatsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CatalogScreen from '../screens/CatalogScreen';

const Tab = createMaterialTopTabNavigator();

// 라인 톤 통일 — lucide
const TAB_ICONS: Record<string, { set: IconSet; name: string; label: string }> = {
  홈:        { set: 'lucide', name: 'Home',       label: '홈' },
  통계:      { set: 'lucide', name: 'BarChart3',  label: '통계' },
  기록목록:  { set: 'lucide', name: 'ListChecks', label: '기록' },
  카탈로그:  { set: 'lucide', name: 'Library',    label: '카탈로그' },
};

// 하단에 위치하는 커스텀 탭바 (스와이프 + 탭 둘 다 지원)
// 레이아웃: 홈 · 통계 · [+] · 기록 · 카탈로그
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const renderTab = (route: any, index: number) => {
    const def = TAB_ICONS[route.name];
    const focused = state.index === index;
    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };
    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        onPress={onPress}
        style={styles.tabItem}
        activeOpacity={0.7}
      >
        <Icon
          set={def.set}
          name={def.name}
          size={iconSize.md}
          color={focused ? colors.primary : colors.textTertiary}
          strokeWidth={focused ? 2 : 1.75}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: focused ? colors.primary : colors.textTertiary },
          ]}
        >
          {def.label}
        </Text>
      </TouchableOpacity>
    );
  };

  // + 버튼: 부모 스택의 '기록추가' 화면으로 이동
  const onAddPress = () => {
    navigation.getParent()?.navigate('기록추가');
  };

  // 좌측 2탭 / + / 우측 2탭 형태로 구성
  const left = state.routes.slice(0, 2);
  const right = state.routes.slice(2);

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {left.map((r: any, i: number) => renderTab(r, i))}
      <View style={styles.fabSlot}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={onAddPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="기록 추가"
        >
          <Icon name="Plus" size={iconSize.md} color={colors.textInverse} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
      {right.map((r: any, i: number) => renderTab(r, i + 2))}
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        lazy: true,
      }}
    >
      <Tab.Screen name="홈" component={HomeScreen} />
      <Tab.Screen name="통계" component={StatsScreen} />
      <Tab.Screen name="기록목록" component={HistoryScreen} />
      <Tab.Screen name="카탈로그" component={CatalogScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 0.5,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  // ── 중앙 + 버튼 (FAB 형태)
  fabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  fabButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
});
