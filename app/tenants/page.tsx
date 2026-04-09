"use client";

import { useState } from "react";
import { Users, Search, Phone, Mail, MoreHorizontal, Home, Calendar, ChevronRight, UserPlus } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  room: string;
  phone: string;
  email: string;
  startDate: string;
  contractMonths: number;
  monthlyRent: string;
  status: "active" | "expiring" | "overdue";
  avatar: string;
}

const MOCK_TENANTS: Tenant[] = [
  { id: "T001", name: "Nguyễn Văn An", room: "201", phone: "0901 234 567", email: "van.an@email.com", startDate: "01/01/2026", contractMonths: 12, monthlyRent: "5,500,000₫", status: "active", avatar: "A" },
  { id: "T002", name: "Trần Thị Bình", room: "202", phone: "0912 345 678", email: "binh.tran@email.com", startDate: "15/02/2026", contractMonths: 6, monthlyRent: "4,800,000₫", status: "active", avatar: "B" },
  { id: "T003", name: "Lê Hoàng Cường", room: "301", phone: "0923 456 789", email: "cuong.le@email.com", startDate: "01/10/2025", contractMonths: 6, monthlyRent: "6,200,000₫", status: "expiring", avatar: "C" },
  { id: "T004", name: "Phạm Minh Duy", room: "103", phone: "0934 567 890", email: "duy.pham@email.com", startDate: "01/03/2026", contractMonths: 12, monthlyRent: "4,200,000₫", status: "overdue", avatar: "D" },
  { id: "T005", name: "Hoàng Thị Emi", room: "401", phone: "0945 678 901", email: "emi.hoang@email.com", startDate: "01/04/2026", contractMonths: 3, monthlyRent: "7,000,000₫", status: "active", avatar: "E" },
];

const statusConfig = {
  active: { label: "Đang thuê", dot: "bg-emerald-500" },
  expiring: { label: "Sắp hết hạn", dot: "bg-amber-500" },
  overdue: { label: "Quá hạn thanh toán", dot: "bg-red-500" },
};

const avatarColors = ["bg-violet-500", "bg-sky-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500"];

export default function TenantsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = MOCK_TENANTS.filter((t) => {
    if (!searchQuery) return true;
    return t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.room.includes(searchQuery);
  });

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Header */}
      <header className="px-5 pt-14 pb-6 bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-600 relative overflow-hidden">
        <div className="absolute -top-14 -right-14 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Khách thuê</h1>
            <p className="text-teal-100 text-xs mt-1">{MOCK_TENANTS.length} khách đang thuê</p>
          </div>
          <button className="w-10 h-10 bg-white/15 backdrop-blur-md rounded-xl flex justify-center items-center text-white border border-white/20 active:scale-95 transition-transform">
            <UserPlus size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-200" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc số phòng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl text-sm text-white placeholder-teal-200 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </header>

      <main className="flex-1 px-5 pt-5">
        {/* Summary Pills */}
        <div className="flex gap-2 mb-5">
          <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-emerald-700">{MOCK_TENANTS.filter(t => t.status === "active").length}</p>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Đang thuê</p>
          </div>
          <div className="flex-1 bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-amber-700">{MOCK_TENANTS.filter(t => t.status === "expiring").length}</p>
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">Sắp hết hạn</p>
          </div>
          <div className="flex-1 bg-red-50 border border-red-100 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-red-600">{MOCK_TENANTS.filter(t => t.status === "overdue").length}</p>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Nợ tiền</p>
          </div>
        </div>

        {/* Tenant Cards */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Users size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm font-semibold">Không tìm thấy khách thuê</p>
            </div>
          )}
          {filtered.map((tenant, idx) => {
            const st = statusConfig[tenant.status];
            return (
              <div key={tenant.id} className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-slate-100 active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-3.5">
                  {/* Avatar */}
                  <div className={`w-11 h-11 ${avatarColors[idx % avatarColors.length]} rounded-2xl flex justify-center items-center text-white font-bold text-sm shadow-sm shrink-0`}>
                    {tenant.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{tenant.name}</h4>
                      <span className={`w-2 h-2 rounded-full ${st.dot} shrink-0`} />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                        <Home size={11} /> P.{tenant.room}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                        <Calendar size={11} /> {tenant.contractMonths} tháng
                      </span>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-800">{tenant.monthlyRent}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">/tháng</p>
                  </div>
                </div>

                {/* Quick Actions Row */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                  <a href={`tel:${tenant.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 rounded-xl text-xs font-semibold text-slate-500 active:bg-slate-100 transition-colors">
                    <Phone size={13} /> Gọi
                  </a>
                  <a href={`mailto:${tenant.email}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 rounded-xl text-xs font-semibold text-slate-500 active:bg-slate-100 transition-colors">
                    <Mail size={13} /> Email
                  </a>
                  <button className="flex items-center justify-center py-2 px-3 bg-slate-50 rounded-xl text-xs font-semibold text-slate-400 active:bg-slate-100 transition-colors">
                    <MoreHorizontal size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
