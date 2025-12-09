import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { XP_REWARD, HUNGER_LOSS, HEALTH_GAIN, LEVELS, xpRequiredForLevel } from './constants.js';

const VALID_DIFFICULTIES = ['latwy', 'sredni', 'trudny'];
const VALID_STATUSES = ['inProgress', 'paused', 'done'];

// Inicjalizacja
initializeApp();
const db = getFirestore();

export const createUserProfile = onDocumentCreated('users/{userId}', async (event) => {
  const userId = event.params.userId;

  if (!event.data) return;

  const level = 1;
  const levelDef = LEVELS[level];

  const profileData = {
    level,
    xp: 0,
    maxHealth: levelDef.maxHealth,
    maxHunger: levelDef.maxHunger,
    maxXp: xpRequiredForLevel(level),
    health: levelDef.maxHealth,
    hunger: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection('users').doc(userId).set(profileData, { merge: true });
});

export const createTask = onCall(async (request) => {
  // 1. Autoryzacja
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }
  const uid = request.auth.uid;

  const { title, difficulty, description = '', dueDate } = request.data || {};

  // 2. Walidacja danych
  if (typeof title !== 'string' || !title.trim()) {
    throw new HttpsError('invalid-argument', 'Field "title" is required and must be a string.');
  }

  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    throw new HttpsError(
      'invalid-argument',
      'Field "difficulty" must be one of: "latwy", "sredni", "trudny".',
    );
  }

  let dueDateObj;
  if (dueDate) {
    // Oczekujemy ISO stringa z frontu
    const d = new Date(dueDate);
    if (Number.isNaN(d.getTime())) {
      throw new HttpsError('invalid-argument', 'Field "dueDate" must be a valid date string.');
    }
    dueDateObj = d;
  } else {
    // Fallback – dzisiaj
    dueDateObj = new Date();
  }

  // 3. Dane zadania
  const taskData = {
    title: title.trim(),
    difficulty, // 'latwy' | 'sredni' | 'trudny'
    description: description.trim(),
    status: 'inProgress', // startowo zawsze w toku
    createdAt: FieldValue.serverTimestamp(),
    dueDate: dueDateObj,
  };

  // 4. Zapis do Firestore
  const userRef = db.collection('users').doc(uid);
  const tasksCol = userRef.collection('tasks');
  const docRef = await tasksCol.add(taskData);

  // 5. Zwracamy nowo utworzone zadanie
  return {
    id: docRef.id,
    ...taskData,
  };
});

export const updateTaskStatus = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }
  const uid = request.auth.uid;

  const { taskId, status } = request.data || {};

  if (typeof taskId !== 'string' || !taskId) {
    throw new HttpsError('invalid-argument', 'Field "taskId" is required and must be a string.');
  }

  if (!VALID_STATUSES.includes(status)) {
    throw new HttpsError(
      'invalid-argument',
      'Field "status" must be one of: "inProgress", "paused", "done".',
    );
  }

  const taskRef = db.collection('users').doc(uid).collection('tasks').doc(taskId);

  const snap = await taskRef.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Task not found for this user.');
  }

  await taskRef.update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { taskId, status };
});

export const completeTask = onCall(async (request) => {
  // 1. Auth
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const uid = request.auth.uid;
  const { difficulty, taskId } = request.data || {};

  // 2. Walidacja difficulty
  if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty)) {
    throw new HttpsError(
      'invalid-argument',
      'Field "difficulty" must be one of: "latwy", "sredni", "trudny".',
    );
  }

  if (typeof taskId !== 'string' || !taskId) {
    throw new HttpsError('invalid-argument', 'Field "taskId" is required and must be a string.');
  }

  const userRef = db.collection('users').doc(uid);
  const taskRef = db.collection('users').doc(uid).collection('tasks').doc(taskId);

  // 3. Transakcja Firestore
  const result = await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError('failed-precondition', 'User profile does not exist.');
    }

    const userData = userSnap.data() || {};
    console.log('User profile loaded:', userData);

    let level = userData.level ?? 1;
    let xp = Number(userData.xp ?? 0);

    const levelDef = LEVELS[level] || LEVELS[1];
    let maxHealth = userData.maxHealth ?? levelDef.maxHealth;
    let maxHunger = userData.maxHunger ?? levelDef.maxHunger;
    let maxXp = userData.maxXp ?? levelDef.maxXp;

    xp = Number.isFinite(xp) ? xp : 0;

    let health = Number(userData.health ?? maxHealth);
    if (!Number.isFinite(health)) health = maxHealth;

    let hunger = Number(userData.hunger ?? maxHunger);
    if (!Number.isFinite(hunger)) hunger = maxHunger;

    // 4. XP
    const xpGain = XP_REWARD[difficulty];
    if (typeof xpGain !== 'number') {
      throw new HttpsError(
        'internal',
        `XP_REWARD is not configured for difficulty "${difficulty}".`,
      );
    }
    xp += xpGain;

    // 5. Levelowanie
    let leveledUp = false;
    while (xp >= xpRequiredForLevel(level)) {
      xp -= xpRequiredForLevel(level);
      level++;
      leveledUp = true;

      const newDef = LEVELS[level] || LEVELS[level - 1] || levelDef;
      maxHealth = newDef.maxHealth;
      maxHunger = newDef.maxHunger;
      maxXp = newDef.maxXp;
    }

    // 6. Głód ↓
    const hungerLossPct = HUNGER_LOSS[difficulty];
    hunger = Math.max(0, hunger - hungerLossPct * maxHunger);

    // 7. Zdrowie ↑
    const healthGainPct = HEALTH_GAIN[difficulty];
    health = Math.min(maxHealth, health + healthGainPct * maxHealth);

    // 8. Zapis profilu
    tx.set(
      userRef,
      {
        xp,
        level,
        maxHealth,
        maxHunger,
        maxXp,
        health,
        hunger,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // 9. Oznacz zadanie jako ukończone
    tx.set(
      taskRef,
      {
        status: 'done',
        completed: true,
        completedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      xp,
      level,
      maxHealth,
      maxHunger,
      maxXp,
      health,
      hunger,
      leveledUp,
    };
  });

  return result;
});
