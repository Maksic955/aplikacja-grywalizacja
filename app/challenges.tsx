import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native';
import FlipCard from '@/components/FlipCard';
import PageHeader from '@/components/PageHeader';
import { useChallenges } from '@/context/ChallengesContext';

export default function ChallengesScreen() {
  const challengesContext = useChallenges();
  const { availableChallenges, completedChallenges, loading } = challengesContext;

  if (loading) {
    return (
      <Screen>
        <PageHeader title="Wyzwania" showBackButton={false} />
        <LoadingContainer>
          <ActivityIndicator size="large" color="#2875d4" />
          <LoadingText>Ładowanie wyzwań...</LoadingText>
        </LoadingContainer>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollContainer contentContainerStyle={{ paddingBottom: 120 }}>
        <PageHeader title="Wyzwania" showBackButton={false} />

        <Section>
          <SectionHeader>
            <SectionTitle>Aktywne wyzwania</SectionTitle>
            <Badge>
              <BadgeText>{availableChallenges.length}</BadgeText>
            </Badge>
          </SectionHeader>

          {availableChallenges.length === 0 ? (
            <EmptyCard>
              <EmptyIcon>🎯</EmptyIcon>
              <EmptyText>Brak aktywnych wyzwań</EmptyText>
              <EmptySubtext>Awansuj poziom aby odblokować więcej!</EmptySubtext>
            </EmptyCard>
          ) : (
            <ChallengesGrid>
              {availableChallenges.map((challenge: any) => (
                <FlipCard
                  key={challenge.id}
                  title={challenge.title}
                  image={challenge.icon}
                  description={challenge.description}
                  variant="challenge"
                />
              ))}
            </ChallengesGrid>
          )}
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Zdobyte odznaki</SectionTitle>
            <Badge completed>
              <BadgeText>{completedChallenges.length}</BadgeText>
            </Badge>
          </SectionHeader>

          {completedChallenges.length === 0 ? (
            <EmptyCard>
              <EmptyIcon>🏅</EmptyIcon>
              <EmptyText>Jeszcze nie masz odznak</EmptyText>
              <EmptySubtext>Wykonuj wyzwania aby je zdobyć!</EmptySubtext>
            </EmptyCard>
          ) : (
            <BadgesGrid>
              {completedChallenges.map((badge: any) => (
                <FlipCard
                  key={badge.id}
                  title={badge.title}
                  image={badge.icon}
                  description={badge.description}
                  variant="badge"
                />
              ))}
            </BadgesGrid>
          )}
        </Section>

        <InfoBox>
          <Ionicons name="information-circle" size={24} color="#2875d4" />
          <InfoTextContainer>
            <InfoTitle>Jak działają wyzwania?</InfoTitle>
            <InfoText>
              Wykonuj zadania aby automatycznie odblokowywać wyzwania i zdobywać odznaki! Kliknij na
              wyzwanie aby zobaczyć szczegóły.
            </InfoText>
          </InfoTextContainer>
        </InfoBox>
      </ScrollContainer>
    </Screen>
  );
}

// style
const Screen = styled.SafeAreaView`
  flex: 1;
  background-color: #f5f5d5;
`;

const ScrollContainer = styled.ScrollView`
  flex: 1;
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  gap: 16px;
`;

const LoadingText = styled.Text`
  font-size: 16px;
  color: #666;
`;

const Section = styled.View`
  margin: 16px;
  margin-top: 8px;
`;

const SectionHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const SectionTitle = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #333;
`;

const Badge = styled.View<{ completed?: boolean }>`
  background-color: ${({ completed }) => (completed ? '#4caf50' : '#2875d4')};
  padding: 4px 12px;
  border-radius: 12px;
`;

const BadgeText = styled.Text`
  color: white;
  font-size: 14px;
  font-weight: 700;
`;

const ChallengesGrid = styled.View`
  background-color: white;
  border-radius: 16px;
  padding: 16px;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  elevation: 3;
`;

const BadgesGrid = styled.View`
  background-color: white;
  border-radius: 16px;
  padding: 16px;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  elevation: 3;
`;

const EmptyCard = styled.View`
  background-color: white;
  border-radius: 16px;
  padding: 40px 24px;
  align-items: center;
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`;

const EmptyIcon = styled.Text`
  font-size: 64px;
  margin-bottom: 16px;
`;

const EmptyText = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
`;

const EmptySubtext = styled.Text`
  font-size: 14px;
  color: #666;
  text-align: center;
`;

const InfoBox = styled.View`
  background-color: #e8f4fd;
  border-radius: 12px;
  padding: 16px;
  margin: 0 16px 16px;
  flex-direction: row;
  gap: 12px;
  border: 1.5px solid #bbdefb;
`;

const InfoTextContainer = styled.View`
  flex: 1;
`;

const InfoTitle = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #2875d4;
  margin-bottom: 4px;
`;

const InfoText = styled.Text`
  font-size: 13px;
  color: #1565c0;
  line-height: 18px;
`;
