import React from 'react';
import styled from 'styled-components/native';

interface TaskItemProps {
  title: string;
  difficulty?: 'Łatwy' | 'Średni' | 'Trudny';
  onPress?: () => void;
}

const Container = styled.TouchableOpacity`
  background-color: #fff;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  elevation: 2;
`;

const Title = styled.Text`
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
`;

const Difficulty = styled.Text`
  font-size: 14px;
  color: #666;
`;

const TaskItem: React.FC<TaskItemProps> = ({ title, difficulty, onPress }) => (
  <Container activeOpacity={0.7} onPress={onPress}>
    <Title>{title}</Title>
    {difficulty && <Difficulty>Trudność: {difficulty}</Difficulty>}
  </Container>
);

export default TaskItem;
