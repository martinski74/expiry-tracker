// Web stub — notifications aren't supported on the web preview.
// Same API as scheduler.ts, but every function is a no-op.

type ScheduleInput = {
  docId: number;
  title: string;
  expiryISO: string;
  reminderDays: number[];
  notifTitleTemplate: string;
  bodyTemplates: { today: string; tomorrow: string; daysTemplate: string };
};

export async function ensurePermission(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  return { granted: false, canAskAgain: false };
}

export async function scheduleForDocument(_input: ScheduleInput): Promise<void> {
  // no-op on web
}

export async function cancelForDocument(
  _docId: number,
  _reminderDays: number[]
): Promise<void> {
  // no-op on web
}

export async function rescheduleForDocument(
  _input: ScheduleInput & { previousReminderDays: number[] }
): Promise<void> {
  // no-op on web
}
