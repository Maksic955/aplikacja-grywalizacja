// context/TaskContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import 'react-native-get-random-values'; 
import { v4 as uuidv4 } from 'uuid';

export interface Task {
  id: string;
  title: string;
  difficulty: 'Łatwy' | 'Średni' | 'Trudny';
  description: string;
  dueDate: Date;
}

interface TaskContextValue {
  tasks: Task[];
  addTask: (t: Omit<Task, 'id'>) => void;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const addTask = (t: Omit<Task, 'id'>) => {
    const newTask: Task = { ...t, id: uuidv4() };
    setTasks((prev) => [newTask, ...prev]);
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be inside TaskProvider');
  return ctx;
}
