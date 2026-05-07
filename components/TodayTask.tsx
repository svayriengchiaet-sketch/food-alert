'use client';

import { TodayTask as TodayTaskType } from '@/lib/types';
import { REVIEW_LABELS } from '@/lib/schedule';
import { CheckCircle, BookOpen, Sunrise, Sparkles } from 'lucide-react';

interface Props {
  task: TodayTaskType | null;
  isWeekend: boolean;
  nextUnstartedLesson: number | null;
  onComplete: () => void;
  onStartNewLesson: (lessonId: number) => void;
}

export default function TodayTask({
  task,
  isWeekend,
  nextUnstartedLesson,
  onComplete,
  onStartNewLesson,
}: Props) {
  if (isWeekend) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="text-center py-6">
          <Sunrise className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-gray-700 mt-3">今日は週末です</h2>
          <p className="text-gray-400 mt-2 text-sm">ゆっくり休んで、平日に備えましょう</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">今日のタスク</p>
        <div className="text-center py-2">
          <Sparkles className="w-10 h-10 text-blue-400 mx-auto" />
          <p className="text-gray-600 mt-3 font-medium">今日の予定はありません</p>

          {nextUnstartedLesson !== null ? (
            <div className="mt-5">
              <p className="text-sm text-gray-400 mb-3">新しいLESSONを始めませんか？</p>
              <button
                onClick={() => onStartNewLesson(nextUnstartedLesson)}
                className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md text-base"
              >
                LESSON {nextUnstartedLesson} を始める
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-3">全てのLESSONが開始済みです</p>
          )}
        </div>
      </div>
    );
  }

  const isCompleted = task.completedDate !== null;

  return (
    <div
      className={`rounded-2xl p-6 shadow-sm border transition-colors ${
        isCompleted
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-100'
      }`}
    >
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">今日のタスク</p>

      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            isCompleted ? 'bg-green-500' : 'bg-blue-500'
          }`}
        >
          {isCompleted ? (
            <CheckCircle className="w-8 h-8 text-white" />
          ) : (
            <BookOpen className="w-8 h-8 text-white" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-3xl font-black text-gray-900">LESSON {task.lessonId}</h3>
            {isCompleted && (
              <span className="text-sm font-semibold text-green-600 bg-green-100 px-2.5 py-0.5 rounded-full">
                完了
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{REVIEW_LABELS[task.reviewNumber]}</p>
        </div>
      </div>

      {!isCompleted ? (
        <button
          onClick={onComplete}
          className="mt-6 w-full bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-black py-4 rounded-xl transition-all shadow-md text-lg tracking-wide"
        >
          ✓ 完了にする
        </button>
      ) : (
        <div className="mt-5 text-center">
          <p className="text-green-600 font-semibold">今日のタスクを完了しました！</p>
        </div>
      )}
    </div>
  );
}
