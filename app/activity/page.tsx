"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle2, DollarSign, Star, UserPlus, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Activity {
  id: string;
  type: "contract" | "payment" | "booking" | "maintenance" | "tenant";
  title: string;
  description: string;
  time: string;
  date: string;
  rawDate?: Date;
}
const typeConfig = {
  contract: { icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-500" },
  payment: { icon: DollarSign, bg: "bg-indigo-50", color: "text-indigo-500" },
  booking: { icon: Star, bg: "bg-blue-50", color: "text-blue-500" },
  maintenance: { icon: AlertTriangle, bg: "bg-amber-50", color: "text-amber-500" },
  tenant: { icon: UserPlus, bg: "bg-violet-50", color: "text-violet-500" },
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/store?key=bookings').then(r => r.json()),
      fetch('/api/store?key=rooms').then(r => r.json()),
    ]).then(([bd, rd]) => {
      const bList = Array.isArray(bd.data) ? bd.data : [];
      const rdList = Array.isArray(rd.data) ? rd.data : [];

      const acts: Activity[] = [];
      const now = new Date();

      const getFriendlyDate = (d: Date) => {
        const isToday = d.toDateString() === now.toDateString();
        const isTomorrow = d.toDateString() === new Date(now.getTime() + 86400000).toDateString();
        return isToday ? "Hôm nay" : isTomorrow ? "Ngày mai" : d.toLocaleDateString('vi-VN');
      };

      bList.forEach((b: any) => {
        const cIn = new Date(b.checkIn);
        const cOut = new Date(b.checkOut);
        const roomObj = rdList.find((r:any) => r.name === b.room);
        const build = roomObj?.building || '';

        acts.push({
          id: `in_${b.id}`,
          type: "booking",
          title: `Đón khách (${b.room} - ${build})`,
          description: `Vào cửa: ${b.guestName} (${b.amount})`,
          time: cIn.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}),
          date: getFriendlyDate(cIn),
          rawDate: cIn
        });

        acts.push({
          id: `out_${b.id}`,
          type: "maintenance",
          title: `Dọn phòng (${b.room} - ${build})`,
          description: `Trả phòng: ${b.guestName}`,
          time: cOut.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}),
          date: getFriendlyDate(cOut),
          rawDate: cOut
        });
      });

      // Sort chronological
      acts.sort((a: any, b: any) => a.rawDate.getTime() - b.rawDate.getTime());
      
      // Filter out too old past events (optional, maybe keep last few weeks)
      const recentActs = acts.filter((a: any) => a.rawDate >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000));
      
      setActivities(recentActs);
      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  }, []);

  // Group activities by category (date label)
  const grouped: Record<string, Activity[]> = {};
  activities.forEach((a) => {
    if (!grouped[a.date]) grouped[a.date] = [];
    grouped[a.date].push(a);
  });

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Header */}
      <header className="px-5 pt-14 pb-6 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 relative overflow-hidden">
        <div className="absolute -top-14 -right-14 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <Link href="/" className="w-9 h-9 bg-white/15 backdrop-blur-md rounded-xl flex justify-center items-center text-white border border-white/20 active:scale-95 transition-transform">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Hoạt động</h1>
            <p className="text-indigo-200 text-xs mt-1">Nhật ký mọi sự kiện</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-10 opacity-70">
            <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Đang tải nhật ký...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-70">
            <Clock size={40} className="mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Chưa có hoạt động nào</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, acts]) => (
            <div key={date} className="mb-6">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 px-1">{date}</h3>
              <div className="flex flex-col gap-3">
                {acts.map((activity) => {
                  const cfg = typeConfig[activity.type];
                  const Icon = cfg.icon;
                  return (
                    <div key={activity.id} className="bg-white dark:bg-slate-800 dark:border-slate-700 p-4 rounded-2xl shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center gap-3.5">
                      <div className={`w-10 h-10 ${cfg.bg} rounded-full flex justify-center items-center ${cfg.color} shrink-0`}>
                        <Icon size={18} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{activity.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{activity.description}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">{activity.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
