import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fetch from 'node-fetch';
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

initializeApp();
const db = getFirestore();

// Push notification helper
const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  try {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      priority: 'high',
      channelId: 'default',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data && result.data.status === 'error') {
      console.error('Push notification error:', result.data.message);
      return false;
    }

    console.log('Push notification sent:', result);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

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
    console.error('Error in increaseHunger:', error);
  }
});

// Hunger notifications - every 1 hour
export const checkHungerNotifications = onSchedule(
  {
    schedule: 'every 1 hours',
    timeZone: 'Europe/Warsaw',
    memory: '256MiB',
  },
  async (event) => {
    console.log('Checking hunger notifications...');

    try {
      const usersSnapshot = await db.collection('users').get();
      let notificationsSent = 0;
      let errors = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        const hunger = userData.hunger || 100;
        const expoPushToken = userData.expoPushToken;

        if (!expoPushToken) continue;

        // Skip if notified recently
        const lastNotificationSent = userData.lastHungerNotification?.toDate
          ? userData.lastHungerNotification.toDate()
          : null;
        const now = new Date();
        const hoursSinceLastNotif = lastNotificationSent
          ? (now - lastNotificationSent) / (1000 * 60 * 60)
          : 999;

        if (hoursSinceLastNotif < 6) continue;

        let shouldSendNotification = false;
        let title = '';
        let body = '';

        if (hunger <= 10) {
          shouldSendNotification = true;
          title = '💀 Tasko umiera z głodu!';
          body = `Krytyczny poziom głodu: ${Math.round(hunger)}%. Nakarm natychmiast!`;
        } else if (hunger <= 30) {
          shouldSendNotification = true;
          title = '🚨 Tasko jest bardzo głodny!';
          body = `Poziom głodu: ${Math.round(hunger)}%. Nakarm swoją postać zanim umrze!`;
        } else if (hunger <= 50) {
          shouldSendNotification = true;
          title = '🍕 Tasko jest głodny';
          body = `Poziom głodu: ${Math.round(hunger)}%. Warto nakarmić postać!`;
        }

        if (shouldSendNotification) {
          const success = await sendPushNotification(expoPushToken, title, body, {
            screen: 'character',
            userId: userId,
            action: 'feed',
          });

          if (success) {
            notificationsSent++;
            await userDoc.ref.update({
              lastHungerNotification: FieldValue.serverTimestamp(),
            });
          } else {
            errors++;
          }
        }
      }

      console.log(`Hunger notifications: ${notificationsSent} sent, ${errors} errors`);
      return { notificationsSent, errors };
    } catch (error) {
      console.error('Error in checkHungerNotifications:', error);
      throw error;
    }
  },
);

// Deadline notifications - every 10 minutes
export const checkDeadlineNotifications = onSchedule(
  {
    schedule: 'every 10 minutes',
    timeZone: 'Europe/Warsaw',
    memory: '256MiB',
  },
  async (event) => {
    console.log('Checking deadline notifications...');

    try {
      const now = new Date();
      const usersSnapshot = await db.collection('users').get();
      let notificationsSent = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const expoPushToken = userData.expoPushToken;

        if (!expoPushToken) continue;

        const tasksSnap = await db
          .collection('users')
          .doc(userId)
          .collection('tasks')
          .where('status', '!=', 'done')
          .get();

        for (const taskDoc of tasksSnap.docs) {
          const task = taskDoc.data();
          const dueDate = task.dueDate?.toDate ? task.dueDate.toDate() : null;

          if (!dueDate || dueDate < now) continue;

          const minutesUntilDeadline = (dueDate - now) / (1000 * 60);
          const alreadyNotified2h = task.notified2h || false;
          const alreadyNotified30m = task.notified30m || false;

          // 2 hours before
          if (minutesUntilDeadline <= 120 && minutesUntilDeadline > 110 && !alreadyNotified2h) {
            await sendPushNotification(
              expoPushToken,
              '⏰ Deadline za 2 godziny!',
              `"${task.title}" kończy się o ${dueDate.toLocaleTimeString('pl-PL', {
                hour: '2-digit',
                minute: '2-digit',
              })}`,
              { screen: 'tasks', taskId: taskDoc.id },
            );

            await taskDoc.ref.update({ notified2h: true });
            notificationsSent++;
          }

          // 30 minutes before
          if (minutesUntilDeadline <= 30 && minutesUntilDeadline > 20 && !alreadyNotified30m) {
            await sendPushNotification(
              expoPushToken,
              '🚨 Ostatnie 30 minut!',
              `"${task.title}" kończy się niedługo!`,
              { screen: 'tasks', taskId: taskDoc.id, urgent: true },
            );

            await taskDoc.ref.update({ notified30m: true });
            notificationsSent++;
          }
        }
      }

      console.log(`Deadline notifications: ${notificationsSent} sent`);
      return { notificationsSent };
    } catch (error) {
      console.error('Error in checkDeadlineNotifications:', error);
      throw error;
    }
  },
);

