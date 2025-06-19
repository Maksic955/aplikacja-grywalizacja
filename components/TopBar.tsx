import React from 'react';
import { GestureResponderEvent } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../components/ProgressBar';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TopBarProps {
  onMenuPress: (event: GestureResponderEvent) => void;
  avatarUri?: string;
  currentXP: number;
  maxXP: number;
  currentHP: number;
  maxHP: number;
}

const Container = styled(SafeAreaView)`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 0px 16px;
  background-color: #2875d4;
  border-radius: 0px 0px 8px 8px;
`;

const LeftSection = styled.View`
  flex-direction: row;
  align-items: center;
`;

const MenuButton = styled.TouchableOpacity`
  padding: 8px; 
`;

const RightSection = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.Image`
  width: 40px;
  height: 40px;
  border-radius: 20px;
`;

const BarsContainer = styled.View`
  flex-direction: column;
  justify-content: center;
  margin-left: 8px;
`;

const ProgressRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-vertical: 2px;
`;

const BarLabel = styled.Text`
  font-size: 12px;
  margin-right: 4px;
  color: #333;
`;

const BarWrapper = styled.View`
  width: 80px;
`;

const TopBar: React.FC<TopBarProps> = ({
  onMenuPress,
  avatarUri,
  currentXP,
  maxXP,
  currentHP,
  maxHP,
}) => (
  <Container>
    <LeftSection>
      <MenuButton onPress={onMenuPress}>
        <Ionicons name="menu" size={34} />
      </MenuButton>
    </LeftSection>

    <RightSection>
      <BarsContainer>
        <ProgressRow>
          <BarLabel>HP</BarLabel>
          <BarWrapper>
            <ProgressBar value={currentHP} maxValue={maxHP} />
          </BarWrapper>
        </ProgressRow>
        <ProgressRow>
          <BarLabel>XP</BarLabel>
          <BarWrapper>
            <ProgressBar value={currentXP} maxValue={maxXP} />
          </BarWrapper>
        </ProgressRow>
      </BarsContainer>
      {avatarUri ? (
        <Avatar source={{ uri: avatarUri }} />
      ) : (
        <Ionicons name="person-circle" size={40} />
      )}
    </RightSection>
  </Container>
);

export default TopBar;
