import React, { useState } from 'react';
import { FlatList, Modal , ScrollView, TouchableWithoutFeedback} from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../components/TopBar';
import TaskItem from '../components/TaskItem';
import { useTasks, Task } from '../context/TaskContext';
import TaskDetailModal from '../components/TaskDetailModal';

export default function HomeScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const { tasks } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const inProgress = tasks.filter(t => t.status === 'inProgress');
  const done = tasks.filter(t => t.status === 'done');
  const cancelled = tasks.filter(t => t.status === 'cancelled');

  interface TaskType {
    id: string;
    title: string;
    difficulty?: 'Łatwy' | 'Średni' | 'Trudny';
  }


  return (
    <Screen>
      <TopBar
        onMenuPress={() => setMenuVisible(true)}
        avatarUri={''}
        currentXP={0}
        maxXP={0}
        currentHP={0}
        maxHP={0}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 80}}>
        <Section>
          <SectionHeader>W toku</SectionHeader>
          <FlatList
          data={inProgress}
          scrollEnabled={false}
          keyExtractor={t => t.id}
          renderItem={({ item }: {item: TaskType}) => (
            <TaskItem
              title={item.title}
              difficulty={item.difficulty}
              onPress={() => {
                setSelectedTask({
                  id: item.id,
                  title: item.title,
                  difficulty: item.difficulty ?? 'Łatwy',
                  description: '',
                  dueDate: new Date(),
                  status: 'inProgress'
                });
                setModalVisible(true);
              }}
            />
          )}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<EmptyText>Brak zadań – dodaj nowe!</EmptyText>}
        />
        </Section>

        <Section>
          <SectionHeader>Wstrzymane</SectionHeader>
          <FlatList
            data={done}
            scrollEnabled={false}
            keyExtractor={t => t.id}
            renderItem={({ item }: {item: TaskType}) => (
              <TaskItem
                title={item.title}
                difficulty={item.difficulty}
                onPress={() => {
                  setSelectedTask({
                    id: item.id,
                    title: item.title,
                    difficulty: item.difficulty ?? 'Łatwy',
                    description: '',
                    dueDate: new Date(),
                    status: 'done'
                  });
                  setModalVisible(true);
                }}
              />
            )}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={<EmptyText>Brak wstrzymanych zadań</EmptyText>}
          />
        </Section>

        <Section>
          <SectionHeader>Wykonane</SectionHeader>
          <FlatList
            data={cancelled}
            scrollEnabled={false}
            keyExtractor={t => t.id}
            renderItem={({ item }: {item: TaskType}) => (
              <TaskItem
                title={item.title}
                difficulty={item.difficulty}
                onPress={() => {
                  setSelectedTask({
                    id: item.id,
                    title: item.title,
                    difficulty: item.difficulty ?? 'Łatwy',
                    description: '',
                    dueDate: new Date(),
                    status: 'cancelled'
                  });
                  setModalVisible(true);
                }}
              />
            )}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={<EmptyText>Brak anulowanych zadań</EmptyText>}
          />
        </Section>
      </ScrollView>

       <Modal visible={!!selectedTask} transparent animationType='fade'>
          <TouchableWithoutFeedback onPress={() => setSelectedTask(null)}>
            <Overlay/>
          </TouchableWithoutFeedback>

          {selectedTask && (
            <TaskDetailModal
              visible={modalVisible}
              taskId={selectedTask.id}              
              onClose={() => setSelectedTask(null)}
            />
          )}  
       </Modal>

      <FloatingButton onPress={() => router.push('/add-task')}>
        <Ionicons name="add" size={28} color="#fff" />
      </FloatingButton>

      <Modal visible={menuVisible} transparent animationType="fade">
        <MenuOverlay>
          <MenuContainer>
            <CloseButton onPress={() => setMenuVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </CloseButton>
            <MenuItem onPress={() => { setMenuVisible(false); router.push('/'); }}>
              <MenuText>Home</MenuText>
            </MenuItem>
            <MenuItem onPress={() => { setMenuVisible(false); router.push('/'); }}>
              <MenuText>Zadania</MenuText>
            </MenuItem>
            <MenuItem onPress={() => { setMenuVisible(false); router.push('/'); }}>
              <MenuText>Statystyki</MenuText>
            </MenuItem>
            <MenuItem onPress={() => { setMenuVisible(false); router.push('/'); }}>
              <MenuText>Wyzwania</MenuText>
            </MenuItem>
            <MenuItem onPress={() => { setMenuVisible(false); router.push('/'); }}>
              <MenuText>Kontakt</MenuText>
            </MenuItem>
            <MenuItem onPress={() => { setMenuVisible(false); router.push('/'); }}>
              <MenuText>Faq</MenuText>
            </MenuItem>
          </MenuContainer>
        </MenuOverlay>
      </Modal>
    </Screen>
  );
}

const Screen = styled.SafeAreaView`
  flex: 1;
`;

const Section = styled.View`margin-bottom: 20px;`;

const SectionHeader = styled.Text`
  font-size: 18px;
  font-weight: bold;
  margin: 0 16px 8px;
`;

const Overlay = styled.View`
  flex: 1;
  background-color: rgba(0,0,0,0.4);
`;

const EmptyText = styled.Text`
  text-align: center;
  color: #888;
  margin: 16px 0;
`;

const FloatingButton = styled.TouchableOpacity`
  position: absolute;
  right: 24px;
  bottom: 56px;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: #2875d4;
  align-items: center;
  justify-content: center;
  elevation: 8;
`;

// ——— Menu modal styling ———

const MenuOverlay = styled.View`
  flex: 1;
  justify-content: center;
  margin: 50px;
`;

const MenuContainer = styled.View`
  flex: 1;
  width: 100%;
  padding: 24px;
  background-color: rgba(255,255,255,0.9);
  border-radius: 12px;
  justify-content: center;
  align-items: center;
`;

const CloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 8px;
  z-index: 1;
`;

const MenuItem = styled.TouchableOpacity`
  padding-vertical: 12px;
`;

const MenuText = styled.Text`
  font-size: 24px;
  color: #333;
`;
