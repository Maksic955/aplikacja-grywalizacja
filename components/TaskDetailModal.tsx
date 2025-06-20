import React from 'react';
import styled from 'styled-components/native';
import { useTasks } from '../context/TaskContext';
import { Ionicons } from '@expo/vector-icons';
;

interface Props {
  visible: boolean;
  taskId: string;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, onClose }: Props) {
  const { tasks, updateTaskStatus } = useTasks();
  const task = tasks.find(t => t.id === taskId);

  if (!task) return null;

  return (
    <Container>
    <CloseButton onPress={onClose}>
      <Ionicons name="close" size={28} color="#333" />
    </CloseButton>

    <Title>{task?.title}</Title>
    <Label>Trudność: {task?.difficulty}</Label>
    <Label>Opis:</Label>
    <Description>{task?.description}</Description>
    <Label>Termin: {task?.dueDate.toLocaleDateString()}</Label>

    {task.status === 'inProgress' ? (
        <Actions>
          <ActionButton cancel onPress={() => { updateTaskStatus(task.id, 'cancelled'); onClose(); }}>
            <ActionText>Wykonane</ActionText>
          </ActionButton>
          <ActionButton onPress={() => { updateTaskStatus(task.id, 'done'); onClose(); }}>
            <ActionText>Wstrzymaj</ActionText>
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

const Container = styled.View`
  position: absolute;
  top: 80px;
  left: 20px;
  right: 20px;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  elevation: 8;
`;

const CloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
`;

const Title = styled.Text`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 12px;
`;

const Label = styled.Text`
  font-size: 14px;
  margin-top: 8px;
  color: #555;
`;

const Description = styled.Text`
  font-size: 16px;
  color: #333;
`;

const Actions = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 24px;
`;

const ActionButton = styled.TouchableOpacity<{ cancel?: boolean }>`
  flex: 1;
  padding: 12px;
  margin: 0 4px;
  background-color: ${(p: { cancel?: boolean }) => p.cancel ? '#d9534f' : '#5cb85c'};
  border-radius: 4px;
  align-items: center;
`;

const ActionText = styled.Text`
  color: #fff;
  font-weight: bold;
`;

const RestoreButton = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  margin: 0 4px;
  background-color: #007bff;
  border-radius: 4px;
  align-items: center;
`;