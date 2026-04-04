export interface FoodItem {
  id: string;
  receiptName: string;
  ingredient: string;
  category: string;
  purchaseDate: string; // ISO date string
  expirationDate: string; // ISO date string
  shelfLifeDays: number;
  storageNote?: string;
  notified: boolean;
}

export interface ReceiptAnalysisResult {
  items: {
    receiptName: string;
    ingredient: string;
    category: string;
    shelfLifeDays: number;
    storageNote?: string;
  }[];
}
