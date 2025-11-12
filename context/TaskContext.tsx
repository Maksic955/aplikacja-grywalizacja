import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { collection, addDoc, getDocs, query, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase'
import 'react-native-get-random-values'; 
import { User } from '@firebase/auth';

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
  clearTrigger?: boolean;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export function TaskProvider({ children, clearTrigger, user }: { children: ReactNode, clearTrigger?: boolean, user: User | null }) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    const loadTasks = async () => {
      try {
        const q = query(collection(firestore, 'users', user.uid, 'tasks'));
        const querySnapshot = await getDocs(q);
        const loadedTasks: Task[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedTasks.push({
            ...(data as Task),
            id: docSnap.id,
            dueDate: new Date(data.dueDate),
            createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
          });
        });
        setTasks(loadedTasks);
      } catch (e) {
        console.error('Błąd w pobieraniu tasków z Firestore:', e);
      }
    };

    loadTasks();
  }, [user]);

  const addTask = async (t: Omit<Task, 'id'>) => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(firestore, 'users', user.uid, 'tasks'), {
        ...t, 
        status: t.status ?? 'inProgress',
        createdAt: new Date().toISOString(),
        dueDate: t.dueDate.toISOString(),
      });
      const newTask: Task = { ...t, id: docRef.id, status: t.status ?? 'inProgress', createdAt: new Date() };
      setTasks((prev) => [newTask, ...prev]);
    } catch (e) {
      console.error('Błąd przy dodawaniu taska do Firestore:', e);
    }
  }

  const updateTaskStatus = async (id: string, status: Task['status']) => {
    if (!user) return;
    try {
      await updateDoc(doc(firestore, 'users', user.uid, 'tasks', id), { status});
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    } catch (e) {
      console.error('Błąd przy aktualizacji statusu taska w Firestore:', e)
    }
  }

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTaskStatus, clearTrigger }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be inside TaskProvider');
  return ctx;
}
