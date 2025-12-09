import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
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

  const loadTasks = async () => {
    if (!user) return;

    try {
      const q = query(collection(firestore, 'users', user.uid, 'tasks'));
      const querySnapshot = await getDocs(q);

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

        loadedTasks.push({
          ...(data as Omit<Task, 'id' | 'dueDate' | 'createdAt'>),
          id: docSnap.id,
          dueDate,
          createdAt,
        });
      });

      setTasks(loadedTasks);
    } catch (e) {
      console.error('Błąd w pobieraniu tasków z Firestore:', e);
    }
  };

  const addTask = async (t: Omit<Task, 'id' | 'status'>) => {
    if (!user) return;

    try {
      const functions = getFunctions(app);
      const createTaskFn = httpsCallable(functions, 'createTask');

      const res = await createTaskFn({
        title: t.title,
        difficulty: t.difficulty,
        description: t.description,
        dueDate: t.dueDate.toISOString(),
      });

      console.log('Created task:', res.data);

      await loadTasks();
    } catch (e) {
      console.error('Błąd przy addTask (backend createTask):', e);
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

      console.log('updateTaskStatus DONE:', id, status);

      await loadTasks();
    } catch (e) {
      console.error('Błąd przy updateTaskStatus:', e);
    }
  };

  const completeTask = async (taskId: string, difficulty: Task['difficulty']) => {
    if (!user) return;

    try {
      const functions = getFunctions(app);
      const completeFn = httpsCallable(functions, 'completeTask');

      console.log('completeTask() → backend call', {
        taskId,
        difficulty,
      });

      const response = await completeFn({ taskId, difficulty });

      console.log('completeTask response:', response.data);

      await loadTasks();
    } catch (e) {
      console.error('Błąd przy completeTask:', e);
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
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
