import { useEffect, useState } from 'react';
import { Dimensions, Pressable, StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/services/firebase';

type RoutePath =
  | '/'
  | '/tasks'
  | '/add-task'
  | '/character'
  | '/login'
  | '/register'
  | '/settings'
  | '/challenges';

export type MenuItem = { label: string; route: RoutePath; icon: string };

interface Props {
  visible: boolean;
  onClose: () => void;
  items: MenuItem[];
  onSelect: (route: RoutePath) => void;
  width?: number;
  translateX: SharedValue<number>;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const MENU_WIDTH = Math.min(320, SCREEN_WIDTH * 0.85);
const SWIPE_THRESHOLD = MENU_WIDTH * 0.3;

const normalize = (p: string) => p.replace(/\/+$/, '') || '/';
const isActiveRoute = (pathname: string, route: RoutePath) => {
  const a = normalize(pathname || '/');
  const b = normalize(route);
  if (b === '/') return a === '/';
  return a === b || a.startsWith(b + '/');
};

export default function SideMenu({ visible, onClose, items, onSelect, translateX }: Props) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [nickname, setNickname] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setNickname(null);
      setAvatarUrl(null);
      return;
    }

    const ref = doc(firestore, 'users', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() || {};
      setNickname(data.nickname ?? null);
      setAvatarUrl(data.avatarUrl ?? null);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (visible) {
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 120,
      });
    } else {
      translateX.value = withTiming(-MENU_WIDTH, {
        duration: 250,
      });
    }
  }, [visible]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = Math.max(-MENU_WIDTH, e.translationX);
      }
    })
    .onEnd((e) => {
      const shouldClose = e.translationX < -SWIPE_THRESHOLD || e.velocityX < -500;

      if (shouldClose) {
        translateX.value = withTiming(-MENU_WIDTH, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 120,
        });
      }
    });

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => {
    const progress = interpolate(translateX.value, [-MENU_WIDTH, 0], [0, 1], Extrapolate.CLAMP);
    return {
      opacity: progress * 0.5,
      pointerEvents: visible ? 'auto' : 'none',
    };
  });

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFillObject, { zIndex: 1000 }]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }, backdropStyle]} />
      </Pressable>

      <GestureDetector gesture={pan}>
        <AnimatedMenuCard style={slideStyle}>
          <CloseButton onPress={onClose}>
            <Ionicons name="close-circle" size={32} color="#2875d4" />
          </CloseButton>

          <MenuItemsContainer>
            {items.map((item) => {
              const active = isActiveRoute(pathname, item.route);
              return (
                <MenuItem
                  key={item.route}
                  active={active}
                  onPress={() => {
                    onSelect(item.route);
                    onClose();
                  }}
                >
                  <MenuIconWrapper active={active}>
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={active ? '#fff' : '#2875d4'}
                    />
                  </MenuIconWrapper>
                  <MenuText active={active}>{item.label}</MenuText>
                </MenuItem>
              );
            })}
          </MenuItemsContainer>

          {user ? (
            <UserSection>
              <UserCard>
                <AvatarWrapper>
                  {avatarUrl ? (
                    <AvatarImage source={{ uri: avatarUrl }} />
                  ) : (
                    <AvatarPlaceholder>
                      <Ionicons name="person" size={32} color="#2875d4" />
                    </AvatarPlaceholder>
                  )}
                </AvatarWrapper>

                <UserInfo>
                  <NicknameText numberOfLines={1}>{nickname || 'Brak nicku'}</NicknameText>
                  <EmailText numberOfLines={1}>{user.email}</EmailText>
                </UserInfo>
              </UserCard>

              <LogoutButton onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#fff" />
                <LogoutText>Wyloguj się</LogoutText>
              </LogoutButton>
            </UserSection>
          ) : (
            <GuestSection>
              <GuestButton
                onPress={() => {
                  onSelect('/login');
                  onClose();
                }}
              >
                <Ionicons name="log-in-outline" size={20} color="#fff" />
                <GuestButtonText>Zaloguj się</GuestButtonText>
              </GuestButton>

              <GuestButton
                secondary
                onPress={() => {
                  onSelect('/register');
                  onClose();
                }}
              >
                <Ionicons name="person-add-outline" size={20} color="#2875d4" />
                <GuestButtonTextSecondary>Zarejestruj się</GuestButtonTextSecondary>
              </GuestButton>
            </GuestSection>
          )}
        </AnimatedMenuCard>
      </GestureDetector>
    </Animated.View>
  );
}

// style
const MenuCard = styled.View`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: ${MENU_WIDTH}px;
  background-color: white;
  padding: 16px;
  padding-top: 60px;
  padding-bottom: 55px;
  shadow-color: #000;
  shadow-opacity: 0.3;
  shadow-radius: 20px;
  elevation: 16;
`;

const AnimatedMenuCard = Animated.createAnimatedComponent(MenuCard);

const CloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
`;

const MenuItemsContainer = styled.View`
  flex: 1;
  gap: 8px;
`;

const MenuItem = styled.TouchableOpacity<{ active?: boolean }>`
  flex-direction: row;
  align-items: center;
  padding: 14px 16px;
  border-radius: 12px;
  background-color: ${({ active }) => (active ? '#e8f4fd' : 'transparent')};
  gap: 16px;
`;

const MenuIconWrapper = styled.View<{ active?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${({ active }) => (active ? '#2875d4' : '#e8f4fd')};
  justify-content: center;
  align-items: center;
`;

const MenuText = styled.Text<{ active?: boolean }>`
  font-size: 18px;
  font-weight: ${({ active }) => (active ? '700' : '500')};
  color: ${({ active }) => (active ? '#2875d4' : '#333')};
`;

const UserSection = styled.View`
  padding-top: 16px;
  border-top-width: 2px;
  border-top-color: #f0f0f0;
  gap: 12px;
`;

const UserCard = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 12px;
  gap: 12px;
`;

const AvatarWrapper = styled.View`
  width: 50px;
  height: 50px;
`;

const AvatarImage = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  border-width: 2px;
  border-color: #2875d4;
`;

const AvatarPlaceholder = styled.View`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background-color: #e8f4fd;
  justify-content: center;
  align-items: center;
`;

const UserInfo = styled.View`
  flex: 1;
`;

const NicknameText = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-bottom: 2px;
`;

const EmailText = styled.Text`
  font-size: 12px;
  color: #666;
`;

const LogoutButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background-color: #e53935;
  border-radius: 12px;
  gap: 8px;
`;

const LogoutText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: white;
`;

const GuestSection = styled.View`
  padding-top: 16px;
  border-top-width: 2px;
  border-top-color: #f0f0f0;
  gap: 12px;
`;

const GuestButton = styled.TouchableOpacity<{ secondary?: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background-color: ${({ secondary }) => (secondary ? 'transparent' : '#2875d4')};
  border-radius: 12px;
  border-width: ${({ secondary }) => (secondary ? '2px' : '0')};
  border-color: ${({ secondary }) => (secondary ? '#2875d4' : 'transparent')};
  gap: 8px;
`;

const GuestButtonText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: white;
`;

const GuestButtonTextSecondary = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #2875d4;
`;
