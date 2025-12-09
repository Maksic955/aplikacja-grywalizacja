import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https'; // ← DODANE onRequest
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  XP_REWARD,
  HUNGER_REDUCTION,
  HEALTH_GAIN,
  HUNGER_INCREASE_PER_HOUR,
  HEALTH_LOSS_WHEN_STARVING,
  LEVELS,
  xpRequiredForLevel,
  CHALLENGES,
  VALID_DIFFICULTIES,
  VALID_STATUSES,
} from './constants.js';

// Inicjalizacja
initializeApp();
const db = getFirestore();

export const seedChallenges = onRequest(async (req, res) => {
  try {
    const batch = db.batch();

    CHALLENGES.forEach((challenge) => {
      const ref = db.collection('challenges').doc(challenge.id);
      batch.set(ref, challenge);
    });

    await batch.commit();

    res.status(200).send({
      success: true,
      message: `✅ Dodano ${CHALLENGES.length} wyzwań do Firestore!`,
      count: CHALLENGES.length,
    });
  } catch (error) {
    console.error('Error seeding challenges:', error);
    res.status(500).send({
      success: false,
      error: error.message,
    });
  }
});

export const increaseHunger = onSchedule('every 1 hours', async (event) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();
    let updatedCount = 0;

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const currentHunger = Number(userData.hunger ?? 0);
      const maxHunger = Number(userData.maxHunger ?? 250);
      const currentHealth = Number(userData.health ?? userData.maxHealth ?? 300);
      const maxHealth = Number(userData.maxHealth ?? 300);

      let newHunger = currentHunger + HUNGER_INCREASE_PER_HOUR * maxHunger;
      newHunger = Math.min(newHunger, maxHunger);

      let newHealth = currentHealth;

      if (newHunger >= maxHunger && currentHealth > 0) {
        newHealth = Math.max(0, currentHealth - HEALTH_LOSS_WHEN_STARVING * maxHealth);
      }

      batch.update(userDoc.ref, {
        hunger: newHunger,
        health: newHealth,
        updatedAt: FieldValue.serverTimestamp(),
      });

      updatedCount++;
    });

    await batch.commit();
  } catch (error) {
    console.error('❌ Error in increaseHunger:', error);
  }
});

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
    nickname: null,
    avatarUrl: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection('users').doc(userId).set(profileData, { merge: true });
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
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const uid = request.auth.uid;
  const { difficulty, taskId } = request.data || {};

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

  const result = await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError('failed-precondition', 'User profile does not exist.');
    }

    const userData = userSnap.data() || {};

    let level = userData.level ?? 1;
    let xp = Number(userData.xp ?? 0);

    const levelDef = LEVELS[level] || LEVELS[1];
    let maxHealth = userData.maxHealth ?? levelDef.maxHealth;
    let maxHunger = userData.maxHunger ?? levelDef.maxHunger;
    let maxXp = userData.maxXp ?? levelDef.maxXp;

    xp = Number.isFinite(xp) ? xp : 0;

    let health = Number(userData.health ?? maxHealth);
    if (!Number.isFinite(health)) health = maxHealth;

    let hunger = Number(userData.hunger ?? 0);
    if (!Number.isFinite(hunger)) hunger = 0;

    const xpGain = XP_REWARD[difficulty];
    if (typeof xpGain !== 'number') {
      throw new HttpsError(
        'internal',
        `XP_REWARD is not configured for difficulty "${difficulty}".`,
      );
    }
    xp += xpGain;

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

    const hungerReductionPct = HUNGER_REDUCTION[difficulty];
    hunger = Math.max(0, hunger - hungerReductionPct * maxHunger);

    const healthGainPct = HEALTH_GAIN[difficulty];
    health = Math.min(maxHealth, health + healthGainPct * maxHealth);

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

