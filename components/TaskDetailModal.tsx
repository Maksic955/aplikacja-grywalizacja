import styled from 'styled-components/native';
import { useTasks } from '@/context/TaskContext';
import { Ionicons } from '@expo/vector-icons';

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
        <Ionicons name="close-circle" size={32} color="#999" />
      </CloseButton>

      <Header>
        <Title numberOfLines={2}>{task.title}</Title>
        <DifficultyBadge color={getDifficultyColor()}>
          <DifficultyText>{getDifficultyLabel()}</DifficultyText>
        </DifficultyBadge>
      </Header>

      {task.description && (
        <Section>
          <SectionLabel>
            <Ionicons name="document-text-outline" size={18} color="#2875d4" />
            <SectionLabelText>Opis</SectionLabelText>
          </SectionLabel>
          <Description>{task.description}</Description>
        </Section>
      )}

      {task.status === 'done' && (
        <>
          <CompletedBox>
            <Ionicons name="checkmark-circle" size={48} color="#4caf50" />
            <CompletedText>Zadanie wykonane!</CompletedText>
            <CompletedSubtext>Świetna robota! 🎉</CompletedSubtext>
          </CompletedBox>

          {task.completedAt && (
            <InfoRow>
              <Ionicons name="calendar" size={16} color="#666" />
              <InfoText>
                Ukończono:{' '}
                {(task.completedAt instanceof Date
                  ? task.completedAt
                  : new Date(task.completedAt)
                ).toLocaleDateString('pl-PL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </InfoText>
            </InfoRow>
          )}
        </>
      )}

      {task.status !== 'done' && isLate && (
        <>
          <LateWarning>
            <Ionicons name="warning" size={32} color="#e53935" />
            <LateWarningText>Termin minął!</LateWarningText>
            <LateWarningSubtext>Wykonaj zadanie jak najszybciej</LateWarningSubtext>
          </LateWarning>

          <Actions>
            <SecondaryButton onPress={onPressPause}>
              <Ionicons name="pause-circle-outline" size={20} color="#8a2b28" />
              <SecondaryButtonText>Wstrzymaj</SecondaryButtonText>
            </SecondaryButton>

            <PrimaryButton onPress={onPressComplete}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <PrimaryButtonText>Wykonane</PrimaryButtonText>
            </PrimaryButton>
          </Actions>
        </>
      )}

      {task.status === 'inProgress' && !isLate && (
        <>
          <StatsRow>
            <StatBox>
              <Ionicons name="time-outline" size={24} color="#2875d4" />
              <StatLabel>Pozostało</StatLabel>
              <StatValue>{leftLabel}</StatValue>
            </StatBox>

            <StatBox>
              <Ionicons name="calendar-outline" size={24} color="#2875d4" />
              <StatLabel>Termin</StatLabel>
              <StatValue>
                {dueDate.toLocaleDateString('pl-PL', {
                  day: 'numeric',
                  month: 'short',
                })}
              </StatValue>
            </StatBox>
          </StatsRow>

          <ProgressSection>
            <ProgressLabel>Postęp</ProgressLabel>
            <ProgressBarContainer>
              <ProgressBar>
                <ProgressFill progress={progress} />
              </ProgressBar>
              <ProgressPercent>{Math.round(progress * 100)}%</ProgressPercent>
            </ProgressBarContainer>
          </ProgressSection>

          <Actions>
            <SecondaryButton onPress={onPressPause}>
              <Ionicons name="pause-circle-outline" size={20} color="#8a2b28" />
              <SecondaryButtonText>Wstrzymaj</SecondaryButtonText>
            </SecondaryButton>

            <PrimaryButton onPress={onPressComplete}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <PrimaryButtonText>Wykonane</PrimaryButtonText>
            </PrimaryButton>
          </Actions>
        </>
      )}

      {task.status === 'paused' && (
        <Actions>
          <PrimaryButton onPress={onPressResume}>
            <Ionicons name="play-circle" size={20} color="#fff" />
            <PrimaryButtonText>Kontynuuj</PrimaryButtonText>
          </PrimaryButton>
        </Actions>
      )}
    </Container>
  );
}

// style
const Container = styled.View`
  position: absolute;
  top: 60px;
  left: 16px;
  right: 16px;
  max-height: 80%;
  padding: 24px;
  border-radius: 20px;
  background-color: #fff;
  shadow-color: #000;
  shadow-opacity: 0.25;
  shadow-radius: 16px;
  elevation: 10;
`;

const CloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
`;

const Header = styled.View`
  margin-bottom: 20px;
`;

const Title = styled.Text`
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
`;

const DifficultyBadge = styled.View<{ color: string }>`
  background-color: ${({ color }) => color}20;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1.5px solid ${({ color }) => color};
  align-self: flex-start;
`;

const DifficultyText = styled.Text`
  font-size: 13px;
  font-weight: 700;
  color: #333;
`;

const Section = styled.View`
  margin-bottom: 20px;
`;

const SectionLabel = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const SectionLabelText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #2875d4;
`;

const Description = styled.Text`
  font-size: 14px;
  color: #666;
  line-height: 22px;
`;

const CompletedBox = styled.View`
  align-items: center;
  padding: 24px;
  background-color: #e8f5e9;
  border-radius: 16px;
  margin-bottom: 16px;
`;

const CompletedText = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #4caf50;
  margin-top: 12px;
`;

const CompletedSubtext = styled.Text`
  font-size: 14px;
  color: #66bb6a;
  margin-top: 4px;
`;

const InfoRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const InfoText = styled.Text`
  font-size: 13px;
  color: #666;
`;

const LateWarning = styled.View`
  align-items: center;
  padding: 24px;
  background-color: #ffebee;
  border-radius: 16px;
  border: 1.5px solid #ffcdd2;
  margin-bottom: 20px;
`;

const LateWarningText = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #e53935;
  margin-top: 8px;
`;

const LateWarningSubtext = styled.Text`
  font-size: 13px;
  color: #c62828;
  margin-top: 4px;
`;

const StatsRow = styled.View`
  flex-direction: row;
  gap: 12px;
  margin-bottom: 20px;
`;

const StatBox = styled.View`
  flex: 1;
  align-items: center;
  padding: 16px;
  background-color: #e8f4fd;
  border-radius: 12px;
`;

const StatLabel = styled.Text`
  font-size: 12px;
  color: #666;
  margin-top: 8px;
`;

const StatValue = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #2875d4;
  margin-top: 4px;
`;

const ProgressSection = styled.View`
  margin-bottom: 20px;
`;

const ProgressLabel = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
`;

const ProgressBarContainer = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const ProgressBar = styled.View`
  flex: 1;
  height: 10px;
  border-radius: 5px;
  background-color: #e0e6ed;
  overflow: hidden;
`;

const ProgressFill = styled.View<{ progress: number }>`
  height: 100%;
  width: ${({ progress }) => progress * 100}%;
  background-color: #4caf50;
  border-radius: 5px;
`;

const ProgressPercent = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: #4caf50;
  min-width: 40px;
`;

const Actions = styled.View`
  flex-direction: row;
  gap: 12px;
`;

const SecondaryButton = styled.TouchableOpacity`
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

const SecondaryButtonText = styled.Text`
  color: #8a2b28;
  font-weight: 700;
  font-size: 14px;
`;

const PrimaryButton = styled.TouchableOpacity`
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

const PrimaryButtonText = styled.Text`
  color: #fff;
  font-weight: 700;
  font-size: 14px;
`;
