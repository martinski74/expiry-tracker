import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

// Configure foreground display behaviour.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true, // Позволява бадж, когато приложението е отворено
  }),
});

const ID_PREFIX = "expirytracker:doc";

function buildIdentifier(docId: number, days: number): string {
  return `${ID_PREFIX}:${docId}:${days}`;
}

/**
 * Помощна функция за създаване на Android Notification Channel.
 * Без това приложението не се появява в Settings -> Notifications на Android.
 */
async function configureAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Expiry Notification",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      showBadge: true, // КРИТИЧНО: Казва на Android да показва точка/цифра на иконката
    });
  }
}

/**
 * Request notification permission. Returns true if granted.
 * Safe to call multiple times — only prompts once.
 */
export async function ensurePermission(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  if (Platform.OS === "web") return { granted: false, canAskAgain: false };

  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) {
    // Ако вече имаме разрешение, уверяваме се, че каналът е създаден
    await configureAndroidChannel();
    return { granted: true, canAskAgain: true };
  }
  if (!settings.canAskAgain) {
    return { granted: false, canAskAgain: false };
  }

  const req = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true, // Смених го на true за iOS, в случай че реша да го пускам и там
      allowSound: false,
    },
  });

  if (req.granted) {
    // Създаваме канала веднага след като потребителят натисне "Позволи"
    await configureAndroidChannel();
  }

  return {
    granted: req.granted,
    canAskAgain: req.canAskAgain ?? true,
  };
}

type ScheduleInput = {
  docId: number;
  title: string;
  expiryISO: string;
  reminderDays: number[];
  /** EN/BG strings for the body. Pass already-translated strings. */
  notifTitleTemplate: string; // contains "{title}"
  bodyTemplates: {
    today: string;
    tomorrow: string;
    daysTemplate: string; // contains "{n}"
  };
};

/**
 * Schedule local notifications for each reminderDay (e.g. [30, 7, 1]).
 * Already-passed reminder times are silently skipped.
 * No-op on web.
 */
export async function scheduleForDocument(input: ScheduleInput): Promise<void> {
  if (Platform.OS === "web") return;

  const expiry = new Date(input.expiryISO);
  expiry.setHours(9, 0, 0, 0); // notify at 9am local time

  const now = new Date();

  for (const days of input.reminderDays) {
    const fireAt = new Date(expiry);
    fireAt.setDate(fireAt.getDate() - days);

    if (fireAt.getTime() <= now.getTime()) {
      // already in the past — skip
      continue;
    }

    const body =
      days === 0
        ? input.bodyTemplates.today
        : days === 1
          ? input.bodyTemplates.tomorrow
          : input.bodyTemplates.daysTemplate.replace("{n}", String(days));

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: buildIdentifier(input.docId, days),
        content: {
          title: input.notifTitleTemplate.replace("{title}", input.title),
          body,
          data: { docId: input.docId },
          // Задаваме бадж за конкретното известие. 
          // Когато известието се задейства, баджът ще стане 1.
          badge: 1,
          // Свързваме известието с нашия Android канал
          ...Platform.select({
            android: {
              channelId: "default",
            },
          }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
        },
      });
    } catch (e) {
      console.warn("[Notif] schedule failed:", e);
    }
  }
}

/**
 * Cancel all notifications previously scheduled for this document
 * (across all reminder days).
 * No-op on web.
 */
export async function cancelForDocument(
  docId: number,
  reminderDays: number[]
): Promise<void> {
  if (Platform.OS === "web") return;

  for (const days of reminderDays) {
    try {
      await Notifications.cancelScheduledNotificationAsync(
        buildIdentifier(docId, days)
      );
    } catch {
      // identifier may not exist — ignore
    }
  }
}

/**
 * Cancel old + schedule new — used on edit.
 */
export async function rescheduleForDocument(
  input: ScheduleInput & { previousReminderDays: number[] }
): Promise<void> {
  await cancelForDocument(input.docId, input.previousReminderDays);
  await scheduleForDocument(input);
}