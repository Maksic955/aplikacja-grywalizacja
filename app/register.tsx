import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Alert, Pressable } from 'react-native';
import styled from 'styled-components/native';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/services/firebase';

export default function RegisterScreen() {
  const router = useRouter();
  const auth = useAuth() as any;
  const user = auth?.user;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');

  useEffect(() => {
    if (user) router.replace('/');
  }, [user]);

  const onSubmit = async () => {
    if (!email.trim()) return Alert.alert('Błąd', 'Podaj e-mail.');
    if (password.length < 6)
      return Alert.alert('Błąd', 'Hasło musi zawierać co najmniej 6 znaków.');
    if (password !== repeat) return Alert.alert('Błąd', 'Hasła się różnią.');

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
      <Title>Utwórz konto</Title>

      <Input
        placeholder="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Input placeholder="Hasło" secureTextEntry value={password} onChangeText={setPassword} />

      <Input placeholder="Powtórz hasło" secureTextEntry value={repeat} onChangeText={setRepeat} />

      <PrimaryButton onPress={onSubmit}>
        <BtnText>Zarejestruj się</BtnText>
      </PrimaryButton>

      <SmallRow>
        <SmallText>Masz już konto? </SmallText>
        {/* Naprawić przekierowanie w linku */}
        <Pressable onPress={() => router.push('/login')}>
          <SmallText>Zaloguj się</SmallText>
        </Pressable>
      </SmallRow>
    </Screen>
  );
}

const Screen = styled.SafeAreaView`
  flex: 1;
  padding: 16px;
  gap: 12px;
  background-color: #2f3a4a;
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const Input = styled.TextInput`
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 12px;
`;

const PrimaryButton = styled.TouchableOpacity`
  background-color: #2875d4;
  padding: 12px;
  border-radius: 8px;
  align-items: center;
  margin-top: 4px;
`;

const BtnText = styled.Text`
  color: #fff;
  font-weight: 700;
`;

const SmallRow = styled.View`
  flex-direction: row;
  margin-top: 8px;
`;

const SmallText = styled.Text`
  font-size: 16px;
  color: #000;
`;
