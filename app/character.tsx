import { Image } from 'react-native';
import styled from 'styled-components/native';
import ProgressBar from '../components/ProgressBar';
import { ScrollView } from 'react-native-gesture-handler';
import { useUserProfile } from '@/context/UserContext';

export default function CharacterScreen() {
  const { profile, loading } = useUserProfile();

  if (loading) {
    return (
      <Screen>
        <StatLabel>Ładowanie danych...</StatLabel>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <StatLabel>Brak danych profilu użytkownika.</StatLabel>
      </Screen>
    );
  }

  console.log('User profile:', profile);

  return (
    <Screen>
      <ScrollView>
        <CharacterImage
          source={require('../assets/images/character/normal.png')}
          resizeMode="contain"
        />

        <SectionSeparator />

        <StatRow>
          <StatLabel>Głód:</StatLabel>
          <StatValue>
            {profile.hunger} / {profile.maxHunger}
          </StatValue>
          <ProgressBar
            value={profile.hunger ?? 0}
            maxValue={profile.maxHunger}
            fillColor="#ffcc00"
            radius={8}
            height={15}
          />
        </StatRow>

        <Separator />

        <StatRow>
          <StatLabel>Poziom doświadczenia:</StatLabel>
          <StatValue>
            {profile.xp} / {profile.maxXp}
          </StatValue>
          <ProgressBar
            value={profile.xp ?? 0}
            maxValue={profile.maxXp}
            fillColor="#4caf50"
            height={15}
          />
        </StatRow>

        <Separator />

        <StatRow>
          <StatLabel>Poziom zdrowia:</StatLabel>
          <StatValue>
            {profile.health} / {profile.maxHealth}
          </StatValue>
          <ProgressBar
            value={profile.health ?? 0}
            maxValue={profile.maxHealth}
            fillColor="#e53935"
            height={15}
          />
        </StatRow>
      </ScrollView>
    </Screen>
  );
}

const Screen = styled(ScrollView)`
  flex: 1;
  padding: 32px;
  background-color: #f5f5d5;
`;

const CharacterImage = styled(Image)`
  width: 50%;
  height: 120px;
  align-self: center;
  margin-bottom: 32px;
`;

const SectionSeparator = styled.View`
  height: 4px;
  width: 100%;
  background-color: black;
  margin: 24px 0;
`;

const Separator = styled.View`
  height: 2px;
  width: 100%;
  background-color: black;
  margin: 24px 0;
`;

const StatRow = styled.View`
  width: 100%;
`;

const StatLabel = styled.Text`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const StatValue = styled.Text`
  font-size: 14px;
  font-weight: 500;
  color: #444;
  text-align: right;
  margin-bottom: 8px;
`;
