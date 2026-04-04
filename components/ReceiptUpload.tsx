'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Loader2, CheckCircle, X } from 'lucide-react';
import Image from 'next/image';

interface AnalyzedItem {
  receiptName: string;
  ingredient: string;
  category: string;
  shelfLifeDays: number;
  storageNote?: string;
  selected: boolean;
}

interface ReceiptUploadProps {
  onItemsAdded: () => void;
}

export default function ReceiptUpload({ onItemsAdded }: ReceiptUploadProps) {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'confirm' | 'saving'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzedItems, setAnalyzedItems] = useState<AnalyzedItem[]>([]);
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    setError(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStep('analyzing');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/analyze-receipt', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'レシートの解析に失敗しました');
      }

      if (!data.items || data.items.length === 0) {
        throw new Error('食材が見つかりませんでした。別のレシートをお試しください');
      }

      setAnalyzedItems(data.items.map((item: Omit<AnalyzedItem, 'selected'>) => ({ ...item, selected: true })));
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setStep('upload');
      setPreviewUrl(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const toggleItem = (index: number) => {
    setAnalyzedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleSave = async () => {
    const selectedItems = analyzedItems.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      setError('保存する食材を選択してください');
      return;
    }

    setStep('saving');
    setError(null);

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newItems: selectedItems,
          purchaseDate,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '保存に失敗しました');
      }

      onItemsAdded();
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存中にエラーが発生しました');
      setStep('confirm');
    }
  };

  const reset = () => {
    setStep('upload');
    setPreviewUrl(null);
    setAnalyzedItems([]);
    setError(null);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  };

  if (step === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="relative">
          {previewUrl && (
            <div className="w-32 h-40 relative rounded-xl overflow-hidden shadow-lg opacity-60">
              <Image src={previewUrl} alt="レシート" fill style={{ objectFit: 'cover' }} />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-700">レシートを解析中...</p>
          <p className="text-sm text-gray-400 mt-1">AIが食材を識別しています</p>
        </div>
      </div>
    );
  }

  if (step === 'confirm' || step === 'saving') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {analyzedItems.filter((i) => i.selected).length}件の食材が見つかりました
          </h3>
          <button
            onClick={reset}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 whitespace-nowrap">購入日：</label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {analyzedItems.map((item, index) => (
            <button
              key={index}
              onClick={() => toggleItem(index)}
              className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${
                item.selected
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-100 bg-gray-50 opacity-60'
              }`}
            >
              <div
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                  item.selected
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300'
                }`}
              >
                {item.selected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">
                    {item.ingredient}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 bg-white rounded-full text-gray-500 border border-gray-200">
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-400">{item.receiptName}</span>
                  <span className="text-xs text-gray-500">
                    保存目安: {item.shelfLifeDays}日
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={reset}
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            disabled={step === 'saving'}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={
              step === 'saving' ||
              analyzedItems.filter((i) => i.selected).length === 0
            }
            className="flex-1 py-2.5 text-sm font-medium text-white bg-green-500 rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {step === 'saving' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                {analyzedItems.filter((i) => i.selected).length}件を登録
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-green-400 bg-green-50'
            : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
            <Upload className="w-7 h-7 text-green-500" />
          </div>
          <div>
            <p className="font-medium text-gray-700">
              レシートをドラッグ＆ドロップ
            </p>
            <p className="text-sm text-gray-400 mt-1">または クリックして選択</p>
          </div>
          <p className="text-xs text-gray-300">JPEG・PNG・WebP 対応</p>
        </div>
      </div>

      <button
        onClick={() => cameraInputRef.current?.click()}
        className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-green-600 border-2 border-green-200 rounded-2xl hover:bg-green-50 transition-colors"
      >
        <Camera size={18} />
        カメラで撮影
      </button>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
