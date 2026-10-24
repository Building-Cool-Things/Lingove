// not_started: not opened yet | in_progress: user is working on it | completed: all required parts done
export const PROGRESS_STATUSES = ["not_started", "in_progress", "completed"] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];
