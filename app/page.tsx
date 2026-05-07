'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen } from 'lucide-react';
import TodayTask from '@/components/TodayTask';
import LessonGrid from '@/components/LessonGrid';
import UpcomingSchedule from '@/components/UpcomingSchedule';
import { loadAppData, saveAppData } from '@/lib/storage';
import {
  toISODate,
  fromISODate,
  isWeekday,
  getTodayTask,
  getNextUnstartedLesson,
  rescheduleOverdue,
  getOccupiedDates,
  calculateNextReviewDate,
  getUpcomingItems,
  TOTAL_REVIEWS,
} from '@/lib/schedule';
import { AppData } from '@/lib/types';

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

function formatTodayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}（${DAY_NAMES[date.getDay()]}）`;
}

export default function Home() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [today] = useState(() => toISODate(new Date()));
  const [todayIsWeekday] = useState(() => isWeekday(new Date()));
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let data = loadAppData();

    if (data.lastCheckedDate !== today) {
      data = rescheduleOverdue(data, today);
      data.lastCheckedDate = today;
      saveAppData(data);
    }

    setAppData(data);
    setupNotifications(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up notification timer on unmount
  useEffect(() => {
    return () => {
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    };
  }, []);

  const setupNotifications = async (data: AppData) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    try {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js');
      }

      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      scheduleNotification(data);
    } catch {
      // Notifications not available
    }
  };

  const scheduleNotification = (data: AppData) => {
    if (Notification.permission !== 'granted') return;

    const now = new Date();
    const target = new Date(now);
    target.setHours(8, 20, 0, 0);

    // Only schedule if 8:20 hasn't passed today
    if (now >= target) return;

    const delay = target.getTime() - now.getTime();
    const task = getTodayTask(data, today);
    const body = task
      ? `今日はLESSON ${task.lessonId}（${task.reviewNumber}回目）があります`
      : '今日の予定を確認しましょう';

    notifTimerRef.current = setTimeout(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.active?.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: '英単語学習の時間です 📚',
            body,
          });
        });
      } else {
        new Notification('英単語学習の時間です 📚', { body });
      }
    }, delay);
  };

  const handleComplete = useCallback(() => {
    if (!appData) return;

    const todayTask = getTodayTask(appData, today);
    if (!todayTask || todayTask.completedDate) return;

    const newData: AppData = JSON.parse(JSON.stringify(appData));
    const lesson = newData.lessons.find(l => l.lessonId === todayTask.lessonId)!;
    const review = lesson.reviews.find(r => r.reviewNumber === todayTask.reviewNumber)!;

    review.completedDate = today;

    // Schedule the next review if this isn't the last one
    if (todayTask.reviewNumber < TOTAL_REVIEWS) {
      const nextReviewNum = todayTask.reviewNumber + 1;
      const nextReview = lesson.reviews.find(r => r.reviewNumber === nextReviewNum)!;
      const occupied = getOccupiedDates(newData, todayTask.lessonId, nextReviewNum);
      const nextDate = calculateNextReviewDate(fromISODate(today), nextReviewNum, occupied);
      nextReview.scheduledDate = toISODate(nextDate);
    }

    saveAppData(newData);
    setAppData(newData);
  }, [appData, today]);

  const handleStartNewLesson = useCallback((lessonId: number) => {
    if (!appData) return;

    const newData: AppData = JSON.parse(JSON.stringify(appData));
    const lesson = newData.lessons.find(l => l.lessonId === lessonId)!;

    // Review 1 is today
    lesson.reviews[0].scheduledDate = today;

    // Pre-schedule review 2 so we can block that date from other lessons
    const occupied = getOccupiedDates(newData, lessonId, 2);
    const review2Date = calculateNextReviewDate(fromISODate(today), 2, occupied);
    lesson.reviews[1].scheduledDate = toISODate(review2Date);

    saveAppData(newData);
    setAppData(newData);
  }, [appData, today]);

  if (!appData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  const todayTask = getTodayTask(appData, today);
  // Only offer to start a new lesson if there's no task today and today is a weekday
  const nextUnstartedLesson =
    !todayTask && todayIsWeekday ? getNextUnstartedLesson(appData) : null;

  const upcomingItems = getUpcomingItems(appData, today, 7);
  const startedCount = appData.lessons.filter(l => l.reviews[0].scheduledDate !== null).length;
  const completedCount = appData.lessons.filter(l =>
    l.reviews.every(r => r.completedDate !== null)
  ).length;

  return (
    <div className="min-h-screen" style={{ background: '#f0f4ff' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-gray-900 text-base leading-none">英単語学習トラッカー</h1>
            <p className="text-xs text-gray-400 mt-0.5">{formatTodayLabel(today)}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400">完了</p>
            <p className="text-sm font-bold text-emerald-600">{completedCount}<span className="text-gray-300 font-normal">/50</span></p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Today's task */}
        <TodayTask
          task={todayTask}
          isWeekend={!todayIsWeekday}
          nextUnstartedLesson={nextUnstartedLesson}
          onComplete={handleComplete}
          onStartNewLesson={handleStartNewLesson}
        />

        {/* Upcoming schedule */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-50">
            <h2 className="font-bold text-gray-700 text-sm">今後の予定</h2>
          </div>
          <div className="px-3 py-3">
            <UpcomingSchedule items={upcomingItems} />
          </div>
        </section>

        {/* Lesson progress grid */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-700 text-sm">LESSON一覧</h2>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                進行中 {startedCount - completedCount}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200 inline-block" />
                完了 {completedCount}
              </span>
            </div>
          </div>
          <LessonGrid
            lessons={appData.lessons}
            today={today}
            todayLessonId={todayTask?.lessonId}
          />
        </section>
      </main>

      <footer className="pb-8 text-center mt-4">
        <p className="text-xs text-gray-300">平日のみ実施 · 1日1LESSON · 朝8:20に通知</p>
      </footer>
    </div>
  );
}