export const checkChallenges = onDocumentWritten('users/{userId}/tasks/{taskId}', async (event) => {
  const userId = event.params.userId;

  const beforeData = event.data?.before?.data();
  const afterData = event.data?.after?.data();

  if (!afterData) return;

  const wasCompleted = beforeData?.status === 'done';
  const isNowCompleted = afterData?.status === 'done';

  if (wasCompleted || !isNowCompleted) {
    return;
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.error(`User ${userId} not found`);
      return;
    }

    const userData = userSnap.data();
    const userLevel = userData.level || 1;

    const tasksSnap = await db.collection('users').doc(userId).collection('tasks').get();

    const stats = calculateUserStats(tasksSnap.docs, userData, afterData);

    const challengesSnap = await db
      .collection('challenges')
      .where('requiredLevel', '<=', userLevel)
      .get();

    const batch = db.batch();
    let completedCount = 0;
    let totalXpGained = 0;

    for (const challengeDoc of challengesSnap.docs) {
      const challenge = challengeDoc.data();
      const challengeId = challengeDoc.id;

      const userChallengeRef = db
        .collection('users')
        .doc(userId)
        .collection('userChallenges')
        .doc(challengeId);

      const userChallengeSnap = await userChallengeRef.get();
      const userChallenge = userChallengeSnap.data();

      if (userChallenge?.status === 'completed') {
        continue;
      }

      const conditionResult = checkChallengeCondition(challenge.condition, stats, afterData);

      if (conditionResult.completed) {
        batch.set(
          userChallengeRef,
          {
            status: 'completed',
            progress: conditionResult.progress,
            completedAt: FieldValue.serverTimestamp(),
            xpRewarded: challenge.xpReward,
          },
          { merge: true },
        );

        batch.update(userRef, {
          xp: FieldValue.increment(challenge.xpReward),
        });

        completedCount++;
        totalXpGained += challenge.xpReward;
      } else {
        batch.set(
          userChallengeRef,
          {
            status: 'active',
            progress: conditionResult.progress,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    }

    if (stats.currentStreak > (userData.currentStreak || 0)) {
      batch.update(userRef, {
        currentStreak: stats.currentStreak,
        lastTaskCompletedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    console.error(`❌ Error checking challenges for user ${userId}:`, error);
  }
});

function calculateUserStats(taskDocs, userData, currentTask) {
  let totalCompleted = 0;
  let totalCreated = taskDocs.length;
  let onTimeCompleted = 0;
  let hardCompleted = 0;
  let mediumCompleted = 0;
  let easyCompleted = 0;
  let fastTasks = { under30: 0, under60: 0 };
  let completedToday = 0;
  let tasksBeforeNoon = 0;
  let tasksAfter23 = 0;
  let totalTimeSpent = 0;

  const completedTasks = [];
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  taskDocs.forEach((doc) => {
    const task = doc.data();

    if (task.status === 'done') {
      totalCompleted++;
      completedTasks.push(task);

      const completedAt = task.completedAt?.toDate ? task.completedAt.toDate() : null;
      const createdAt = task.createdAt?.toDate ? task.createdAt.toDate() : null;
      const dueDate = task.dueDate?.toDate ? task.dueDate.toDate() : null;

      if (dueDate && completedAt && completedAt <= dueDate) {
        onTimeCompleted++;
      }

      if (task.difficulty === 'trudny') hardCompleted++;
      if (task.difficulty === 'sredni') mediumCompleted++;
      if (task.difficulty === 'latwy') easyCompleted++;

      if (createdAt && completedAt) {
        const durationMinutes = (completedAt - createdAt) / (1000 * 60);
        if (durationMinutes < 30) fastTasks.under30++;
        if (durationMinutes < 60) fastTasks.under60++;
      }

      if (completedAt && completedAt >= todayStart) {
        completedToday++;
      }

      if (completedAt && completedAt.getHours() < 12) {
        tasksBeforeNoon++;
      }

      if (completedAt && completedAt.getHours() >= 23) {
        tasksAfter23++;
      }

      if (task.timeSpent) {
        totalTimeSpent += task.timeSpent;
      }
    }
  });

  const currentStreak = calculateStreak(completedTasks);

  let sameDayTasks = 0;
  completedTasks.forEach((task) => {
    const completedAt = task.completedAt?.toDate ? task.completedAt.toDate() : null;
    const createdAt = task.createdAt?.toDate ? task.createdAt.toDate() : null;

    if (completedAt && createdAt) {
      const isSameDay =
        completedAt.getDate() === createdAt.getDate() &&
        completedAt.getMonth() === createdAt.getMonth() &&
        completedAt.getFullYear() === createdAt.getFullYear();
      if (isSameDay) sameDayTasks++;
    }
  });

  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const tasksInLast7Days = completedTasks.filter((task) => {
    const completedAt = task.completedAt?.toDate ? task.completedAt.toDate() : null;
    return completedAt && completedAt >= last7Days;
  }).length;

  return {
    totalCompleted,
    totalCreated,
    onTimeCompleted,
    hardCompleted,
    mediumCompleted,
    easyCompleted,
    fastTasksUnder30: fastTasks.under30,
    fastTasksUnder60: fastTasks.under60,
    completedToday,
    tasksBeforeNoon,
    tasksAfter23,
    sameDayTasks,
    tasksInLast7Days,
    currentStreak,
    totalTimeSpentHours: totalTimeSpent / 60,
    level: userData.level || 1,
    totalXp: userData.xp || 0,
  };
}

function calculateStreak(completedTasks) {
  if (completedTasks.length === 0) return 0;

  const sorted = completedTasks
    .filter((task) => task.completedAt)
    .sort((a, b) => b.completedAt.toMillis() - a.completedAt.toMillis());

  if (sorted.length === 0) return 0;

  let streak = 1;
  const now = Date.now();
  const lastCompleted = sorted[0].completedAt.toMillis();

  const hoursSinceLastTask = (now - lastCompleted) / (1000 * 60 * 60);
  if (hoursSinceLastTask > 24) {
    return 0;
  }

  for (let i = 1; i < sorted.length; i++) {
    const currentTime = sorted[i - 1].completedAt.toMillis();
    const previousTime = sorted[i].completedAt.toMillis();
    const hoursBetween = (currentTime - previousTime) / (1000 * 60 * 60);

    if (hoursBetween <= 24) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function checkChallengeCondition(condition, stats, currentTask) {
  const type = condition.type;
  const target = condition.target;

  switch (type) {
    case 'tasksCompleted':
      return {
        completed: stats.totalCompleted >= target,
        progress: stats.totalCompleted,
      };

    case 'tasksCreated':
      return {
        completed: stats.totalCreated >= target,
        progress: stats.totalCreated,
      };

    case 'tasksOnTime':
      return {
        completed: stats.onTimeCompleted >= target,
        progress: stats.onTimeCompleted,
      };

    case 'hardTasksCompleted':
      return {
        completed: stats.hardCompleted >= target,
        progress: stats.hardCompleted,
      };

    case 'taskStreak':
      return {
        completed: stats.currentStreak >= target,
        progress: stats.currentStreak,
      };

    case 'levelReached':
      return {
        completed: stats.level >= condition.level,
        progress: stats.level,
      };

    case 'totalXpEarned':
      return {
        completed: stats.totalXp >= target,
        progress: stats.totalXp,
      };

    case 'taskCompletedUnder':
      if (!currentTask) {
        return { completed: false, progress: 0 };
      }

      let createdAt = null;
      let completedAt = null;

      if (currentTask.createdAt) {
        createdAt = currentTask.createdAt.toDate
          ? currentTask.createdAt.toDate()
          : currentTask.createdAt;
      }
      if (currentTask.completedAt) {
        completedAt = currentTask.completedAt.toDate
          ? currentTask.completedAt.toDate()
          : currentTask.completedAt;
      }

      if (createdAt && completedAt) {
        const durationMinutes = (completedAt - createdAt) / (1000 * 60);
        return {
          completed: durationMinutes < condition.minutes,
          progress: durationMinutes < condition.minutes ? 1 : 0,
        };
      }

      return { completed: false, progress: 0 };
    case 'fastTasksCompleted':
      const count = condition.minutes === 30 ? stats.fastTasksUnder30 : stats.fastTasksUnder60;
      return {
        completed: count >= target,
        progress: count,
      };

    case 'taskBeforeHour':
      return {
        completed: stats.tasksBeforeNoon >= 1,
        progress: stats.tasksBeforeNoon,
      };

    case 'taskAfterHour':
      return {
        completed: stats.tasksAfter23 >= 1,
        progress: stats.tasksAfter23,
      };

    case 'taskSameDay':
      return {
        completed: stats.sameDayTasks >= target,
        progress: stats.sameDayTasks,
      };

    case 'tasksInDays':
      return {
        completed: stats.tasksInLast7Days >= target,
        progress: stats.tasksInLast7Days,
      };

    case 'totalTimeSpent':
      return {
        completed: stats.totalTimeSpentHours >= condition.hours,
        progress: stats.totalTimeSpentHours,
      };

    default:
      console.warn(`Unknown challenge condition type: ${type}`);
      return { completed: false, progress: 0 };
  }
}

export const retroactiveCheckChallenges = onRequest(async (req, res) => {
  const userId = req.query.userId;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).send({ error: 'Missing userId parameter' });
  }

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).send({ error: 'User not found' });
    }
    const userData = userDoc.data();

    const tasksSnap = await db.collection('users').doc(userId).collection('tasks').get();

    const stats = calculateUserStats(tasksSnap.docs, userData, null);

    const challengesSnap = await db.collection('challenges').get();

    const batch = db.batch();
    let completedCount = 0;

    for (const challengeDoc of challengesSnap.docs) {
      const challenge = challengeDoc.data();

      const userChallengeRef = db
        .collection('users')
        .doc(userId)
        .collection('userChallenges')
        .doc(challengeDoc.id);

      const userChallengeSnap = await userChallengeRef.get();
      if (userChallengeSnap.exists && userChallengeSnap.data().status === 'completed') {
        continue;
      }

      const conditionResult = checkChallengeCondition(challenge.condition, stats, null);

      if (conditionResult.completed) {
        batch.set(
          userChallengeRef,
          {
            status: 'completed',
            progress: conditionResult.progress,
            completedAt: FieldValue.serverTimestamp(),
            xpRewarded: challenge.xpReward,
            retroactive: true,
          },
          { merge: true },
        );
        batch.update(db.collection('users').doc(userId), {
          xp: FieldValue.increment(challenge.xpReward),
        });

        completedCount++;
      }
    }

    await batch.commit();

    res.status(200).send({
      success: true,
      userId,
      completedCount,
      message: `Retroactively completed ${completedCount} challenges!`,
    });
  } catch (error) {
    console.error('Error in retroactiveCheckChallenges:', error);
    res.status(500).send({ error: error.message });
  }
});
