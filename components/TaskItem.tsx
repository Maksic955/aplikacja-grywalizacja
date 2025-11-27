import React, { useEffect, useRef } from 'react';
import styled from 'styled-components/native';
import { Animated } from 'react-native';

interface TaskItemProps {
  title: string;
  difficulty?: 'latwy' | 'sredni' | 'trudny';
  dueDate?: any;
  allowShake?: boolean;
  onPress?: () => void;
}

const difficultyLabels: Record<'latwy' | 'sredni' | 'trudny', string> = {
  latwy: 'Łatwy',
  sredni: 'Średni',
  trudny: 'Trudny',
};

export default function TaskItem({
  title,
  difficulty,
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
          useNativeDriver: false,
        }),
        Animated.timing(shakeX, {
          toValue: -4,
          duration: 70,
          useNativeDriver: false,
        }),
        Animated.timing(shakeX, {
          toValue: 2,
          duration: 50,
          useNativeDriver: false,
        }),
        Animated.timing(shakeX, {
          toValue: 0,
          duration: 50,
          useNativeDriver: false,
        }),
        Animated.delay(2200),
      ]).start(() => {
        if (isLate) loop();
      });
    };

    loop();
  }, [isLate]);

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLate) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [isLate]);

  const borderColor = isLate
    ? pulse.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255,70,70,0.3)', 'rgba(255,0,0,0.9)'],
      })
    : '#fff';

  return (
    <AnimatedContainer
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        transform: [{ translateX: isLate ? shakeX : 0 }],
        borderColor,
        borderWidth: isLate ? 2 : 0,
        backgroundColor: isLate ? '#ffe8e8' : '#fff',
        shadowColor: isLate ? '#ff0000' : '#000',
        shadowOpacity: isLate ? 0.4 : 0.1,
        shadowRadius: isLate ? 10 : 4,
      }}
    >
      <Title>{title}</Title>

      {difficulty && <Difficulty>Trudność: {difficultyLabels[difficulty]}</Difficulty>}

      {isLate && <LateInfo>Czas minął!</LateInfo>}
    </AnimatedContainer>
  );
}

// Style

const AnimatedContainer = Animated.createAnimatedComponent(styled.TouchableOpacity`
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 10px;
  elevation: 3;
`);

const Title = styled.Text`
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
`;

const Difficulty = styled.Text`
  font-size: 14px;
  color: #666;
`;

const LateInfo = styled.Text`
  margin-top: 6px;
  font-size: 12px;
  color: #b30000;
  font-weight: 700;
`;
