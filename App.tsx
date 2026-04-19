import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import LoginScreen from './src/screens/LoginScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import { supabase } from './src/lib/supabase';
import { colors } from './src/constants/theme';

type AppState = 'loading' | 'login' | 'profile_setup' | 'main';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');

  // 앱 시작 시 세션 확인
  useEffect(() => {
    checkSession();

    // 세션 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          await checkProfile(session.user.id);
        } else {
          setAppState('login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await checkProfile(session.user.id);
    } else {
      setAppState('login');
    }
  };

  const checkProfile = async (userId: string) => {
    // 프로필이 완성되어 있는지 확인 (닉네임이 있으면 완료된 것으로 간주)
    const { data } = await supabase
      .from('users')
      .select('nickname')
      .eq('id', userId)
      .single();
    if (data && data.nickname) {
      setAppState('main');
    } else {
      setAppState('profile_setup');
    }
  };

  if (appState === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
          <RootNavigator />
        </NavigationContainer>
      )}
    </>
  );
}
