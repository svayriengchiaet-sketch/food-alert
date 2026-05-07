import { AppData, LessonData } from './types';
import { TOTAL_LESSONS, TOTAL_REVIEWS } from './schedule';

const STORAGE_KEY = 'english-learning-v1';

function buildInitialLessons(): LessonData[] {
  return Array.from({ length: TOTAL_LESSONS }, (_, i) => ({
    lessonId: i + 1,
    reviews: Array.from({ length: TOTAL_REVIEWS }, (_, j) => ({
      reviewNumber: j + 1,
      scheduledDate: null,
      completedDate: null,
    })),
  }));
}

export function initializeAppData(): AppData {
  return {
    lessons: buildInitialLessons(),
    lastCheckedDate: null,
  };
}

export function loadAppData(): AppData {
  if (typeof window === 'undefined') return initializeAppData();

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initial = initializeAppData();
    saveAppData(initial);
    return initial;
  }

  try {
    const parsed = JSON.parse(stored) as AppData;
    // Ensure all 50 lessons are present (handles schema migrations)
    while (parsed.lessons.length < TOTAL_LESSONS) {
      const id = parsed.lessons.length + 1;
      parsed.lessons.push({
        lessonId: id,
        reviews: Array.from({ length: TOTAL_REVIEWS }, (_, j) => ({
          reviewNumber: j + 1,
          scheduledDate: null,
          completedDate: null,
        })),
      });
    }
    return parsed;
  } catch {
    const initial = initializeAppData();
    saveAppData(initial);
    return initial;
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
