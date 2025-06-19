import { TaskProvider } from "@/context/TaskContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
  <TaskProvider>
    <Stack screenOptions={{
      headerShown: false,  
      contentStyle: { backgroundColor: '#2f3a4a' }
    }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add-task" />
    </Stack>
  </TaskProvider>
);
  
}
