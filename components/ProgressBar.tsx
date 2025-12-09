import styled from 'styled-components/native';

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

  return (
    <BarContainer height={height} backgroundColor={backgroundColor} radius={radius}>
      <BarFill ratio={ratio} fillColor={fillColor} radius={radius} />
    </BarContainer>
  );
}

const BarContainer = styled.View<{ height: number; backgroundColor: string; radius: number }>`
  width: 100%;
  height: ${({ height }) => height}px;
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: ${({ radius }) => radius}px;
  overflow: hidden;
`;

const BarFill = styled.View<{ ratio: number; fillColor: string; radius?: number }>`
  width: ${({ ratio }) => ratio * 100}%;
  height: 100%;
  background-color: ${({ fillColor }) => fillColor};
  border-radius: ${({ radius }) => radius}px;
`;
