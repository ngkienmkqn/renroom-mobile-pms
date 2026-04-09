import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Renroom - Quản lý thuê trọ",
  description: "A serverless property management mobile application",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Renroom",
  },
};

export const viewport: import("next").Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4f46e5", // Indigo-600 header styling
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-slate-100 text-slate-900 antialiased min-h-screen flex justify-center`}>
        <main className="w-full max-w-md min-h-screen bg-slate-50 shadow-2xl relative overflow-x-hidden pb-20">
          {children}
        <Toaster position="top-center" richColors theme="light" />
        <BottomNav />
        </main>
      </body>
    </html>
  );
}
