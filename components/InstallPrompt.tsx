"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user dismissed recently (7-day snooze)
    const dismissed = localStorage.getItem("suri_pwa_dismissed");
    if (dismissed && Date.now() < Number(dismissed)) return;

    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after a short delay so user sees the app first
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDeferredPrompt(null);
    // Don't show again for 7 days
    localStorage.setItem("suri_pwa_dismissed", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-[72px] left-0 right-0 z-[200] flex justify-center px-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="w-full max-w-md bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl p-4 shadow-2xl shadow-indigo-500/30 flex items-center gap-3 border border-white/10">
        {/* Icon */}
        <div className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0">
          <Download size={20} strokeWidth={2.5} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold leading-tight">Thêm Suri vào Màn hình chính</p>
          <p className="text-[11px] text-indigo-200 mt-0.5">Truy cập nhanh như ứng dụng gốc</p>
        </div>

        {/* Actions */}
        <button
          onClick={handleInstall}
          className="px-4 py-2 bg-white text-indigo-700 text-xs font-bold rounded-xl active:scale-95 transition-transform flex-shrink-0 shadow-lg"
        >
          Cài đặt
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-white/60 hover:text-white flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
