import styled from 'styled-components/native';

interface Props { 
  onLogin?: () => void;
  onRegister?: () => void;
}

export default function EntryPage({ onLogin, onRegister }: Props) {
  return (
    <Wrapper>
      <Message>Witaj w Tasko! Jeśli chcesz korzystać z aplikacji musisz założyć konto lub się zalogować jeśli już je masz.</Message>
      <ButtonsWrapper>
        <EntryButton onPress={onLogin}>
          <ButtonText>Zaloguj się</ButtonText>
        </EntryButton>
        <EntryButton onPress={onRegister}>
          <ButtonText>Zarejestruj się</ButtonText>
        </EntryButton>
      </ButtonsWrapper>
    </Wrapper>
  );
}

const Wrapper = styled.View`
  flex: 1;
  background-color: #FAF0E6;
  justify-content: center;
  align-items: center;
  padding: 32px;
  border-radius: 5px;
  border: 3px solid black;
`;

const Message = styled.Text`
  font-size: 18px;
  color: black;
  text-align: center;
  margin-bottom: 40px;
`;

const ButtonsWrapper = styled.View`
  width: 100%;
  gap: 16px;
`;

const EntryButton = styled.TouchableOpacity`
  background-color: #fff;

  border-style: solid;
  border-radius: 16px;
  border-width: 3px;
  border-color: #000;

  align-items: center;
  padding-vertical: 12px;

  shadow-color: #000;
  shadow-opacity: 0.2;
  shadow-radius: 0px;
  elevation: 0;
`;

const ButtonText = styled.Text`
  color: black;
  font-size: 16px;
  font-weight: bold;
`;