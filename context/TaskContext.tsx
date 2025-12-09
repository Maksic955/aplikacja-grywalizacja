import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, firestore } from '../services/firebase';
import { User } from '@firebase/auth';

export interface Task {
  id: string;
  title: string;
  difficulty: 'latwy' | 'sredni' | 'trudny';
  description: string;
  dueDate: Date;
  status: 'inProgress' | 'paused' | 'done';
  createdAt?: Date;
  completedAt?: Date;
}

interface TaskContextValue {
  tasks: Task[];
  loading: boolean;
  addTask: (t: Omit<Task, 'id' | 'status'>) => Promise<void>;
  updateTaskStatus: (id: string, status: Task['status']) => Promise<void>;
  completeTask: (taskId: string, difficulty: Task['difficulty']) => Promise<void>;
  clearTrigger?: boolean;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export function TaskProvider({
  children,
  clearTrigger,
  user,
}: {
  children: ReactNode;
  clearTrigger?: boolean;
  user: User | null;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(firestore, 'users', user.uid, 'tasks'),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const loadedTasks: Task[] = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;

          const rawDue = data.dueDate;
          let dueDate: Date;

          if (rawDue instanceof Date) {
            dueDate = rawDue;
          } else if (rawDue && typeof rawDue.toDate === 'function') {
            dueDate = rawDue.toDate();
          } else {
            dueDate = new Date(rawDue);
          }

          const rawCreated = data.createdAt;
          let createdAt: Date | undefined;
          if (rawCreated instanceof Date) {
            createdAt = rawCreated;
          } else if (rawCreated && typeof rawCreated.toDate === 'function') {
            createdAt = rawCreated.toDate();
          } else if (rawCreated) {
            createdAt = new Date(rawCreated);
          }

          const rawCompleted = data.completedAt;
          let completedAt: Date | undefined;
          if (rawCompleted instanceof Date) {
            completedAt = rawCompleted;
          } else if (rawCompleted && typeof rawCompleted.toDate === 'function') {
            completedAt = rawCompleted.toDate();
          } else if (rawCompleted) {
            completedAt = new Date(rawCompleted);
          }

          loadedTasks.push({
            ...(data as Omit<Task, 'id' | 'dueDate' | 'createdAt' | 'completedAt'>),
            id: docSnap.id,
            dueDate,
            createdAt,
            completedAt,
          });
        });

        setTasks(loadedTasks);
        setLoading(false);
      },
      (error) => {
        console.error('Błąd w pobieraniu tasków z Firestore:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const addTask = async (t: Omit<Task, 'id' | 'status'>) => {
    if (!user) return;

    try {
      const tasksRef = collection(firestore, 'users', user.uid, 'tasks');

      await addDoc(tasksRef, {
        title: t.title,
        difficulty: t.difficulty,
        description: t.description,
        dueDate: t.dueDate,
        status: 'inProgress',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Błąd przy addTask:', e);
      throw e;
    }
  };

  const updateTaskStatus = async (id: string, status: Task['status']) => {
    if (!user) return;

    try {
      const functions = getFunctions(app);
      const updateStatusFn = httpsCallable(functions, 'updateTaskStatus');

      await updateStatusFn({
        taskId: id,
        status: status,
      });
    } catch (e) {
      console.error('Błąd przy updateTaskStatus:', e);
      throw e;
    }
  };

  const completeTask = async (taskId: string, difficulty: Task['difficulty']) => {
    if (!user) return;

    try {
      const functions = getFunctions(app);
      const completeFn = httpsCallable(functions, 'completeTask');

      await completeFn({ taskId, difficulty });
    } catch (e) {
      console.error('Błąd przy completeTask:', e);
      throw e;
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        addTask,
        updateTaskStatus,
        completeTask,
        clearTrigger,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be inside TaskProvider');
  return ctx;
}
