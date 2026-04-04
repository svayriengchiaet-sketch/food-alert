'use client';

import { differenceInDays } from 'date-fns';
import { Inbox, RefreshCw } from 'lucide-react';
import FoodItemCard from './FoodItemCard';
import { FoodItem } from '@/lib/types';

interface FoodListProps {
  items: FoodItem[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

type TabType = 'all' | 'expiring' | 'fresh';

export default function FoodList({ items, isLoading, onDelete, onRefresh }: FoodListProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedItems = [...items].sort((a, b) => {
    const dateA = new Date(a.expirationDate);
    const dateB = new Date(b.expirationDate);
    return dateA.getTime() - dateB.getTime();
  });

  const expiringItems = sortedItems.filter((item) => {
    const expDate = new Date(item.expirationDate);
    expDate.setHours(0, 0, 0, 0);
    return differenceInDays(expDate, today) <= 3;
  });

  const freshItems = sortedItems.filter((item) => {
    const expDate = new Date(item.expirationDate);
    expDate.setHours(0, 0, 0, 0);
    return differenceInDays(expDate, today) > 3;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span className="text-sm">読み込み中...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
          <Inbox className="w-8 h-8 text-gray-300" />
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-500">食材がありません</p>
          <p className="text-sm text-gray-400 mt-1">
            レシートを撮影して食材を登録しましょう
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {expiringItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">⚠️</span>
            <h2 className="text-sm font-semibold text-gray-600">
              もうすぐ期限切れ
            </h2>
            <span className="ml-auto text-xs font-bold text-white bg-red-400 rounded-full w-5 h-5 flex items-center justify-center">
              {expiringItems.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {expiringItems.map((item) => (
              <FoodItemCard key={item.id} item={item} onDelete={onDelete} />
            ))}
          </div>
        </section>
      )}

      {freshItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">✅</span>
            <h2 className="text-sm font-semibold text-gray-600">
              まだ大丈夫な食材
            </h2>
            <span className="ml-auto text-xs font-bold text-white bg-green-400 rounded-full w-5 h-5 flex items-center justify-center">
              {freshItems.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {freshItems.map((item) => (
              <FoodItemCard key={item.id} item={item} onDelete={onDelete} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
