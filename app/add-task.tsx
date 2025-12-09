import { useState } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useTasks } from '@/context/TaskContext';
import { Ionicons } from '@expo/vector-icons';

interface NewTask {
  title: string;
  difficulty: 'latwy' | 'sredni' | 'trudny';
  description: string;
  dueDate: Date;
}

export default function AddTaskScreen() {
  const router = useRouter();
  const { addTask } = useTasks();

  type TaskInput = NewTask;

  const [task, setTask] = useState<TaskInput>({
    title: '',
    difficulty: 'latwy',
    description: '',
    dueDate: new Date(),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (selectedDate) {
      const updated = new Date(task.dueDate);
      updated.setFullYear(selectedDate.getFullYear());
      updated.setMonth(selectedDate.getMonth());
      updated.setDate(selectedDate.getDate());

      setTask({ ...task, dueDate: updated });

      setTimeout(() => setShowTimePicker(true), 150);
    }
  };

  const handleTimeChange = (_event: any, selectedTime?: Date) => {
    setShowTimePicker(false);

    if (selectedTime) {
      const updated = new Date(task.dueDate);
      updated.setHours(selectedTime.getHours());
      updated.setMinutes(selectedTime.getMinutes());
      updated.setSeconds(0);

      setTask({ ...task, dueDate: updated });
    }
  };

  const onSubmit = async () => {
    if (!task.title.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę zadania.');
      return;
    }

    if (task.dueDate < new Date()) {
      Alert.alert('Błąd', 'Termin wykonania nie może być w przeszłości.');
      return;
    }

    setLoading(true);

    try {
      await addTask({
        title: task.title.trim(),
        difficulty: task.difficulty,
        description: task.description.trim(),
        dueDate: task.dueDate,
      });

      router.back();
    } catch (e) {
      console.error('Błąd przy dodawaniu zadania:', e);
      Alert.alert('Błąd', 'Nie udało się dodać zadania. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = () => {
    switch (task.difficulty) {
      case 'latwy':
        return '#4caf50';
      case 'sredni':
        return '#ff9800';
      case 'trudny':
        return '#e53935';
      default:
        return '#2875d4';
    }
  };

  const getDifficultyIcon = () => {
    switch (task.difficulty) {
      case 'latwy':
        return 'checkmark-circle';
      case 'sredni':
        return 'alert-circle';
      case 'trudny':
        return 'flame';
      default:
        return 'help-circle';
    }
  };

  const minDate = new Date();

  return (
    <Container>
      {/* Header jako karta */}
      <HeaderCard>
        <HeaderContent>
          <HeaderTitle>Nowe zadanie</HeaderTitle>
          <CloseButton onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#333" />
          </CloseButton>
        </HeaderContent>
      </HeaderCard>

      <ContentWrapper>
        <ScrollContainer contentContainerStyle={{ paddingBottom: 16 }}>
          {/* Nazwa zadania */}
          <InputCard>
            <Label>
              <Ionicons name="create-outline" size={18} color="#2875d4" />
              <LabelText>Nazwa zadania</LabelText>
            </Label>
            <Input
              value={task.title}
              onChangeText={(text: string) => setTask({ ...task, title: text })}
              placeholder="Np. Zrobić zakupy"
              placeholderTextColor="#999"
            />
          </InputCard>

          {/* Poziom trudności */}
          <InputCard>
            <Label>
              <Ionicons name={getDifficultyIcon()} size={18} color={getDifficultyColor()} />
              <LabelText>Poziom trudności</LabelText>
            </Label>
            <PickerContainer color={getDifficultyColor()}>
              <Picker
                selectedValue={task.difficulty}
                onValueChange={(value: 'latwy' | 'sredni' | 'trudny') =>
                  setTask({ ...task, difficulty: value })
                }
                style={{ color: getDifficultyColor() }}
              >
                <Picker.Item label="🟢 Łatwy" value="latwy" />
                <Picker.Item label="🟡 Średni" value="sredni" />
                <Picker.Item label="🔴 Trudny" value="trudny" />
              </Picker>
            </PickerContainer>
          </InputCard>

          {/* Opis zadania */}
          <InputCard>
            <Label>
              <Ionicons name="document-text-outline" size={18} color="#2875d4" />
              <LabelText>Opis zadania</LabelText>
            </Label>
            <TextArea
              value={task.description}
              onChangeText={(text: string) => setTask({ ...task, description: text })}
              placeholder="Dodaj szczegóły zadania..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </InputCard>

          {/* Termin wykonania */}
          <InputCard>
            <Label>
              <Ionicons name="calendar-outline" size={18} color="#2875d4" />
              <LabelText>Termin wykonania</LabelText>
            </Label>
            <DateButton onPress={() => setShowDatePicker(true)}>
              <DateButtonText>
                {task.dueDate.toLocaleDateString('pl-PL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </DateButtonText>
              <DateButtonTime>
                {task.dueDate.toLocaleTimeString('pl-PL', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </DateButtonTime>
            </DateButton>
          </InputCard>

          {showDatePicker && (
            <DateTimePicker
              value={task.dueDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={minDate}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={task.dueDate}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </ScrollContainer>

        {/* Przycisk na dole - TERAZ ZAWSZE WIDOCZNY */}
        <BottomButtonContainer>
          <SubmitButton onPress={onSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="add-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                <ButtonText>Dodaj zadanie</ButtonText>
              </>
            )}
          </SubmitButton>
        </BottomButtonContainer>
      </ContentWrapper>
    </Container>
  );
}

// STYLES

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #f5f5d5;
`;

const HeaderCard = styled.View`
  background-color: white;
  margin: 8px 16px 16px 16px;
  border-radius: 16px;
  shadow-color: #000;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
  elevation: 5;
  overflow: hidden;
`;

const HeaderContent = styled.View`
  background-color: #2875d4;
  padding: 20px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-radius: 16px;
`;

const HeaderTitle = styled.Text`
  font-size: 24px;
  font-weight: 700;
  color: white;
`;

const CloseButton = styled.TouchableOpacity`
  background-color: white;
  padding: 8px;
  border-radius: 20px;
`;

const ContentWrapper = styled.View`
  flex: 1;
`;

const ScrollContainer = styled.ScrollView`
  flex: 1;
  padding-horizontal: 16px;
`;

const InputCard = styled.View`
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  elevation: 3;
`;

const Label = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
`;

const LabelText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const Input = styled.TextInput`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  background-color: #f9f9f9;
  color: #333;
`;

const TextArea = styled.TextInput`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  background-color: #f9f9f9;
  color: #333;
  height: 120px;
`;

const PickerContainer = styled.View<{ color: string }>`
  border: 2px solid ${({ color }) => color};
  border-radius: 8px;
  background-color: #f9f9f9;
  overflow: hidden;
`;

const DateButton = styled.TouchableOpacity`
  background-color: #2875d4;
  padding: 16px;
  border-radius: 8px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const DateButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 600;
`;

const DateButtonTime = styled.Text`
  color: white;
  font-size: 20px;
  font-weight: 700;
`;

const BottomButtonContainer = styled.View`
  background-color: #f5f5d5;
  padding: 16px;
  padding-bottom: 140px;
  border-top-width: 1px;
  border-top-color: #ddd;
`;

const SubmitButton = styled.TouchableOpacity`
  background-color: #2875d4;
  padding: 16px;
  border-radius: 12px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-opacity: 0.2;
  shadow-radius: 8px;
  elevation: 5;
`;

const ButtonText = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: 700;
`;
