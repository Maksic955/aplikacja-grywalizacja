import { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, Modal } from 'react-native';
import styled from 'styled-components/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { firestore, storage } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserContext';

import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function SettingsScreen() {
  const { user, changePassword } = useAuth();
  const { profile } = useUserProfile();

  const nickFromProfile = (profile as any)?.nickname as string | undefined;
  const avatarFromProfile = (profile as any)?.avatarUrl as string | undefined;

  const [editingNick, setEditingNick] = useState(false);
  const [nickname, setNickname] = useState(nickFromProfile ?? '');
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [oldPassError, setOldPassError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingNick) {
      setNickname(nickFromProfile ?? '');
    }
  }, [nickFromProfile, editingNick]);

  if (!user) {
    return (
      <Screen>
        <Title>Ustawienia</Title>
        <InfoText>Musisz być zalogowany, aby zobaczyć ustawienia.</InfoText>
      </Screen>
    );
  }

  const userRef = doc(firestore, 'users', user.uid);
  const currentAvatarUrl = avatarPreview || avatarFromProfile || null;

  const saveNickname = async () => {
    if (!nickname.trim()) {
      return Alert.alert('Błąd', 'Nick nie może być pusty.');
    }

    setLoading(true);
    try {
      await updateDoc(userRef, {
        nickname: nickname.trim(),
        updatedAt: new Date(),
      });
      Alert.alert('Sukces', 'Zaktualizowano nick.');
      setEditingNick(false);
    } catch (err) {
      console.error(err);
      Alert.alert('Błąd', 'Nie udało się zapisać nicku.');
    }
    setLoading(false);
  };

  const cancelNicknameEdit = () => {
    setEditingNick(false);
    setNickname(nickFromProfile ?? '');
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert('Błąd', 'Brak uprawnień do galerii.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setAvatarPreview(uri);
  };

  const saveAvatar = async () => {
    if (!avatarPreview) return;

    setUploading(true);
    try {
      const response = await fetch(avatarPreview);
      const blob = await response.blob();

      const filename = `avatar_${Date.now()}.jpg`;
      const storageRef = ref(storage, `avatars/${user.uid}/${filename}`);

      await uploadBytes(storageRef, blob);

      const url = await getDownloadURL(storageRef);

      await updateDoc(userRef, {
        avatarUrl: url,
        updatedAt: new Date(),
      });

      setAvatarPreview(null);
      Alert.alert('Sukces', 'Zaktualizowano avatar.');
    } catch (err) {
      console.error(err);
      Alert.alert('Błąd', 'Nie udało się zapisać zdjęcia.');
    }
    setUploading(false);
  };

  const minLengthOk = newPass.length >= 4;
  const hasDigit = /\d/.test(newPass);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPass);
  const passwordsMatch = newPass.length > 0 && newPass === confirmPass;
  const hasTypedNew = newPass.length > 0;

  const canSubmitPassword =
    !!oldPass && minLengthOk && hasDigit && hasSpecial && passwordsMatch && !loading;

  const closePasswordModal = () => {
    setPasswordModalVisible(false);
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
    setOldPassError(null);
  };

  const changePass = async () => {
    if (!canSubmitPassword) return;

    setLoading(true);
    setOldPassError(null);

    try {
      await changePassword(oldPass, newPass);
      Alert.alert('Sukces', 'Hasło zostało zmienione.');
      closePasswordModal();
    } catch (err: any) {
      console.error(err);
      setOldPassError('Stare hasło jest niepoprawne.');
      Alert.alert('Błąd', err?.message || 'Nie udało się zmienić hasła.');
    }

    setLoading(false);
  };

  const getRuleVisual = (ok: boolean) => {
    if (!hasTypedNew) {
      return { color: '#000', icon: 'ellipse-outline' as const };
    }
    return {
      color: ok ? '#2e7d32' : '#c62828',
      icon: ok ? ('checkmark-circle' as const) : ('close-circle' as const),
    };
  };

  const lengthRule = getRuleVisual(minLengthOk);
  const digitRule = getRuleVisual(hasDigit);
  const specialRule = getRuleVisual(hasSpecial);

  const displayedNick = nickFromProfile || 'Brak nicku';

  return (
    <>
      <Screen>
        <AvatarSection>
          <AvatarTouchable activeOpacity={0.8} onPress={pickAvatar} disabled={uploading}>
            {currentAvatarUrl ? (
              <AvatarImage source={{ uri: currentAvatarUrl }} />
            ) : (
              <AvatarPlaceholderCircle>
                <Ionicons name="add" size={32} color="#666" />
              </AvatarPlaceholderCircle>
            )}
          </AvatarTouchable>

          {uploading && <ActivityIndicator size="small" color="#2875d4" />}

          {avatarPreview ? (
            <SmallButton onPress={saveAvatar} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <SmallButtonText>Zapisz</SmallButtonText>
              )}
            </SmallButton>
          ) : currentAvatarUrl ? (
            <SmallButton onPress={pickAvatar} disabled={uploading}>
              <SmallButtonText>Zmień zdjęcie</SmallButtonText>
            </SmallButton>
          ) : null}
        </AvatarSection>

        <Box>
          <Label>Nick</Label>

          {!editingNick ? (
            <RowBetween>
              <NickText>{displayedNick}</NickText>
              <SmallButton onPress={() => setEditingNick(true)}>
                <SmallButtonText>Zmień tekst</SmallButtonText>
              </SmallButton>
            </RowBetween>
          ) : (
            <>
              <Input value={nickname} onChangeText={setNickname} placeholder="Twój nick..." />
              <RowRight>
                <SecondaryButton onPress={cancelNicknameEdit}>
                  <SecondaryButtonText>Anuluj</SecondaryButtonText>
                </SecondaryButton>
                <PrimaryButton onPress={saveNickname} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <PrimaryButtonText>Zapisz</PrimaryButtonText>
                  )}
                </PrimaryButton>
              </RowRight>
            </>
          )}
        </Box>

        <Box>
          <Label>Hasło</Label>
          <RowBetween>
            <PasswordMasked>********</PasswordMasked>
            <SmallButton onPress={() => setPasswordModalVisible(true)}>
              <SmallButtonText>Zmień hasło</SmallButtonText>
            </SmallButton>
          </RowBetween>
        </Box>

        {(loading || uploading) && (
          <GlobalLoaderWrapper>
            <ActivityIndicator size="large" color="#2875d4" />
          </GlobalLoaderWrapper>
        )}
      </Screen>

      <Modal visible={passwordModalVisible} transparent animationType="fade">
        <ModalOverlay>
          <ModalBox>
            <ModalCloseButton onPress={closePasswordModal}>
              <Ionicons name="close" size={22} color="#333" />
            </ModalCloseButton>

            <ModalTitle>Zmień hasło</ModalTitle>

            <Label>Stare hasło</Label>
            <Input
              value={oldPass}
              onChangeText={(txt) => {
                setOldPass(txt);
                setOldPassError(null);
              }}
              secureTextEntry
            />
            {oldPassError && <ErrorText>{oldPassError}</ErrorText>}

            <Label>Nowe hasło</Label>
            <Input
              value={newPass}
              onChangeText={(txt) => {
                setNewPass(txt);
              }}
              secureTextEntry
            />

            <RulesWrapper>
              <RuleRow>
                <Ionicons name={lengthRule.icon} size={16} color={lengthRule.color} />
                <RuleText style={{ color: lengthRule.color }}>Minimum 4 znaki</RuleText>
              </RuleRow>

              <RuleRow>
                <Ionicons name={digitRule.icon} size={16} color={digitRule.color} />
                <RuleText style={{ color: digitRule.color }}>Minimum jedna cyfra</RuleText>
              </RuleRow>

              <RuleRow>
                <Ionicons name={specialRule.icon} size={16} color={specialRule.color} />
                <RuleText style={{ color: specialRule.color }}>
                  Minimum jeden znak specjalny
                </RuleText>
              </RuleRow>
            </RulesWrapper>

            <Label>Potwierdź nowe hasło</Label>
            <Input value={confirmPass} onChangeText={setConfirmPass} secureTextEntry />

            {confirmPass.length > 0 && !passwordsMatch && (
              <ErrorText>Hasła nie są takie same.</ErrorText>
            )}

            <ModalButton onPress={changePass} disabled={!canSubmitPassword}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ModalButtonText>Zapisz</ModalButtonText>
              )}
            </ModalButton>
          </ModalBox>
        </ModalOverlay>
      </Modal>
    </>
  );
}

