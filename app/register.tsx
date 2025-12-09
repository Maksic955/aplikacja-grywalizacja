import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Alert, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/services/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const auth = useAuth() as any;
  const user = auth?.user;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [repeatError, setRepeatError] = useState('');

  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);

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

    setHasMinLength(text.length >= 4);
    setHasNumber(/\d/.test(text));
    setHasSpecialChar(/[!@#$%^&*(),.?":{}|<>]/.test(text));

    if (!text) {
      setPasswordError('');
    } else if (text.length < 4) {
      setPasswordError('Hasło musi mieć minimum 4 znaki');
    } else if (!/\d/.test(text)) {
      setPasswordError('Hasło musi zawierać cyfrę');
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(text)) {
      setPasswordError('Hasło musi zawierać znak specjalny');
    } else {
      setPasswordError('');
    }

    if (repeat && text !== repeat) {
      setRepeatError('Hasła się różnią');
    } else if (repeat) {
      setRepeatError('');
    }
  };

  const validateRepeat = (text: string) => {
    setRepeat(text);
    if (!text) {
      setRepeatError('');
    } else if (text !== password) {
      setRepeatError('Hasła się różnią');
    } else {
      setRepeatError('');
    }
  };

  const onSubmit = async () => {
    if (!email || !password || !repeat) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola');
      return;
    }

    if (emailError || passwordError || repeatError) {
      Alert.alert('Błąd', 'Popraw błędy w formularzu');
      return;
    }

    try {
      const fn = auth.signUp ?? auth.register ?? auth.login;
      await fn(email.trim(), password);

      const sendWelcomeEmail = httpsCallable(functions, 'sendWelcomeEmail');
      sendWelcomeEmail({ email: email.trim() })
        .then(() => console.log('Welcome email sent'))
        .catch((err) => console.error('Error sending welcome email:', err));

      Alert.alert('Sukces!', 'Konto zostało utworzone.');
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Rejestracja nieudana', e?.message ?? 'Spróbuj ponownie.');
    }
  };

  return (
    <Screen>
      <ScrollContainer contentContainerStyle={{ paddingBottom: 120 }}>
        <ContentCard>
          <Header>
            <BackButton onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#2875d4" />
            </BackButton>
            <Title>Utwórz konto</Title>
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
                  placeholder="Utwórz bezpieczne hasło"
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

              {password && (
                <RequirementsBox>
                  <Requirement met={hasMinLength}>
                    <Ionicons
                      name={hasMinLength ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={hasMinLength ? '#4caf50' : '#999'}
                    />
                    <RequirementText met={hasMinLength}>Minimum 4 znaki</RequirementText>
                  </Requirement>
                  <Requirement met={hasNumber}>
                    <Ionicons
                      name={hasNumber ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={hasNumber ? '#4caf50' : '#999'}
                    />
                    <RequirementText met={hasNumber}>Minimum jedna cyfra</RequirementText>
                  </Requirement>
                  <Requirement met={hasSpecialChar}>
                    <Ionicons
                      name={hasSpecialChar ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={hasSpecialChar ? '#4caf50' : '#999'}
                    />
                    <RequirementText met={hasSpecialChar}>
                      Minimum jeden znak specjalny
                    </RequirementText>
                  </Requirement>
                </RequirementsBox>
              )}
            </InputWrapper>

            <InputWrapper>
              <Label>Powtórz hasło</Label>
              <InputContainer hasError={!!repeatError}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={repeatError ? '#e53935' : '#666'}
                />
                <Input
                  placeholder="Wpisz hasło ponownie"
                  secureTextEntry={!showRepeat}
                  value={repeat}
                  onChangeText={validateRepeat}
                  hasError={!!repeatError}
                />
                <TouchableOpacity onPress={() => setShowRepeat(!showRepeat)}>
                  <Ionicons
                    name={showRepeat ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </InputContainer>
              {repeatError && <ErrorText>{repeatError}</ErrorText>}
              {repeat && !repeatError && <SuccessText>✓ Hasła są zgodne</SuccessText>}
            </InputWrapper>

            <SubmitButton
              onPress={onSubmit}
              disabled={
                !email || !password || !repeat || !!emailError || !!passwordError || !!repeatError
              }
            >
              <ButtonText>Zarejestruj się</ButtonText>
            </SubmitButton>
          </FormSection>

          <FooterRow>
            <FooterText>Masz już konto? </FooterText>
            <FooterLink onPress={() => router.push('/login')}>
              <FooterLinkText>Zaloguj się</FooterLinkText>
            </FooterLink>
          </FooterRow>
        </ContentCard>
      </ScrollContainer>
    </Screen>
  );
}

// style
const Screen = styled.SafeAreaView`
  flex: 1;
  background-color: #f5f5d5;
`;

const ScrollContainer = styled.ScrollView`
  flex: 1;
  padding: 24px;
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

const SuccessText = styled.Text`
  font-size: 12px;
  color: #4caf50;
  margin-left: 4px;
`;

const RequirementsBox = styled.View`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  gap: 8px;
`;

const Requirement = styled.View<{ met?: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const RequirementText = styled.Text<{ met?: boolean }>`
  font-size: 12px;
  color: ${({ met }) => (met ? '#4caf50' : '#999')};
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
