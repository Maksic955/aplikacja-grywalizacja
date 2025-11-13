import { useMemo } from 'react';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTasks, Task } from '@/context/TaskContext';
import HomeTaskCard from '@/components/HomeTaskCard';

export default function HomeScreen() {
  const router = useRouter();
  const { tasks, updateTaskStatus } = useTasks();

  const inProgress = useMemo(
    () => tasks.filter(t => t.status === 'inProgress'),
    [tasks]
  );

  const hasTasks = inProgress.length > 0;

  const urgent: Task | null = useMemo(() => {
    if (inProgress.length === 0) return null;

    const now = Date.now();
    const toTs = (d: Date | string) => new Date(d).getTime();

    const future = inProgress.filter(t => toTs(t.dueDate) >= now);
    if (future.length) {
      return future.reduce((a, b) => toTs(a.dueDate) <= toTs(b.dueDate) ? a : b);
    }

    return inProgress.reduce((a, b) => toTs(a.dueDate) >= toTs(b.dueDate) ? a : b);
  }, [inProgress]);

  return (
    <Screen>
      <Header>Bieżące zadania</Header>

      {!urgent ? (
        <EmptyWrap>
          <EmptyText>Brak zadań w toku — dodaj nowe!</EmptyText>
          <InlineAdd onPress={() => router.push('/add-task')}>
            <Ionicons name="add" size={22} color="#fff" />
          </InlineAdd>
        </EmptyWrap>
      ) : (
        <HomeTaskCard
          task={urgent}
          onPause={() => updateTaskStatus(urgent.id, 'paused')}
          onDone={() => updateTaskStatus(urgent.id, 'done')}
        />
      )}

      { hasTasks && (
        <FloatingButton onPress={() => router.push('/add-task')}>
          <Ionicons name="add" size={28} color="#fff" />
        </FloatingButton>
      )}
    </Screen>
  );
}

const Screen = styled.SafeAreaView`
  flex: 1
`;
const Header = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: black;
  margin: 0 16px 8px;
`;
const EmptyWrap = styled.View`
  align-items: center;
  margin-top: 32px;
  gap: 12px;
  padding: 0 16px;
`;
const EmptyText = styled.Text`
  text-align: center; color: #9aa8b2;
`;

const InlineAdd = styled.TouchableOpacity`
  padding: 6px 10px;
  border-radius: 16px;
  background-color: #2875d4;
`;

const FloatingButton = styled.TouchableOpacity`
  position: absolute;
  right: 24px;
  bottom: 120px;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: #2875d4;
  align-items: center;
  justify-content: center;
  elevation: 8;
`;