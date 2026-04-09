"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Plus, Search, Filter, BedDouble, Users, Clock, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { Drawer } from "vaul";
import { toast } from "sonner";

type BookingStatus = "all" | "confirmed" | "pending" | "cancelled";

interface Booking {
  id: string;
  guestName: string;
  room: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  source: string;
  status: "confirmed" | "pending" | "cancelled";
  amount: string;
}

const statusConfig = {
  confirmed: { label: "Đã xác nhận", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  pending: { label: "Chờ duyệt", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  cancelled: { label: "Đã huỷ", color: "bg-red-50 text-red-600 border-red-200", icon: XCircle },
};

const sourceColors: Record<string, string> = {
  "Airbnb": "bg-rose-500",
  "Booking.com": "bg-blue-600",
  "Agoda": "bg-red-600",
  "Trực tiếp": "bg-indigo-600",
};

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<BookingStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Drawer Form State
  const [guestName, setGuestName] = useState("");
  const [room, setRoom] = useState("Phòng 201");
  const [status, setStatus] = useState<"confirmed"|"pending">("confirmed");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [amount, setAmount] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetch('/api/store?key=bookings')
      .then(r => r.json())
      .then(d => {
        if (d.data && Array.isArray(d.data)) setBookings(d.data);
      })
      .catch(err => console.error(err));
  }, []);

  const formatCurrency = (val: string) => {
    if (!val) return "0₫";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(val));
  };

  const handleCreateBooking = async () => {
    if (!guestName) {
      toast.error("Vui lòng nhập tên khách hàng");
      return;
    }
    const newBooking: Booking = {
      id: `B${Math.floor(Math.random() * 1000)}`,
      guestName,
      room,
      checkIn: checkIn ? new Date(checkIn).toLocaleDateString('vi-VN') : "Hôm nay",
      checkOut: checkOut ? new Date(checkOut).toLocaleDateString('vi-VN') : "Mai",
      nights: 1, 
      source: "Trực tiếp",
      status: status,
      amount: formatCurrency(amount)
    };
    
    const newArr = [newBooking, ...bookings];
    setBookings(newArr);
    
    // Reset & Close
    setGuestName("");
    setAmount("");
    setIsDrawerOpen(false);

    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'bookings', data: newArr })
      });
      toast.success("Thành công!", { description: "Đã tạo mạng Đặt phòng qua Serverless KV." });
    } catch {
      toast.error("Lỗi đồng bộ", { description: "Lưu tạm thời (Offline Mode)." });
    }
  };

  const filtered = bookings.filter((b) => {
    if (activeTab !== "all" && b.status !== activeTab) return false;
    if (searchQuery && !b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) && !b.room.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const tabs: { key: BookingStatus; label: string; count: number }[] = [
    { key: "all", label: "Tất cả", count: bookings.length },
    { key: "confirmed", label: "Xác nhận", count: bookings.filter((b) => b.status === "confirmed").length },
    { key: "pending", label: "Chờ duyệt", count: bookings.filter((b) => b.status === "pending").length },
    { key: "cancelled", label: "Đã huỷ", count: bookings.filter((b) => b.status === "cancelled").length },
  ];

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Header */}
      <header className="px-5 pt-14 pb-6 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 relative overflow-hidden">
        <div className="absolute -top-14 -right-14 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Đặt phòng</h1>
            <p className="text-indigo-200 text-xs mt-1">Quản lý lịch đặt phòng & OTA</p>
          </div>
          <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <Drawer.Trigger asChild>
              <button className="w-10 h-10 bg-white/15 backdrop-blur-md rounded-xl flex justify-center items-center text-white border border-white/20 active:scale-95 transition-transform">
                <Plus size={20} strokeWidth={2.5} />
              </button>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm" />
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-50 flex flex-col rounded-t-[32px] h-[95vh] outline-none">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 my-4" />
                <div className="max-w-md w-full mx-auto flex flex-col overflow-auto px-6 pb-6 h-full">
                  <Drawer.Title className="font-extrabold text-xl text-slate-800 mb-1">Thêm đặt phòng mới</Drawer.Title>
                  <p className="text-sm text-slate-500 mb-6">Tạo mới booking và đồng bộ lịch tự động.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Tên khách hàng</label>
                      <input 
                        type="text" 
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full px-4 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                        placeholder="VD: Nguyễn Văn A" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Tòa nhà</label>
                        <select className="w-full px-4 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                          <optgroup label="Cơ sở tự vận hành (Thuê đứt)">
                            <option>Tòa nhà Q7</option>
                            <option>Homestay Đà Lạt</option>
                          </optgroup>
                          <optgroup label="Môi giới / Book hộ">
                            <option>Villa Vũng Tàu</option>
                            <option>Resort PQ</option>
                          </optgroup>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Phòng</label>
                        <select 
                          value={room}
                          onChange={(e) => setRoom(e.target.value)}
                          className="w-full px-4 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option>Phòng 101 - Trống</option>
                          <option>Phòng 201 - Trống</option>
                          <option>Phòng 305 - Trống</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Giờ nhận phòng</label>
                        <input 
                          type="datetime-local" 
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="w-full px-2 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-[11px] font-bold text-slate-600 focus:outline-none" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Giờ trả phòng</label>
                        <input 
                          type="datetime-local" 
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="w-full px-2 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-[11px] font-bold text-slate-600 focus:outline-none" 
                        />
                      </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Trạng thái xử lý</label>
                        <select 
                          value={status}
                          onChange={(e) => setStatus(e.target.value as "confirmed"|"pending")}
                          className="w-full px-4 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="confirmed">Đã xác nhận</option>
                          <option value="pending">Chờ duyệt</option>
                        </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Số tiền thanh toán</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full px-4 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm font-bold text-indigo-700 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                          placeholder="Nhập theo VNĐ" 
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">VNĐ</span>
                      </div>
                    </div>
                    <button 
                      onClick={handleCreateBooking}
                      className="w-full mt-4 bg-indigo-600 text-white font-bold py-4 rounded-2xl flex justify-center items-center shadow-lg shadow-indigo-200 active:scale-[0.98] transition-transform"
                    >
                      Xác nhận lưu
                    </button>
                  </div>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        </div>

        {/* Search */}
        <div className="relative mt-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-300" />
          <input
            type="text"
            placeholder="Tìm theo tên khách, phòng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl text-sm text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </header>

      <main className="flex-1 px-5 pt-5">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.key ? "bg-white/20" : "bg-slate-100"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Booking Cards */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl mt-4">
              <CalendarDays size={40} className="mx-auto mb-3 opacity-30 text-indigo-500" />
              <p className="text-sm font-semibold">Hiện chưa có đặt phòng nào</p>
              <p className="text-xs mt-1 text-slate-400">Click dấu cộng (+) trên cùng để tạo thêm</p>
            </div>
          )}
          {filtered.map((booking) => {
            const st = statusConfig[booking.status];
            const StatusIcon = st.icon;
            return (
              <div key={booking.id} className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-slate-100 active:scale-[0.98] transition-transform">
                {/* Top Row */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${sourceColors[booking.source] || "bg-slate-400"}`} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{booking.guestName}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{booking.source} • {booking.id}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${st.color} flex items-center gap-1`}>
                    <StatusIcon size={11} />
                    {st.label}
                  </span>
                </div>

                {/* Details Row */}
                <div className="flex items-center gap-4 bg-slate-50 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <BedDouble size={14} />
                    <span className="text-xs font-semibold">{booking.room}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CalendarDays size={14} />
                    <span className="text-xs font-semibold">{booking.checkIn} → {booking.checkOut}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock size={14} />
                    <span className="text-xs font-semibold">{booking.nights} đêm</span>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="flex justify-between items-center mt-3">
                  <span className="text-base font-black text-slate-800">{booking.amount}</span>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
