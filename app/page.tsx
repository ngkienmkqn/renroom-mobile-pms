"use client";

import { useState, useEffect } from "react";
import { UserCircle, Search, CalendarDays, TrendingUp, Key, Banknote, HelpCircle, ArrowRight, User, ChevronRight, Clock, Star, Home, CalendarCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [revenue, setRevenue] = useState(0);
  const [rentedRooms, setRentedRooms] = useState(0);
  const [checkins, setCheckins] = useState(0);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/store?key=bookings').then(r => r.json()),
      fetch('/api/store?key=tenants').then(r => r.json()),
      fetch('/api/store?key=rooms').then(r => r.json()),
    ]).then(([bd, td, rd]) => {
      const bList = Array.isArray(bd.data) ? bd.data : [];
      const tList = Array.isArray(td.data) ? td.data : [];
      const rdList = Array.isArray(rd.data) ? rd.data : [];

      const activeTenants = tList.filter((t: any) => t.status === "active").length;
      setRentedRooms(activeTenants);

      const totalRev = tList.reduce((acc: number, t: any) => {
        const val = t.monthlyRent.replace(/\D/g, ""); // clean non-digits string
        return acc + (Number(val) || 0);
      }, 0);
      setRevenue(totalRev);

      const todayChecks = bList.length; // Approximate checkins based on total bookings
      setCheckins(todayChecks);

      // Intelligent CRM feeds
      const acts: any[] = [];
      const now = new Date();
      bList.forEach((b: any) => {
        const cIn = new Date(b.checkIn);
        const cOut = new Date(b.checkOut);
        const roomObj = rdList.find((r:any) => r.name === b.room);
        const wifi = roomObj?.notes?.find((n:any)=>n.type==='utility' && n.content.toLowerCase().includes('wifi'))?.content || 'Chưa cập nhật';
        const pass = roomObj?.notes?.find((n:any)=>n.type==='password')?.content || 'Chưa cập nhật';
        const build = roomObj?.building || '';

        // If checkout is within next 2 days or past due slightly
        if (cOut >= now && cOut <= new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)) {
          acts.push({
            id: `out_${b.id}`,
            icon: ArrowRight,
            title: `Nhắc dọn phòng (${b.room} - ${build})`,
            details: [
              `Giờ ra: ${cOut.toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'})}`,
              `Tên khách: ${b.guestName}`
            ],
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-500/10",
            date: cOut
          });
        }
        // If checkin is upcoming
        if (cIn >= now && cIn <= new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)) {
          acts.push({
            id: `in_${b.id}`,
            icon: CheckCircle2,
            title: `Checklist Đón khách (${b.room} - ${build})`,
            details: [
              `Giờ vào: ${cIn.toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'})} (${b.guestName})`,
              `Tiền phòng: ${b.amount} (${b.status === 'confirmed' ? "Đã cọc/Xác nhận" : "Chưa cọc"})`,
              `Pass cửa: ${pass}`,
              `Mật khẩu Wifi: ${wifi}`
            ],
            color: "text-emerald-500",
            bg: "bg-emerald-50 dark:bg-emerald-500/10",
            date: cIn
          });
        }
      });
      // Sort to show most urgent first
      acts.sort((a,b) => a.date.getTime() - b.date.getTime());
      setActivities(acts.slice(0, 5));
    }).catch(err => console.error(err));
  }, []);

  return (
    <div className="flex flex-col min-h-full pb-10 font-sans">
      {/* Header Profile / Welcome */}
      <header className="px-6 pt-14 pb-12 bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-800 dark:from-indigo-900 dark:via-slate-900 dark:to-slate-950 rounded-b-[40px] shadow-lg relative overflow-hidden transition-colors duration-300">
        {/* Abstract decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 -left-10 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl"></div>

        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex justify-center items-center text-indigo-700 font-bold text-lg shadow-inner">
              <User size={22} strokeWidth={2.5}/>
            </div>
            <div>
              <p className="text-indigo-100 text-[11px] font-semibold uppercase tracking-widest mb-0.5">Xin chào Quản lý,</p>
              <h2 className="text-white text-xl font-black tracking-tight">Suri Home Stay</h2>
            </div>
          </div>
          <button className="w-10 h-10 bg-white/15 backdrop-blur-md rounded-xl flex justify-center items-center text-white border border-white/20 active:scale-95 transition-transform">
            <Search size={20} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 -mt-6 relative z-20">
        {/* KPI Grid */}
        <section>
          {/* Revenue KPI */}
          <div className="col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 dark:border-slate-700 flex justify-between items-center active:scale-[0.98] transition-transform mb-4">
            <div>
              <p className="text-slate-400 dark:text-slate-500 text-xs uppercase font-extrabold tracking-wider mb-1">Dòng tiền dự kiến</p>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                {new Intl.NumberFormat("vi-VN").format(revenue)} <span className="text-xl text-slate-400 font-bold">₫</span>
              </h2>
            </div>
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl shadow-sm border border-emerald-100/50 flex justify-center items-center shrink-0">
              <TrendingUp size={28} strokeWidth={2.5} />
            </div>
          </div>
          
          <div className="flex gap-4">
            {/* Active Rooms KPI */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-transform">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex justify-center items-center mb-4">
                <Home size={22} strokeWidth={2.5} />
              </div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white">{rentedRooms}<span className="text-sm font-semibold text-slate-400 ml-1">phòng</span></h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1">Đang hoạt động</p>
            </div>
            
            {/* Booking KPI */}
            <div className="flex-1 bg-gradient-to-b from-orange-50 dark:from-slate-800 to-white dark:to-slate-800 rounded-3xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-orange-100/50 dark:border-slate-700 active:scale-[0.98] transition-transform">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-2xl flex justify-center items-center mb-4">
                <CalendarCheck size={22} strokeWidth={2.5} />
              </div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white">{checkins}<span className="text-sm font-semibold text-slate-400 ml-1">đơn</span></h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1">Lượt đặt phòng</p>
            </div>
          </div>
        </section>

        {/* Quick Actions / Activity */}
        <div className="mt-6 mb-6">
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">Hoạt động cần chú ý</h2>
            <Link href="/activity" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 active:opacity-70">
              Xem tất cả gợi ý <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
             {activities.length === 0 ? (
               <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                 <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex justify-center items-center text-slate-300 dark:text-slate-500 mb-3">
                   <Clock size={24} strokeWidth={2} />
                 </div>
                 <h4 className="text-sm font-bold text-slate-400 dark:text-slate-300">Không có lịch gần đây</h4>
                 <p className="text-xs text-slate-300 dark:text-slate-500 mt-1">Các hoạt động nhận và trả phòng sẽ hiện lên đây để AI nhắc nhở.</p>
               </div>
             ) : (
               activities.map((act) => {
                 const Icon = act.icon;
                 return (
                   <div key={act.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                     <div className={`w-10 h-10 ${act.bg} ${act.color} rounded-xl flex justify-center items-center shrink-0`}>
                       <Icon size={18} strokeWidth={2.5}/>
                     </div>
                     <div className="flex-1 min-w-0">
                       <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate mb-1.5">{act.title}</h4>
                       <ul className="space-y-1">
                         {act.details?.map((detail: string, idx: number) => (
                           <li key={idx} className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                             <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                             <span className="leading-snug">{detail}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                     <ChevronRight size={16} className="text-slate-300 shrink-0"/>
                   </div>
                 );
               })
             )}
          </div>
        </div>
      </main>
    </div>
  );
}
