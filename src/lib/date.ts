export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`);
}

export function addDays(dateKey: string, amount: number): string {
  const nextDate = parseDateKey(dateKey);
  nextDate.setDate(nextDate.getDate() + amount);
  return toDateKey(nextDate);
}

export function compareDateKeys(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

export function diffInDays(startDateKey: string, endDateKey: string): number {
  const start = parseDateKey(startDateKey).getTime();
  const end = parseDateKey(endDateKey).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function hasTimePassed(
  dateKey: string,
  reminderTime: string,
  now: Date
): boolean {
  const [hoursText, minutesText] = reminderTime.split(":");
  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return false;
  }

  const reminderDate = parseDateKey(dateKey);
  reminderDate.setHours(hours, minutes, 0, 0);
  return now.getTime() >= reminderDate.getTime();
}

export function formatDateLabel(dateKey: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(parseDateKey(dateKey));
}

export function formatTimeLabel(value: string): string {
  const [hoursText, minutesText] = value.split(":");
  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const previewDate = new Date();
  previewDate.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("es-CR", {
    hour: "numeric",
    minute: "2-digit"
  }).format(previewDate);
}

export function formatDurationLabel(milliseconds: number): string {
  const totalMinutes = Math.round(milliseconds / 60_000);
  if (totalMinutes <= 0) {
    return "menos de 1 min";
  }

  if (totalMinutes === 1) {
    return "1 min";
  }

  return `${totalMinutes} min`;
}
