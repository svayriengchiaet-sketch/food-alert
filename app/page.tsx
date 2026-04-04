'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Leaf } from 'lucide-react';
import ReceiptUpload from '@/components/ReceiptUpload';
import FoodList from '@/components/FoodList';
import { FoodItem } from '@/lib/types';

export default function Home() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/items');
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/items?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleItemsAdded = () => {
    setIsUploadOpen(false);
    fetchItems();
  };

  // Summary stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiringSoon = items.filter((item) => {
    const expDate = new Date(item.expirationDate);
    expDate.setHours(0, 0, 0, 0);
    const diff = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 3;
  }).length;

  return (
    <div className="min-h-screen" style={{ background: '#f5f7f5' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b border-green-100"
        style={{ background: 'rgba(245, 247, 245, 0.9)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-base leading-none">食材管理</h1>
              <p className="text-xs text-gray-400 leading-none mt-0.5">消費期限トラッカー</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {expiringSoon > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-red-600">
                  {expiringSoon}件まもなく期限切れ
                </span>
              </div>
            )}
            <button
              onClick={fetchItems}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
              aria-label="更新"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Receipt Upload Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setIsUploadOpen(!isUploadOpen)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🧾</span>
              <div className="text-left">
                <p className="font-semibold text-gray-900 text-sm">レシートを登録</p>
                <p className="text-xs text-gray-400">
                  撮影またはアップロードで食材を自動取得
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white bg-green-500 px-2.5 py-1 rounded-full">
                AI解析
              </span>
              {isUploadOpen ? (
                <ChevronUp size={16} className="text-gray-400" />
              ) : (
                <ChevronDown size={16} className="text-gray-400" />
              )}
            </div>
          </button>

          {isUploadOpen && (
            <div className="px-5 pb-5 border-t border-gray-50">
              <div className="pt-4">
                <ReceiptUpload onItemsAdded={handleItemsAdded} />
              </div>
            </div>
          )}
        </section>

        {/* Stats bar */}
        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">登録食材</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
              <p className="text-2xl font-bold text-amber-500">{expiringSoon}</p>
              <p className="text-xs text-gray-400 mt-0.5">期限間近</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
              <p className="text-2xl font-bold text-green-500">{items.length - expiringSoon}</p>
              <p className="text-xs text-gray-400 mt-0.5">新鮮</p>
            </div>
          </div>
        )}

        {/* Food Items List */}
        <section>
          <FoodList
            items={items}
            isLoading={isLoading}
            onDelete={handleDelete}
            onRefresh={fetchItems}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-8 text-center">
        <p className="text-xs text-gray-300">
          期限3日前にメールでお知らせします
        </p>
      </footer>
    </div>
  );
}