// style
const Screen = styled.ScrollView`
  flex: 1;
  padding: 20px;
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
`;

const InfoText = styled.Text`
  font-size: 16px;
  color: #666;
`;

const AvatarSection = styled.View`
  align-items: center;
  margin-bottom: 24px;
  gap: 12px;
`;

const AvatarTouchable = styled.TouchableOpacity``;

const AvatarImage = styled.Image`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  border-width: 2px;
  border-color: #2875d4;
`;

const AvatarPlaceholderCircle = styled.View`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  border-width: 2px;
  border-color: #ccc;
  justify-content: center;
  align-items: center;
  background-color: #f2f2f2;
`;

const Box = styled.View`
  background-color: #fff;
  padding: 16px;
  margin-bottom: 24px;
  border-radius: 12px;
  elevation: 3;
`;

const Label = styled.Text`
  font-size: 14px;
  color: #666;
  margin-bottom: 6px;
`;

const Input = styled.TextInput`
  border-width: 1px;
  border-color: #ccc;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 12px;
`;

const RowBetween = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const RowRight = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  gap: 8px;
`;

const NickText = styled.Text`
  font-size: 16px;
  font-weight: 600;
`;

const SmallButton = styled.TouchableOpacity`
  padding: 8px 12px;
  border-radius: 10px;
  background-color: #2875d4;
  align-items: center;
  justify-content: center;
