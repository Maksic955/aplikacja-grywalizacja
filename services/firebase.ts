import { getApps, getApp, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

import {
  Auth,
  getAuth,
  initializeAuth,
  // @ts-ignore
  browserLocalPersistence,
  setPersistence,
  getReactNativePersistence,
} from 'firebase/auth';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let _auth: Auth;

if (Platform.OS === 'web') {
  _auth = getAuth(app);
  setPersistence(_auth, browserLocalPersistence).catch(() => {});
} else {
  try {
    _auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    _auth = getAuth(app);
  }
}

export const auth = _auth;

export const firestore = getFirestore(app);

export const functions = getFunctions(app);

export const storage = getStorage(app);

export default { app, auth, firestore, functions, storage };
