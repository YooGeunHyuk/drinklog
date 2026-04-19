import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import { colors, fontSize } from '../constants/theme';

import HomeScreen from '../screens/HomeScreen';
import StatsScreen from '../screens/StatsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CatalogScreen from '../screens/CatalogScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  홈: '🏠',
  통계: '📊',
  기록목록: '📋',
  카탈로그: '🗃️',
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
        tabBarLabel: ({ focused }) => (
          <Text
            style={[
              styles.tabLabel,
              { color: focused ? colors.primary : colors.textTertiary },
            ]}
          >
            {route.name === '기록목록' ? '기록' : route.name}
          </Text>
        ),
        tabBarStyle: styles.tabBar,
      })}
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
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 0.5,
    height: 85,
    paddingTop: 8,
    paddingBottom: 28,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
