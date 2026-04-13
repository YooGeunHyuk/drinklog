import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './src/navigation/TabNavigator';
import LoginScreen from './src/screens/LoginScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';

type AppState = 'login' | 'profile_setup' | 'main';

export default function App() {
  const [appState, setAppState] = useState<AppState>('login');

  return (
    <>
      <StatusBar style="light" />
      {appState === 'login' && (
        <LoginScreen onLogin={() => setAppState('profile_setup')} />
      )}
      {appState === 'profile_setup' && (
        <ProfileSetupScreen onComplete={() => setAppState('main')} />
      )}
      {appState === 'main' && (
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      )}
    </>
  );
}
