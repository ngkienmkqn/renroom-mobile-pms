"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Building2, CreditCard, Bell, Globe, Shield, ChevronRight, Moon, Palette, ExternalLink, Smartphone, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Drawer } from "vaul";

interface SettingItem {
  id?: string;
  icon: React.ElementType;
  label: string;
  description: string;
  iconBg: string;
  iconColor: string;
  action?: string;
}

const settingSections: { title: string; items: SettingItem[] }[] = [
  {
    title: "Tài sản",
    items: [
      { id: "building", icon: Building2, label: "Thông tin toà nhà", description: "Tên, địa chỉ, số tầng", iconBg: "bg-indigo-50", iconColor: "text-indigo-600" },
      { id: "payment", icon: CreditCard, label: "Phương thức thanh toán", description: "Chuyển khoản, MoMo, tiền mặt", iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
    ],
  },
  {
    title: "Kết nối OTA",
    items: [
      { id: "channex", icon: Globe, label: "Channel Manager", description: "Channex / Beds24 API", iconBg: "bg-sky-50", iconColor: "text-sky-600", action: "Kết nối" },
      { id: "airbnb", icon: ExternalLink, label: "Đồng bộ Airbnb", description: "iCal / API Integration", iconBg: "bg-rose-50", iconColor: "text-rose-500", action: "Cấu hình" },
      { id: "booking", icon: ExternalLink, label: "Đồng bộ Booking.com", description: "Channel Manager API", iconBg: "bg-blue-50", iconColor: "text-blue-600", action: "Cấu hình" },
    ],
  },
  {
    title: "Ứng dụng",
    items: [
      { id: "notifications", icon: Bell, label: "Thông báo", description: "Push, Email, SMS", iconBg: "bg-amber-50", iconColor: "text-amber-600" },
      { id: "darkmode", icon: Moon, label: "Giao diện tối", description: "Tự động / Thủ công", iconBg: "bg-slate-100", iconColor: "text-slate-600" },
      { id: "language", icon: Palette, label: "Ngôn ngữ", description: "Tiếng Việt", iconBg: "bg-purple-50", iconColor: "text-purple-600" },
    ],
  },
];

// Reusable Switch Component
const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
  <button 
    onClick={() => onChange(!checked)}
    className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${checked ? 'bg-indigo-500' : 'bg-slate-300'}`}
  >
    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

export default function SettingsPage() {
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);

  // States for Notifications
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifCheckin, setNotifCheckin] = useState(true);
  const [notifPayment, setNotifPayment] = useState(true);
  const [notifReport, setNotifReport] = useState(false);

  // States for Dark Mode
  const [themeMode, setThemeMode] = useState("light");

  // On mount: read persisted theme preference and apply it
  useEffect(() => {
    const saved = localStorage.getItem("suri_theme") || "light";
    setThemeMode(saved);
    applyThemeClass(saved);
  }, []);

  const applyThemeClass = (mode: string) => {
    const html = document.documentElement;
    if (mode === "dark") {
      html.classList.add("dark");
    } else if (mode === "light") {
      html.classList.remove("dark");
    } else {
      // "system" — follow OS preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        html.classList.add("dark");
      } else {
        html.classList.remove("dark");
      }
    }
  };

  const handleItemClick = (id?: string, label?: string) => {
    if (id === "notifications" || id === "darkmode") {
      setActiveDrawer(id);
    } else {
      toast.info(`Màn hình "${label}" đang được phát triển.`);
    }
  };

  const closeDrawer = () => setActiveDrawer(null);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handlePushToggle = async (v: boolean) => {
    setNotifPush(v);
    if (!v) return;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Trình duyệt không hỗ trợ Web Push. Vui lòng thêm Add to Home Screen (iOS).');
      setNotifPush(false);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Bạn đã từ chối quyền gửi thông báo');
        setNotifPush(false);
        return;
      }
      
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("Missing VAPID PUBLIC KEY variable");
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });
      
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      
      toast.success('Đăng ký Push Notifications thành công!');
    } catch (err: any) {
      console.error(err);
      toast.error('Có lỗi xảy ra: ' + err.message);
      setNotifPush(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Header */}
      <header className="px-5 pt-14 pb-6 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 relative overflow-hidden">
        <div className="absolute -top-14 -right-14 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-xl font-bold text-white tracking-tight">Cài đặt</h1>
          <p className="text-slate-300 text-xs mt-1">Cấu hình hệ thống & kết nối OTA</p>
        </div>
      </header>

      <main className="flex-1 px-5 pt-5">
        {/* Profile */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex justify-center items-center text-white font-bold text-lg shadow-lg shadow-indigo-200">
            A
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Admin Suri</h3>
            <p className="text-xs text-slate-400 mt-0.5">admin@surihomestay.vn</p>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </div>

        {/* Settings Sections */}
        {settingSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 px-1">{section.title}</h3>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 overflow-hidden">
              {section.items.map((item, idx) => (
                <button
                  key={item.label}
                  onClick={() => handleItemClick(item.id, item.label)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-slate-50 dark:active:bg-slate-700/50 transition-colors text-left ${
                    idx < section.items.length - 1 ? "border-b border-slate-50 dark:border-slate-700/50" : ""
                  }`}
                >
                  <div className={`w-9 h-9 ${item.iconBg} ${item.iconColor} rounded-xl flex justify-center items-center shrink-0`}>
                    <item.icon size={17} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                  {item.action ? (
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{item.action}</span>
                  ) : (
                    <ChevronRight size={16} className="text-slate-300 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-[11px] text-slate-300 font-medium mt-4 pb-4">Suri Home Stay v1.0.0 • PWA Mobile</p>
      </main>

      {/* ---------------- DRAWERS ---------------- */}
      
      {/* 1. Notifications Drawer */}
      <Drawer.Root open={activeDrawer === "notifications"} onOpenChange={(o) => !o && closeDrawer()}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-50 dark:bg-slate-900 flex flex-col rounded-t-[32px] h-[65vh] outline-none">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
            <div className="max-w-md w-full mx-auto flex flex-col px-6 pb-6 h-full">
              <Drawer.Title className="font-extrabold text-xl text-slate-800 dark:text-white mb-1">Cài đặt Thông báo</Drawer.Title>
              <p className="text-sm text-slate-500 mb-6">Nhận cảnh báo qua các kênh tức thời.</p>
              
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden mb-5">
                {/* Push */}
                <div className="flex items-center justify-between p-4 border-b border-slate-50 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                      <Smartphone size={18} strokeWidth={2.5}/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Push App</p>
                      <p className="text-xs text-slate-400">Gửi trực tiếp lên màn hình</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={notifPush} onChange={handlePushToggle} />
                </div>
                {/* Zalo / SMS */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                      <MessageSquare size={18} strokeWidth={2.5}/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Zalo ZNS / SMS</p>
                      <p className="text-xs text-slate-400">Cần liên kết Zalo OA</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={notifEmail} onChange={setNotifEmail} />
                </div>
              </div>

              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 px-1">Tùy biến CRM Thông minh</h3>
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden mb-6">
                <div className="flex items-center justify-between p-4 border-b border-slate-50 dark:border-slate-700/50">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Khách Check-in / Check-out</p>
                    <p className="text-xs text-slate-400">Báo trước 2 tiếng để dọn dẹp</p>
                  </div>
                  <ToggleSwitch checked={notifCheckin} onChange={setNotifCheckin} />
                </div>
                <div className="flex items-center justify-between p-4 border-b border-slate-50 dark:border-slate-700/50">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Nhắc nợ & Thu tiền</p>
                    <p className="text-xs text-slate-400">Khách tới hạn hợp đồng thuê</p>
                  </div>
                  <ToggleSwitch checked={notifPayment} onChange={setNotifPayment} />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Báo cáo cuối ngày</p>
                    <p className="text-xs text-slate-400">Tóm tắt số liệu 21:00 mỗi ngày</p>
                  </div>
                  <ToggleSwitch checked={notifReport} onChange={setNotifReport} />
                </div>
              </div>

              <button 
                onClick={() => {
                  toast.success("Thay đổi thông báo đã được lưu!");
                  closeDrawer();
                }}
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 active:scale-[0.98] transition-transform"
              >
                Lưu cài đặt
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* 2. Darkmode Drawer */}
      <Drawer.Root open={activeDrawer === "darkmode"} onOpenChange={(o) => !o && closeDrawer()}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-50 dark:bg-slate-900 flex flex-col rounded-t-[32px] h-[45vh] outline-none">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
            <div className="max-w-md w-full mx-auto flex flex-col px-6 pb-6 h-full">
              <Drawer.Title className="font-extrabold text-xl text-slate-800 dark:text-white mb-1">Giao diện tối</Drawer.Title>
              <p className="text-sm text-slate-500 mb-6">Chọn phong cách hiển thị ứng dụng.</p>
              
              <div className="flex flex-col gap-3">
                {[
                  { id: "system", label: "Tự động theo hệ thống" },
                  { id: "light", label: "Giao diện sáng" },
                  { id: "dark", label: "Giao diện tối" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setThemeMode(mode.id);
                      applyThemeClass(mode.id);
                    }}
                    className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-colors ${
                      themeMode === mode.id 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-500/50 shadow-sm' 
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-[0_2px_12px_rgb(0,0,0,0.02)]'
                    }`}
                  >
                    <span className={`text-sm font-bold ${themeMode === mode.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {mode.label}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex justify-center items-center ${themeMode === mode.id ? 'border-indigo-600' : 'border-slate-300'}`}>
                      {themeMode === mode.id && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => {
                  localStorage.setItem("suri_theme", themeMode);
                  applyThemeClass(themeMode);
                  toast.success("Đã lưu giao diện " + (themeMode === "dark" ? "tối" : themeMode === "light" ? "sáng" : "tự động") + "!");
                  closeDrawer();
                }}
                className="w-full mt-6 bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 active:scale-[0.98] transition-transform"
              >
                Áp dụng
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

    </div>
  );
}
