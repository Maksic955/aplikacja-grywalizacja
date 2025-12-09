import { useMemo, useState } from 'react';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTasks } from '@/context/TaskContext';
import HomeTaskCard from '@/components/HomeTaskCard';
import FlipCard from '@/components/FlipCard';
import PageHeader from '@/components/PageHeader';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useChallenges } from '@/context/ChallengesContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 32;

export default function HomeScreen() {
  const router = useRouter();
  const { tasks, updateTaskStatus, completeTask } = useTasks();
  const [currentSlide, setCurrentSlide] = useState(0);
  const { availableChallenges } = useChallenges();

  const activeTasks = useMemo(() => tasks.filter((t) => t.status === 'inProgress'), [tasks]);

  const hasTasks = activeTasks.length > 0;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    setCurrentSlide(index);
  };

  return (
    <Screen>
      <ScrollContainer contentContainerStyle={{ paddingBottom: 140 }}>
        <PageHeader title="Strona Główna" showBackButton={false} />
        <SectionCard>
          <SectionHeader>Bieżące zadania</SectionHeader>

          {!hasTasks ? (
            <EmptyWrap>
              <EmptyText>Brak zadań w toku — dodaj nowe!</EmptyText>
              <InlineAdd onPress={() => router.push('/add-task')}>
                <Ionicons name="add" size={22} color="#fff" />
              </InlineAdd>
            </EmptyWrap>
          ) : (
            <>
              <TasksSlider
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH}
                decelerationRate="fast"
                pagingEnabled
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                {activeTasks.map((task) => (
                  <SlideWrapper key={task.id}>
                    <HomeTaskCard
                      task={task}
                      onPause={() => updateTaskStatus(task.id, 'paused')}
                      onDone={() => completeTask(task.id, task.difficulty)}
                    />
                  </SlideWrapper>
                ))}
              </TasksSlider>

              {activeTasks.length > 1 && (
                <PaginationDots>
                  {activeTasks.map((_, index) => (
                    <Dot key={index} active={index === currentSlide} />
                  ))}
                </PaginationDots>
              )}
            </>
          )}
        </SectionCard>

        <SectionCard>
          <SectionHeader>Wyzwania</SectionHeader>

          <ChallengesGrid>
            {availableChallenges.slice(0, 9).map((challenge) => (
              <FlipCard
                key={challenge.id}
                title={challenge.title}
                image={challenge.icon}
                description={challenge.description}
              />
            ))}
          </ChallengesGrid>

          <MoreButton onPress={() => router.push('/challenges')}>
            <MoreButtonText>Przejdź do Wyzwań</MoreButtonText>
            <Ionicons name="arrow-forward" size={18} color="#2875d4" />
          </MoreButton>
        </SectionCard>
      </ScrollContainer>

      {hasTasks && (
        <FloatingButton onPress={() => router.push('/add-task')} activeOpacity={0.7}>
          <Ionicons name="add" size={28} color="#fff" />
        </FloatingButton>
      )}
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

const SectionCard = styled.View`
  background-color: white;
  border-radius: 16px;
  padding: 16px;
  margin: 16px;
  margin-bottom: 0;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  elevation: 3;
`;

const SectionHeader = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
`;

const EmptyWrap = styled.View`
  align-items: center;
  padding: 32px 0;
  gap: 12px;
`;

const EmptyText = styled.Text`
  text-align: center;
  color: #9aa8b2;
  font-size: 16px;
`;

const InlineAdd = styled.TouchableOpacity`
  padding: 12px 16px;
  border-radius: 20px;
  background-color: #2875d4;
`;

const TasksSlider = styled.ScrollView`
  margin: 0 -16px;
`;

const SlideWrapper = styled.View`
  width: ${CARD_WIDTH}px;
  padding: 0 16px;
`;

const PaginationDots = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
  gap: 8px;
`;

const Dot = styled.View<{ active: boolean }>`
  width: ${({ active }) => (active ? '24px' : '8px')};
  height: 8px;
  border-radius: 4px;
  background-color: ${({ active }) => (active ? '#2875d4' : '#d0d0d0')};
`;

const ChallengesGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
`;

const MoreButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
  padding: 12px;
  background-color: #e8f4fd;
  border-radius: 10px;
  gap: 8px;
`;

const MoreButtonText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #2875d4;
`;

const FloatingButton = styled.TouchableOpacity`
  position: absolute;
  right: 24px;
  bottom: 140px;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: #2875d4;
  align-items: center;
  justify-content: center;
  shadow-color: #000;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 8;
`;
