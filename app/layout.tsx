import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "英単語学習トラッカー",
  description: "スペースド・リペティションで英単語50LESONを効率的に習得",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
