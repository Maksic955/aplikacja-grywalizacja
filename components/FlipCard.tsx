import { useEffect, useState } from 'react';
import styled from 'styled-components/native';
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
}

export default function FlipCard({ title, image, description }: FlipCardProps) {
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
      <CardFace>
        <AnimatedContent style={animatedStyle}>
          {!showContent ? (
            <CardImage>{image}</CardImage>
          ) : (
            <TextContent>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
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

const CardFace = styled.View`
  width: 100%;
  height: 100%;
  background-color: #f0f4f8;
  border-radius: 12px;
  justify-content: center;
  align-items: center;
  border: 2px solid #e0e6ed;
  padding: 8px;
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

const TextContent = styled.View`
  justify-content: center;
  align-items: center;
`;

const CardTitle = styled.Text`
  font-size: 12px;
  font-weight: 700;
  color: #333;
  text-align: center;
  margin-bottom: 4px;
`;

const CardDescription = styled.Text`
  font-size: 10px;
  color: #666;
  text-align: center;
  line-height: 14px;
`;
