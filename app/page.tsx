import { Home, TrendingUp, CalendarCheck, ArrowRight, Clock, Star, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-full pb-10 font-sans">
      {/* Header Profile / Welcome */}
      <header className="px-6 pt-14 pb-12 bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-800 rounded-b-[40px] shadow-lg relative overflow-hidden">
        {/* Abstract decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-indigo-100/90 text-sm font-medium tracking-wide">Xin chào buổi sáng,</p>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Admin Renroom 👋</h1>
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex justify-center items-center font-bold text-white shadow-inner border border-white/20">
            A
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-8 z-20 -mt-10">
        
        {/* KPI Section */}
        <section className="grid grid-cols-2 gap-4 mb-8">
          {/* Main Revenue Card */}
          <div className="col-span-2 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 flex justify-between items-center active:scale-[0.98] transition-transform">
            <div>
              <p className="text-slate-400 text-xs uppercase font-extrabold tracking-wider mb-1">Doanh thu tháng 4</p>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">0 <span className="text-xl text-slate-400 font-bold">₫</span></h2>
            </div>
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl shadow-sm border border-emerald-100/50 flex justify-center items-center">
              <TrendingUp size={28} strokeWidth={2.5} />
            </div>
          </div>
          
          {/* Active Rooms KPI */}
          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100 active:scale-[0.98] transition-transform">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex justify-center items-center mb-4">
              <Home size={22} strokeWidth={2.5} />
            </div>
            <h3 className="text-3xl font-black text-slate-800">0<span className="text-sm font-semibold text-slate-400 ml-1">/ 15</span></h3>
            <p className="text-slate-500 text-xs font-semibold mt-1">Phòng đã thuê</p>
          </div>
          
          {/* Booking KPI */}
          <div className="bg-gradient-to-b from-orange-50 to-white rounded-3xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-orange-100/50 active:scale-[0.98] transition-transform">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex justify-center items-center mb-4">
              <CalendarCheck size={22} strokeWidth={2.5} />
            </div>
            <h3 className="text-3xl font-black text-slate-800">0<span className="text-sm font-semibold text-slate-400 ml-1">đơn</span></h3>
            <p className="text-slate-500 text-xs font-semibold mt-1">Check-in hôm nay</p>
          </div>
        </section>

        {/* Quick Actions / Activity */}
        <div className="mt-8 mb-6">
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">Hoạt động gần đây</h2>
            <Link href="/activity" className="text-xs font-bold text-indigo-600 flex items-center gap-0.5 active:opacity-70">
              Xem tất cả <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
             {/* Empty Feed State */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex justify-center items-center text-slate-300 mb-3">
                <Clock size={24} strokeWidth={2} />
              </div>
              <h4 className="text-sm font-bold text-slate-400">Chưa có hoạt động nào</h4>
              <p className="text-xs text-slate-300 mt-1">Mọi nghiệp vụ sẽ được lịch sử hóa tại đây</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
