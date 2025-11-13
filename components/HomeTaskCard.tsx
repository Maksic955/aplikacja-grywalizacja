import styled from 'styled-components/native';
import { Task } from '@/context/TaskContext';
import { renderStars, formatLeft, formatDateShort } from '@/utils/taskHelpers';

type Props = {
  task: Task;
  onPause?: () => void;  
  onDone?: () => void;
};

export default function HomeTaskCard({ task, onPause, onDone }: Props) {
  const now = Date.now();
  const due = new Date(task.dueDate).getTime();
  const start = now - 24 * 3600 * 1000;
  const total = Math.max(due - start, 1);
  const left = Math.max(due - now, 0);
  const progress = Math.min(1, Math.max(0, 1 - left / total));
  const leftLabel = formatLeft(left);
  const dueLabel = formatDateShort(task.dueDate);

  return (
    <Card>
      <TopRow>
        <Title numberOfLines={1}>{task.title}</Title>

        <Stars>
          {renderStars(task.difficulty)}
        </Stars>
      </TopRow>

      {!!task.description && (
        <Desc numberOfLines={6}>{task.description}</Desc>
      )}

      <MetaRow>
        <MetaText>Pozostały czas: {leftLabel}</MetaText>
        <MetaText>Termin wykonania: {dueLabel}</MetaText>
      </MetaRow>

      <Track>
        <Fill style={{ width: `${progress * 100}%` }} />
      </Track>

      <ButtonsRow>
        <StopBtn activeOpacity={0.85} onPress={onPause}>
          <StopText>Zatrzymaj zadanie</StopText>
        </StopBtn>

        <DoneBtn activeOpacity={0.9} onPress={onDone}>
          <DoneText>Wykonane</DoneText>
        </DoneBtn>
      </ButtonsRow>
    </Card>
  );
}

// Style
const Card = styled.View`
  margin: 12px 16px 0;
  padding: 14px;
  border-radius: 12px;
  background-color: #fff;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 10px;
  elevation: 6;
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