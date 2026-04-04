import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: '画像ファイルが見つかりません' },
        { status: 400 }
      );
    }

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mediaType = imageFile.type as
      | 'image/jpeg'
      | 'image/png'
      | 'image/gif'
      | 'image/webp';

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
      return NextResponse.json(
        { error: '対応していない画像形式です。JPEG、PNG、GIF、WebPをご使用ください' },
        { status: 400 }
      );
    }

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `このレシートを分析して、食べ物・飲み物・調味料などの食材のみを抽出してください。
日用品（洗剤、シャンプー、トイレットペーパーなど）は除外してください。

以下のJSON形式のみで返してください（説明文は不要）：
{
  "items": [
    {
      "receiptName": "レシート上の商品名",
      "ingredient": "食材名（日本語、わかりやすく）",
      "category": "カテゴリ",
      "shelfLifeDays": 数値（冷蔵保存での日数）,
      "storageNote": "保存方法の注意（任意、簡潔に）"
    }
  ]
}

カテゴリは以下から選択：
野菜・果物、肉・魚介、乳製品・卵、豆腐・大豆製品、調味料・油、加工食品、パン・麺類、飲み物、菓子・スイーツ、冷凍食品、その他

保存日数の目安（冷蔵）：
- 葉物野菜（ほうれん草、レタスなど）: 3日
- 根菜類（にんじん、大根など）: 7〜14日
- 果物: 3〜7日
- 肉類（鶏・豚・牛）: 3日
- ひき肉: 2日
- 魚・刺身: 2日
- 牛乳: 10日
- ヨーグルト: 14日
- 卵: 28日
- 豆腐: 5日
- チーズ（開封後）: 7〜14日
- パン（食パン）: 5日
- 調味料（開封後の醤油・みりんなど）: 90日
- 缶詰・瓶詰め: 365日
- 冷凍食品: 30日（冷凍保存の場合）
- 清涼飲料水: 180日
- お茶・コーヒー: 365日

商品名から食材を適切に判断し、現実的な保存期間を設定してください。
JSONのみを返し、他のテキストは含めないでください。`,
            },
          ],
        },
      ],
    });

    // Extract text content (skip thinking blocks)
    const textContent = response.content.find((b) => b.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { error: 'レシートを解析できませんでした' },
        { status: 500 }
      );
    }

    // Extract JSON from the response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'レシートから食材情報を取得できませんでした' },
        { status: 500 }
      );
    }

    const data = JSON.parse(jsonMatch[0]);

    if (!data.items || !Array.isArray(data.items)) {
      return NextResponse.json(
        { error: 'レシートに食材が見つかりませんでした' },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Receipt analysis error:', error);
    return NextResponse.json(
      { error: 'レシートの解析中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
