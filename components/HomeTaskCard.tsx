import styled from 'styled-components/native';
import { Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { Task } from '@/context/TaskContext';

type Props = {
  task: Task;
  onPause?: () => void;
  onDone?: () => void;
};

export default function HomeTaskCard({ task, onPause, onDone }: Props) {
  const rawDue = task.dueDate as any;
  const dueDate =
    rawDue instanceof Date ? rawDue : rawDue?.toDate ? rawDue.toDate() : new Date(rawDue);

  const rawCreated = (task as any).createdAt;
  const createdAt =
    rawCreated instanceof Date
      ? rawCreated
      : rawCreated?.toDate
        ? rawCreated.toDate()
        : new Date(Date.now() - 1);

  const now = Date.now();
  const dueTs = dueDate.getTime();
  const createdTs = createdAt.getTime();
  const isLate = now > dueTs;

  const total = Math.max(dueTs - createdTs, 1);
  const elapsed = Math.max(now - createdTs, 0);
  const progress = Math.min(1, Math.max(0, elapsed / total));

  const diff = dueTs - now;

  let leftLabel = '';
  if (diff <= 0) leftLabel = '0 min';
  else {
    const min = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);

    if (min < 60) leftLabel = `${min} min`;
    else if (h < 24) leftLabel = `${h} godz`;
    else leftLabel = `${d} dni`;
  }

  const getDifficultyColor = () => {
    switch (task.difficulty) {
      case 'latwy':
        return '#4caf50';
      case 'sredni':
        return '#ff9800';
      case 'trudny':
        return '#e53935';
      default:
        return '#999';
    }
  };

  const getDifficultyLabel = () => {
    switch (task.difficulty) {
      case 'latwy':
        return 'Łatwy';
      case 'sredni':
        return 'Średni';
      case 'trudny':
        return 'Trudny';
      default:
        return task.difficulty;
    }
  };

  const shakeX = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLate) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeX, {
          toValue: 6,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: -6,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: 2,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
      ]),
    ).start();
  }, [isLate]);

  useEffect(() => {
    if (!isLate) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [isLate]);

  return (
    <Wrapper>
      {isLate && <PulseOverlay style={{ opacity: pulse }} />}

      <AnimatedCard style={{ transform: [{ translateX: isLate ? shakeX : 0 }] }}>
        <TopRow>
          <Title numberOfLines={1}>{task.title}</Title>
          <DifficultyBadge color={getDifficultyColor()}>
            <DifficultyText>{getDifficultyLabel()}</DifficultyText>
          </DifficultyBadge>
        </TopRow>

        {!!task.description && <Desc numberOfLines={3}>{task.description}</Desc>}

        {isLate ? (
          <LateBox>
            <LateIcon>
              <Ionicons name="warning" size={24} color="#e53935" />
            </LateIcon>
            <LateContent>
              <LateTitle>Termin minął!</LateTitle>
              <LateSub>Tasko jest niezadowolony</LateSub>
            </LateContent>
          </LateBox>
        ) : (
          <>
            <MetaRow>
              <MetaItem>
                <Ionicons name="time-outline" size={16} color="#666" />
                <MetaText>{leftLabel}</MetaText>
              </MetaItem>
              <MetaItem>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <MetaText>
                  {dueDate.toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </MetaText>
              </MetaItem>
            </MetaRow>

            <ProgressContainer>
              <ProgressBar>
                <ProgressFill progress={progress} />
              </ProgressBar>
              <ProgressText>{Math.round(progress * 100)}%</ProgressText>
            </ProgressContainer>
          </>
        )}

        <ButtonsRow>
          <StopBtn activeOpacity={0.85} onPress={onPause}>
            <Ionicons name="pause-circle-outline" size={20} color="#8a2b28" />
            <StopText>Wstrzymaj</StopText>
          </StopBtn>

          <DoneBtn activeOpacity={0.9} onPress={onDone}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <DoneText>Wykonane</DoneText>
          </DoneBtn>
        </ButtonsRow>
      </AnimatedCard>
    </Wrapper>
  );
}

// style
const Wrapper = styled.View`
  position: relative;
`;

const PulseOverlay = styled(Animated.View)`
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 16px;
  background-color: rgba(229, 57, 53, 0.3);
  z-index: 1;
`;

const AnimatedCard = styled(Animated.View)`
  margin: 12px 0;
  padding: 20px;
  border-radius: 16px;
  background-color: #fff;
  shadow-color: #000;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
  elevation: 5;
  z-index: 2;
`;

const TopRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Title = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #333;
  flex: 1;
  margin-right: 12px;
`;

const DifficultyBadge = styled.View<{ color: string }>`
  background-color: ${({ color }) => color}20;
  padding: 6px 12px;
  border-radius: 12px;
  border: 1.5px solid ${({ color }) => color};
`;

const DifficultyText = styled.Text`
  font-size: 12px;
  font-weight: 700;
  color: #333;
`;

const Desc = styled.Text`
  font-size: 14px;
  color: #666;
  line-height: 20px;
  margin-bottom: 16px;
`;

const MetaRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const MetaItem = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const MetaText = styled.Text`
  font-size: 13px;
  color: #666;
  font-weight: 500;
`;

const ProgressContainer = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const ProgressBar = styled.View`
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background-color: #e0e6ed;
  overflow: hidden;
`;

const ProgressFill = styled.View<{ progress: number }>`
  height: 100%;
  width: ${({ progress }) => progress * 100}%;
  background-color: #4caf50;
  border-radius: 4px;
`;

const ProgressText = styled.Text`
  font-size: 12px;
  font-weight: 700;
  color: #4caf50;
  min-width: 36px;
`;

const LateBox = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  background-color: #ffebee;
  border: 1.5px solid #ffcdd2;
  margin-bottom: 16px;
`;

const LateIcon = styled.View`
  margin-right: 12px;
`;

const LateContent = styled.View`
  flex: 1;
`;

const LateTitle = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #e53935;
  margin-bottom: 2px;
`;

const LateSub = styled.Text`
  font-size: 13px;
  color: #c62828;
`;

const ButtonsRow = styled.View`
  flex-direction: row;
  gap: 12px;
`;

const StopBtn = styled.TouchableOpacity`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 14px;
  border-radius: 12px;
  background-color: #ffebee;
  border: 1.5px solid #ffcdd2;
  gap: 6px;
`;

const StopText = styled.Text`
  color: #8a2b28;
  font-weight: 700;
  font-size: 14px;
`;

const DoneBtn = styled.TouchableOpacity`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 14px;
  border-radius: 12px;
  background-color: #4caf50;
  gap: 6px;
  shadow-color: #4caf50;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 4;
`;

const DoneText = styled.Text`
  color: #fff;
  font-weight: 700;
  font-size: 14px;
`;
