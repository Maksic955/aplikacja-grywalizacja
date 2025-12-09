// app/_layout.tsx
import { useEffect, useState } from 'react';
import { Dimensions, Text } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { Stack, useRouter, usePathname, SplashScreen } from 'expo-router';
import styled from 'styled-components/native';
import { useFonts, Nunito_400Regular, Nunito_700Bold } from '@expo-google-fonts/nunito';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import TopBar from '@/components/TopBar';
import SideMenu from '@/components/SideMenu';
import NavBar from '@/components/NavBar';
import EntryPage from './entry-page';

type RoutePath = '/' | '/tasks' | '/add-task' | '/character' | '/login' | '/register';

const APP_BG = '#F5F5DC';
const SIDE_WIDTH = Math.min(320, Dimensions.get('window').width * 0.8);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LayoutWithAuth />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function LayoutWithAuth() {
  const currentRoute = usePathname();
  const { user, initializing } = useAuth();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_700Bold,
  });

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      (Text as any).defaultProps = {
        ...(Text as any).defaultProps,
        style: {
          ...(Text as any).defaultProps?.style,
          fontFamily: 'Nunito_400Regular',
        },
      };
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const [menuVisible, setMenuVisible] = useState(false);

  const translateX = useSharedValue(-SIDE_WIDTH);
  const startX = useSharedValue(-SIDE_WIDTH);

  const openMenu = () => {
    setMenuVisible(true);
    translateX.value = withTiming(0, { duration: 220 });
  };

  const closeMenu = () => {
    translateX.value = withTiming(-SIDE_WIDTH, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(setMenuVisible)(false);
      }
    });
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onBegin((event) => {
      if (!menuVisible && event.x > 25) {
        startX.value = -SIDE_WIDTH;
        return;
      }
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const next = startX.value + event.translationX;
      const clamped = Math.max(-SIDE_WIDTH, Math.min(0, next));
      translateX.value = withSpring(clamped, {
        damping: 20,
        stiffness: 300,
        mass: 0.1,
      });

      if (clamped > -SIDE_WIDTH + 5) {
        runOnJS(setMenuVisible)(true);
      }
    })
    .onEnd(() => {
      const shouldOpen = translateX.value > -SIDE_WIDTH / 2;
      translateX.value = withSpring(shouldOpen ? 0 : -SIDE_WIDTH, {
        damping: 20,
        stiffness: 300,
        mass: 0.1,
      });

      runOnJS(setMenuVisible)(shouldOpen);
    });

  if (!fontsLoaded) {
    return null;
  }

  const handleSelect = (route: RoutePath) => {
    closeMenu();
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
    <GestureDetector gesture={panGesture}>
      <Screen>
        <TopBar
          onMenuPress={openMenu}
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
              animation: 'fade_from_bottom',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="tasks" />
            <Stack.Screen name="add-task" />
            <Stack.Screen name="character" />
          </Stack>
        </Content>

        <SideMenu
          visible={menuVisible}
          onClose={closeMenu}
          items={[
            { label: 'Home', route: '/' },
            { label: 'Zadania', route: '/tasks' },
            { label: 'Postać', route: '/character' },
          ]}
          onSelect={handleSelect}
          width={SIDE_WIDTH}
          translateX={translateX}
        />

        <NavBar />
      </Screen>
    </GestureDetector>
  );
}

const Screen = styled.SafeAreaView`
  flex: 1;
  padding-bottom: 12px;
  background-color: ${APP_BG};
`;

const Content = styled.View`
  flex: 1;
  margin-top: 8px;
`;
