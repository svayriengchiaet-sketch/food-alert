import { NextRequest, NextResponse } from 'next/server';
import { differenceInDays } from 'date-fns';
import { getItems, saveItems } from '@/lib/storage';
import { sendExpirationNotification } from '@/lib/email';
import { FoodItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const items = await getItems();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find items expiring within 3 days (including already expired)
    const expiringItems = items.filter((item) => {
      const expDate = new Date(item.expirationDate);
      expDate.setHours(0, 0, 0, 0);
      const daysLeft = differenceInDays(expDate, today);
      return daysLeft <= 3 && !item.notified;
    });

    if (expiringItems.length > 0) {
      // Send email notification
      await sendExpirationNotification(expiringItems);

      // Mark items as notified
      const updatedItems: FoodItem[] = items.map((item) => {
        if (expiringItems.find((e) => e.id === item.id)) {
          return { ...item, notified: true };
        }
        return item;
      });

      await saveItems(updatedItems);
    }

    // Clean up items that expired more than 7 days ago and were notified
    const cleanedItems = items.filter((item) => {
      const expDate = new Date(item.expirationDate);
      const daysOverdue = differenceInDays(today, expDate);
      return !(daysOverdue > 7 && item.notified);
    });

    if (cleanedItems.length < items.length) {
      await saveItems(cleanedItems);
    }

    return NextResponse.json({
      success: true,
      checkedItems: items.length,
      notifiedItems: expiringItems.length,
      cleanedItems: items.length - cleanedItems.length,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: '期限チェックの実行中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
