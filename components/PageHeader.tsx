import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface PageHeaderProps {
  title: string;
  onBackPress?: () => void;
  showBackButton?: boolean;
}

export default function PageHeader({
  title,
  onBackPress,
  showBackButton = false,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <HeaderCard>
      {showBackButton ? (
        <BackButton onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </BackButton>
      ) : (
        <Placeholder />
      )}

      <HeaderTitle>{title}</HeaderTitle>
      <Placeholder />
    </HeaderCard>
  );
}

// style
const HeaderCard = styled.View`
  background-color: #2875d4;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  margin: 16px;
  margin-bottom: 8px;
  border-radius: 16px;
  shadow-color: #000;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
  elevation: 5;
`;

const BackButton = styled.TouchableOpacity`
  padding: 4px;
`;

const HeaderTitle = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: white;
`;

const Placeholder = styled.View`
  width: 32px;
`;
