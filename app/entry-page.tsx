import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onLogin?: () => void;
  onRegister?: () => void;
}

export default function EntryPage({ onLogin, onRegister }: Props) {
  return (
    <Screen>
      <ContentCard>
        <LogoWrapper>
          <Ionicons name="checkmark-done-circle" size={80} color="#2875d4" />
        </LogoWrapper>

        <Title>Witaj w Tasko!</Title>

        <Message>Aby korzystać z aplikacji musisz się zalogować lub założyć nowe konto.</Message>

        <ButtonsWrapper>
          <LoginButton onPress={onLogin}>
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <ButtonText>Zaloguj się</ButtonText>
          </LoginButton>

          <RegisterButton onPress={onRegister}>
            <Ionicons name="person-add-outline" size={20} color="#2875d4" />
            <RegisterButtonText>Zarejestruj się</RegisterButtonText>
          </RegisterButton>
        </ButtonsWrapper>
      </ContentCard>
    </Screen>
  );
}

// style
const Screen = styled.SafeAreaView`
  flex: 1;
  background-color: #f5f5d5;
  justify-content: center;
  padding: 24px;
`;

const ContentCard = styled.View`
  background-color: white;
  border-radius: 24px;
  padding: 40px 24px;
  align-items: center;
  shadow-color: #000;
  shadow-opacity: 0.15;
  shadow-radius: 20px;
  elevation: 8;
`;

const LogoWrapper = styled.View`
  margin-bottom: 24px;
`;

const Title = styled.Text`
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
`;

const Message = styled.Text`
  font-size: 16px;
  color: #666;
  text-align: center;
  line-height: 24px;
  margin-bottom: 32px;
`;

const ButtonsWrapper = styled.View`
  width: 100%;
  gap: 12px;
`;

const LoginButton = styled.TouchableOpacity`
  background-color: #2875d4;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-radius: 12px;
  gap: 8px;
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 700;
`;

const RegisterButton = styled.TouchableOpacity`
  background-color: transparent;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-radius: 12px;
  border: 2px solid #2875d4;
  gap: 8px;
`;

const RegisterButtonText = styled.Text`
  color: #2875d4;
  font-size: 16px;
  font-weight: 700;
`;
