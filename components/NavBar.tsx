import React from 'react';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RoutePath = '/' | '/tasks' | '/character' | '/add-task';

const normalize = (p: string) => p.replace(/\/+$/, '') || '/';
const isActive = (pathname: string, route: RoutePath) => {
  const a = normalize(pathname || '/');
  const b = normalize(route);
  if (b === '/') return a === '/';
  return a === b || a.startsWith(b + '/');
};

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const homeActive = isActive(pathname, '/');
  const tasksActive = isActive(pathname, '/tasks');
  const characterActive = isActive(pathname, '/character');

  return (
    <Wrap style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
      <NavButton onPress={() => router.replace('/tasks')} activeOpacity={0.7}>
        <IconWrapper active={tasksActive}>
          <Ionicons
            name={tasksActive ? 'checkmark-done' : 'checkmark-done-outline'}
            size={22}
            color={tasksActive ? '#15478a' : '#fff'}
          />
        </IconWrapper>
        <ButtonLabel active={tasksActive}>Zadania</ButtonLabel>
      </NavButton>

      <NavButton onPress={() => router.replace('/')} activeOpacity={0.7}>
        <IconWrapper active={homeActive}>
          <Ionicons
            name={homeActive ? 'home' : 'home-outline'}
            size={24}
            color={homeActive ? '#15478a' : '#fff'}
          />
        </IconWrapper>
        <ButtonLabel active={homeActive}>Home</ButtonLabel>
      </NavButton>

      <NavButton onPress={() => router.replace('/character')} activeOpacity={0.7}>
        <IconWrapper active={characterActive}>
          <Ionicons
            name={characterActive ? 'person' : 'person-outline'}
            size={22}
            color={characterActive ? '#15478a' : '#fff'}
          />
        </IconWrapper>
        <ButtonLabel active={characterActive}>Postać</ButtonLabel>
      </NavButton>
    </Wrap>
  );
}

// style
const Wrap = styled.View`
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  background-color: #15478a;
  border-radius: 20px;
  padding: 8px 16px;
  shadow-color: #000;
  shadow-opacity: 0.25;
  shadow-radius: 16px;
  elevation: 12;
`;

const NavButton = styled.TouchableOpacity`
  align-items: center;
  gap: 4px;
`;

const IconWrapper = styled.View<{ active: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${({ active }) => (active ? '#e8f4fd' : ' #15478a')};
  align-items: center;
  justify-content: center;
`;

const ButtonLabel = styled.Text<{ active: boolean }>`
  font-size: 11px;
  font-weight: ${({ active }) => (active ? '700' : '500')};
  color: ${({ active }) => (active ? '#fff' : '#a0c8e8')};
`;
