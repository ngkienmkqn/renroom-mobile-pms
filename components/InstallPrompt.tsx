"use client";

import { useState, useEffect } from "react";
import { Download, X, MoreVertical } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isManualFallback, setIsManualFallback] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone or fullscreen mode)
    if (window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches) return;

    let hasFiredEvent = false;

    // Check window.__deferredPrompt that was trapped before React mounted
    if ((window as any).__deferredPrompt) {
      hasFiredEvent = true;
      setDeferredPrompt((window as any).__deferredPrompt);
      setTimeout(() => setShowBanner(true), 2000);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      hasFiredEvent = true;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    
    // Manual fallback for aggressive Chrome blocking
    const fallbackTimer = setTimeout(() => {
      if (!hasFiredEvent) {
        const isAndroid = /android/i.test(navigator.userAgent || '');
        if (isAndroid) {
          setIsManualFallback(true);
          setShowBanner(true);
        }
      }
    }, 4500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallbackTimer);
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
  };

  if (!showBanner) return null;

  if (isManualFallback) {
    return (
      <div className="fixed bottom-[72px] left-0 right-0 z-[200] flex justify-center px-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
        <div className="w-full max-w-5xl bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl p-4 shadow-2xl shadow-rose-500/30 flex items-start gap-4 border border-white/10 relative">
          <button onClick={() => setShowBanner(false)} className="absolute top-2 right-2 p-1 text-white/70 hover:text-white">
            <X size={16} />
          </button>
          
          <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
            <MoreVertical size={22} strokeWidth={3} />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <p className="text-[13px] font-bold leading-tight mb-1">Cài đặt Ứng Dụng Nhanh</p>
            <p className="text-[11px] text-rose-100 leading-relaxed font-medium">Bấm vào Menu 3 chấm góc phải trình duyệt Chrome <span className="font-bold relative -top-0.5"><MoreVertical size={12} className="inline opacity-80"/></span><br/>Chọn <strong className="text-white border-b border-dashed">Thêm vào màn hình chính</strong> để trải nghiệm Fullscreen!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[72px] left-0 right-0 z-[200] flex justify-center px-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="w-full max-w-5xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl p-4 shadow-2xl shadow-indigo-500/30 flex items-center gap-3 border border-white/10">
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
