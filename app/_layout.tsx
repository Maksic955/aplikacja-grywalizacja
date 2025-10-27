// app/_layout.tsx
import React, { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { StatusBar } from 'react-native';
import { TaskProvider } from '@/context/TaskContext';
import TopBar from '@/components/TopBar';
import SideMenu from '@/components/SideMenu';
import NavBar from '@/components/NavBar';
import { AuthProvider } from '@/context/AuthContext';

type RoutePath = '/' | '/tasks' | '/add-task' | '/character';

const APP_BG = '#2f3a4a'; 

export default function RootLayout() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleSelect = (route: RoutePath) => {
    setMenuVisible(false);
    router.push(route as any);
  };

  return (
    <AuthProvider>
      <TaskProvider>
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
              <Stack.Screen name="character" />
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
      </TaskProvider>
    </AuthProvider>
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