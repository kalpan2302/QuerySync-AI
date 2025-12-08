import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QuerySync AI - Real-time Q&A Dashboard",
  description: "A real-time Q&A dashboard with AI-powered answer suggestions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-100 dark:bg-gray-900 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
