import { useState } from 'react';
import { FlatList, Modal, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';

import TaskItem from '../components/TaskItem';
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
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* W TOKU */}
        <Section>
          <SectionHeader>W toku</SectionHeader>

          <FlatList
            data={inProgress}
            scrollEnabled={false}
            keyExtractor={(t) => t.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={<EmptyText>Brak zadań – dodaj nowe!</EmptyText>}
            renderItem={({ item }: { item: Task }) => (
              <TaskItem
                allowShake={true}
                title={item.title}
                difficulty={item.difficulty}
                dueDate={item.dueDate}
                onPress={() => setSelectedTask(item)}
              />
            )}
          />
        </Section>

        {/* WSTRZYMANE */}
        <Section>
          <SectionHeader>Wstrzymane</SectionHeader>

          <FlatList
            data={paused}
            scrollEnabled={false}
            keyExtractor={(t) => t.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={<EmptyText>Brak wstrzymanych zadań</EmptyText>}
            renderItem={({ item }: { item: Task }) => (
              <TaskItem
                allowShake={true}
                title={item.title}
                difficulty={item.difficulty}
                dueDate={item.dueDate}
                onPress={() => setSelectedTask(item)}
              />
            )}
          />
        </Section>

        {/* WYKONANE */}
        <Section>
          <SectionHeader>Wykonane</SectionHeader>

          <FlatList
            data={done}
            scrollEnabled={false}
            keyExtractor={(t) => t.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={<EmptyText>Brak wykonanych zadań</EmptyText>}
            renderItem={({ item }: { item: Task }) => (
              <TaskItem
                allowShake={false} // <— ważne: żadnych wstrząsów
                title={item.title}
                difficulty={item.difficulty}
                dueDate={item.dueDate}
                onPress={() => setSelectedTask(item)}
              />
            )}
          />
        </Section>
      </ScrollView>

      {/* Modal szczegółów */}
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

      {/* FAB */}
      <FloatingButton onPress={() => router.push('/add-task')}>
        <Ionicons name="add" size={28} color="#fff" />
      </FloatingButton>
    </Screen>
  );
}

// STYLES;

const Screen = styled.SafeAreaView`
  flex: 1;
`;

const Section = styled.View`
  margin-bottom: 20px;
`;

const SectionHeader = styled.Text`
  font-size: 18px;
  font-weight: bold;
  margin: 0 16px 8px;
`;

const Overlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.4);
`;

const EmptyText = styled.Text`
  text-align: center;
  color: #888;
  margin: 16px 0;
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
