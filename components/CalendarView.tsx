"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
} from "lucide-react";

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
  const scrollRef = useRef<HTMLDivElement>(null);

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

    return roomBookings
      .filter((b) => {
        const checkIn = parseDate(b.checkIn);
        const checkOut = parseDate(b.checkOut);
        if (!checkIn || !checkOut) return false;
        return checkIn <= monthEnd && checkOut > monthStart;
      })
      .map((b) => {
        const checkIn = parseDate(b.checkIn)!;
        const checkOut = parseDate(b.checkOut)!;

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
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const roomBookingsThisMonth = bookings.filter(b => {
                  if (b.room !== room.name || b.status === "cancelled") return false;
                  const ci = parseDate(b.checkIn);
                  const co = parseDate(b.checkOut);
                  if (!ci || !co) return false;
                  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                  const monthEnd = new Date(now.getFullYear(), now.getMonth(), daysInMonth, 23, 59, 59);
                  return ci <= monthEnd && co > monthStart;
                });
                const bookedDays = new Set<number>();
                roomBookingsThisMonth.forEach(b => {
                  const ci = parseDate(b.checkIn)!;
                  const co = parseDate(b.checkOut)!;
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dayStart = new Date(now.getFullYear(), now.getMonth(), d, 0, 0, 0);
                    const dayEnd = new Date(now.getFullYear(), now.getMonth(), d, 23, 59, 59);
                    if (ci <= dayEnd && co > dayStart) bookedDays.add(d);
                  }
                });
                // Grid: 7 columns to match calendar feel
                return (
                  <div className="grid grid-cols-7 gap-[3px] shrink-0 mr-1">
                    {Array.from({ length: daysInMonth }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-[5px] h-[5px] rounded-full ${
                          bookedDays.has(i + 1)
                            ? "bg-emerald-500"
                            : "bg-slate-200 dark:bg-slate-600"
                        }`}
                      />
                    ))}
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
                    const price = currentRoom?.defaultDailyPrice || 0;

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col items-center pt-3 pb-7 px-1 relative ${
                          isPast ? "opacity-40" : ""
                        }`}
                        onClick={() => {
                          if (!isPast && onCreateBooking && !hasBooking) {
                            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}T14:00`;
                            const nextDay = new Date(year, month, cell.day + 1);
                            const checkOutStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, "0")}-${String(nextDay.getDate()).padStart(2, "0")}T12:00`;
                            onCreateBooking(selectedRoom, dateStr, checkOutStr);
                          }
                        }}
                      >
                        {/* Day Number */}
                        <div
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
                            isToday
                              ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 ring-2 ring-slate-300 dark:ring-slate-600"
                              : hasBooking
                              ? "text-slate-700 dark:text-slate-200"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {cell.day}
                        </div>

                        {/* Price */}
                        <span
                          className={`text-[10px] mt-1 font-semibold ${
                            weekend
                              ? "text-slate-500 dark:text-slate-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {formatVND(price)}
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
                    const left = seg.startCol * cellWidth;
                    const width = (seg.endCol - seg.startCol + 1) * cellWidth;
                    // Each row is approximately 88px (pt-3 + content + pb-7)
                    const rowHeight = 88;
                    const top = seg.row * rowHeight + 62; // offset to sit below price text

                    return (
                      <div
                        key={`${bar.id}-${segIdx}`}
                        className={`absolute h-6 ${style.bg} ${style.text} flex items-center z-10 cursor-pointer active:brightness-110 transition-all shadow-sm`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          top: `${top}px`,
                          borderRadius: `${seg.isFirst ? "14px" : "0"} ${seg.isLast ? "14px" : "0"} ${seg.isLast ? "14px" : "0"} ${seg.isFirst ? "14px" : "0"}`,
                          paddingLeft: seg.isFirst ? "10px" : "4px",
                          paddingRight: seg.isLast ? "10px" : "4px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPopover(popover?.id === bar.id ? null : bar);
                        }}
                      >
                        {/* Avatar circle + Name */}
                        {seg.isFirst && (
                          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                            <div className="w-5 h-5 bg-white/30 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-bold">{bar.guestName.charAt(0)}</span>
                            </div>
                            <span className="text-[11px] font-bold truncate drop-shadow-sm">
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
    </div>
  );
}
