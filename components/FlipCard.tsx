import { useState } from 'react';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface FlipCardProps {
  title: string;
  image: string;
  description: string;
  variant?: 'challenge' | 'badge';
}

export default function FlipCard({
  title,
  image,
  description,
  variant = 'challenge',
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const opacity = useSharedValue(1);

  const handlePress = () => {
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(setShowContent)(!showContent);
        runOnJS(setIsFlipped)(!isFlipped);
        opacity.value = withTiming(1, { duration: 200 });
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <CardWrapper onPress={handlePress} activeOpacity={0.8}>
      <CardFace variant={variant}>
        <AnimatedContent style={animatedStyle}>
          {!showContent ? (
            <>
              <CardImage>{image}</CardImage>
              {variant === 'badge' && (
                <CheckmarkCircle>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </CheckmarkCircle>
              )}
            </>
          ) : (
            <TextContent>
              <CardTitle variant={variant}>{title}</CardTitle>
              <CardDescription variant={variant}>{description}</CardDescription>
            </TextContent>
          )}
        </AnimatedContent>
      </CardFace>
    </CardWrapper>
  );
}

// style
const CardWrapper = styled.TouchableOpacity`
  width: 30%;
  aspect-ratio: 1;
`;

const CardFace = styled.View<{ variant: 'challenge' | 'badge' }>`
  width: 100%;
  height: 100%;
  background-color: ${({ variant }) => (variant === 'badge' ? '#e8f5e9' : '#f0f4f8')};
  border-radius: 12px;
  justify-content: center;
  align-items: center;
  border: 2px solid ${({ variant }) => (variant === 'badge' ? '#4caf50' : '#e0e6ed')};
  padding: 8px;
  position: relative;
`;

const Content = styled.View`
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
`;

const AnimatedContent = Animated.createAnimatedComponent(Content);

const CardImage = styled.Text`
  font-size: 48px;
`;

const CheckmarkCircle = styled.View`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: #4caf50;
  justify-content: center;
  align-items: center;
  z-index: 10;
`;

const TextContent = styled.View`
  justify-content: center;
  align-items: center;
`;

const CardTitle = styled.Text<{ variant: 'challenge' | 'badge' }>`
  font-size: 12px;
  font-weight: 700;
  color: ${({ variant }) => (variant === 'badge' ? '#2e7d32' : '#333')};
  text-align: center;
  margin-bottom: 4px;
`;

const CardDescription = styled.Text<{ variant: 'challenge' | 'badge' }>`
  font-size: 10px;
  color: ${({ variant }) => (variant === 'badge' ? '#558b2f' : '#666')};
  text-align: center;
  line-height: 14px;
`;
