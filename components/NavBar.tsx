import React from 'react';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RoutePath = '/' | '/tasks' | '/character' | '/add-task';

const BAR_HEIGHT = 64;

const TABS: { label: string; route: RoutePath; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Home',     route: '/',         icon: 'home' },
  { label: 'Zadania',  route: '/tasks',    icon: 'list' },
  { label: 'Postać',   route: '/character',icon: 'person' },
];

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

  return (
    <Wrap
      style={{
        paddingBottom: insets.bottom,
        height: BAR_HEIGHT + insets.bottom,
      }}
      accessibilityRole="tablist"
    >
      {TABS.map((t) => {
        const active = isActive(pathname, t.route);
        return (
          <TabButton
            key={t.route}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => router.replace(t.route as any)}
          >
            <Ionicons
              name={t.icon}
              size={22}
              color={active ? '#2875d4' : '#c9d3dc'}
            />
            <TabLabel $active={active}>{t.label}</TabLabel>
          </TabButton>
        );
      })}
    </Wrap>
  );
}

// Style

const Wrap = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;

  flex-direction: row;
  align-items: center;
  justify-content: space-around;

  background-color: #223142; /* lekko ciemniej niż tło (#2f3a4a) */
  border-top-width: 1px;
  border-top-color: rgba(255, 255, 255, 0.06);

  shadow-color: #000;
  shadow-opacity: 0.15;
  shadow-radius: 10px;
  elevation: 12;
`;

const TabButton = styled.TouchableOpacity`
  flex: 1;
  height: ${BAR_HEIGHT}px;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

const TabLabel = styled.Text`
  font-size: 11px;
  font-weight: ${({ $active }: { $active?: boolean }) => ($active ? '700' : '500')};
  color: ${({ $active }: { $active?: boolean }) => ($active ? '#2875d4' : '#c9d3dc')};
`;