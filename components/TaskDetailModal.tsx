import styled from 'styled-components/native';
import { useTasks } from '@/context/TaskContext';
import { Ionicons } from '@expo/vector-icons';
import { formatDateShort } from '@/utils/taskHelpers';
import ProgressBar from './ProgressBar';

const difficultyToRating = (d: 'latwy' | 'sredni' | 'trudny') => {
  switch (d) {
    case 'latwy':
      return 1;
    case 'sredni':
      return 3;
    case 'trudny':
      return 5;
    default:
      return 1;
  }
};

const difficultyLabels: Record<'latwy' | 'sredni' | 'trudny', string> = {
  latwy: 'Łatwy',
  sredni: 'Średni',
  trudny: 'Trudny',
};

interface Props {
  taskId: string;
  visible: boolean;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, onClose }: Props) {
  const { tasks, updateTaskStatus, completeTask } = useTasks();

  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);

  const createdAt = task.createdAt
    ? task.createdAt instanceof Date
      ? task.createdAt
      : new Date(task.createdAt)
    : new Date(Date.now() - 1);

  const now = new Date();

  const isLate = now.getTime() > dueDate.getTime();

  const totalMs = Math.max(dueDate.getTime() - createdAt.getTime(), 1);
  const elapsedMs = Math.max(now.getTime() - createdAt.getTime(), 0);

  const progress = Math.min(1, Math.max(0, elapsedMs / totalMs));

  const diffMs = dueDate.getTime() - now.getTime();

  const minutesLeft = Math.floor(diffMs / 60000);
  const hoursLeft = Math.floor(diffMs / 3600000);
  const daysLeft = Math.floor(diffMs / 86400000);

  let leftLabel = '';

  if (minutesLeft <= 0) leftLabel = '0 min';
  else if (minutesLeft < 60) leftLabel = `${minutesLeft} min`;
  else if (hoursLeft < 24) leftLabel = `${hoursLeft} godz`;
  else leftLabel = `${daysLeft} dni`;

  const dueLabel = formatDateShort(dueDate);

  let completedAtLabel = '';
  if (task.completedAt) {
    const doneDate =
      task.completedAt instanceof Date ? task.completedAt : new Date(task.completedAt);
    completedAtLabel = formatDateShort(doneDate);
  }

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

  const onPressComplete = async () => {
    await completeTask(task.id, task.difficulty);
    onClose();
  };

  const onPressPause = async () => {
    await updateTaskStatus(task.id, 'paused');
    onClose();
  };

  const onPressResume = async () => {
    await updateTaskStatus(task.id, 'inProgress');
    onClose();
  };

  return (
    <Container>
      <CloseButton onPress={onClose}>
        <Ionicons name="close" size={26} color="#333" />
      </CloseButton>
      <HeaderRow>
        <Title numberOfLines={1}>{task.title}</Title>
        <StarsRow rating={difficultyToRating(task.difficulty)} />
      </HeaderRow>
      <Label>Trudność: {difficultyLabels[task.difficulty]}</Label>
      {task.description ? (
        <>
          <Label>Opis:</Label>
          <Description>{task.description}</Description>
        </>
      ) : null}

      {task.status === 'done' && (
        <>
          <MetaRow>
            <MetaText>Pozostały czas: Skończone</MetaText>
            <MetaTextRight>Data wykonania: {completedAtLabel || 'Brak'}</MetaTextRight>
          </MetaRow>

          <Actions>
            <ActionText>Zadanie zostało wykonane! Powodzenia przy kolejnym</ActionText>
          </Actions>
        </>
      )}

      {task.status !== 'done' && isLate && (
        <>
          <LateBox>
            <LateTitle>UWAGA!!! CZAS MINĄŁ!!!</LateTitle>
            <LateSubtitle>Tasko jest niezadowolony.</LateSubtitle>
          </LateBox>

          <Actions>
            <ActionButton $softRed onPress={onPressPause}>
              <ActionText $stopRed>Wstrzymaj</ActionText>
            </ActionButton>

            <ActionButton $green onPress={onPressComplete}>
              <ActionText $doneGreen>Wykonane</ActionText>
            </ActionButton>
          </Actions>
        </>
      )}

      {task.status === 'inProgress' && !isLate && (
        <>
          <MetaRow>
            <MetaText>Pozostały czas: {leftLabel}</MetaText>
            <MetaTextRight>Termin: {dueLabel}</MetaTextRight>
          </MetaRow>

          <ProgressTrack>
            <ProgressBar value={progress * 100} maxValue={100} height={10} fillColor="#33a05a" />
          </ProgressTrack>

          <Actions>
            <ActionButton $softRed onPress={onPressPause}>
              <ActionText $stopRed>Wstrzymaj</ActionText>
            </ActionButton>

            <ActionButton $green onPress={onPressComplete}>
              <ActionText $doneGreen>Wykonane</ActionText>
            </ActionButton>
          </Actions>
        </>
      )}

      {task.status === 'paused' && (
        <Actions>
          <ActionButton $green onPress={onPressResume}>
            <ActionText $doneGreen>Kontynuuj</ActionText>
          </ActionButton>
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

const ProgressTrack = styled.View`
  margin-top: 8px;
  height: 10px;
  border-radius: 8px;
  background-color: #e8eef5;
  overflow: hidden;
`;

const LateBox = styled.View`
  margin-top: 14px;
  padding: 12px;
  border-radius: 8px;
  background-color: #ffe2e2;
  border: 1px solid #ffb3b3;
`;

const LateTitle = styled.Text`
  font-size: 15px;
  font-weight: 700;
  color: #c80000;
`;

const LateSubtitle = styled.Text`
  margin-top: 4px;
  font-size: 12px;
  color: #933;
`;

const Actions = styled.View`
  margin-top: 16px;
  flex-direction: row;
  gap: 12px;
`;

const ActionButton = styled.TouchableOpacity<{ $green?: boolean; $softRed?: boolean }>`
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  align-items: center;
  background-color: ${(props) => (props.$green ? '#33a05a' : props.$softRed ? '#f2c1c0' : '#ccc')};
`;

const ActionText = styled.Text<{ $doneGreen?: boolean; $stopRed?: boolean }>`
  color: ${(props) => (props.$doneGreen ? '#fff' : props.$stopRed ? '#8a2b28' : '#fff')};
  font-size: 16px;
  font-weight: 700;
`;
