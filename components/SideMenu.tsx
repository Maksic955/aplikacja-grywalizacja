import { useEffect, useRef } from 'react';
import { Dimensions, Pressable, StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import MenuFooter, { LogoutBtn } from './MenuFooter';

import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

type RoutePath = '/' | '/tasks' | '/add-task' | '/character' | '/login' | '/register';
export type MenuItem = { label: string; route: RoutePath };

interface Props {
  visible: boolean;
  onClose: () => void;
  items: MenuItem[];
  onSelect: (route: RoutePath) => void;
  width?: number;
  translateX: SharedValue<number>;
}

const RAW_WIDTH = Math.min(320, Dimensions.get('window').width * 0.8);

type ActiveProp = { $active?: boolean };

const normalize = (p: string) => p.replace(/\/+$/, '') || '/';
const isActiveRoute = (pathname: string, route: RoutePath) => {
  const a = normalize(pathname || '/');
  const b = normalize(route);
  if (b === '/') return a === '/';
  return a === b || a.startsWith(b + '/');
};

export default function SideMenu({
  visible,
  onClose,
  items,
  onSelect,
  width = RAW_WIDTH,
  translateX,
}: Props) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => {
    const progress = interpolate(translateX.value, [-width, 0], [0, 1], Extrapolate.CLAMP);
    return {
      backgroundColor: `rgba(0,0,0,${0.4 * progress})`,
    };
  });

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFillObject, { zIndex: 1000 }]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[{ flex: 1 }, backdropStyle]} />
      </Pressable>

      <AnimatedContainer
        style={[
          {
            width,
          },
          slideStyle,
        ]}
      >
        <CloseButton onPress={onClose}>
          <Ionicons name="close" size={24} color="#333" />
        </CloseButton>

        {items.map((i) => {
          const active = isActiveRoute(pathname, i.route);
          return (
            <MenuItemBtn
              key={i.route}
              $active={active}
              onPress={() => {
                onSelect(i.route);
                onClose();
              }}
            >
              <MenuText $active={active}>{i.label}</MenuText>
            </MenuItemBtn>
          );
        })}

        {user ? (
          <UserSection>
            <EmailWrapper>
              <EmailText>Zalogowano jako:</EmailText>
              <EmailValue>{user.email}</EmailValue>
            </EmailWrapper>

            <LogoutWrapper>
              <LogoutBtn
                onLogout={() => {
                  logout();
                  onClose();
                }}
              />
            </LogoutWrapper>
          </UserSection>
        ) : (
          <MenuFooter
            onLogin={() => {
              onSelect('/login');
              onClose();
            }}
            onRegister={() => {
              onSelect('/register');
              onClose();
            }}
          />
        )}
      </AnimatedContainer>
    </Animated.View>
  );
}

// styles

const Panel = styled.View`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  padding: 24px;
  padding-top: 48px;
  background-color: rgba(255, 255, 255, 0.98);
  border-top-right-radius: 16px;
  border-bottom-right-radius: 16px;
  justify-content: flex-start;
  shadow-color: #000;
  shadow-opacity: 0.2;
  shadow-radius: 12px;
  elevation: 12;
`;

const AnimatedContainer = Animated.createAnimatedComponent(Panel);

const CloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 8px;
`;

const MenuItemBtn = styled.TouchableOpacity<ActiveProp>`
  padding-vertical: 14px;
  border-bottom-width: 3px;
  align-items: flex-start;
`;

const MenuText = styled.Text<ActiveProp>`
  font-size: 22px;
  color: ${({ $active }: ActiveProp) => ($active ? '#2875d4' : '#333')};
  font-weight: ${({ $active }: ActiveProp) => ($active ? '700' : '400')};
`;

const UserSection = styled.View`
  flex: 1;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 28px;
`;

const EmailWrapper = styled.View`
  margin-bottom: 120px;
  padding-horizontal: 4px;
  align-items: center;
`;

const LogoutWrapper = styled.View`
  margin-bottom: 8px;
  width: 100%;
  align-items: center;
`;

const EmailText = styled.Text`
  color: #000;
  font-size: 14px;
`;

const EmailValue = styled.Text`
  color: #000;
  font-size: 16px;
  font-weight: 600;
`;
