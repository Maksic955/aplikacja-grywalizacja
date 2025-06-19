import React from 'react';
import styled from 'styled-components/native';

interface ProgressBarProps {
  value: number;
  maxValue: number;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
}

const Container = styled.View<{ height: number; backgroundColor: string }>`
  width: 100%;
  height: ${({ height }: { height: number }) => height}px;
  background-color: ${({ backgroundColor }: { backgroundColor: string }) => backgroundColor};
  border-radius: ${({ height }: { height: number }) => height / 2}px;
  overflow: hidden;
`;

const Fill = styled.View<{ fillWidth: string; fillColor: string }>`
  width: ${({ fillWidth }: { fillWidth: string }) => fillWidth};
  height: 100%;
  background-color: ${({ fillColor }: { fillColor: string }) => fillColor};
`;

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  maxValue,
  height = 6,
  backgroundColor = '#E0E0E0',
  fillColor = '#4CAF50',
}) => {
  const ratio = Math.min(Math.max(value / maxValue, 0), 1);
  const fillWidth = `${ratio * 100}%`;

  return (
    <Container height={height} backgroundColor={backgroundColor}>
      <Fill fillWidth={fillWidth} fillColor={fillColor} />
    </Container>
  );
};

export default ProgressBar;
