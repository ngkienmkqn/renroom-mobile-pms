import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Suri Home Stay - Quản lý HomeStay",
  description: "Hệ thống Quản lý HomeStay thông minh",
  openGraph: {
    title: "Suri Home Stay - Quản lý HomeStay",
    description: "Hệ thống Quản lý HomeStay thông minh",
    siteName: "Suri Home Stay",
    type: "website"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Suri Home Stay",
  },
  manifest: "/manifest.json",
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
      <body className={`${inter.className} bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-200 antialiased min-h-screen flex justify-center transition-colors duration-300`}>
        <main className="w-full max-w-5xl min-h-screen bg-slate-50 dark:bg-slate-900 shadow-2xl relative overflow-x-hidden pb-20 transition-colors duration-300">
          {children}
        <Toaster position="top-center" richColors theme="light" />
        <BottomNav />
        <InstallPrompt />
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    var t = localStorage.getItem('suri_theme');
    if (t === 'dark') document.documentElement.classList.add('dark');
    else if (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
  } catch(e) {}
  if ('serviceWorker' in navigator) { window.addEventListener('load', function() { navigator.serviceWorker.register('/sw.js'); }); }
})()
`
          }}
        />
        </main>
      </body>
    </html>
  );
}
