// app/_layout.tsx

import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useFonts, Nunito_400Regular, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Stack, useRouter, usePathname, SplashScreen } from 'expo-router';
import styled from 'styled-components/native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import TopBar from '@/components/TopBar';
import SideMenu from '@/components/SideMenu';
import NavBar from '@/components/NavBar';
import EntryPage from './entry-page';

type RoutePath = '/' | '/tasks' | '/add-task' | '/character' | '/login' | '/register';

const APP_BG = '#F5F5DC';

export default function RootLayout() {
  return (
    <AuthProvider>
      <LayoutWithAuth />
    </AuthProvider>
  );
}

function LayoutWithAuth() {
  const currentRoute = usePathname();
  const { user, initializing } = useAuth();
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_700Bold,
  })

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      (Text as any).defaultProps = {
      ...(Text as any).defaultProps,
      style: {
      fontFamily: 'Nunito',
    }
  }
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const [menuVisible, setMenuVisible] = useState(false);

  if (!fontsLoaded) {
    return null;
  }

  const handleSelect = (route: RoutePath) => {
    setMenuVisible(false);
    router.push(route as any);
  };

  const isAuthPage = currentRoute === '/login' || currentRoute === '/register';

  if (!user && !initializing && !isAuthPage) {
    return (
        <EntryPage
          onLogin={() => router.push('/login')}
          onRegister={() => router.push('/register')}
        />
    );
  }

  return (
    <Screen>
      <TopBar
        onMenuPress={() => setMenuVisible(true)}
        avatarUri=""
        currentXP={0}
        maxXP={0}
        currentHP={0}
        maxHP={0}
      />

      <Content>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: APP_BG },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="tasks" />
          <Stack.Screen name="add-task" />
        </Stack>
      </Content>

      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        items={[
          { label: 'Home', route: '/' },
          { label: 'Zadania', route: '/tasks' },
          { label: 'Postać', route: '/character' },
        ]}
        onSelect={handleSelect}
      />
      <NavBar />
    </Screen>
  );
}

const Screen = styled.SafeAreaView`
  flex: 1;
  font-family: 'Nunito_400Regular';
  padding-bottom: 12px;
  background-color: ${APP_BG};
`;

const Content = styled.View`
  flex: 1;
  margin-top: 8px;
`;