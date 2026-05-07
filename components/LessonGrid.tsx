'use client';

import { LessonData } from '@/lib/types';
import { getLessonStatus } from '@/lib/schedule';

interface Props {
  lessons: LessonData[];
  today: string;
  todayLessonId?: number;
}

export default function LessonGrid({ lessons, today, todayLessonId }: Props) {
  return (
    <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
      {lessons.map((lesson) => {
        const status = getLessonStatus(lesson, today);
        const completedCount = lesson.reviews.filter(r => r.completedDate !== null).length;
        const isToday = lesson.lessonId === todayLessonId;

        return (
          <div
            key={lesson.lessonId}
            title={`LESSON ${lesson.lessonId}: ${
              status === 'not_started'
                ? '未開始'
                : status === 'completed'
                ? '完了'
                : `${completedCount}/7回`
            }`}
            className={`
              aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-bold
              select-none transition-all
              ${status === 'not_started' ? 'bg-gray-100 text-gray-400' : ''}
              ${status === 'in_progress' && !isToday ? 'bg-blue-100 text-blue-700' : ''}
              ${status === 'in_progress' && isToday ? 'bg-blue-500 text-white ring-2 ring-blue-400 ring-offset-1' : ''}
              ${status === 'completed' ? 'bg-emerald-100 text-emerald-700' : ''}
            `}
          >
            <span className="leading-none">{lesson.lessonId}</span>
            {status === 'in_progress' && (
              <span className={`text-[8px] leading-none mt-0.5 font-normal ${isToday ? 'text-blue-100' : 'text-blue-400'}`}>
                {completedCount}/7
              </span>
            )}
            {status === 'completed' && (
              <span className="text-[8px] leading-none mt-0.5">✓</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
