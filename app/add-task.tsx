import { useState } from 'react';
import { Button, Alert } from 'react-native';
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

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (selectedDate) {
      const updated = new Date(task.dueDate);
      updated.setFullYear(selectedDate.getFullYear());
      updated.setMonth(selectedDate.getMonth());
      updated.setDate(selectedDate.getDate());

      setTask({ ...task, dueDate: updated });

      // otwórz wybór godziny
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
    }
  };

  return (
    <Container>
      <CloseButton onPress={() => router.back()}>
        <Ionicons name="close" size={24} color="#333" />
      </CloseButton>

      <Label>Nazwa zadania</Label>
      <Input
        value={task.title}
        onChangeText={(text: string) => setTask({ ...task, title: text })}
        placeholder="Wpisz nazwę zadania"
      />

      <Label>Poziom trudności</Label>
      <PickerContainer>
        <Picker
          selectedValue={task.difficulty}
          onValueChange={(value: 'latwy' | 'sredni' | 'trudny') =>
            setTask({ ...task, difficulty: value })
          }
        >
          <Picker.Item label="Łatwy" value="latwy" />
          <Picker.Item label="Średni" value="sredni" />
          <Picker.Item label="Trudny" value="trudny" />
        </Picker>
      </PickerContainer>

      <Label>Opis zadania</Label>
      <Input
        value={task.description}
        onChangeText={(text: string) => setTask({ ...task, description: text })}
        placeholder="Opis zadania"
        multiline
        numberOfLines={4}
        style={{ height: 80, textAlignVertical: 'top' }}
      />

      <Label>Termin wykonania</Label>
      <Button
        title={task.dueDate.toLocaleString('pl-PL')}
        onPress={() => setShowDatePicker(true)}
      />

      {showDatePicker && (
        <DateTimePicker
          value={task.dueDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
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

      <FormButton onPress={onSubmit} style={{ marginTop: 24 }}>
        <ButtonText>Dodaj</ButtonText>
      </FormButton>
    </Container>
  );
}

// Style

const Container = styled.SafeAreaView`
  flex: 1;
  padding-top: 60px;
  padding-left: 32px;
  padding-right: 32px;
  margin: 16px;
  margin-top: 0;
  border-radius: 8px;
  background-color: #fff;
`;

const CloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 8px;
  z-index: 10;
`;

const Label = styled.Text`
  font-size: 16px;
  margin-bottom: 8px;
  color: #333;
`;

const Input = styled.TextInput`
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 16px;
`;

const PickerContainer = styled.View`
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 16px;
`;

const FormButton = styled.TouchableOpacity`
  background-color: #2875d4;
  padding: 12px;
  border-radius: 4px;
  align-items: center;
`;

const ButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
`;
