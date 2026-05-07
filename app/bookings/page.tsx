"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Plus, Search, Filter, BedDouble, Users, Clock, CheckCircle2, XCircle, ChevronRight, Trash2, LayoutList, CalendarRange, Calendar } from "lucide-react";
import { Drawer } from "vaul";
import { toast } from "sonner";
import TimelineView from "@/components/TimelineView";
import CalendarView from "@/components/CalendarView";

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
  deposit?: string;
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
  const [viewMode, setViewMode] = useState<"list" | "timeline" | "calendar">("calendar");

  // Room data for pricing suggestions
  const [availableRooms, setAvailableRooms] = useState<{name: string; defaultDailyPrice: number; building: string}[]>([]);

  // ─── Draft Persistence ───
  const DRAFT_KEY = "suri_booking_draft";

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  };

  const saveDraft = (fields: Record<string, any>) => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(fields)); } catch {}
  };

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  };

  // Drawer Form State
  const [guestName, setGuestName] = useState("");
  const [room, setRoom] = useState("");
  const [status, setStatus] = useState<"confirmed"|"pending">("confirmed");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [amount, setAmount] = useState("");
  const [deposit, setDeposit] = useState("");
  const [bookingNote, setBookingNote] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [suggestedAmount, setSuggestedAmount] = useState<number | null>(null);
  const [calcNights, setCalcNights] = useState<number>(0);
  const [editBookingId, setEditBookingId] = useState<string | null>(null);

  // Restore draft from localStorage on client mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && (draft.guestName || draft.room || draft.checkIn || draft.checkOut || draft.amount)) {
      setGuestName(draft.guestName ?? "");
      setRoom(draft.room ?? "");
      setStatus(draft.status ?? "confirmed");
      setCheckIn(draft.checkIn ?? "");
      setCheckOut(draft.checkOut ?? "");
      setAmount(draft.amount ?? "");
      setDeposit(draft.deposit ?? "");
      setBookingNote(draft.bookingNote ?? "");
      setEditBookingId(draft.editBookingId ?? null);
    }
  }, []);

  const openEditBooking = (b: Booking) => {
    setEditBookingId(b.id);
    setGuestName(b.guestName);
    setRoom(b.room);
    setStatus(b.status);
    
    // Parse checkIn and checkOut to datetime-local format (YYYY-MM-DDThh:mm)
    try {
      const formatForInput = (isoStr: string) => {
         if (!isoStr) return "";
         if (isoStr.includes("T")) return isoStr.slice(0, 16);
         return new Date(isoStr).toISOString().slice(0, 16);
      };
      setCheckIn(formatForInput(b.checkIn));
      setCheckOut(formatForInput(b.checkOut));
    } catch {
      setCheckIn(b.checkIn);
      setCheckOut(b.checkOut);
    }
    
    setAmount(b.amount ? b.amount.replace(/\D/g, "") : "");
    setDeposit(b.deposit ? b.deposit.replace(/\D/g, "") : "");
    setIsDrawerOpen(true);
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/store?key=bookings').then(r => r.json()),
      fetch('/api/store?key=rooms').then(r => r.json()),
    ]).then(([bd, rd]) => {
      if (bd.data && Array.isArray(bd.data)) setBookings(bd.data);
      if (rd.data && Array.isArray(rd.data)) setAvailableRooms(rd.data.map((r: any) => ({ name: r.name, defaultDailyPrice: r.defaultDailyPrice, building: r.building })));
    }).catch(console.error);
  }, []);

  // Auto-save draft whenever form fields change
  useEffect(() => {
    const hasContent = guestName || room || checkIn || checkOut || amount || deposit || bookingNote;
    if (hasContent) {
      saveDraft({ guestName, room, status, checkIn, checkOut, amount, deposit, bookingNote, editBookingId });
    }
  }, [guestName, room, status, checkIn, checkOut, amount, deposit, bookingNote, editBookingId]);

  // Auto-calculate nights when dates change
  useEffect(() => {
    if (checkIn && checkOut) {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const diff = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
      setCalcNights(diff);
    } else {
      setCalcNights(0);
    }
  }, [checkIn, checkOut]);

  // Auto-suggest amount when room or nights change
  useEffect(() => {
    const matchedRoom = availableRooms.find(r => r.name === room);
    if (matchedRoom && matchedRoom.defaultDailyPrice > 0 && calcNights > 0) {
      const suggested = matchedRoom.defaultDailyPrice * calcNights;
      setSuggestedAmount(suggested);
      if (!amount) setAmount(String(suggested));
    } else {
      setSuggestedAmount(null);
    }
  }, [room, calcNights, availableRooms]);

  const formatCurrency = (val: string) => {
    if (!val) return "0₫";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(val));
  };

  const displayAmount = (val: string) => {
    if (!val) return "0₫";
    if (val.includes("₫") || val.includes("đ") || val.includes("VND")) return val; 
    return formatCurrency(val);
  };

  const formatFriendlyDate = (dateStr: string) => {
    try {
      if (!dateStr || dateStr.includes("Hôm nay") || dateStr.includes("Mai")) return dateStr;
      
      // Handle DD/MM/YYYY vs ISO fallback check
      if (dateStr.includes("/")) return dateStr;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      
      if (dateStr.includes("T") || dateStr.includes(":")) {
         return `${time} (${date})`;
      }
      return date;
    } catch {
      return dateStr;
    }
  };

  const handleSaveBooking = async () => {
    if (!guestName) {
      toast.error("Vui lòng nhập tên khách hàng");
      return;
    }
    if (!room) {
      toast.error("Vui lòng chọn phòng");
      return;
    }

    // ─── Conflict Detection ───
    if (checkIn && checkOut) {
      const newStart = new Date(checkIn).getTime();
      const newEnd = new Date(checkOut).getTime();

      if (newStart >= newEnd) {
        toast.error("Giờ check-out phải sau check-in");
        return;
      }

      const conflict = bookings.find((b) => {
        if (b.id === editBookingId) return false; // Ignore self when editing
        if (b.room !== room) return false;
        if (b.status === "cancelled") return false;

        // Parse existing booking dates
        let existStart: number, existEnd: number;
        try {
          // Try ISO format first
          if (b.checkIn.includes("T") || b.checkIn.includes("-")) {
            existStart = new Date(b.checkIn).getTime();
          } else {
            return false; // Can't compare non-datetime bookings
          }
          if (b.checkOut.includes("T") || b.checkOut.includes("-")) {
            existEnd = new Date(b.checkOut).getTime();
          } else {
            return false;
          }
        } catch {
          return false;
        }

        if (isNaN(existStart) || isNaN(existEnd)) return false;

        // Overlap check: new starts before existing ends AND new ends after existing starts
        return newStart < existEnd && newEnd > existStart;
      });

      if (conflict) {
        toast.error(`⚠️ Phòng ${room} đã có khách!`, {
          description: `Trùng giờ với booking của "${conflict.guestName}" (${formatFriendlyDate(conflict.checkIn)} → ${formatFriendlyDate(conflict.checkOut)})`,
          duration: 6000,
        });
        return;
      }
    }

    const newBooking: Booking = {
      id: editBookingId || `B${Math.floor(Math.random() * 1000)}`,
      guestName,
      room,
      checkIn: checkIn || new Date().toISOString(),
      checkOut: checkOut || new Date(Date.now() + 86400000).toISOString(),
      nights: calcNights || 1, 
      source: "Trực tiếp",
      status: status,
      amount: formatCurrency(amount),
      deposit: formatCurrency(deposit)
    };
    
    const newArr = editBookingId 
       ? bookings.map(b => b.id === editBookingId ? newBooking : b)
       : [newBooking, ...bookings];
       
    setBookings(newArr);
    
    // Reset & Close + clear draft
    setGuestName("");
    setAmount("");
    setDeposit("");
    setBookingNote("");
    setRoom("");
    setCheckIn("");
    setCheckOut("");
    setSuggestedAmount(null);
    setCalcNights(0);
    setEditBookingId(null);
    setIsDrawerOpen(false);
    clearDraft();

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

  const handleDeleteBooking = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa đặt phòng này? Hành động này không thể hoàn tác.")) return;

    const newArr = bookings.filter(b => b.id !== id);
    setBookings(newArr);

    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'bookings', data: newArr })
      });
      toast.success("Đã xóa đặt phòng!");
    } catch {
      toast.error("Lỗi khi xóa trên máy chủ");
    }
  };

  const handleClearAllBookings = async () => {
    if (!window.confirm("CẢNH BÁO: BẠN CÓ CHẮC MUỐN XÓA TẤT CẢ DỮ LIỆU ĐẶT PHÒNG?")) return;
    
    setBookings([]);
    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'bookings', data: [] })
      });
      toast.success("Đã xóa toàn bộ dữ liệu đặt phòng!");
    } catch {
      toast.error("Lỗi khi xóa trên máy chủ");
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
            <p className="text-indigo-200 text-xs mt-1">Quản lý lịch đặt phòng HomeStay</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "list" ? "timeline" : viewMode === "timeline" ? "calendar" : "list")}
              className="w-10 h-10 bg-white/15 backdrop-blur-md rounded-xl flex justify-center items-center text-white border border-white/20 active:scale-95 transition-transform"
              title={viewMode === "list" ? "Xem Timeline" : viewMode === "timeline" ? "Xem Lịch" : "Xem Danh sách"}
            >
              {viewMode === "list" ? <CalendarRange size={18} strokeWidth={2} /> : viewMode === "timeline" ? <Calendar size={18} strokeWidth={2} /> : <LayoutList size={18} strokeWidth={2} />}
            </button>
            <button
              onClick={handleClearAllBookings}
              className="w-10 h-10 bg-red-400/20 backdrop-blur-md rounded-xl flex justify-center items-center text-red-200 border border-red-400/30 hover:bg-red-500/40 active:scale-95 transition-transform"
              title="Xóa toàn bộ dữ liệu"
            >
              <Trash2 size={18} strokeWidth={2} />
            </button>
          <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <Drawer.Trigger asChild>
              <button 
                onClick={() => {
                   // If there's a saved draft, restore it; otherwise start fresh
                   const draft = loadDraft();
                   if (draft && (draft.guestName || draft.room || draft.checkIn)) {
                     setEditBookingId(draft.editBookingId ?? null);
                     setGuestName(draft.guestName ?? "");
                     setRoom(draft.room ?? "");
                     setCheckIn(draft.checkIn ?? "");
                     setCheckOut(draft.checkOut ?? "");
                     setAmount(draft.amount ?? "");
                     setDeposit(draft.deposit ?? "");
                     setBookingNote(draft.bookingNote ?? "");
                     setStatus(draft.status ?? "confirmed");
                     setSuggestedAmount(null);
                   } else {
                     setEditBookingId(null);
                     setGuestName("");
                     setRoom("");
                     setCheckIn("");
                     setCheckOut("");
                     setAmount("");
                     setDeposit("");
                     setBookingNote("");
                     setStatus("confirmed");
                     setSuggestedAmount(null);
                   }
                }}
                className="w-10 h-10 bg-white/15 backdrop-blur-md rounded-xl flex justify-center items-center text-white border border-white/20 active:scale-95 transition-transform"
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[9999] backdrop-blur-sm" />
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[9999] bg-slate-50 dark:bg-slate-900 flex flex-col rounded-t-[32px] h-[95vh] outline-none">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
                <div className="max-w-5xl w-full mx-auto flex flex-col overflow-auto px-6 pb-6 h-full">
                  <Drawer.Title className="font-extrabold text-xl text-slate-800 dark:text-white mb-1">{editBookingId ? "Chỉnh sửa Booking" : "Thêm đặt phòng mới"}</Drawer.Title>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{editBookingId ? "Cập nhật thông tin booking." : "Tạo mới booking và đồng bộ lịch tự động."}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Tên khách hàng</label>
                      <input 
                        type="text" 
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                        placeholder="VD: Nguyễn Văn A" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Khu / Tòa nhà</label>
                        <input 
                          type="text"
                          className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="Mặc định"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Phòng</label>
                        <select
                          value={room}
                          onChange={(e) => setRoom(e.target.value)}
                          className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">Chọn phòng...</option>
                          {availableRooms.map((r, i) => (
                            <option key={i} value={r.name}>{r.name} — {r.building}</option>
                          ))}
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
                          className="w-full px-2 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-[11px] font-bold text-slate-600 dark:text-slate-300 focus:outline-none" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Giờ trả phòng</label>
                        <input 
                          type="datetime-local" 
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="w-full px-2 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-[11px] font-bold text-slate-600 dark:text-slate-300 focus:outline-none" 
                        />
                      </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Trạng thái xử lý</label>
                        <select 
                          value={status}
                          onChange={(e) => setStatus(e.target.value as "confirmed"|"pending")}
                          className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 rounded-2xl border border-slate-100 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="confirmed">Đã xác nhận</option>
                          <option value="pending">Chờ duyệt</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Số tiền thanh toán</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-3 pr-8 py-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm font-bold text-indigo-700 dark:text-indigo-400 placeholder:font-normal dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                            placeholder="Tổng VNĐ" 
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VND</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Số tiền đã cọc</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={deposit}
                            onChange={(e) => setDeposit(e.target.value)}
                            className="w-full pl-3 pr-8 py-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm font-bold text-emerald-600 dark:text-emerald-400 placeholder:font-normal dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                            placeholder="Cọc VNĐ" 
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VND</span>
                        </div>
                      </div>
                    </div>
                      {suggestedAmount !== null && calcNights > 0 && (
                        <p className="text-[11px] text-violet-500 font-semibold mt-2 px-1">
                          💡 Gợi ý: {new Intl.NumberFormat('vi-VN').format(suggestedAmount)}đ ({calcNights} đêm × {new Intl.NumberFormat('vi-VN').format(suggestedAmount / calcNights)}đ/đêm)
                          {amount && Number(amount) !== suggestedAmount && (
                            <span className="text-amber-500 ml-1">• Đang ghi đè giá</span>
                          )}
                        </p>
                      )}

                    {/* Booking Note */}
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Ghi chú đặt phòng</label>
                      <textarea
                        value={bookingNote}
                        onChange={(e) => setBookingNote(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="VD: Khách yêu cầu thêm gối, check-in trễ..."
                      />
                    </div>
                    <button 
                      onClick={handleSaveBooking}
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
        {viewMode === "calendar" ? (
          <CalendarView
            bookings={bookings}
            rooms={availableRooms}
            onEditBooking={(b) => openEditBooking(b)}
            onDeleteBooking={(id) => handleDeleteBooking(id)}
            onCreateBooking={(roomName, checkInTime, checkOutTime) => {
              setEditBookingId(null);
              setRoom(roomName);
              setCheckIn(checkInTime);
              setCheckOut(checkOutTime);
              setGuestName("");
              setAmount("");
              setBookingNote("");
              setStatus("confirmed");
              const r = availableRooms.find((rm) => rm.name === roomName);
              if (r && checkInTime && checkOutTime) {
                const ci = new Date(checkInTime);
                const co = new Date(checkOutTime);
                const diffMs = co.getTime() - ci.getTime();
                const nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                setCalcNights(nights);
                setSuggestedAmount(r.defaultDailyPrice * nights);
              }
              setIsDrawerOpen(true);
            }}
          />
        ) : viewMode === "timeline" ? (
          <TimelineView
            bookings={bookings}
            rooms={availableRooms}
            onEditBooking={(b) => openEditBooking(b)}
            onDeleteBooking={(id) => handleDeleteBooking(id)}
            onCreateBooking={(roomName, checkInTime, checkOutTime) => {
              setEditBookingId(null);
              setRoom(roomName);
              setCheckIn(checkInTime);
              setCheckOut(checkOutTime);
              setGuestName("");
              setAmount("");
              setBookingNote("");
              setStatus("confirmed");
              const r = availableRooms.find((rm) => rm.name === roomName);
              if (r && checkInTime && checkOutTime) {
                const ci = new Date(checkInTime);
                const co = new Date(checkOutTime);
                const diffMs = co.getTime() - ci.getTime();
                const nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                setCalcNights(nights);
                setSuggestedAmount(r.defaultDailyPrice * nights);
              }
              setIsDrawerOpen(true);
            }}
          />
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                    activeTab === tab.key
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none"
                      : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
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
                <div className="text-center py-16 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-3xl mt-4">
                  <CalendarDays size={40} className="mx-auto mb-3 opacity-30 text-indigo-500" />
                  <p className="text-sm font-semibold">Hiện chưa có đặt phòng nào</p>
                  <p className="text-xs mt-1 text-slate-400 dark:text-slate-600">Click dấu cộng (+) trên cùng để tạo thêm</p>
                </div>
              )}
              {filtered.map((booking) => {
                const st = statusConfig[booking.status];
                const StatusIcon = st.icon;
                return (
                  <div key={booking.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-transform">
                    {/* Top Row */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${sourceColors[booking.source] || "bg-slate-400"}`} />
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white">{booking.guestName}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Nguồn: {booking.source} • Mã đơn: {booking.id}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${st.color} flex items-center gap-1`}>
                        <StatusIcon size={11} />
                        {st.label}
                      </span>
                    </div>

                    {/* Details Row */}
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <BedDouble size={14} />
                        <span className="text-xs font-semibold">{booking.room}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <CalendarDays size={14} />
                        <span className="text-xs font-semibold">{formatFriendlyDate(booking.checkIn)} → {formatFriendlyDate(booking.checkOut)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Clock size={14} />
                        <span className="text-xs font-semibold">{booking.nights} đêm</span>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-base font-black text-slate-800 dark:text-white">{displayAmount(String(booking.amount))}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditBooking(booking); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                        <button 
                          onClick={(e) => handleDeleteBooking(booking.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                        <ChevronRight size={16} className="text-slate-300" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
