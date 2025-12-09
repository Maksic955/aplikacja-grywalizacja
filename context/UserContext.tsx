// context/UserContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { User } from '@firebase/auth';

export interface ProfileData {
  hunger: number;
  health: number;
  xp: number;
  level: number;
  maxHealth: number;
  maxHunger: number;
  maxXp: number;
}

interface UserContextValue {
  profile: ProfileData | null;
  loading: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children, user }: { children: ReactNode; user: User | null }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const ref = doc(firestore, 'users', user.uid);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        setLoading(false);

        if (!snap.exists()) {
          setProfile(null);
          return;
        }

        const data = snap.data() || {};

        const safeNumber = (value: any, fallback: number) => {
          const n = Number(value);
          return Number.isFinite(n) ? n : fallback;
        };

        const parsed: ProfileData = {
          level: safeNumber(data.level, 1),
          xp: safeNumber(data.xp, 0),
          maxHealth: safeNumber(data.maxHealth, 300),
          maxHunger: safeNumber(data.maxHunger, 250),
          maxXp: safeNumber(data.maxXp, 300),
          health: safeNumber(data.health, safeNumber(data.maxHealth, 300)),
          hunger: safeNumber(data.hunger, 0),
        };

        setProfile(parsed);
      },
      (err) => {
        console.error('onSnapshot user profile error:', err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [user]);

  return <UserContext.Provider value={{ profile, loading }}>{children}</UserContext.Provider>;
}

export function useUserProfile(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserProfile must be used inside UserProvider');
  return ctx;
}
