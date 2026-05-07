import { AppData, LessonData, TodayTask } from './types';

export const TOTAL_LESSONS = 50;
export const TOTAL_REVIEWS = 7;

// Calendar days to add from the previous review's completion date
export const REVIEW_INTERVALS: Record<number, number> = {
  2: 1,   // Next day
  3: 3,   // 3 days later
  4: 7,   // 1 week later
  5: 7,   // 1 week later
  6: 14,  // 2 weeks later
  7: 30,  // ~1 month later
};

export const REVIEW_LABELS: Record<number, string> = {
  1: '初回学習',
  2: '2回目（翌日）',
  3: '3回目（3日後）',
  4: '4回目（1週間後）',
  5: '5回目（1週間後）',
  6: '6回目（2週間後）',
  7: '7回目（1ヶ月後）',
};

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function nextWeekdayOnOrAfter(date: Date): Date {
  const result = new Date(date);
  while (!isWeekday(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

function addCalendarDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Returns all dates currently occupied by scheduled reviews
export function getOccupiedDates(
  data: AppData,
  excludeLessonId?: number,
  excludeReviewNumber?: number,
): Set<string> {
  const occupied = new Set<string>();
  for (const lesson of data.lessons) {
    for (const review of lesson.reviews) {
      if (!review.scheduledDate) continue;
      if (
        lesson.lessonId === excludeLessonId &&
        review.reviewNumber === excludeReviewNumber
      ) continue;
      occupied.add(review.scheduledDate);
    }
  }
  return occupied;
}

// Finds the earliest weekday on or after targetDate that's not in occupiedDates
export function findAvailableDate(targetDate: Date, occupiedDates: Set<string>): Date {
  let date = nextWeekdayOnOrAfter(new Date(targetDate));
  while (occupiedDates.has(toISODate(date))) {
    date.setDate(date.getDate() + 1);
    date = nextWeekdayOnOrAfter(date);
  }
  return date;
}

// Calculate the scheduled date for reviewNumber, given the previous review's date
export function calculateNextReviewDate(
  prevDate: Date,
  reviewNumber: number,
  occupiedDates: Set<string>,
): Date {
  const days = REVIEW_INTERVALS[reviewNumber];
  const target = addCalendarDays(prevDate, days);
  return findAvailableDate(target, occupiedDates);
}

// Returns today's task, or null if nothing is scheduled for today
export function getTodayTask(data: AppData, today: string): TodayTask | null {
  for (const lesson of data.lessons) {
    for (const review of lesson.reviews) {
      if (review.scheduledDate === today) {
        return {
          lessonId: lesson.lessonId,
          reviewNumber: review.reviewNumber,
          scheduledDate: today,
          completedDate: review.completedDate,
        };
      }
    }
  }
  return null;
}

// Returns the ID of the next lesson that hasn't been started yet
export function getNextUnstartedLesson(data: AppData): number | null {
  for (const lesson of data.lessons) {
    if (lesson.reviews[0].scheduledDate === null) {
      return lesson.lessonId;
    }
  }
  return null;
}

// Moves all overdue (past, uncompleted) reviews to the next available weekday
export function rescheduleOverdue(data: AppData, today: string): AppData {
  const newData: AppData = JSON.parse(JSON.stringify(data));

  type Overdue = { lessonId: number; reviewNumber: number; oldDate: string };
  const overdue: Overdue[] = [];

  for (const lesson of newData.lessons) {
    for (const review of lesson.reviews) {
      if (review.scheduledDate && review.scheduledDate < today && !review.completedDate) {
        overdue.push({ lessonId: lesson.lessonId, reviewNumber: review.reviewNumber, oldDate: review.scheduledDate });
      }
    }
  }

  // Reschedule in chronological order so earlier items claim earlier slots
  overdue.sort((a, b) => a.oldDate.localeCompare(b.oldDate) || a.lessonId - b.lessonId);

  const todayDate = fromISODate(today);
  for (const item of overdue) {
    const lesson = newData.lessons.find(l => l.lessonId === item.lessonId)!;
    const review = lesson.reviews.find(r => r.reviewNumber === item.reviewNumber)!;
    const occupied = getOccupiedDates(newData, item.lessonId, item.reviewNumber);
    review.scheduledDate = toISODate(findAvailableDate(todayDate, occupied));
  }

  return newData;
}

export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

export function getLessonStatus(lesson: LessonData, today: string): LessonStatus {
  if (!lesson.reviews[0].scheduledDate) return 'not_started';
  if (lesson.reviews.every(r => r.completedDate !== null)) return 'completed';
  return 'in_progress';
}

// Returns upcoming scheduled dates (future + today) sorted ascending
export interface UpcomingItem {
  date: string;
  lessonId: number;
  reviewNumber: number;
  isCompleted: boolean;
  isToday: boolean;
}

export function getUpcomingItems(data: AppData, today: string, limit = 7): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  for (const lesson of data.lessons) {
    for (const review of lesson.reviews) {
      if (review.scheduledDate && review.scheduledDate >= today) {
        items.push({
          date: review.scheduledDate,
          lessonId: lesson.lessonId,
          reviewNumber: review.reviewNumber,
          isCompleted: review.completedDate !== null,
          isToday: review.scheduledDate === today,
        });
      }
    }
  }
  items.sort((a, b) => a.date.localeCompare(b.date));
  return items.slice(0, limit);
}
