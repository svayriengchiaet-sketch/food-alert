'use client';

import { differenceInDays } from 'date-fns';
import { Trash2, Clock, Package } from 'lucide-react';
import { FoodItem } from '@/lib/types';

interface FoodItemCardProps {
  item: FoodItem;
  onDelete: (id: string) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  '野菜・果物': '🥦',
  '肉・魚介': '🥩',
  '乳製品・卵': '🥛',
  '豆腐・大豆製品': '🫘',
  '調味料・油': '🫙',
  '加工食品': '🥫',
  'パン・麺類': '🍞',
  '飲み物': '🧃',
  '菓子・スイーツ': '🍪',
  '冷凍食品': '❄️',
  'その他': '🛒',
};

function getExpirationStatus(expirationDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  const daysLeft = differenceInDays(expDate, today);

  if (daysLeft < 0) {
    return {
      label: '期限切れ',
      color: 'text-red-600',
      bg: 'bg-red-50',
      badge: 'bg-red-500',
      border: 'border-red-200',
      daysLeft,
    };
  } else if (daysLeft === 0) {
    return {
      label: '今日まで',
      color: 'text-red-500',
      bg: 'bg-red-50',
      badge: 'bg-red-500',
      border: 'border-red-200',
      daysLeft,
    };
  } else if (daysLeft <= 1) {
    return {
      label: '明日まで',
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      badge: 'bg-orange-500',
      border: 'border-orange-200',
      daysLeft,
    };
  } else if (daysLeft <= 3) {
    return {
      label: `あと${daysLeft}日`,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      badge: 'bg-amber-500',
      border: 'border-amber-200',
      daysLeft,
    };
  } else if (daysLeft <= 7) {
    return {
      label: `あと${daysLeft}日`,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      badge: 'bg-yellow-500',
      border: 'border-yellow-200',
      daysLeft,
    };
  } else {
    return {
      label: `あと${daysLeft}日`,
      color: 'text-green-600',
      bg: 'bg-green-50',
      badge: 'bg-green-500',
      border: 'border-green-200',
      daysLeft,
    };
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function FoodItemCard({ item, onDelete }: FoodItemCardProps) {
  const status = getExpirationStatus(item.expirationDate);
  const emoji = CATEGORY_EMOJI[item.category] || '🛒';

  // Progress bar: 0% = expired, 100% = just purchased
  const progressPercent = Math.max(
    0,
    Math.min(100, (status.daysLeft / item.shelfLifeDays) * 100)
  );

  return (
    <div
      className={`bg-white rounded-2xl border ${status.border} shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden`}
    >
      <div className={`h-1 ${status.badge}`} style={{ width: '100%' }}>
        <div
          className="h-full bg-opacity-30 bg-white transition-all duration-300"
          style={{ width: `${100 - progressPercent}%` }}
        />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={`text-2xl leading-none mt-0.5 flex-shrink-0 w-10 h-10 ${status.bg} rounded-xl flex items-center justify-center`}
            >
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                {item.ingredient}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {item.receiptName}
              </p>
              <span className="inline-block mt-1.5 text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                {item.category}
              </span>
            </div>
          </div>

          <button
            onClick={() => onDelete(item.id)}
            className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="削除"
          >
            <Trash2 size={15} />
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Package size={12} />
            <span>{formatDate(item.purchaseDate)}購入</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={12} />
              <span>{formatDate(item.expirationDate)}まで</span>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${status.badge}`}
            >
              {status.label}
            </span>
          </div>
        </div>

        {item.storageNote && (
          <p className="mt-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-1.5">
            💡 {item.storageNote}
          </p>
        )}
      </div>
    </div>
  );
}
