import React from 'react';
import styled from 'styled-components/native';
import { useTasks } from '@/context/TaskContext';
import { Ionicons } from '@expo/vector-icons';
import { formatDateShort } from '@/utils/taskHelpers';

const difficultyToRating = (d: 'Łatwy' | 'Średni' | 'Trudny') => { 
  switch (d) {
    case 'Łatwy': return 1;
    case 'Średni': return 3;
    case 'Trudny': return 5;
    default: return 1;
  }
}
interface Props {
  visible: boolean;
  taskId: string;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, onClose }: Props) {
  const { tasks, updateTaskStatus } = useTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;

  const MS = 24 * 60 * 60 * 1000;
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((task.dueDate.getTime() - now.getTime()) / MS));
  const totalDays = Math.max(daysLeft, 7);
  const progress = Math.min(1, Math.max(0, (totalDays - daysLeft) / totalDays));
  const daysLeftLabel =
    daysLeft === 0 ? 'dzisiaj' : `${daysLeft} ${daysLeft === 1 ? 'dzień' : 'dni'}`;
  const dueLabel = formatDateShort(task.dueDate)


  const StarsRow = ({ rating }: { rating: number }) => (
  <StarsWrap>
    {Array.from({ length: 5 }).map((_, i) => (
      <Ionicons
        key={i}
        name={i < rating ? 'star' : 'star-outline'}
        size={18}
        color={i < rating ? '#33a05a' : '#9db2c6'}
        style={{ marginRight: 4 }}
      />
    ))}
  </StarsWrap>
  );

  return (
    <Container>
      <CloseButton onPress={onClose} accessibilityLabel="Zamknij">
          <Ionicons name="close" size={26} color="#333" />
      </CloseButton>
      <HeaderRow>
          <Title numberOfLines={1}>{task.title}</Title>
          <StarsRow rating={difficultyToRating(task.difficulty)} />
      </HeaderRow>
      
      <Label>Trudność: {task.difficulty}</Label>

      {!!task.description && (
        <>
          <Label>Opis:</Label>
          <Description>{task.description}</Description>
        </>
      )}
      
      <MetaRow>
        <MetaText>Pozostały czas: {daysLeftLabel}</MetaText>
        <MetaTextRight>Termin wykonania: {dueLabel}</MetaTextRight>
      </MetaRow>
      <ProgressTrack>
        <ProgressFill style={{ width: `${Math.round(progress * 100)}%` }} />
      </ProgressTrack>

      {task.status === 'inProgress' ? (
        <Actions>
          <ActionButton $softRed onPress={() => { updateTaskStatus(task.id, 'paused'); onClose(); }}>
            <ActionText $stopRed>Wstrzymaj</ActionText>
          </ActionButton>

          <ActionButton $green onPress={() => { updateTaskStatus(task.id, 'done'); onClose(); }}>
            <ActionText $doneGreen>Wykonane</ActionText>
          </ActionButton>
        </Actions>
      ) : (
        <Actions>
          <RestoreButton onPress={() => { updateTaskStatus(task.id, 'inProgress'); onClose(); }}>
            <ActionText>Przywróć</ActionText>
          </RestoreButton>
        </Actions>
      )}
    </Container>
  );
}

// Style

const Container = styled.View`
  position: absolute;
  top: 80px;
  left: 20px;
  right: 20px;

  padding: 44px 14px 16px;
  border-radius: 12px;
  background-color: #fff;

  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 10px;
  elevation: 6;
`;

const CloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 8px;
  z-index: 1;
`;

const HeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 6px;
`;

const Title = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #222;
  flex: 1;
  margin-right: 12px;
`;

const StarsWrap = styled.View`
  flex-direction: row;
  align-items: center;
`;

const Label = styled.Text`
  margin-top: 10px;
  font-size: 13px;
  color: #667;
`;

const Description = styled.Text`
  margin-top: 6px;
  color: #555;
  line-height: 20px;
`;

const MetaRow = styled.View`
  margin-top: 14px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const MetaText = styled.Text`
  font-size: 12px;
  color: #667;
`;

const MetaTextRight = styled(MetaText)`
  color: #444;
`;

// Pasek progresu
const ProgressTrack = styled.View`
  margin-top: 8px;
  height: 10px;
  border-radius: 8px;
  background-color: #e8eef5;
  overflow: hidden;
`;

const ProgressFill = styled.View`
  height: 100%;
  background-color: #33a05a;
  border-radius: 8px;
`;

// Przcysiki
const Actions = styled.View`
  margin-top: 16px;
  flex-direction: row;
  gap: 12px;
`;

const ActionButton = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  align-items: center;
  background-color: ${({ $green, $softRed }: { $green?: boolean; $softRed?: boolean }) =>
    $green ? '#33a05a' : $softRed ? '#f2c1c0' : '#ccc'};
`;

const ActionText = styled.Text`
  color: ${({ $doneGreen, $stopRed }: { $doneGreen?: boolean; $stopRed?: boolean }) =>
    $doneGreen ? '#fff' : $stopRed ? '#8a2b28' : '#fff'};
  font-size: 16px;
  font-weight: 700;
`;

const RestoreButton = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  align-items: center;
  background-color: #2875d4;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 6px;
  elevation: 2;
`;