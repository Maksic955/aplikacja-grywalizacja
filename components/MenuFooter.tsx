import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  onLogin: () => void;
  onRegister: () => void;
};

export default function MenuFooter({ onLogin, onRegister }: Props) {
  return (
    <Footer>
      <AuthBtn onPress={onLogin}>
        <BtnText>Zaloguj</BtnText>
      </AuthBtn>

      <AuthBtn onPress={onRegister}>
        <BtnText>Zarejestruj</BtnText>
      </AuthBtn>
    </Footer>
  );
}

export function LogoutBtn({ onLogout }: { onLogout: () => void }) {
  return (
    <Footer>
      <LogOutlineBtn onPress={onLogout} style={{ shadowOffset: { width: 3, height: 3 } }}>
        <Ionicons name="log-out-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
        <LgOutBtnText>Wyloguj</LgOutBtnText>
      </LogOutlineBtn>
    </Footer>
  );
}

const Footer = styled.View`
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 45px;
  gap: 12px;
`;

const AuthBtn = styled.TouchableOpacity`
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

const BtnText = styled.Text`
  color: #000;
  font-weight: 700;
  font-size: 16px;
`;

const LogOutlineBtn = styled.TouchableOpacity`
  width: 100%;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 12px;
  background-color: #ef4444;
  border-radius: 10px;
  margin-top: 10px;
`;

const LgOutBtnText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: 700;
`;
