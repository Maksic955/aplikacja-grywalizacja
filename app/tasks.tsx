import { useState } from 'react';
import { Modal, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';

import PageHeader from '@/components/PageHeader';
import TaskItem from '@/components/TaskItem';
import TaskDetailModal from '../components/TaskDetailModal';
import { useTasks, Task } from '../context/TaskContext';

export default function TasksScreen() {
  const router = useRouter();
  const { tasks } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const inProgress = tasks.filter((t) => t.status === 'inProgress');
  const paused = tasks.filter((t) => t.status === 'paused');
  const done = tasks.filter((t) => t.status === 'done');

  return (
    <Screen>
      <ScrollContainer contentContainerStyle={{ paddingBottom: 120 }}>
        <PageHeader title="Zadania" showBackButton={false} />

        <Section>
          <SectionHeader>W toku</SectionHeader>
          {inProgress.length === 0 ? (
            <EmptyCard>
              <EmptyText>Brak zadań – dodaj nowe!</EmptyText>
            </EmptyCard>
          ) : (
            inProgress.map((task) => (
              <TaskItem
                key={task.id}
                title={task.title}
                difficulty={task.difficulty}
                description={task.description}
                dueDate={task.dueDate}
                allowShake={true}
                onPress={() => setSelectedTask(task)}
              />
            ))
          )}
        </Section>

        <Section>
          <SectionHeader>Wstrzymane</SectionHeader>
          {paused.length === 0 ? (
            <EmptyCard>
              <EmptyText>Brak wstrzymanych zadań</EmptyText>
            </EmptyCard>
          ) : (
            paused.map((task) => (
              <TaskItem
                key={task.id}
                title={task.title}
                difficulty={task.difficulty}
                description={task.description}
                dueDate={task.dueDate}
                allowShake={true}
                onPress={() => setSelectedTask(task)}
              />
            ))
          )}
        </Section>

        <Section>
          <SectionHeader>Wykonane</SectionHeader>
          {done.length === 0 ? (
            <EmptyCard>
              <EmptyText>Brak wykonanych zadań</EmptyText>
            </EmptyCard>
          ) : (
            done.map((task) => (
              <TaskItem
                key={task.id}
                title={task.title}
                difficulty={task.difficulty}
                description={task.description}
                dueDate={task.dueDate}
                allowShake={false}
                onPress={() => setSelectedTask(task)}
              />
            ))
          )}
        </Section>
      </ScrollContainer>

      <Modal visible={!!selectedTask} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSelectedTask(null)}>
          <Overlay />
        </TouchableWithoutFeedback>

        {selectedTask && (
          <TaskDetailModal
            visible={true}
            taskId={selectedTask.id}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </Modal>

      <FloatingButton onPress={() => router.push('/add-task')} activeOpacity={0.7}>
        <Ionicons name="add" size={28} color="#fff" />
      </FloatingButton>
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

const Section = styled.View`
  padding: 16px;
  padding-top: 8px;
`;

const SectionHeader = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
`;

const EmptyCard = styled.View`
  background-color: white;
  border-radius: 12px;
  padding: 32px 16px;
  align-items: center;
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`;

const EmptyText = styled.Text`
  text-align: center;
  color: #999;
  font-size: 14px;
`;

const Overlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
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
