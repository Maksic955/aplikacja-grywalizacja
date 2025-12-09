import { Image } from 'react-native';
import styled from 'styled-components/native';
import { useEffect, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import ProgressBar from '../components/ProgressBar';
import { useUserProfile } from '@/context/UserContext';
import PageHeader from '@/components/PageHeader';

export default function CharacterScreen() {
  const { profile, loading } = useUserProfile();
  const [characterState, setCharacterState] = useState<'normal' | 'hungry' | 'injured'>('normal');

  const hungerScale = useSharedValue(1);
  const xpScale = useSharedValue(1);
  const healthScale = useSharedValue(1);

  useEffect(() => {
    if (!profile) return;

    const hungerPercentage = (profile.hunger / profile.maxHunger) * 100;
    const healthPercentage = (profile.health / profile.maxHealth) * 100;

    if (healthPercentage < 50) {
      setCharacterState('injured');
    } else if (hungerPercentage >= 50) {
      setCharacterState('hungry');
    } else {
      setCharacterState('normal');
    }
  }, [profile?.hunger, profile?.health, profile?.maxHunger, profile?.maxHealth]);

  useEffect(() => {
    if (profile?.hunger !== undefined) {
      hungerScale.value = withSequence(
        withSpring(1.05, { damping: 15, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 300 }),
      );
    }
  }, [profile?.hunger]);

  useEffect(() => {
    if (profile?.xp !== undefined) {
      xpScale.value = withSequence(
        withSpring(1.05, { damping: 15, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 300 }),
      );
    }
  }, [profile?.xp]);

  useEffect(() => {
    if (profile?.health !== undefined) {
      healthScale.value = withSequence(
        withSpring(1.05, { damping: 15, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 300 }),
      );
    }
  }, [profile?.health]);

  const hungerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hungerScale.value }],
  }));

  const xpAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }],
  }));

  const healthAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: healthScale.value }],
  }));

  const getCharacterImage = () => {
    switch (characterState) {
      case 'hungry':
        return require('../assets/images/character/hungry.png');
      case 'injured':
        return require('../assets/images/character/injured.png');
      default:
        return require('../assets/images/character/normal.png');
    }
  };

  if (loading) {
    return (
      <Screen contentContainerStyle={{ paddingBottom: 120 }}>
        <ContentWrapper>
          <PageHeader title="Postać" />
          <StatLabel>Ładowanie danych...</StatLabel>
        </ContentWrapper>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen contentContainerStyle={{ paddingBottom: 120 }}>
        <ContentWrapper>
          <PageHeader title="Postać" />
          <StatLabel>Brak danych profilu użytkownika.</StatLabel>
        </ContentWrapper>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ paddingBottom: 120 }}>
      <PageHeader title="Postać" />
      <ContentWrapper>
        <CharacterImageWrapper>
          <CharacterImage source={getCharacterImage()} resizeMode="contain" />
          <StateIndicator state={characterState}>
            {characterState === 'hungry' && '🍔 Głodna'}
            {characterState === 'injured' && '🩹 Ranna'}
            {characterState === 'normal' && '😊 W formie'}
          </StateIndicator>
        </CharacterImageWrapper>

        <CharacterInfoCard>
          <CharacterInfo>
            <CharacterStatLeft>Postać: {profile.nickname}</CharacterStatLeft>
            <CharacterStatRight>Poziom: {profile.level}</CharacterStatRight>
          </CharacterInfo>
        </CharacterInfoCard>

        <SectionSeparator />

        <AnimatedStatCard style={hungerAnimStyle}>
          <StatRow>
            <StatLabel>Głód:</StatLabel>
            <StatValue>
              {profile.hunger} / {profile.maxHunger}
            </StatValue>
          </StatRow>
          <ProgressBar
            value={profile.hunger ?? 0}
            maxValue={profile.maxHunger}
            fillColor="#ffcc00"
            radius={8}
            height={15}
          />
        </AnimatedStatCard>

        <AnimatedStatCard style={xpAnimStyle}>
          <StatRow>
            <StatLabel>Poziom doświadczenia:</StatLabel>
            <StatValue>
              {profile.xp} / {profile.maxXp}
            </StatValue>
          </StatRow>
          <ProgressBar
            value={profile.xp ?? 0}
            maxValue={profile.maxXp}
            fillColor="#4caf50"
            height={15}
          />
        </AnimatedStatCard>

        <AnimatedStatCard style={healthAnimStyle}>
          <StatRow>
            <StatLabel>Poziom zdrowia:</StatLabel>
            <StatValue>
              {profile.health} / {profile.maxHealth}
            </StatValue>
          </StatRow>
          <ProgressBar
            value={profile.health ?? 0}
            maxValue={profile.maxHealth}
            fillColor="#e53935"
            height={15}
          />
        </AnimatedStatCard>
      </ContentWrapper>
    </Screen>
  );
}

// style
const Screen = styled.ScrollView`
  flex: 1;
  background-color: #f5f5d5;
`;

const ContentWrapper = styled.View`
  padding: 8px 16px 16px 16px;
`;

const CharacterImageWrapper = styled.View`
  align-self: center;
  width: 200px;
  height: 220px;
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  margin-top: 24px;
  margin-bottom: 20px;
  shadow-color: #000;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
  elevation: 5;
  justify-content: center;
  align-items: center;
`;

const CharacterImage = styled(Image)`
  width: 100%;
  height: 160px;
`;

const StateIndicator = styled.Text<{ state: 'normal' | 'hungry' | 'injured' }>`
  margin-top: 8px;
  font-size: 14px;
  font-weight: 600;
  color: ${({ state }) => {
    if (state === 'hungry') return '#ff9800';
    if (state === 'injured') return '#e53935';
    return '#4caf50';
  }};
`;

const CharacterInfoCard = styled.View`
  width: 100%;
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  elevation: 3;
`;

const CharacterInfo = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const CharacterStatLeft = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #333;
`;

const CharacterStatRight = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #2875d4;
`;

const SectionSeparator = styled.View`
  height: 3px;
  width: 100%;
  background-color: #333;
  margin: 12px 0;
`;

const StatCard = styled.View`
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  elevation: 3;
`;

const AnimatedStatCard = Animated.createAnimatedComponent(StatCard);

const StatRow = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const StatLabel = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const StatValue = styled.Text`
  font-size: 14px;
  font-weight: 500;
  color: #666;
`;
