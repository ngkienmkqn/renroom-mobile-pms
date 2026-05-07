"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Calendar,
  FileText,
  Banknote,
  StickyNote,
  X,
  Pencil,
} from "lucide-react";
import { Drawer } from "vaul";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────
interface Expense {
  id: string;
  roomName: string;
  date: string;
  description: string;
  amount: number;
  note: string;
  createdAt: string;
}

interface RoomInfo {
  name: string;
  building: string;
  contractPrice: number;
  defaultDailyPrice: number;
  electricityPrice?: number;
  waterPrice?: number;
  otherPrice?: number;
}

interface Booking {
  id: string;
  guestName: string;
  room: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  source: string;
  status: string;
  amount: string;
}

// ─── Helpers ──────────────────────────────────────────
const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const formatVND = (val: number) =>
  new Intl.NumberFormat("vi-VN").format(val);

const parseAmount = (val: string): number => {
  const cleaned = String(val).replace(/[^\d]/g, "");
  return Number(cleaned) || 0;
};

// ─── Component ────────────────────────────────────────
export default function FinancePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Filters
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedRoom, setSelectedRoom] = useState<string>("all");

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formRoom, setFormRoom] = useState("");
  const [formDate, setFormDate] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  );
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formNote, setFormNote] = useState("");

  // ─── Data Loading ───────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/store?key=expenses").then((r) => r.json()),
      fetch("/api/store?key=rooms").then((r) => r.json()),
      fetch("/api/store?key=bookings").then((r) => r.json()),
    ])
      .then(([ed, rd, bd]) => {
        if (ed.data && Array.isArray(ed.data)) setExpenses(ed.data);
        if (rd.data && Array.isArray(rd.data)) setRooms(rd.data);
        if (bd.data && Array.isArray(bd.data)) setBookings(bd.data);
      })
      .catch(console.error);
  }, []);

  // ─── Persist ────────────────────────────────────────
  const persistExpenses = async (data: Expense[]) => {
    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "expenses", data }),
      });
    } catch {
      toast.error("Lỗi đồng bộ dữ liệu");
    }
  };

  // ─── Month Navigation ──────────────────────────────
  const goMonth = (offset: number) => {
    let newMonth = selectedMonth + offset;
    let newYear = selectedYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  // ─── Computed Data ──────────────────────────────────
  const displayRooms = selectedRoom === "all" ? rooms : rooms.filter((r) => r.name === selectedRoom);

  // Revenue: sum of booking amounts for selected month/room
  const monthRevenue = useMemo(() => {
    return bookings
      .filter((b) => {
        if (b.status === "cancelled") return false;
        const cIn = new Date(b.checkIn);
        if (cIn.getMonth() !== selectedMonth || cIn.getFullYear() !== selectedYear) return false;
        if (selectedRoom !== "all" && b.room !== selectedRoom) return false;
        return true;
      })
      .reduce((acc, b) => acc + parseAmount(b.amount), 0);
  }, [bookings, selectedMonth, selectedYear, selectedRoom]);

  // Fixed costs: sum of contractPrice + electricity + water + other for displayed rooms
  const fixedCosts = useMemo(() => {
    return displayRooms.reduce((acc, r) => {
      const base = Number(r.contractPrice) || 0;
      const elec = Number(r.electricityPrice) || 0;
      const water = Number(r.waterPrice) || 0;
      const other = Number(r.otherPrice) || 0;
      return acc + base + elec + water + other;
    }, 0);
  }, [displayRooms]);

  // Variable expenses: sum of expense entries for selected month/room
  const monthExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        if (d.getMonth() !== selectedMonth || d.getFullYear() !== selectedYear) return false;
        if (selectedRoom !== "all" && e.roomName !== selectedRoom) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedMonth, selectedYear, selectedRoom]);

  const totalExpenseAmount = useMemo(
    () => monthExpenses.reduce((acc, e) => acc + e.amount, 0),
    [monthExpenses]
  );

  const totalChi = fixedCosts + totalExpenseAmount;
  const profit = monthRevenue - totalChi;

  // ─── Form Handlers ─────────────────────────────────
  const resetForm = () => {
    setEditingId(null);
    setFormRoom(rooms[0]?.name || "");
    setFormDate(
      `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    );
    setFormDescription("");
    setFormAmount("");
    setFormNote("");
  };

  const handleSave = async () => {
    if (!formDescription.trim()) {
      toast.error("Vui lòng nhập nội dung chi");
      return;
    }
    if (!formAmount || Number(formAmount) <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    if (!formRoom) {
      toast.error("Vui lòng chọn phòng");
      return;
    }

    const entry: Expense = {
      id: editingId || `E${Date.now()}`,
      roomName: formRoom,
      date: formDate,
      description: formDescription.trim(),
      amount: Number(formAmount),
      note: formNote.trim(),
      createdAt: editingId
        ? expenses.find((e) => e.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    let newArr: Expense[];
    if (editingId) {
      newArr = expenses.map((e) => (e.id === editingId ? entry : e));
      toast.success("Đã cập nhật chi phí!");
    } else {
      newArr = [entry, ...expenses];
      toast.success("Đã thêm chi phí mới!");
    }

    setExpenses(newArr);
    await persistExpenses(newArr);
    resetForm();
    setIsDrawerOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xóa khoản chi này?")) return;
    const newArr = expenses.filter((e) => e.id !== id);
    setExpenses(newArr);
    await persistExpenses(newArr);
    toast.success("Đã xóa chi phí!");
  };

  const openEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setFormRoom(expense.roomName);
    setFormDate(expense.date);
    setFormDescription(expense.description);
    setFormAmount(String(expense.amount));
    setFormNote(expense.note);
    setIsDrawerOpen(true);
  };

  const formatDateVN = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* ─── Header ─── */}
      <header className="px-5 pt-14 pb-6 bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-700 dark:from-teal-900 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden transition-colors duration-300">
        <div className="absolute -top-14 -right-14 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-20 -left-10 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Thu Chi</h1>
            <p className="text-teal-200 text-xs mt-1">Tổng hợp thu chi theo tháng</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsDrawerOpen(true);
            }}
            className="w-10 h-10 bg-white/15 backdrop-blur-md rounded-xl flex justify-center items-center text-white border border-white/20 active:scale-95 transition-transform"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-4 mt-5">
          <button
            onClick={() => goMonth(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-90 transition-transform"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-white font-extrabold text-base">
              {MONTH_NAMES[selectedMonth]}
            </p>
            <p className="text-teal-200 text-[11px] font-medium">{selectedYear}</p>
          </div>
          <button
            onClick={() => goMonth(1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-90 transition-transform"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pt-5">
        {/* ─── Room Filter ─── */}
        <div className="flex gap-1.5 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
          <button
            onClick={() => setSelectedRoom("all")}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 ${
              selectedRoom === "all"
                ? "bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-200 dark:shadow-none"
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
            }`}
          >
            Tất cả
          </button>
          {rooms.map((r) => (
            <button
              key={r.name}
              onClick={() => setSelectedRoom(r.name)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                selectedRoom === r.name
                  ? "bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-200 dark:shadow-none"
                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>

        {/* ─── Summary Card ─── */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 dark:border-slate-700 mb-5">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
            <Wallet size={14} className="text-teal-500" />
            Tổng hợp {MONTH_NAMES[selectedMonth]}
            {selectedRoom !== "all" && ` — ${selectedRoom}`}
          </h3>

          <div className="grid grid-cols-3 gap-3 divide-x divide-slate-100 dark:divide-slate-700">
            {/* Revenue */}
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <TrendingUp size={10} className="text-emerald-500" />
                Tổng Thu
              </p>
              <p className="text-[15px] font-black text-emerald-500 tracking-tight">
                {formatVND(monthRevenue)}₫
              </p>
            </div>
            {/* Expenses */}
            <div className="pl-3">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <TrendingDown size={10} className="text-rose-500" />
                Tổng Chi
              </p>
              <p className="text-[15px] font-black text-rose-500 tracking-tight">
                {formatVND(totalChi)}₫
              </p>
            </div>
            {/* Profit */}
            <div className="pl-3">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Lợi nhuận</p>
              <p
                className={`text-[15px] font-black tracking-tight ${
                  profit >= 0 ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {profit >= 0 ? "+" : ""}
                {formatVND(profit)}₫
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-medium">Chi phí cố định (Nhà, Điện, Nước...)</span>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{formatVND(fixedCosts)}₫</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-medium">Chi phí phát sinh ({monthExpenses.length} khoản)</span>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{formatVND(totalExpenseAmount)}₫</span>
            </div>
          </div>
        </div>

        {/* ─── Expense List ─── */}
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">
            Chi phí phát sinh
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">{monthExpenses.length} khoản</span>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {monthExpenses.length === 0 && (
            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-3xl">
              <Receipt size={36} className="mx-auto mb-3 opacity-30 text-teal-500" />
              <p className="text-sm font-semibold">Chưa có khoản chi nào</p>
              <p className="text-xs mt-1 text-slate-400">Bấm (+) để thêm chi phí phát sinh</p>
            </div>
          )}

          {monthExpenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-transform"
              onClick={() => openEdit(expense)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Receipt size={18} strokeWidth={2.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate pr-2">
                      {expense.description}
                    </h4>
                    <span className="text-sm font-black text-rose-500 shrink-0">
                      -{formatVND(expense.amount)}₫
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {formatDateVN(expense.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Banknote size={10} />
                      {expense.roomName}
                    </span>
                  </div>

                  {expense.note && (
                    <p className="text-[11px] text-slate-400 mt-1.5 flex items-start gap-1">
                      <StickyNote size={10} className="shrink-0 mt-0.5" />
                      <span className="truncate">{expense.note}</span>
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(expense.id);
                  }}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ─── Add/Edit Expense Drawer ─── */}
      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[9999] backdrop-blur-sm" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[9999] bg-slate-50 dark:bg-slate-900 flex flex-col rounded-t-[32px] max-h-[85vh] outline-none">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
            <div className="max-w-5xl w-full mx-auto flex flex-col overflow-auto px-6 pb-6 h-full">
              <Drawer.Title className="font-extrabold text-xl text-slate-800 dark:text-white mb-1">
                {editingId ? "Sửa chi phí" : "Thêm chi phí mới"}
              </Drawer.Title>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {editingId ? "Cập nhật khoản chi phát sinh." : "Ghi nhận chi phí phát sinh cho căn hộ."}
              </p>

              <div className="space-y-4">
                {/* Room */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    Phòng / Căn hộ
                  </label>
                  <select
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="">Chọn phòng...</option>
                    {rooms.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name} — {r.building}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    Ngày chi
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    Nội dung chi
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    placeholder="VD: Mua khăn tắm, Thuê dọn phòng..."
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    Số tiền chi
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full pl-4 pr-12 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm font-bold text-rose-600 dark:text-rose-400 placeholder:font-normal dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      placeholder="VD: 200000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      VND
                    </span>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    Ghi chú
                  </label>
                  <textarea
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    placeholder="Ghi chú thêm (tùy chọn)..."
                  />
                </div>

                <button
                  onClick={handleSave}
                  className="w-full mt-4 bg-teal-600 text-white font-bold py-4 rounded-2xl flex justify-center items-center shadow-lg shadow-teal-200 dark:shadow-none active:scale-[0.98] transition-transform"
                >
                  {editingId ? "Cập nhật chi phí" : "Lưu chi phí"}
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
