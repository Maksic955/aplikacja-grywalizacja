import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Konfiguracja
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationsContextType {
  notification: Notifications.Notification | null;
  scheduleNotification: (title: string, body: string, trigger: Date | number) => Promise<string>;
  cancelNotification: (notificationId: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  // Setup przy montowaniu
  useEffect(() => {
    // Android channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2875d4',
      });
    }

    // Listeners
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 Notification received:', notification);
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification tapped:', response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Zaplanuj lokalne powiadomienie
  async function scheduleNotification(title: string, body: string, trigger: Date | number) {
    try {
      let notificationTrigger: Notifications.NotificationTriggerInput;

      if (typeof trigger === 'number') {
        notificationTrigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: trigger,
          repeats: false,
        };
      } else {
        notificationTrigger = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: trigger,
        };
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: notificationTrigger,
      });

      console.log(`✅ Scheduled notification: ${id}`);
      return id;
    } catch (err: any) {
      console.error('Error scheduling notification:', err);
      throw err;
    }
  }

  // Anuluj powiadomienie
  async function cancelNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`🗑️ Cancelled notification: ${notificationId}`);
  }

  const value: NotificationsContextType = {
    notification,
    scheduleNotification,
    cancelNotification,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
