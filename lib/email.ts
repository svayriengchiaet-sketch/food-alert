import { FoodItem } from './types';
import { differenceInDays, format } from 'date-fns';
import { ja } from 'date-fns/locale';

const NOTIFICATION_EMAIL = 'iganokami.tokiie@gmail.com';

export async function sendExpirationNotification(
  expiringItems: FoodItem[]
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Resend API key not configured, skipping notification');
    return;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const today = new Date();

  const itemsHtml = expiringItems
    .map((item) => {
      const expDate = new Date(item.expirationDate);
      const daysLeft = differenceInDays(expDate, today);
      const statusColor =
        daysLeft <= 0 ? '#ef4444' : daysLeft <= 1 ? '#f97316' : '#f59e0b';
      const statusText =
        daysLeft <= 0
          ? '期限切れ'
          : daysLeft === 1
          ? '明日まで'
          : `あと${daysLeft}日`;

      return `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0;">
          <strong>${item.ingredient}</strong>
          <div style="font-size: 12px; color: #888; margin-top: 2px;">${item.receiptName}</div>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; color: #666;">
          ${format(expDate, 'M月d日', { locale: ja })}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: center;">
          <span style="background: ${statusColor}; color: white; padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: bold;">
            ${statusText}
          </span>
        </td>
      </tr>
      `;
    })
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif; background-color: #f8faf8;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

    <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 32px 32px 24px; text-align: center;">
      <div style="font-size: 40px; margin-bottom: 8px;">🍱</div>
      <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">消費期限アラート</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">
        ${format(today, 'M月d日（E）', { locale: ja })}の通知
      </p>
    </div>

    <div style="padding: 24px 32px;">
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        以下の食材の消費期限が近づいています。早めにご使用ください。
      </p>

      <table style="width: 100%; border-collapse: collapse; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px 16px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #f0f0f0;">食材</th>
            <th style="padding: 12px 16px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #f0f0f0;">消費期限</th>
            <th style="padding: 12px 16px; text-align: center; font-size: 13px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #f0f0f0;">状態</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="margin-top: 24px; padding: 16px; background: #f0fdf4; border-radius: 10px; border-left: 4px solid #22c55e;">
        <p style="margin: 0; font-size: 13px; color: #166534;">
          💡 食材を無駄にしないために、今日の献立に活用してみましょう！
        </p>
      </div>
    </div>

    <div style="padding: 16px 32px 24px; text-align: center; border-top: 1px solid #f0f0f0;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        このメールは食材管理アプリから自動送信されています
      </p>
    </div>
  </div>
</body>
</html>
  `;

  await resend.emails.send({
    from: 'food-alert@resend.dev',
    to: NOTIFICATION_EMAIL,
    subject: `🍱 消費期限アラート - ${expiringItems.length}件の食材をご確認ください`,
    html,
  });

  console.log(
    `[Email] Sent notification for ${expiringItems.length} items to ${NOTIFICATION_EMAIL}`
  );
}
