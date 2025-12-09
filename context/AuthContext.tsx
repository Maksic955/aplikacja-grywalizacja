import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';

import { doc, setDoc } from 'firebase/firestore';
import { firestore } from '@/services/firebase';

import { auth } from '@/services/firebase';
import { TaskProvider } from './TaskContext';
import { UserProvider } from './UserContext';

type AuthCtx = {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [clearTrigger, setClearTrigger] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    const userId = userCred.user.uid;

    await setDoc(doc(firestore, 'users', userId), {
      createdAt: new Date(),
    });

    await setDoc(doc(firestore, 'users', userId, 'profile', 'stats'), {
      hunger: 0,
      health: 100,
      xp: 0,
      level: 1,
    });

    await setDoc(doc(firestore, 'users', userId, 'tasks', '_init'), {
      placeholder: true,
      createdAt: new Date(),
    });
  };

  const logout = async () => {
    await signOut(auth);
    setClearTrigger(true);
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    const current = auth.currentUser;

    if (!current || !current.email) {
      throw new Error('Brak zalogowanego użytkownika.');
    }

    const cred = EmailAuthProvider.credential(current.email, oldPassword);
    await reauthenticateWithCredential(current, cred);

    await updatePassword(current, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        login,
        register,
        logout,
        changePassword,
      }}
    >
      <UserProvider user={user}>
        <TaskProvider clearTrigger={clearTrigger} user={user}>
          {children}
        </TaskProvider>
      </UserProvider>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
