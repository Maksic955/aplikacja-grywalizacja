import styled from 'styled-components/native';
import { Animated } from 'react-native';
import { useEffect, useRef } from 'react';

import { Task } from '@/context/TaskContext';
import { renderStars, formatDateShort } from '@/utils/taskHelpers';

type Props = {
  task: Task;
  onPause?: () => void;
  onDone?: () => void;
};

export default function HomeTaskCard({ task, onPause, onDone }: Props) {
  // Daty
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

  // Progress
  const total = Math.max(dueTs - createdTs, 1);
  const elapsed = Math.max(now - createdTs, 0);
  const progress = Math.min(1, Math.max(0, elapsed / total));

  const diff = dueTs - now;
  const dueLabel = formatDateShort(dueDate);

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

  // animacje

  // Wstrząsaniecie
  const shakeX = useRef(new Animated.Value(0)).current;

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

  // pulsowanie
  const pulse = useRef(new Animated.Value(0)).current;

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
      {/** Poświata */}
      {isLate && <PulseOverlay style={{ opacity: pulse }} />}

      <AnimatedCard style={{ transform: [{ translateX: isLate ? shakeX : 0 }] }}>
        <TopRow>
          <Title numberOfLines={1}>{task.title}</Title>
          <Stars>{renderStars(task.difficulty)}</Stars>
        </TopRow>

        {!!task.description && <Desc numberOfLines={6}>{task.description}</Desc>}

        {isLate ? (
          <LateBox>
            <LateTitle>UWAGA!!! CZAS MINĄŁ!!!</LateTitle>
            <LateSub>Tasko jest niezadowolony.</LateSub>
          </LateBox>
        ) : (
          <>
            <MetaRow>
              <MetaText>Pozostały czas: {leftLabel}</MetaText>
              <MetaText>Termin wykonania: {dueLabel}</MetaText>
            </MetaRow>

            <Track>
              <Fill style={{ width: `${progress * 100}%` }} />
            </Track>
          </>
        )}

        <ButtonsRow>
          <StopBtn activeOpacity={0.85} onPress={onPause}>
            <StopText>Zatrzymaj zadanie</StopText>
          </StopBtn>

          <DoneBtn activeOpacity={0.9} onPress={onDone}>
            <DoneText>Wykonane</DoneText>
          </DoneBtn>
        </ButtonsRow>
      </AnimatedCard>
    </Wrapper>
  );
}

// STYLES

const Wrapper = styled.View`
  position: relative;
`;

const PulseOverlay = styled(Animated.View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 16px;
  background-color: rgba(255, 0, 0, 0.4);
  z-index: 1;
`;

const AnimatedCard = styled(Animated.View)`
  margin: 12px 16px 0;
  padding: 14px;
  border-radius: 12px;
  background-color: #fff;
  elevation: 6;
  z-index: 2;
`;

const TopRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #222;
  flex: 1;
`;

const Stars = styled.View`
  margin-left: 8px;
  flex-direction: row;
  align-items: center;
`;

const Desc = styled.Text`
  margin-top: 8px;
  color: #555;
  line-height: 20px;
`;

const MetaRow = styled.View`
  margin-top: 12px;
  flex-direction: row;
  justify-content: space-between;
`;

const MetaText = styled.Text`
  font-size: 12px;
  color: #667;
`;

const Track = styled.View`
  height: 10px;
  border-radius: 6px;
  background-color: #e5ecf2;
  overflow: hidden;
  margin-top: 8px;
`;

const Fill = styled.View`
  height: 100%;
  background-color: #33c24d;
`;

const LateBox = styled.View`
  margin-top: 12px;
  padding: 10px;
  border-radius: 8px;
  background-color: #ffe2e2;
  border: 1px solid #ffb3b3;
`;

const LateTitle = styled.Text`
  font-size: 15px;
  font-weight: 700;
  color: #c80000;
`;

const LateSub = styled.Text`
  font-size: 12px;
  margin-top: 4px;
  color: #a33;
`;

const ButtonsRow = styled.View`
  margin-top: 14px;
  flex-direction: row;
  gap: 12px;
`;

const StopBtn = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  background-color: #f2c1c0;
  align-items: center;
`;
const StopText = styled.Text`
  color: #8a2b28;
  font-weight: 600;
`;

const DoneBtn = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  background-color: #33a05a;
  align-items: center;
`;
const DoneText = styled.Text`
  color: #fff;
  font-weight: 700;
`;
