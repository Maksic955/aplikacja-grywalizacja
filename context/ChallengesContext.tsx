import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { firestore } from '@/services/firebase';
import { useAuth } from './AuthContext';
import { useUserProfile } from './UserContext';

// TYPES
export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  requiredLevel: number;
  category: string;
  condition: {
    type: string;
    target?: number;
    level?: number;
    minutes?: number;
    hour?: number;
    hours?: number;
    days?: number;
  };
  xpReward: number;
  order: number;
}

export interface UserChallenge {
  challengeId: string;
  status: 'locked' | 'active' | 'completed';
  progress: number;
  completedAt?: Date;
  xpRewarded?: number;
}

interface ChallengesContextType {
  challenges: Challenge[];
  userChallenges: Map<string, UserChallenge>;

  availableChallenges: Challenge[];
  completedChallenges: Challenge[];
  completedCount: number;

  loading: boolean;
  error: string | null;

  refreshChallenges: () => Promise<void>;
}

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

export function ChallengesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<Map<string, UserChallenge>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const challengesRef = collection(firestore, 'challenges');
        const q = query(challengesRef, orderBy('order', 'asc'));
        const snapshot = await getDocs(q);

        const challengesData: Challenge[] = [];
        snapshot.forEach((doc) => {
          challengesData.push({ id: doc.id, ...doc.data() } as Challenge);
        });

        setChallenges(challengesData);
      } catch (err: any) {
        console.error('Error fetching challenges:', err);
        setError(err.message);
      }
    };

    fetchChallenges();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setUserChallenges(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);

    const userChallengesRef = collection(firestore, 'users', user.uid, 'userChallenges');

    const unsubscribe = onSnapshot(
      userChallengesRef,
      (snapshot) => {
        const userChallengesMap = new Map<string, UserChallenge>();

        snapshot.forEach((doc) => {
          const data = doc.data();
          userChallengesMap.set(doc.id, {
            challengeId: doc.id,
            status: data.status || 'locked',
            progress: data.progress || 0,
            completedAt: data.completedAt?.toDate(),
            xpRewarded: data.xpRewarded,
          });
        });

        setUserChallenges(userChallengesMap);
      },
      (err) => {
        console.error('Error listening to user challenges:', err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const availableChallenges = useMemo(() => {
    const userLevel = profile?.level || 1;

    return challenges
      .map((challenge) => {
        const userChallenge = userChallenges.get(challenge.id);
        const isLocked = challenge.requiredLevel > userLevel;

        return {
          ...challenge,
          userStatus: userChallenge?.status || (isLocked ? 'locked' : 'active'),
          userProgress: userChallenge?.progress || 0,
          completedAt: userChallenge?.completedAt,
          isLocked,
        };
      })
      .filter((challenge) => challenge.userStatus !== 'completed');
  }, [challenges, userChallenges, profile?.level]);

  const completedChallenges = useMemo(() => {
    return challenges
      .map((challenge) => {
        const userChallenge = userChallenges.get(challenge.id);
        return {
          ...challenge,
          userStatus: userChallenge?.status || 'locked',
          completedAt: userChallenge?.completedAt,
          xpRewarded: userChallenge?.xpRewarded,
        };
      })
      .filter((challenge) => challenge.userStatus === 'completed')
      .sort((a, b) => {
        if (!a.completedAt || !b.completedAt) return 0;
        return b.completedAt.getTime() - a.completedAt.getTime();
      });
  }, [challenges, userChallenges]);

  const completedCount = useMemo(() => {
    return completedChallenges.length;
  }, [completedChallenges]);

  const refreshChallenges = async () => {
    setLoading(true);
    try {
      const challengesRef = collection(firestore, 'challenges');
      const q = query(challengesRef, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);

      const challengesData: Challenge[] = [];
      snapshot.forEach((doc) => {
        challengesData.push({ id: doc.id, ...doc.data() } as Challenge);
      });

      setChallenges(challengesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const value: ChallengesContextType = {
    challenges,
    userChallenges,
    availableChallenges,
    completedChallenges,
    completedCount,
    loading,
    error,
    refreshChallenges,
  };

  return <ChallengesContext.Provider value={value}>{children}</ChallengesContext.Provider>;
}

export function useChallenges() {
  const context = useContext(ChallengesContext);
  if (context === undefined) {
    throw new Error('useChallenges must be used within a ChallengesProvider');
  }
  return context;
}
