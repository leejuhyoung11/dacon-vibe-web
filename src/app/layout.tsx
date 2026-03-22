import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import SeedInitializer from "@/components/layout/SeedInitializer";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DAKER VIBE — 해커톤 플랫폼",
  description: "AI·데이터 해커톤에 도전하고, 팀을 만들고, 함께 성장하는 플랫폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <SeedInitializer />
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
