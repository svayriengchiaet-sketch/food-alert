'use client';

import { UpcomingItem, REVIEW_LABELS } from '@/lib/schedule';

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${m}/${d}（${DAY_NAMES[date.getDay()]}）`;
}

interface Props {
  items: UpcomingItem[];
}

export default function UpcomingSchedule({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-gray-400">
        今後の予定はありません
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={`${item.lessonId}-${item.reviewNumber}-${i}`}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
            item.isToday
              ? 'bg-blue-50 border border-blue-200'
              : item.isCompleted
              ? 'bg-gray-50'
              : 'bg-gray-50'
          }`}
        >
          <div className={`text-xs font-semibold w-14 flex-shrink-0 ${item.isToday ? 'text-blue-600' : 'text-gray-400'}`}>
            {item.isToday ? '今日' : formatDate(item.date)}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-gray-800">LESSON {item.lessonId}</span>
            <span className="text-gray-400 text-xs ml-2">{REVIEW_LABELS[item.reviewNumber]}</span>
          </div>
          {item.isCompleted && (
            <span className="text-xs text-emerald-600 font-semibold flex-shrink-0">完了</span>
          )}
          {item.isToday && !item.isCompleted && (
            <span className="text-xs text-blue-600 font-semibold flex-shrink-0">本日</span>
          )}
        </div>
      ))}
    </div>
  );
}
