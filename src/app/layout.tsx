import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import AppHeader from "@/components/AppHeader";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GroupSync",
    template: "%s | GroupSync",
  },
  description:
    "Plan together, find the best time and place to meet, and settle shared expenses easily.",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-950">
        <div className="flex min-h-screen flex-col">
          <AppHeader />

          <div className="flex-1">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}