`;

const SmallButtonText = styled.Text`
  color: #fff;
  font-size: 13px;
  font-weight: 600;
`;

const SecondaryButton = styled.TouchableOpacity`
  padding: 10px 14px;
  border-radius: 10px;
  border-width: 1px;
  border-color: #2875d4;
  margin-right: 8px;
`;

const SecondaryButtonText = styled.Text`
  color: #2875d4;
  font-weight: 600;
`;

const PrimaryButton = styled.TouchableOpacity`
  padding: 10px 16px;
  border-radius: 10px;
  background-color: #2875d4;
`;

const PrimaryButtonText = styled.Text`
  color: #fff;
  font-weight: 700;
`;

const PasswordMasked = styled.Text`
  font-size: 16px;
  letter-spacing: 2px;
`;

const GlobalLoaderWrapper = styled.View`
  margin-top: 12px;
`;

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.4);
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ModalBox = styled.View`
  width: 100%;
  max-width: 420px;
  background-color: #fff;
  border-radius: 16px;
  padding: 20px;
  elevation: 8;
`;

const ModalCloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px;
`;

const ModalTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
  padding-right: 32px;
`;

const RulesWrapper = styled.View`
  margin-bottom: 12px;
`;

const RuleRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 4px;
`;

const RuleText = styled.Text`
  font-size: 12px;
  margin-left: 6px;
`;

const ErrorText = styled.Text`
  font-size: 12px;
  color: #c62828;
  margin-bottom: 8px;
`;

const ModalButton = styled.TouchableOpacity<{ disabled?: boolean }>`
  margin-top: 8px;
  padding: 12px;
  border-radius: 10px;
  align-items: center;
  background-color: ${({ disabled }) => (disabled ? '#9bbce5' : '#2875d4')};
`;

const ModalButtonText = styled.Text`
  color: #fff;
  font-weight: 700;
`;
