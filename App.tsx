import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import LoginScreen from './src/screens/LoginScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import TermsAgreementScreen from './src/screens/TermsAgreementScreen';
import { supabase } from './src/lib/supabase';
import { colors } from './src/constants/theme';
import { useAppFonts } from './src/theme/fonts';

type AppState =
  | 'loading'
  | 'login'
  | 'terms_agreement'
  | 'profile_setup'
  | 'main';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  // Pretendard 폰트 로드 (파일이 비어 있으면 즉시 true 반환 → 시스템 폰트 폴백)
  const [fontsLoaded] = useAppFonts();

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
    // 진입 게이트:
    //   1. 약관 동의 (terms_agreed_at + privacy_agreed_at) — 법적 필수
    //   2. 프로필 완성 (nickname + birth_year) — 만 19세 검증 위해
    // .maybeSingle() — public.users에 row가 아직 없어도 에러 던지지 않음
    try {
      const { data, error } = await supabase
        .from('users')
        .select('nickname, birth_year, terms_agreed_at, privacy_agreed_at')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!data?.terms_agreed_at || !data?.privacy_agreed_at) {
        setAppState('terms_agreement');
        return;
      }
      if (!data?.nickname || !data?.birth_year) {
        setAppState('profile_setup');
        return;
      }
      setAppState('main');
    } catch (err) {
      // 조회 실패해도 로딩에 갇히지 않도록 약관 단계로 폴백
      console.error('checkProfile error:', err);
      setAppState('terms_agreement');
    }
  };

  if (appState === 'loading' || !fontsLoaded) {
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
        // 로그인 직후엔 loading으로 두고 onAuthStateChange의 checkProfile이
        // 약관/프로필/메인 중 어디로 보낼지 결정. 기존 user의 화면 깜빡임 방지.
        <LoginScreen onLogin={() => setAppState('loading')} />
      )}
      {appState === 'terms_agreement' && (
        <TermsAgreementScreen onComplete={() => setAppState('profile_setup')} />
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
