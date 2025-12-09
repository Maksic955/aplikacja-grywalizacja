import { useEffect, useState } from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { user, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) router.replace('/');
  }, [user]);

  const validateEmail = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) {
      setEmailError('');
    } else if (!emailRegex.test(text)) {
      setEmailError('Nieprawidłowy format e-mail');
    } else {
      setEmailError('');
    }
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    if (!text) {
      setPasswordError('');
    } else if (text.length < 6) {
      setPasswordError('Hasło musi mieć minimum 6 znaków');
    } else {
      setPasswordError('');
    }
  };

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola');
      return;
    }

    if (emailError || passwordError) {
      Alert.alert('Błąd', 'Popraw błędy w formularzu');
      return;
    }

    try {
      await login(email.trim(), password);
      setTimeout(() => {
        Alert.alert('Witamy ponownie!', 'Tasko się cieszy, że wróciłeś/aś! 😊');
        router.replace('/');
      }, 1000);
    } catch (e: any) {
      Alert.alert('Błąd logowania', 'Hasło lub e-mail są nieprawidłowe.');
    }
  };

  return (
    <Screen>
      <ContentCard>
        <Header>
          <BackButton onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2875d4" />
          </BackButton>
          <Title>Zaloguj się</Title>
          <Placeholder />
        </Header>

        <FormSection>
          <InputWrapper>
            <Label>E-mail</Label>
            <InputContainer hasError={!!emailError}>
              <Ionicons name="mail-outline" size={20} color={emailError ? '#e53935' : '#666'} />
              <Input
                placeholder="twoj@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={validateEmail}
                hasError={!!emailError}
              />
              {email && !emailError && (
                <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
              )}
            </InputContainer>
            {emailError && <ErrorText>{emailError}</ErrorText>}
          </InputWrapper>

          <InputWrapper>
            <Label>Hasło</Label>
            <InputContainer hasError={!!passwordError}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordError ? '#e53935' : '#666'}
              />
              <Input
                placeholder="Minimum 6 znaków"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={validatePassword}
                hasError={!!passwordError}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </InputContainer>
            {passwordError && <ErrorText>{passwordError}</ErrorText>}
          </InputWrapper>

          <SubmitButton
            onPress={onSubmit}
            disabled={!email || !password || !!emailError || !!passwordError}
          >
            <ButtonText>Zaloguj</ButtonText>
          </SubmitButton>
        </FormSection>

        <FooterRow>
          <FooterText>Nie masz konta? </FooterText>
          <FooterLink onPress={() => router.push('/register')}>
            <FooterLinkText>Zarejestruj się</FooterLinkText>
          </FooterLink>
        </FooterRow>
      </ContentCard>
    </Screen>
  );
}

// style
const Screen = styled.SafeAreaView`
  flex: 1;
  background-color: #f5f5d5;
  padding: 16px 24px;
  padding-top: 48px;
`;

const ContentCard = styled.View`
  background-color: white;
  border-radius: 24px;
  padding: 24px;
  shadow-color: #000;
  shadow-opacity: 0.15;
  shadow-radius: 20px;
  elevation: 8;
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const BackButton = styled.TouchableOpacity`
  padding: 4px;
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: 700;
  color: #333;
`;

const Placeholder = styled.View`
  width: 32px;
`;

const FormSection = styled.View`
  gap: 20px;
  margin-bottom: 24px;
`;

const InputWrapper = styled.View`
  gap: 8px;
`;

const Label = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

const InputContainer = styled.View<{ hasError?: boolean }>`
  flex-direction: row;
  align-items: center;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 2px solid ${({ hasError }) => (hasError ? '#e53935' : '#e0e0e0')};
  padding: 12px 16px;
  gap: 12px;
`;

const Input = styled.TextInput<{ hasError?: boolean }>`
  flex: 1;
  font-size: 16px;
  color: #333;
`;

const ErrorText = styled.Text`
  font-size: 12px;
  color: #e53935;
  margin-left: 4px;
`;

const SubmitButton = styled.TouchableOpacity<{ disabled?: boolean }>`
  background-color: ${({ disabled }) => (disabled ? '#ccc' : '#2875d4')};
  padding: 16px;
  border-radius: 12px;
  align-items: center;
  margin-top: 8px;
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 700;
`;

const FooterRow = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const FooterText = styled.Text`
  font-size: 14px;
  color: #666;
`;

const FooterLink = styled.TouchableOpacity``;

const FooterLinkText = styled.Text`
  font-size: 14px;
  color: #2875d4;
  font-weight: 700;
`;
