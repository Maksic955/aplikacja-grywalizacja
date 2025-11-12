import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Animated, Dimensions, Pressable, StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import MenuFooter, { LogoutBtn } from './MenuFooter';

type RoutePath = '/' | '/tasks' | '/add-task' | '/character' | '/login' | '/register';
export type MenuItem = { label: string; route: RoutePath };

interface Props {
  visible: boolean;
  onClose: () => void;
  items: MenuItem[];
  onSelect: (route: RoutePath) => void;
  width?: number;
}

const RAW_WIDTH = Math.min(320, Dimensions.get('window').width * 0.8);

type ActiveProp = { $active?: boolean };

const normalize = (p: string) => p.replace(/\/+$/, '') || '/';
const isActiveRoute = (pathname: string, route: RoutePath) => {
  const a = normalize(pathname || '/');
  const b = normalize(route);
  if (b === '/') return a === '/';
  return a === b || a.startsWith(b + '/');
}

export default function SideMenu({
  visible,
  onClose,
  items,
  onSelect,
  width = RAW_WIDTH,
}: Props) {
  const pathname = usePathname();
  const translateX = useRef(new Animated.Value(-width)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const { user, logout } = useAuth();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -width, duration: 200, useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, translateX, backdrop, width]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFillObject, { zIndex: 1000 }]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: backdrop.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)'],
            }),
          }}
        />
      </Pressable>

      <AnimatedContainer
        style={{
          width,
          transform: [{ translateX }],
        }}
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
        { user ? (
          <LogoutBtn onLogout={() => {
            logout();
            onClose();
          }} />
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

// Style
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

const OutlineBtn = styled.TouchableOpacity<{ $danger?: boolean }>`
  flex: 1;
  padding-vertical: 12px;
  border-radius: 16px;
  background-color: #fff;
  border-width: 3px;
  border-color: #d9534f;
  
  shadow-color: #000;
  shadow-opacity: 0.2;
  shadow-radius: 0px;
  elevation: 0;
`;