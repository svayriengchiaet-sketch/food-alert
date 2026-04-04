import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "食材管理 | 消費期限トラッカー",
  description: "レシートを撮影して食材の消費期限を自動管理。期限が近づいたらメールでお知らせ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
