import { useMemo, useEffect, useRef } from 'react';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTasks, Task } from '@/context/TaskContext';
import HomeTaskCard from '@/components/HomeTaskCard';

export default function HomeScreen() {
  const router = useRouter();
  const { tasks, updateTaskStatus, completeTask } = useTasks();

  const normalizeDate = (d: any) => (d instanceof Date ? d : (d?.toDate?.() ?? new Date(d)));

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status === 'inProgress' || t.status === 'paused'),
    [tasks],
  );

  const now = Date.now();

  // wybór najpilniejszego zadania
  const urgent: Task | null = useMemo(() => {
    if (activeTasks.length === 0) return null;

    const late = activeTasks.filter((t) => now > normalizeDate(t.dueDate).getTime());

    if (late.length > 0) {
      return late.reduce((a, b) => {
        const da = normalizeDate(a.dueDate).getTime();
        const db = normalizeDate(b.dueDate).getTime();
        return da <= db ? a : b;
      });
    }

    const sorted = [...activeTasks].sort((a, b) => {
      const da = normalizeDate(a.dueDate).getTime();
      const db = normalizeDate(b.dueDate).getTime();

      if (da !== db) return da - db;

      const ca = normalizeDate(a.createdAt).getTime();
      const cb = normalizeDate(b.createdAt).getTime();
      return ca - cb;
    });

    return sorted[0];
  }, [activeTasks]);

  const hasTasks = activeTasks.length > 0;

  const isLate = urgent ? now > normalizeDate(urgent.dueDate).getTime() : false;

  // animacje
  const shakeX = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  // wstrząs (native)
  useEffect(() => {
    if (!isLate) return;

    const runShake = () => {
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
          toValue: 3,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ]).start(() => {
        if (isLate) runShake();
      });
    };

    runShake();
  }, [isLate]);

  // pulsowanie (native)
  useEffect(() => {
    if (!isLate) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.5,
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
        <Wrapper>
          {isLate && <PulseOverlay pointerEvents="none" style={{ opacity: pulse }} />}

          <AnimatedCard
            style={{
              transform: [{ translateX: shakeX }],
            }}
          >
            <HomeTaskCard
              task={urgent}
              onPause={() => updateTaskStatus(urgent.id, 'paused')}
              onDone={() => completeTask(urgent.id, urgent.difficulty)}
            />
          </AnimatedCard>
        </Wrapper>
      )}

      {hasTasks && (
        <FloatingButton onPress={() => router.push('/add-task')}>
          <Ionicons name="add" size={28} color="#fff" />
        </FloatingButton>
      )}
    </Screen>
  );
}

// STYLES

const Wrapper = styled.View`
  position: relative;
  margin: 0;
  padding: 0;
`;

const PulseOverlay = styled(Animated.View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 18px;
  background-color: rgba(255, 0, 0, 0.45);
  z-index: 1;
`;

const AnimatedCard = styled(Animated.View)`
  z-index: 2;
`;

const Screen = styled.SafeAreaView`
  flex: 1;
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
  text-align: center;
  color: #9aa8b2;
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
