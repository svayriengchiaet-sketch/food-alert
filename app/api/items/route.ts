import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { addDays, format } from 'date-fns';
import { getItems, saveItems } from '@/lib/storage';
import { FoodItem } from '@/lib/types';

export async function GET() {
  try {
    const items = await getItems();
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newItems, purchaseDate } = body as {
      newItems: {
        receiptName: string;
        ingredient: string;
        category: string;
        shelfLifeDays: number;
        storageNote?: string;
      }[];
      purchaseDate: string;
    };

    if (!newItems || !Array.isArray(newItems) || newItems.length === 0) {
      return NextResponse.json(
        { error: '食材データが不正です' },
        { status: 400 }
      );
    }

    const purchase = new Date(purchaseDate);
    const existingItems = await getItems();

    const createdItems: FoodItem[] = newItems.map((item) => ({
      id: uuidv4(),
      receiptName: item.receiptName,
      ingredient: item.ingredient,
      category: item.category,
      purchaseDate: format(purchase, 'yyyy-MM-dd'),
      expirationDate: format(addDays(purchase, item.shelfLifeDays), 'yyyy-MM-dd'),
      shelfLifeDays: item.shelfLifeDays,
      storageNote: item.storageNote,
      notified: false,
    }));

    const updatedItems = [...existingItems, ...createdItems];
    await saveItems(updatedItems);

    return NextResponse.json({ items: createdItems }, { status: 201 });
  } catch (error) {
    console.error('Error saving items:', error);
    return NextResponse.json(
      { error: 'データの保存に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'IDが指定されていません' },
        { status: 400 }
      );
    }

    const items = await getItems();
    const updatedItems = items.filter((item) => item.id !== id);

    if (items.length === updatedItems.length) {
      return NextResponse.json(
        { error: '指定された食材が見つかりません' },
        { status: 404 }
      );
    }

    await saveItems(updatedItems);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'データの削除に失敗しました' },
      { status: 500 }
    );
  }
}