// Daily streak reminder - 20:00
export const dailyStreakReminder = onSchedule(
  {
    schedule: '0 20 * * *',
    timeZone: 'Europe/Warsaw',
    memory: '256MiB',
  },
  async (event) => {
    console.log('Sending daily streak reminders...');

    try {
      const usersSnapshot = await db.collection('users').get();
      let notificationsSent = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const expoPushToken = userData.expoPushToken;
        const currentStreak = userData.currentStreak || 0;

        if (!expoPushToken) continue;

        const tasksSnap = await db
          .collection('users')
          .doc(userId)
          .collection('tasks')
          .where('status', '==', 'done')
          .get();

        let completedToday = false;
        tasksSnap.forEach((taskDoc) => {
          const task = taskDoc.data();
          const completedAt = task.completedAt?.toDate ? task.completedAt.toDate() : null;

          if (completedAt && completedAt >= today) {
            completedToday = true;
          }
        });

        // Send reminder if no task completed today
        if (!completedToday && currentStreak > 0) {
          await sendPushNotification(
            expoPushToken,
            `🔥 Nie zgub streak ${currentStreak} dni!`,
            'Ukończ przynajmniej jedno zadanie dzisiaj, żeby utrzymać passę!',
            { screen: 'tasks', action: 'addTask' },
          );
          notificationsSent++;
        } else if (!completedToday) {
          await sendPushNotification(
            expoPushToken,
            '🎯 Zacznij nową passę!',
            'Ukończ zadanie dzisiaj i zbuduj swój streak!',
            { screen: 'tasks' },
          );
          notificationsSent++;
        }
      }

      console.log(`Daily reminders: ${notificationsSent} sent`);
      return { notificationsSent };
    } catch (error) {
      console.error('Error in dailyStreakReminder:', error);
      throw error;
    }
  },
);

// Paused tasks reminder - every 12 hours
export const checkPausedTasks = onSchedule(
  {
    schedule: 'every 12 hours',
    timeZone: 'Europe/Warsaw',
    memory: '256MiB',
  },
  async (event) => {
    console.log('Checking paused tasks...');

    try {
      const now = new Date();
      const usersSnapshot = await db.collection('users').get();
      let notificationsSent = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const expoPushToken = userData.expoPushToken;

        if (!expoPushToken) continue;

        const tasksSnap = await db
          .collection('users')
          .doc(userId)
          .collection('tasks')
          .where('status', '==', 'paused')
          .get();

        let pausedCount = 0;
        let oldestPausedTask = null;
        let longestPauseDuration = 0;

        tasksSnap.forEach((taskDoc) => {
          const task = taskDoc.data();
          const updatedAt = task.updatedAt?.toDate ? task.updatedAt.toDate() : null;

          if (updatedAt) {
            const hoursSincePause = (now - updatedAt) / (1000 * 60 * 60);

            if (hoursSincePause > 24) {
              pausedCount++;

              if (hoursSincePause > longestPauseDuration) {
                longestPauseDuration = hoursSincePause;
                oldestPausedTask = task;
              }
            }
          }
        });

        if (pausedCount > 0 && oldestPausedTask) {
          const days = Math.floor(longestPauseDuration / 24);

          await sendPushNotification(
            expoPushToken,
            '⏸️ Wróć do akcji!',
            `Masz ${pausedCount} wstrzymanych zadań. "${oldestPausedTask.title}" czeka już ${days} dni!`,
            { screen: 'tasks', filter: 'paused' },
          );
          notificationsSent++;
        }
      }

      console.log(`Paused tasks: ${notificationsSent} notifications sent`);
      return { notificationsSent };
    } catch (error) {
      console.error('Error in checkPausedTasks:', error);
      throw error;
    }
  },
);

// Overdue tasks reminder - daily at 9:00
export const checkOverdueTasks = onSchedule(
  {
    schedule: '0 9 * * *',
    timeZone: 'Europe/Warsaw',
    memory: '256MiB',
  },
  async (event) => {
    console.log('Checking overdue tasks...');

    try {
      const now = new Date();
      const usersSnapshot = await db.collection('users').get();
      let notificationsSent = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const expoPushToken = userData.expoPushToken;

        if (!expoPushToken) continue;

        const tasksSnap = await db
          .collection('users')
          .doc(userId)
          .collection('tasks')
          .where('status', '!=', 'done')
          .get();

        let overdueCount = 0;
        let overdueTaskNames = [];

        tasksSnap.forEach((taskDoc) => {
          const task = taskDoc.data();
          const dueDate = task.dueDate?.toDate ? task.dueDate.toDate() : null;

          if (dueDate && dueDate < now) {
            overdueCount++;
            if (overdueTaskNames.length < 2) {
              overdueTaskNames.push(task.title);
            }
          }
        });

        if (overdueCount > 0) {
          const tasksText = overdueTaskNames.join('", "');
          const moreText = overdueCount > 2 ? ` i ${overdueCount - 2} więcej` : '';

          await sendPushNotification(
            expoPushToken,
            '📅 Masz zaległe zadania!',
            `"${tasksText}"${moreText} czekają na ukończenie.`,
            { screen: 'tasks', filter: 'overdue' },
          );
          notificationsSent++;
        }
      }

      console.log(`Overdue tasks: ${notificationsSent} notifications sent`);
      return { notificationsSent };
    } catch (error) {
      console.error('Error in checkOverdueTasks:', error);
      throw error;
    }
  },
);

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

        // Send challenge completion notification
        if (userData.expoPushToken) {
          await sendPushNotification(
            userData.expoPushToken,
            '🏆 Nowe wyzwanie ukończone!',
            `"${challenge.title}" - zdobyłeś ${challenge.xpReward} XP!`,
            {
              screen: 'challenges',
              challengeId: challengeId,
              xpGained: challenge.xpReward,
            },
          );
        }
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
    console.error(`Error checking challenges for user ${userId}:`, error);
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
