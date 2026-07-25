import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { MobileTabBar } from "@/components/MobileTabBar";

export const metadata: Metadata = {
  title: "Santiago Bet Tracker",
  description: "Track your MLB sports bets with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen">
        <Navbar />
        <main className="min-h-[calc(100vh-3.5rem)] pb-16 md:pb-0">{children}</main>
        <MobileTabBar />
      </body>
    </html>
  );
}
