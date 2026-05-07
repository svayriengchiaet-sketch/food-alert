export interface ReviewEntry {
  reviewNumber: number; // 1-7
  scheduledDate: string | null; // YYYY-MM-DD
  completedDate: string | null;
}

export interface LessonData {
  lessonId: number; // 1-50
  reviews: ReviewEntry[];
}

export interface AppData {
  lessons: LessonData[];
  lastCheckedDate: string | null;
}

export interface TodayTask {
  lessonId: number;
  reviewNumber: number;
  scheduledDate: string;
  completedDate: string | null;
}
