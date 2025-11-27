import { useEffect, useState } from 'react';
import { Alert, Pressable } from 'react-native';
import styled from 'styled-components/native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function LoginScrn() {
  const router = useRouter();
  const { user, login} = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) router.replace('/');
  }, [user]);

  const onSubmit = async () => {
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Logowanie nieudane', e?.message ?? 'Spróbuj ponownie.');
    }
  };

  return (
    <Screen>
      <Title>Zaloguj się</Title>
      <Input 
        placeholder="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Input 
        placeholder="Hasło"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <PrimaryButton onPress={onSubmit}>
        <BtnText>Zaloguj</BtnText>
      </PrimaryButton>

      <SmallRow>
        <SmallText>Nie masz konta? </SmallText>
        <Pressable onPress={() => router.push('/register')} >
          <SmallText>Zarejestruj się</SmallText>
        </Pressable>
      </SmallRow>
    </Screen>
  )
}

const Screen = styled.SafeAreaView`
  flex: 1;
  padding: 16px;
  gap: 12px;
  background-color: #2f3a4a;
`;

const Title = styled.Text`
  font-size: 22px;
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