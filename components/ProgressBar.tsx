import { useEffect } from 'react';
import styled from 'styled-components/native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface ProgressBarProps {
  value: number;
  maxValue: number;
  height: number;
  backgroundColor?: string;
  fillColor?: string;
  radius?: number;
}

export default function ProgressBar({
  value,
  maxValue,
  height,
  backgroundColor = '#e0e0e0',
  fillColor = '#76c7c0',
  radius = 8,
}: ProgressBarProps) {
  const ratio = Math.min(Math.max(value / maxValue, 0), 1);

  const animatedRatio = useSharedValue(ratio);

  useEffect(() => {
    animatedRatio.value = withSpring(ratio, {
      damping: 30,
      stiffness: 60,
      mass: 0.5,
    });
  }, [ratio]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedRatio.value * 100}%`,
  }));

  return (
    <BarContainer height={height} backgroundColor={backgroundColor} radius={radius}>
      <AnimatedBarFill style={animatedStyle} fillColor={fillColor} radius={radius} />
    </BarContainer>
  );
}

// style
const BarContainer = styled.View<{ height: number; backgroundColor: string; radius: number }>`
  width: 100%;
  height: ${({ height }) => height}px;
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: ${({ radius }) => radius}px;
  overflow: hidden;
`;

const BarFill = styled.View<{ fillColor: string; radius?: number }>`
  height: 100%;
  background-color: ${({ fillColor }) => fillColor};
  border-radius: ${({ radius }) => radius}px;
`;

const AnimatedBarFill = Animated.createAnimatedComponent(BarFill);
