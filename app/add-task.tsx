import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import styled from 'styled-components/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useTasks } from '@/context/TaskContext';

interface NewTask {
  title: string;
  difficulty: 'Łatwy' | 'Średni' | 'Trudny';
  description: string;
  dueDate: Date;
}

export default function AddTaskScreen() {
  const router = useRouter();
  const { addTask } = useTasks();
  type TaskInput = Omit<NewTask, 'id'>;
  const [task, setTask] = useState<TaskInput>({
    title: '',
    difficulty: 'Łatwy',
    description: '',
    dueDate: new Date(),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const onSubmit = () => {
    if (!task.title.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę zadania.');
      return;
    }
    addTask({
      title: task.title,
      difficulty: task.difficulty || 'Łatwy',
      description: task.description || '',
      dueDate: task.dueDate || new Date(),
      status: 'inProgress',
    });
    router.back();
  };

  return (
    <Container>
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
          onValueChange={(itemValue: 'Łatwy' | 'Średni' | 'Trudny', _index: number) =>
            setTask({ ...task, difficulty: itemValue as any })
          }
        >
          <Picker.Item label="Łatwy" value="Łatwy" />
          <Picker.Item label="Średni" value="Średni" />
          <Picker.Item label="Trudny" value="Trudny" />
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
        title={task.dueDate.toLocaleDateString()}
        onPress={() => setShowDatePicker(true)}
      />
      {showDatePicker && (
        <DateTimePicker
          value={task.dueDate}
          mode="date"
          display="default"
          onChange={(event: any, date?: Date) => {
            setShowDatePicker(false);
            if (date) setTask({ ...task, dueDate: date });
          }}
        />
      )}

      <FormButton onPress={onSubmit} style={{ marginTop: 24 }}>
        <ButtonText>Dodaj</ButtonText>
      </FormButton>
    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
  padding: 16px;
  background-color: #fff;
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
