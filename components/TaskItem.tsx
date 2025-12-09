import React, { useEffect, useRef } from 'react';
import styled from 'styled-components/native';
import { Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TaskItemProps {
  title: string;
  difficulty?: 'latwy' | 'sredni' | 'trudny';
  description?: string;
  dueDate?: any;
  allowShake?: boolean;
  onPress?: () => void;
}

const difficultyLabels: Record<'latwy' | 'sredni' | 'trudny', string> = {
  latwy: 'Łatwy',
  sredni: 'Średni',
  trudny: 'Trudny',
};

const difficultyColors: Record<'latwy' | 'sredni' | 'trudny', string> = {
  latwy: '#4caf50',
  sredni: '#ff9800',
  trudny: '#e53935',
};

export default function TaskItem({
  title,
  difficulty,
  description,
  dueDate,
  allowShake,
  onPress,
}: TaskItemProps) {
  let d: Date;

  if (dueDate instanceof Date) d = dueDate;
  else if (dueDate?.toDate) d = dueDate.toDate();
  else d = new Date(dueDate);

  if (!Number.isFinite(d.getTime())) {
    d = new Date(Date.now() + 1);
  }

  const now = Date.now();
  const isLate = allowShake && now > d.getTime();

  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLate) return;

    const loop = () => {
      Animated.sequence([
        Animated.timing(shakeX, {
          toValue: 4,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: -4,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: 2,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.delay(2200),
      ]).start(() => {
        if (isLate) loop();
      });
    };

    loop();
  }, [isLate]);

  const getDifficultyColor = () => {
    return difficulty ? difficultyColors[difficulty] : '#999';
  };

  const getDifficultyLabel = () => {
    return difficulty ? difficultyLabels[difficulty] : '';
  };

  return (
    <AnimatedContainer
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        transform: [{ translateX: shakeX }],
      }}
    >
      <TaskHeader>
        <TaskTitle numberOfLines={1}>{title}</TaskTitle>
        {difficulty && (
          <DifficultyBadge color={getDifficultyColor()}>
            <DifficultyText>{getDifficultyLabel()}</DifficultyText>
          </DifficultyBadge>
        )}
      </TaskHeader>

      {description && <TaskDescription numberOfLines={2}>{description}</TaskDescription>}

      <TaskFooter>
        <TaskDate isLate={isLate}>
          <Ionicons name="calendar-outline" size={14} color={isLate ? '#e53935' : '#666'} />
          <TaskDateText isLate={isLate}>
            {d.toLocaleDateString('pl-PL', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </TaskDateText>
        </TaskDate>
      </TaskFooter>
    </AnimatedContainer>
  );
}

// style
const Container = styled.TouchableOpacity`
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  elevation: 3;
`;

const AnimatedContainer = Animated.createAnimatedComponent(Container);

const TaskHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const TaskTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 8px;
`;

const DifficultyBadge = styled.View<{ color: string }>`
  background-color: ${({ color }) => color}20;
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid ${({ color }) => color};
`;

const DifficultyText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: #333;
`;

const TaskDescription = styled.Text`
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  line-height: 20px;
`;

const TaskFooter = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const TaskDate = styled.View<{ isLate?: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const TaskDateText = styled.Text<{ isLate?: boolean }>`
  font-size: 12px;
  color: ${({ isLate }) => (isLate ? '#e53935' : '#666')};
  font-weight: ${({ isLate }) => (isLate ? '700' : '400')};
`;
