import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { AppState, ReminderPermissionState } from "../types";
import { hasTimePassed, toDateKey } from "./date";
import { isSessionPending } from "./learningEngine";

const DAILY_REMINDER_ID = 101;
const DAILY_CHANNEL_ID = "daily-learning";

interface ReminderLoopOptions {
  getSnapshot: () => AppState;
  getNow: () => Date;
  onNotify: (dateKey: string) => void;
}

export function isNativeReminderPlatform() {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("LocalNotifications");
}

export async function getReminderPermission(): Promise<ReminderPermissionState> {
  if (isNativeReminderPlatform()) {
    const permission = await LocalNotifications.checkPermissions();
    return permission.display;
  }

  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

export async function requestReminderPermission(): Promise<ReminderPermissionState> {
  if (isNativeReminderPlatform()) {
    const permission = await LocalNotifications.requestPermissions();
    return permission.display;
  }

  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.requestPermission();
}

export function isReminderDue(state: AppState, dateKey: string, now: Date): boolean {
  const session = state.dailySessions[dateKey];

  if (!session || !isSessionPending(session)) {
    return false;
  }

  if (!state.settings.preferredReminderTime) {
    return false;
  }

  if (state.lastNotificationDate === dateKey) {
    return false;
  }

  return hasTimePassed(dateKey, state.settings.preferredReminderTime, now);
}

export async function syncNativeReminderSchedule(state: AppState) {
  if (!isNativeReminderPlatform()) {
    return;
  }

  await ensureDailyChannel();
  await LocalNotifications.cancel({
    notifications: [{ id: DAILY_REMINDER_ID }]
  });

  if (!state.settings.notificationsEnabled || state.settings.notificationPermission !== "granted") {
    return;
  }

  const [hoursText, minutesText] = state.settings.preferredReminderTime.split(":");
  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return;
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id: DAILY_REMINDER_ID,
        title: "Learn English",
        body: "Tu practica diaria esta lista: nuevas palabras y repasos te esperan.",
        channelId: DAILY_CHANNEL_ID,
        actionTypeId: "OPEN_APP",
        ongoing: false,
        autoCancel: true,
        schedule: {
          on: {
            hour: hours,
            minute: minutes
          },
          repeats: true,
          allowWhileIdle: true
        }
      }
    ]
  });
}

export function startReminderLoop(options: ReminderLoopOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return () => undefined;
  }

  const checkForReminder = () => {
    const snapshot = options.getSnapshot();
    const now = options.getNow();
    const todayKey = toDateKey(now);

    if (!snapshot.settings.notificationsEnabled) {
      return;
    }

    if (snapshot.settings.notificationPermission !== "granted") {
      return;
    }

    if (!isReminderDue(snapshot, todayKey, now)) {
      return;
    }

    const notification = new Notification("Tu practica diaria esta lista", {
      body: "Tienes palabras nuevas y repasos esperando en Learn English.",
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      tag: `learn-english-${todayKey}`
    });

    notification.onclick = () => {
      window.focus();
    };

    options.onNotify(todayKey);
  };

  checkForReminder();

  const intervalId = window.setInterval(checkForReminder, 60_000);
  return () => window.clearInterval(intervalId);
}

async function ensureDailyChannel() {
  const existingChannels = await LocalNotifications.listChannels();
  if (existingChannels.channels.some((channel) => channel.id === DAILY_CHANNEL_ID)) {
    return;
  }

  await LocalNotifications.createChannel({
    id: DAILY_CHANNEL_ID,
    name: "Practica diaria",
    description: "Recordatorios diarios para estudiar vocabulario.",
    importance: 4,
    visibility: 1,
    vibration: true,
    lights: true
  });
}
