import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Referent AI Translator",
  description: "Parse an article URL and request AI-generated summaries.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

