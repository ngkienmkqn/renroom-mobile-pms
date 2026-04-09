"use client";

import { Home, ClipboardList, Users, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  const navItems = [
    { name: "Tổng quan", href: "/", icon: Home },
    { name: "Đặt phòng", href: "/bookings", icon: ClipboardList },
    { name: "Khách thuê", href: "/tenants", icon: Users },
    { name: "Cài đặt", href: "/settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] flex justify-center bg-transparent">
      <div className="w-full max-w-md bg-white border-t-2 border-slate-100 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
        <ul className="flex justify-around items-center px-1 py-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name} className="flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
                    isActive ? "text-indigo-600 scale-105" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <div className={`relative ${isActive ? "drop-shadow-md" : ""}`}>
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-semibold leading-none ${isActive ? "opacity-100" : "opacity-80"}`}>
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
