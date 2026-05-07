"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  X,
  ChevronDown,
  BedDouble,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Trash2,
  Lock,
} from "lucide-react";
import { Drawer } from "vaul";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────
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

interface RoomInfo {
  name: string;
  defaultDailyPrice: number;
  building: string;
}

interface CalendarViewProps {
  bookings: Booking[];
  rooms: RoomInfo[];
  onEditBooking?: (booking: Booking) => void;
  onCreateBooking?: (room: string, checkIn: string, checkOut: string) => void;
  onDeleteBooking?: (bookingId: string) => void;
  initialRoom?: string;
}

interface RoomBlock {
  id: string;
  roomName: string;
  startDate: string;
  endDate: string;
  note: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────
const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: "bg-emerald-500", text: "text-white", label: "Đã xác nhận" },
  pending: { bg: "bg-amber-500", text: "text-white", label: "Chờ duyệt" },
  cancelled: { bg: "bg-red-400/50", text: "text-white/60", label: "Đã huỷ" },
};

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // ISO / standard
  if (dateStr.includes("T") || dateStr.includes("-")) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  }
  // Friendly: "14:00 (08/05)"
  const friendlyMatch = dateStr.match(/(\d{1,2}):(\d{2})\s*\((\d{1,2})\/(\d{1,2})\)/);
  if (friendlyMatch) {
    const [, h, m, day, month] = friendlyMatch;
    return new Date(new Date().getFullYear(), Number(month) - 1, Number(day), Number(h), Number(m));
  }
  // dd/mm/yyyy
  const slashMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  // dd/mm
  const shortMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (shortMatch) {
    const [, day, month] = shortMatch;
    return new Date(new Date().getFullYear(), Number(month) - 1, Number(day));
  }
  // Fallback
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  return null;
}

