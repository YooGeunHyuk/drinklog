import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import EditDrinkScreen from '../screens/EditDrinkScreen';
import LabelScanScreen from '../screens/LabelScanScreen';
import AdminCSVUploadScreen from '../screens/AdminCSVUploadScreen';
import AdminRequestsScreen from '../screens/AdminRequestsScreen';
import RequestDrinkScreen from '../screens/RequestDrinkScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddDrinkScreen from '../screens/AddDrinkScreen';
import FriendsScreen from '../screens/FriendsScreen';
import FriendRankingScreen from '../screens/FriendRankingScreen';

export type RootStackParamList = {
  Tabs: undefined;
  기록추가: undefined;
  EditDrink: { logId: string };
  LabelScan: undefined;
  AdminCSVUpload: undefined;
  AdminRequests: undefined;
  RequestDrink: { prefillName?: string } | undefined;
  Settings: undefined;
  Friends: undefined;
  FriendRanking: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="기록추가"
        component={AddDrinkScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="EditDrink"
        component={EditDrinkScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="LabelScan"
        component={LabelScanScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="AdminCSVUpload"
        component={AdminCSVUploadScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="AdminRequests"
        component={AdminRequestsScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="RequestDrink"
        component={RequestDrinkScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="FriendRanking"
        component={FriendRankingScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}
