"use client";

import { useState } from "react";
import { Settings as SettingsIcon, Building2, CreditCard, Bell, Globe, Shield, ChevronRight, Moon, Palette, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SettingItem {
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
      { icon: Building2, label: "Thông tin toà nhà", description: "Tên, địa chỉ, số tầng", iconBg: "bg-indigo-50", iconColor: "text-indigo-600" },
      { icon: CreditCard, label: "Phương thức thanh toán", description: "Chuyển khoản, MoMo, tiền mặt", iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
    ],
  },
  {
    title: "Kết nối OTA",
    items: [
      { icon: Globe, label: "Channel Manager", description: "Channex / Beds24 API", iconBg: "bg-sky-50", iconColor: "text-sky-600", action: "Kết nối" },
      { icon: ExternalLink, label: "Đồng bộ Airbnb", description: "iCal / API Integration", iconBg: "bg-rose-50", iconColor: "text-rose-500", action: "Cấu hình" },
      { icon: ExternalLink, label: "Đồng bộ Booking.com", description: "Channel Manager API", iconBg: "bg-blue-50", iconColor: "text-blue-600", action: "Cấu hình" },
    ],
  },
  {
    title: "Ứng dụng",
    items: [
      { icon: Bell, label: "Thông báo", description: "Push, Email, SMS", iconBg: "bg-amber-50", iconColor: "text-amber-600" },
      { icon: Moon, label: "Giao diện tối", description: "Tự động / Thủ công", iconBg: "bg-slate-100", iconColor: "text-slate-600" },
      { icon: Palette, label: "Ngôn ngữ", description: "Tiếng Việt", iconBg: "bg-purple-50", iconColor: "text-purple-600" },
    ],
  },
  {
    title: "Bảo mật",
    items: [
      { icon: Shield, label: "Đổi mật khẩu", description: "Cập nhật mật khẩu đăng nhập", iconBg: "bg-red-50", iconColor: "text-red-500" },
    ],
  },
];

export default function SettingsPage() {
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
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex justify-center items-center text-white font-bold text-lg shadow-lg shadow-indigo-200">
            A
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800">Admin Renroom</h3>
            <p className="text-xs text-slate-400 mt-0.5">admin@renroom.vn</p>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </div>

        {/* Settings Sections */}
        {settingSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 px-1">{section.title}</h3>
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
              {section.items.map((item, idx) => (
                <button
                  key={item.label}
                  onClick={() => toast.info(`Màn hình "${item.label}" đang được phát triển.`)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-slate-50 transition-colors text-left ${
                    idx < section.items.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  <div className={`w-9 h-9 ${item.iconBg} ${item.iconColor} rounded-xl flex justify-center items-center shrink-0`}>
                    <item.icon size={17} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
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

        {/* Version */}
        <p className="text-center text-[11px] text-slate-300 font-medium mt-4 pb-4">Renroom v1.0.0 • PWA Mobile</p>
      </main>
    </div>
  );
}
