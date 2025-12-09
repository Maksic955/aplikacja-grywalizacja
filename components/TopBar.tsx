import { useState, useEffect } from 'react';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { GestureResponderEvent, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import ProgressBar from '../components/ProgressBar';
import { useUserProfile } from '@/context/UserContext';
import { useAuth } from '@/context/AuthContext';

interface TopBarProps {
  onMenuPress: (event: GestureResponderEvent) => void;
  currentXP: number;
  maxXP: number;
}

export default function TopBar({ onMenuPress, currentXP, maxXP }: TopBarProps) {
  const { profile } = useUserProfile();
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const avatarUri = profile?.avatarUrl ?? null;
  const nickname = profile?.nickname ?? 'Brak nicku';
  const email = user?.email ?? '';

  const [modalVisible, setModalVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const translateY = useSharedValue(-50);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (modalVisible && !isClosing) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
      opacity.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.ease),
      });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
    }
  }, [modalVisible, isClosing]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const closeModal = () => {
    setIsClosing(true);

    translateY.value = withTiming(-30, {
      duration: 250,
      easing: Easing.in(Easing.ease),
    });
    opacity.value = withTiming(0, {
      duration: 250,
      easing: Easing.in(Easing.ease),
    });
    scale.value = withTiming(0.95, {
      duration: 250,
      easing: Easing.in(Easing.ease),
    });

    setTimeout(() => {
      setModalVisible(false);
      setIsClosing(false);
      translateY.value = -50;
      opacity.value = 0;
      scale.value = 0.9;
    }, 250);
  };

  const handleSettingsPress = () => {
    closeModal();
    setTimeout(() => {
      router.push('/settings');
    }, 250);
  };

  const handleLogout = () => {
    closeModal();
    setTimeout(() => {
      logout();
    }, 250);
  };

  return (
    <>
      <Container style={{ paddingTop: insets.top + 8 }}>
        <LeftSection>
          <MenuButton onPress={onMenuPress}>
            <Ionicons name="menu" size={28} color="#fff" />
          </MenuButton>
        </LeftSection>

        <RightSection>
          <BarsContainer>
            <ProgressRow>
              <BarLabel>XP</BarLabel>
              <BarWrapper>
                <ProgressBar
                  value={currentXP}
                  maxValue={maxXP}
                  height={16}
                  fillColor="#4ade80"
                  backgroundColor="rgba(255,255,255,0.3)"
                  radius={8}
                />
              </BarWrapper>
            </ProgressRow>
          </BarsContainer>

          <AvatarTouchable onPress={() => setModalVisible(true)}>
            {avatarUri ? (
              <Avatar source={{ uri: avatarUri }} />
            ) : (
              <Ionicons name="person-circle" size={36} color="white" />
            )}
          </AvatarTouchable>
        </RightSection>
      </Container>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeModal}
      >
        <ModalOverlay activeOpacity={1} onPress={closeModal}>
          <AnimatedModalBox
            onStartShouldSetResponder={() => true}
            style={[animatedModalStyle, { marginTop: insets.top + 60, marginRight: 16 }]}
          >
            <CloseArea onPress={closeModal}>
              <Ionicons name="close" size={22} color="#333" />
            </CloseArea>

            {avatarUri ? (
              <ModalAvatar source={{ uri: avatarUri }} />
            ) : (
              <Ionicons name="person-circle" size={80} color="#666" />
            )}

            <ModalName>{nickname}</ModalName>
            <ModalEmail>{email}</ModalEmail>

            <ModalButton onPress={handleSettingsPress}>
              <Ionicons name="settings-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <ModalBtnText>Ustawienia</ModalBtnText>
            </ModalButton>

            <ModalButton onPress={handleLogout} logout>
              <Ionicons name="log-out-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <ModalBtnText>Wyloguj</ModalBtnText>
            </ModalButton>
          </AnimatedModalBox>
        </ModalOverlay>
      </Modal>
    </>
  );
}

// style
const Container = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-horizontal: 16px;
  padding-bottom: 8px;
  background-color: #2875d4;
  border-radius: 0px 0px 8px 8px;
`;

const LeftSection = styled.View`
  flex-direction: row;
  align-items: center;
`;

const MenuButton = styled.TouchableOpacity`
  padding: 4px;
`;

const RightSection = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 10px;
`;

const AvatarTouchable = styled.TouchableOpacity`
  z-index: 10;
`;

const Avatar = styled.Image`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  border-width: 2px;
  border-color: #fff;
`;

const BarsContainer = styled.View`
  flex-direction: column;
  justify-content: center;
`;

const ProgressRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const BarLabel = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #fff;
`;

const BarWrapper = styled.View`
  width: 130px;
`;

const ModalOverlay = styled.TouchableOpacity`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.4);
  align-items: flex-end;
`;

const ModalBox = styled.View`
  width: 280px;
  background-color: white;
  border-radius: 16px;
  padding: 24px;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.2;
  shadow-radius: 12px;
  elevation: 8;
`;

const AnimatedModalBox = Animated.createAnimatedComponent(ModalBox);

const CloseArea = styled.TouchableOpacity`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px;
  z-index: 10;
`;

const ModalAvatar = styled.Image`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  margin-bottom: 12px;
  border-width: 3px;
  border-color: #2875d4;
`;

const ModalName = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
`;

const ModalEmail = styled.Text`
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
`;

const ModalButton = styled.TouchableOpacity<{ logout?: boolean }>`
  width: 100%;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 12px;
  background-color: ${({ logout }) => (logout ? '#ef4444' : '#2875d4')};
  border-radius: 10px;
  margin-top: 10px;
`;

const ModalBtnText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: 700;
`;