function formatVND(val: number): string {
  if (val >= 1000000) return `${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)}tr`;
  if (val >= 1000) return `${Math.round(val / 1000)} N đ`;
  return `${val}đ`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // 0=Sunday, convert to Mon=0 format
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isWeekend(year: number, month: number, day: number): boolean {
  const d = new Date(year, month, day).getDay();
  return d === 0 || d === 6; // Sunday or Saturday
}

const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

// ─── Component ────────────────────────────────────────
export default function CalendarView({
  bookings,
  rooms,
  onEditBooking,
  onCreateBooking,
  onDeleteBooking,
  initialRoom,
}: CalendarViewProps) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(initialRoom || null);
  const [popover, setPopover] = useState<Booking | null>(null);
  const [blockPopover, setBlockPopover] = useState<RoomBlock | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ─── Block State ────────────────────────────────────
  const [blocks, setBlocks] = useState<RoomBlock[]>([]);
  const [blockDrawerOpen, setBlockDrawerOpen] = useState(false);
  const [blockStartDate, setBlockStartDate] = useState("");
  const [blockEndDate, setBlockEndDate] = useState("");
  const [blockNote, setBlockNote] = useState("");

  // Fetch blocks on mount
  useEffect(() => {
    fetch("/api/store?key=blocks")
      .then((r) => r.json())
      .then((d) => { if (d.data && Array.isArray(d.data)) setBlocks(d.data); })
      .catch(console.error);
  }, []);

  const persistBlocks = useCallback(async (data: RoomBlock[]) => {
    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "blocks", data }),
      });
    } catch { toast.error("Lỗi lưu block"); }
  }, []);

  const handleSaveBlock = useCallback(async () => {
    if (!blockStartDate || !selectedRoom) return;
    const entry: RoomBlock = {
      id: `BLK${Date.now()}`,
      roomName: selectedRoom,
      startDate: blockStartDate,
      endDate: blockEndDate || blockStartDate,
      note: blockNote.trim(),
      createdAt: new Date().toISOString(),
    };
    const newBlocks = [...blocks, entry];
    setBlocks(newBlocks);
    await persistBlocks(newBlocks);
    setBlockDrawerOpen(false);
    setBlockStartDate("");
    setBlockEndDate("");
    setBlockNote("");
    toast.success("Đã đóng phòng!");
  }, [blockStartDate, blockEndDate, blockNote, selectedRoom, blocks, persistBlocks]);

  const handleDeleteBlock = useCallback(async (id: string) => {
    if (!window.confirm("Mở lại phòng cho những ngày này?")) return;
    const newBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(newBlocks);
    await persistBlocks(newBlocks);
    setBlockPopover(null);
    toast.success("Đã mở phòng!");
  }, [blocks, persistBlocks]);

  // Check if a day is blocked for the current room
  const isDayBlocked = useCallback((year: number, month: number, day: number): RoomBlock | null => {
    if (!selectedRoom) return null;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return blocks.find((b) => {
      if (b.roomName !== selectedRoom) return false;
      return dateStr >= b.startDate && dateStr <= (b.endDate || b.startDate);
    }) || null;
  }, [blocks, selectedRoom]);

  const today = useMemo(() => new Date(), []);

  // Generate months to display: 2 months before + current + 4 months after = 7 months
  const months = useMemo(() => {
    const result: { year: number; month: number }[] = [];
    const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      result.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    return result;
  }, [today]);

  // Auto-scroll to current month on mount
  useEffect(() => {
    if (scrollRef.current) {
      const currentMonthEl = scrollRef.current.querySelector('[data-current-month="true"]');
      if (currentMonthEl) {
        currentMonthEl.scrollIntoView({ block: "start", behavior: "auto" });
      }
    }
  }, [selectedRoom]);

  // Get bookings for selected room
  const roomBookings = useMemo(() => {
    if (!selectedRoom) return [];
    return bookings.filter(
      (b) => b.room === selectedRoom && b.status !== "cancelled"
    );
  }, [bookings, selectedRoom]);

  // Get room info
  const currentRoom = useMemo(() => {
    if (!selectedRoom) return null;
    return rooms.find((r) => r.name === selectedRoom) || null;
  }, [rooms, selectedRoom]);

  // Check if a day has bookings and return them
  const getBookingsForDay = (year: number, month: number, day: number) => {
    const dayStart = new Date(year, month, day, 0, 0, 0);
    const dayEnd = new Date(year, month, day, 23, 59, 59);

    return roomBookings.filter((b) => {
      const checkIn = parseDate(b.checkIn);
      const checkOut = parseDate(b.checkOut);
      if (!checkIn || !checkOut) return false;
      return checkIn <= dayEnd && checkOut > dayStart;
    });
  };

  // Calculate booking bar positions for a month
  const getBookingBars = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOffset = getFirstDayOfMonth(year, month);
    const monthStart = new Date(year, month, 1, 0, 0, 0);
    const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59);

    // Filter bookings visible in this month
    const visibleBookings = roomBookings
      .filter((b) => {
        const checkIn = parseDate(b.checkIn);
        const checkOut = parseDate(b.checkOut);
        if (!checkIn || !checkOut) return false;
        return checkIn <= monthEnd && checkOut > monthStart;
      })
      .map((b) => ({ ...b, _ci: parseDate(b.checkIn)!, _co: parseDate(b.checkOut)! }))
      .sort((a, b) => a._ci.getTime() - b._ci.getTime());

    // Merge consecutive bookings by same guest (normalized name)
    const normalize = (name: string) => name.trim().toLowerCase();
    const merged: typeof visibleBookings = [];
    for (const booking of visibleBookings) {
      const last = merged[merged.length - 1];
      if (last && normalize(last.guestName) === normalize(booking.guestName)) {
        // Check if checkout day of last == checkin day of this (same-day transition)
        const lastCoDay = new Date(last._co.getFullYear(), last._co.getMonth(), last._co.getDate());
        const thisCiDay = new Date(booking._ci.getFullYear(), booking._ci.getMonth(), booking._ci.getDate());
        if (lastCoDay.getTime() === thisCiDay.getTime() || last._co >= booking._ci) {
          // Merge: extend the last booking's checkout
          last._co = booking._co > last._co ? booking._co : last._co;
          last.checkOut = booking._co > last._co ? booking.checkOut : last.checkOut;
          last.nights = (last.nights || 0) + (booking.nights || 0);
          // Keep earlier amount display
          continue;
        }
      }
      merged.push({ ...booking });
    }

    return merged.map((b) => {
        const checkIn = b._ci;
        const checkOut = b._co;

        // Clamp to month boundaries
        const visibleStart = checkIn < monthStart ? monthStart : checkIn;
        const visibleEnd = checkOut > new Date(year, month, daysInMonth + 1, 0, 0, 0)
          ? new Date(year, month, daysInMonth + 1, 0, 0, 0)
          : checkOut;

        const startDay = visibleStart.getDate();
        const endDay = Math.min(visibleEnd.getDate() === 0 ? daysInMonth : visibleEnd.getDate(), daysInMonth);
        // If checkOut is exactly midnight of next day, endDay is the last occupied day
        const isCheckoutMidnight = visibleEnd.getHours() === 0 && visibleEnd.getMinutes() === 0;
        const lastOccupiedDay = isCheckoutMidnight ? endDay - 1 : endDay;

        const startsBeforeMonth = checkIn < monthStart;
        const endsAfterMonth = checkOut > new Date(year, month, daysInMonth + 1, 0, 0, 0);

        return {
          ...b,
          startDay,
          endDay: Math.max(startDay, lastOccupiedDay < startDay ? startDay : lastOccupiedDay),
          startsBeforeMonth,
          endsAfterMonth,
        };
      });
  };

  // ─── Room List View ─────────────────────────────────
  if (!selectedRoom) {
    return (
      <div className="flex flex-col gap-3 px-1">
        <h2 className="text-lg font-black text-slate-800 dark:text-white px-1 mb-1">Lịch</h2>
        {rooms.map((room) => {
          const roomBCount = bookings.filter(
            (b) => b.room === room.name && b.status !== "cancelled"
          ).length;
          return (
            <button
              key={room.name}
              onClick={() => setSelectedRoom(room.name)}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-all flex items-center gap-4"
            >
              {/* Room Thumbnail */}
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 rounded-xl flex items-center justify-center shrink-0">
                <BedDouble size={24} className="text-indigo-500 dark:text-indigo-400" />
              </div>

              <div className="flex-1 min-w-0 text-left">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">{room.name}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <MapPin size={10} />
                  {room.building}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {roomBCount > 0 ? `${roomBCount} booking` : "Chưa có booking"}
                </p>
              </div>

              {/* Monthly availability dots - shows actual days of current month */}
              {(() => {
                const now = new Date();
                const yr = now.getFullYear(), mo = now.getMonth();
                const daysInMonth = new Date(yr, mo + 1, 0).getDate();
                const roomBookingsThisMonth = bookings.filter(b => {
                  if (b.room !== room.name || b.status === "cancelled") return false;
                  const ci = parseDate(b.checkIn);
                  const co = parseDate(b.checkOut);
                  if (!ci || !co) return false;
                  const monthStart = new Date(yr, mo, 1);
                  const monthEnd = new Date(yr, mo, daysInMonth, 23, 59, 59);
                  return ci <= monthEnd && co > monthStart;
                });

                // Track each day's status: 'full' | 'checkin' | 'checkout' | 'both' | null
                const dayStatus = new Map<number, string>();
                roomBookingsThisMonth.forEach(b => {
                  const ci = parseDate(b.checkIn)!;
                  const co = parseDate(b.checkOut)!;
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dayStart = new Date(yr, mo, d, 0, 0, 0);
                    const dayEnd = new Date(yr, mo, d, 23, 59, 59);
                    if (!(ci <= dayEnd && co > dayStart)) continue;

                    const isCheckInDay = ci.getFullYear() === yr && ci.getMonth() === mo && ci.getDate() === d;
                    const isCheckOutDay = co.getFullYear() === yr && co.getMonth() === mo && co.getDate() === d && !(co.getHours() === 0 && co.getMinutes() === 0);
                    const prev = dayStatus.get(d);

                    if (isCheckInDay && !isCheckOutDay) {
                      // Afternoon only (check-in)
                      dayStatus.set(d, prev === 'checkout' || prev === 'full' || prev === 'both' ? 'both' : 'checkin');
                    } else if (isCheckOutDay && !isCheckInDay) {
                      // Morning only (check-out)
                      dayStatus.set(d, prev === 'checkin' || prev === 'full' || prev === 'both' ? 'both' : 'checkout');
                    } else {
                      // Full day (middle of booking, or same-day checkin+checkout)
                      dayStatus.set(d, 'full');
                    }
                  }
                });

                const grayColor = "rgb(100,116,139)"; // slate-500
                const greenColor = "rgb(16,185,129)";  // emerald-500
                const emptyColor = "rgb(226,232,240)";  // slate-200

                return (
                  <div className="grid grid-cols-7 gap-[3px] shrink-0 mr-1">
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const status = dayStatus.get(i + 1);
                      let bg: string;
                      let style: React.CSSProperties = { width: 5, height: 5, borderRadius: "50%" };

                      if (!status) {
                        bg = emptyColor;
                        style.backgroundColor = bg;
                      } else if (status === 'full' || status === 'both') {
                        style.backgroundColor = greenColor;
                      } else if (status === 'checkin') {
                        // Right half green (afternoon), left half empty
                        style.background = `linear-gradient(to right, ${emptyColor} 50%, ${greenColor} 50%)`;
                      } else if (status === 'checkout') {
                        // Left half green (morning), right half empty
                        style.background = `linear-gradient(to right, ${greenColor} 50%, ${emptyColor} 50%)`;
                      }

                      return <div key={i} style={style} />;
                    })}
                  </div>
                );
              })()}
            </button>
          );
        })}

        {rooms.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">Chưa có phòng nào</p>
            <p className="text-xs mt-1">Vào tab "Kho Phòng" để thêm phòng trước</p>
          </div>
        )}
      </div>
    );
  }

  // ─── Calendar View for Selected Room ────────────────
  const bookingBarsCache = new Map<string, ReturnType<typeof getBookingBars>>();
  const getCachedBars = (year: number, month: number) => {
    const key = `${year}-${month}`;
    if (!bookingBarsCache.has(key)) {
      bookingBarsCache.set(key, getBookingBars(year, month));
    }
    return bookingBarsCache.get(key)!;
  };

  return (
    <div className="flex flex-col -mx-5">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
        <button
          onClick={() => { setSelectedRoom(null); setPopover(null); }}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white truncate">
            {currentRoom?.name}
          </h2>
          <p className="text-[11px] text-slate-400 truncate">{currentRoom?.building}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
              setBlockStartDate(todayStr);
              setBlockEndDate(todayStr);
              setBlockNote("");
              setBlockDrawerOpen(true);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 active:scale-90 transition-transform"
          >
            <Ban size={15} />
          </button>
          <span className="text-[10px] font-bold text-violet-500 bg-violet-50 dark:bg-violet-500/15 px-2 py-1 rounded-lg">
            {formatVND(currentRoom?.defaultDailyPrice || 0)}/đêm
          </span>
        </div>
      </div>

      {/* ─── Weekday Header (sticky) ─── */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="grid grid-cols-7 py-2.5">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={`text-center text-[11px] font-bold ${
                i >= 5 ? "text-slate-500 dark:text-slate-400" : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Scrollable Month Grids ─── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-white dark:bg-slate-800">
        {months.map(({ year, month }) => {
          const daysInMonth = getDaysInMonth(year, month);
          const firstDayOffset = getFirstDayOfMonth(year, month);
          const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
          const bars = getCachedBars(year, month);

          // Build grid cells
          const cells: { day: number; isEmpty: boolean }[] = [];
          for (let i = 0; i < firstDayOffset; i++) {
            cells.push({ day: 0, isEmpty: true });
          }
          for (let d = 1; d <= daysInMonth; d++) {
            cells.push({ day: d, isEmpty: false });
          }
          // Pad to complete last row
          while (cells.length % 7 !== 0) {
            cells.push({ day: 0, isEmpty: true });
          }

          // Calculate which rows booking bars occupy
          const rows = cells.length / 7;

          // For each booking bar, calculate grid positions
          const barPositions = bars.map((bar) => {
            const startGridIdx = firstDayOffset + bar.startDay - 1;
            const endGridIdx = firstDayOffset + bar.endDay - 1;
            
            // Split into row segments
            const segments: { row: number; startCol: number; endCol: number; isFirst: boolean; isLast: boolean }[] = [];
            
            let currentIdx = startGridIdx;
            while (currentIdx <= endGridIdx) {
              const row = Math.floor(currentIdx / 7);
              const startCol = currentIdx % 7;
              const rowEndIdx = Math.min(endGridIdx, (row + 1) * 7 - 1);
              const endCol = rowEndIdx % 7;
              
              segments.push({
                row,
                startCol,
                endCol,
                isFirst: currentIdx === startGridIdx && !bar.startsBeforeMonth,
                isLast: rowEndIdx === endGridIdx && !bar.endsAfterMonth,
              });
              
              currentIdx = (row + 1) * 7;
            }
            
            return { ...bar, segments };
          });

          return (
            <div
              key={`${year}-${month}`}
              className="border-b border-slate-100 dark:border-slate-700 pb-4"
              data-current-month={isCurrentMonth ? "true" : undefined}
            >
              {/* Month Title */}
              <h3 className="text-lg font-black text-slate-800 dark:text-white px-5 pt-6 pb-3">
                {MONTH_NAMES[month]} {year !== today.getFullYear() ? year : ""}
              </h3>

              {/* Calendar Grid */}
              <div className="relative px-2">
                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {cells.map((cell, idx) => {
                    if (cell.isEmpty) {
                      return <div key={idx} className="pt-3 pb-7 px-1" />;
                    }

                    const isToday = isCurrentMonth && cell.day === today.getDate();
                    const isPast =
                      new Date(year, month, cell.day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const weekend = isWeekend(year, month, cell.day);
                    const dayBookings = getBookingsForDay(year, month, cell.day);
                    const hasBooking = dayBookings.length > 0;
                    const defaultPrice = currentRoom?.defaultDailyPrice || 0;
                    // Show actual booking price if booked, default price otherwise
                    const bookingPrice = hasBooking ? (() => {
                      const amountStr = dayBookings[0].amount || "";
                      // Parse "400.000 ₫" → 400000
                      const num = parseInt(amountStr.replace(/[^\d]/g, ""), 10);
                      return isNaN(num) ? defaultPrice : num;
                    })() : defaultPrice;
                    const dayBlock = isDayBlocked(year, month, cell.day);

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col items-center pt-3 pb-7 px-1 relative ${
                          isPast ? "opacity-40" : ""
                        }`}
                        onClick={() => {
                          if (dayBlock) {
                            // Tap blocked day → show block details
                            setBlockPopover(dayBlock);
                            setPopover(null);
                            return;
                          }
                          if (!isPast && !hasBooking) {
                            // Tap empty day → open block drawer with this date
                            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
                            if (onCreateBooking) {
                              onCreateBooking(selectedRoom, dateStr + "T14:00", `${new Date(year, month, cell.day + 1).getFullYear()}-${String(new Date(year, month, cell.day + 1).getMonth() + 1).padStart(2, "0")}-${String(new Date(year, month, cell.day + 1).getDate()).padStart(2, "0")}T12:00`);
                            }
                          }
                        }}
                      >
                        {/* Day Number */}
                        <div
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors relative ${
                            isToday
                              ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 ring-2 ring-slate-300 dark:ring-slate-600"
                              : dayBlock
                              ? "text-slate-400 dark:text-slate-500"
                              : hasBooking
                              ? "text-slate-700 dark:text-slate-200"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {cell.day}
                          {/* Strikethrough line for blocked days */}
                          {dayBlock && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-7 h-[1.5px] bg-slate-400 dark:bg-slate-500 rotate-[-45deg]" />
                            </div>
                          )}
                        </div>

                        {/* Price or Blocked */}
                        <span
                          className={`text-[10px] mt-1 font-semibold ${
                            dayBlock
                              ? "text-slate-400 dark:text-slate-600 line-through"
                              : hasBooking
                              ? "text-emerald-600 dark:text-emerald-400"
                              : weekend
                              ? "text-slate-500 dark:text-slate-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {dayBlock ? "Đóng" : formatVND(bookingPrice)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Booking Bars Overlay */}
                {barPositions.map((bar) =>
                  bar.segments.map((seg, segIdx) => {
                    const style = statusStyle[bar.status] || statusStyle.confirmed;
                    const cellWidth = 100 / 7; // percentage
                    const halfCell = cellWidth / 2;
                    let left = seg.startCol * cellWidth;
                    let width = (seg.endCol - seg.startCol + 1) * cellWidth;

                    // Airbnb-style: check-in day shows RIGHT half, check-out day shows LEFT half
                    // This prevents overlap when back-to-back bookings share a day
                    if (seg.isFirst) {
                      left += halfCell;
                      width -= halfCell;
                    }
                    if (seg.isLast) {
                      width -= halfCell;
                    }
                    // Ensure minimum visible width
                    width = Math.max(width, halfCell * 0.5);

                    // Each row is approximately 88px (pt-3 + content + pb-7)
                    const rowHeight = 88;
                    const top = seg.row * rowHeight + 58; // offset to sit below price text

                    return (
                      <div
                        key={`${bar.id}-${segIdx}`}
                        className={`absolute h-[14px] ${style.bg} ${style.text} flex items-center z-10 cursor-pointer active:brightness-110 transition-all shadow-sm`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          top: `${top}px`,
                          borderRadius: `${seg.isFirst ? "14px" : "0"} ${seg.isLast ? "14px" : "0"} ${seg.isLast ? "14px" : "0"} ${seg.isFirst ? "14px" : "0"}`,
                          paddingLeft: seg.isFirst ? "8px" : "4px",
                          paddingRight: seg.isLast ? "4px" : "4px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPopover(popover?.id === bar.id ? null : bar);
                        }}
                      >
                        {/* Avatar + Name */}
                        {seg.isFirst && (
                          <div className="flex items-center gap-0.5 min-w-0 overflow-hidden">
                            <div className="w-3 h-3 bg-white/30 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-[6px] font-bold">{bar.guestName.charAt(0)}</span>
                            </div>
                            <span className="text-[8px] font-bold truncate leading-none drop-shadow-sm">
                              {bar.guestName}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Booking Popover ─── */}
      {popover && (
        <div className="fixed left-0 right-0 bottom-[80px] z-[210] flex justify-center px-4 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-300/50 dark:shadow-none relative">
            {/* Action buttons */}
            <div className="absolute top-3 right-3 flex items-center gap-1">
              {onEditBooking && (
                <button
                  onClick={() => { onEditBooking(popover); setPopover(null); }}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Clock size={16} />
                  <span className="text-xs font-bold ml-1 hidden sm:inline">Sửa</span>
                </button>
              )}
              {onDeleteBooking && (
                <button
                  onClick={() => {
                    if (window.confirm("Xóa booking này?")) {
                      onDeleteBooking(popover.id);
                      setPopover(null);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <XCircle size={16} />
                </button>
              )}
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
              <button
                onClick={() => setPopover(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Guest info */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-full ${statusStyle[popover.status]?.bg} flex items-center justify-center`}>
                <span className="text-xs font-bold text-white">{popover.guestName.charAt(0)}</span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">{popover.guestName}</h4>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusStyle[popover.status]?.bg} ${statusStyle[popover.status]?.text}`}
              >
                {statusStyle[popover.status]?.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3 py-2.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Phòng</p>
                <p className="text-xs font-bold text-slate-700 dark:text-white">{popover.room}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3 py-2.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Nguồn</p>
                <p className="text-xs font-bold text-slate-700 dark:text-white">{popover.source}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3 py-2.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Check-in</p>
                <p className="text-xs font-bold text-slate-700 dark:text-white">{popover.checkIn}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3 py-2.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Check-out</p>
                <p className="text-xs font-bold text-slate-700 dark:text-white">{popover.checkOut}</p>
              </div>
            </div>

            <div className="mt-3 flex justify-between items-center">
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {popover.amount}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {popover.nights} đêm • Mã: {popover.id}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Block Popover ─── */}
      {blockPopover && (
        <div className="fixed left-0 right-0 bottom-[80px] z-[210] flex justify-center px-4 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-300/50 dark:shadow-none relative">
            <div className="absolute top-3 right-3 flex items-center gap-1">
              <button
                onClick={() => handleDeleteBlock(blockPopover.id)}
                className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
              >
                <Lock size={14} />
                <span className="text-xs font-bold">Mở phòng</span>
              </button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
              <button
                onClick={() => setBlockPopover(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center">
                <Ban size={14} className="text-white" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">Phòng đã đóng</h4>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-500 text-white">Blocked</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3 py-2.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Từ ngày</p>
                <p className="text-xs font-bold text-slate-700 dark:text-white">{blockPopover.startDate}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3 py-2.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Đến ngày</p>
                <p className="text-xs font-bold text-slate-700 dark:text-white">{blockPopover.endDate || blockPopover.startDate}</p>
              </div>
            </div>
            {blockPopover.note && (
              <div className="mt-2 bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3 py-2.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Ghi chú</p>
                <p className="text-xs text-slate-700 dark:text-white">{blockPopover.note}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Block Drawer ─── */}
      <Drawer.Root open={blockDrawerOpen} onOpenChange={setBlockDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[9999] backdrop-blur-sm" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[9999] bg-slate-50 dark:bg-slate-900 flex flex-col rounded-t-[32px] max-h-[80vh] outline-none">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
            <div className="max-w-5xl w-full mx-auto flex flex-col overflow-auto px-6 pb-6">
              <Drawer.Title className="font-extrabold text-xl text-slate-800 dark:text-white mb-1">Đóng phòng</Drawer.Title>
              <p className="text-sm text-slate-500 mb-6">Chặn ngày không cho thuê — {currentRoom?.name}</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Từ ngày</label>
                  <input type="date" value={blockStartDate} onChange={(e) => { setBlockStartDate(e.target.value); if (!blockEndDate) setBlockEndDate(e.target.value); }}
                    className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Đến ngày</label>
                  <input type="date" value={blockEndDate} onChange={(e) => setBlockEndDate(e.target.value)} min={blockStartDate}
                    className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Lý do / Ghi chú</label>
                  <textarea value={blockNote} onChange={(e) => setBlockNote(e.target.value)} rows={2} placeholder="VD: Bảo trì, Sửa chữa, Nghỉ lễ..."
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
                </div>
                <button onClick={handleSaveBlock}
                  className="w-full mt-2 bg-slate-700 dark:bg-slate-600 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 shadow-lg active:scale-[0.98] transition-transform">
                  <Ban size={16} /> Đóng phòng
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
