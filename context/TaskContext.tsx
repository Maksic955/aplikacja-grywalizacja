import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values'; 
import { v4 as uuidv4 } from 'uuid';

export interface Task {
  id: string;
  title: string;
  difficulty: 'Łatwy' | 'Średni' | 'Trudny';
  description: string;
  dueDate: Date;
  status: 'inProgress' | 'paused' | 'done';
  createdAt?: Date;
}

interface TaskContextValue {
  tasks: Task[];
  addTask: (t: Omit<Task, 'id'>) => void;
  updateTaskStatus: (id: string, status: Task['status']) => void;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

const STORAGE_KEY = '@tasks:v1';

const jsonReplacer = (_key: string, value: any) => 
  value instanceof Date ? value.toISOString() : value;

const reviveTaskDates = (raw: any): Task => ({
  ...raw,
  dueDate: new Date(raw.dueDate),
  createdAt: raw.createdAt ? new Date(raw.createdAt) : undefined,
});

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const hydrateRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const revived: Task[] = Array.isArray(parsed) ? parsed.map(reviveTaskDates) : [];
          setTasks(revived);
        }
      } catch (e) {
        console.error('Failed to hydrate tasks from storage:', e);
      } finally {
        hydrateRef.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrateRef.current) return;
    (async () => {
      try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks, jsonReplacer)) 
      } catch (e) {
        console.warn('Nie udało się zapisać zadań do storage:', e);
      }
    })();
  }, [tasks]);

  const addTask = (t: Omit<Task, 'id'>) => {
    const newTask: Task = { ...t, status: t.status ?? 'inProgress', id: uuidv4(), createdAt: new Date() };
    setTasks((prev) => [newTask, ...prev]);
  };

  const updateTaskStatus = (id: string, status: Task['status']) => {
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, status } : t)
    )
  }

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTaskStatus }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be inside TaskProvider');
  return ctx;
}
