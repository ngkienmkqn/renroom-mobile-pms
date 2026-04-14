"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  BedDouble,
  X,
  CheckCircle2,
  AlertTriangle,
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
}

interface RoomInfo {
  name: string;
  defaultDailyPrice: number;
  building: string;
}

interface TimelineViewProps {
  bookings: Booking[];
  rooms: RoomInfo[];
}

// ─── Constants ────────────────────────────────────────
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_WIDTH = 80; // px per hour column
const ROW_HEIGHT = 64; // px per room row

const statusStyle: Record<
  string,
  { bg: string; border: string; text: string; label: string; icon: typeof CheckCircle2 }
> = {
  confirmed: {
    bg: "bg-emerald-500/80",
    border: "border-emerald-400",
    text: "text-white",
    label: "Đã xác nhận",
    icon: CheckCircle2,
  },
  pending: {
    bg: "bg-amber-500/80",
    border: "border-amber-400",
    text: "text-white",
    label: "Chờ duyệt",
    icon: AlertTriangle,
  },
  cancelled: {
    bg: "bg-red-500/50",
    border: "border-red-400",
    text: "text-white/70",
    label: "Đã huỷ",
    icon: XCircle,
  },
};

const sourceColors: Record<string, string> = {
  Airbnb: "bg-rose-400",
  "Booking.com": "bg-blue-400",
  Agoda: "bg-red-400",
  "Trực tiếp": "bg-indigo-400",
};

// ─── Helpers ──────────────────────────────────────────
function parseBookingDate(dateStr: string, referenceDate: Date): Date | null {
  if (!dateStr) return null;

  // Try ISO / datetime-local format: "2026-04-14T14:00"
  if (dateStr.includes("T") || dateStr.includes("-")) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  }

  // Try "HH:mm (DD/MM)" format from formatFriendlyDate
  const friendlyMatch = dateStr.match(
    /(\d{1,2}):(\d{2})\s*\((\d{1,2})\/(\d{1,2})\)/
  );
  if (friendlyMatch) {
    const [, h, m, day, month] = friendlyMatch;
    const d = new Date(referenceDate.getFullYear(), Number(month) - 1, Number(day), Number(h), Number(m));
    return d;
  }

  // Try "DD/MM/YYYY" format
  const slashMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  // Try "DD/MM" format (assume current year)
  const shortMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (shortMatch) {
    const [, day, month] = shortMatch;
    return new Date(referenceDate.getFullYear(), Number(month) - 1, Number(day));
  }

  return null;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateVN(d: Date): string {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return `${days[d.getDay()]}, ${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

// ─── Component ────────────────────────────────────────
export default function TimelineView({ bookings, rooms }: TimelineViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [activeRoom, setActiveRoom] = useState<string>("all");
  const [popover, setPopover] = useState<Booking | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isToday = isSameDay(selectedDate, today);

  // Scroll to current hour on mount
  useEffect(() => {
    if (scrollRef.current && isToday) {
      const now = new Date();
      const scrollTo = Math.max(0, (now.getHours() - 1) * HOUR_WIDTH);
      scrollRef.current.scrollLeft = scrollTo;
    }
  }, [isToday]);

  // Navigate date
  const goDay = (offset: number) => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + offset);
      return d;
    });
    setPopover(null);
  };

  const goToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
    setPopover(null);
  };

  // Filter rooms
  const displayRooms = activeRoom === "all" ? rooms : rooms.filter((r) => r.name === activeRoom);

  // Map bookings to timeline blocks for the selected date
  const getBookingsForRoom = (roomName: string) => {
    return bookings
      .filter((b) => {
        if (b.room !== roomName) return false;
        if (b.status === "cancelled") return false;

        const checkIn = parseBookingDate(b.checkIn, selectedDate);
        const checkOut = parseBookingDate(b.checkOut, selectedDate);
        if (!checkIn || !checkOut) return false;

        // Check if booking overlaps with selected date
        const dayStart = new Date(selectedDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(selectedDate);
        dayEnd.setHours(23, 59, 59, 999);

        return checkIn <= dayEnd && checkOut >= dayStart;
      })
      .map((b) => {
        const checkIn = parseBookingDate(b.checkIn, selectedDate)!;
        const checkOut = parseBookingDate(b.checkOut, selectedDate)!;

        const dayStart = new Date(selectedDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(selectedDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Clamp to the visible day
        const visibleStart = checkIn < dayStart ? dayStart : checkIn;
        const visibleEnd = checkOut > dayEnd ? dayEnd : checkOut;

        const startHour = visibleStart.getHours() + visibleStart.getMinutes() / 60;
        const endHour = visibleEnd.getHours() + visibleEnd.getMinutes() / 60;
        const duration = Math.max(0.5, endHour - startHour);

        return {
          ...b,
          startHour,
          duration,
          startsBeforeDay: checkIn < dayStart,
          endsAfterDay: checkOut > dayEnd,
        };
      });
  };

  // Now line position
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const nowLeft = nowHour * HOUR_WIDTH;

  return (
    <div className="flex flex-col gap-3">
      {/* ─── Date Navigation ─── */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl px-3 py-2.5 border border-slate-100 dark:border-slate-700 shadow-sm">
        <button
          onClick={() => goDay(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 active:scale-90 transition-transform"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-indigo-500" />
          <button onClick={goToday} className="text-sm font-bold text-slate-800 dark:text-white">
            {isToday ? "Hôm nay" : formatDateVN(selectedDate)}
          </button>
          {!isToday && (
            <button
              onClick={goToday}
              className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full"
            >
              Hôm nay
            </button>
          )}
        </div>

        <button
          onClick={() => goDay(1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 active:scale-90 transition-transform"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ─── Room Filter Tabs ─── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => { setActiveRoom("all"); setPopover(null); }}
          className={`flex-shrink-0 px-3.5 py-2 rounded-full text-[11px] font-bold border transition-all active:scale-95 ${
            activeRoom === "all"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none"
              : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
          }`}
        >
          Tất cả ({rooms.length})
        </button>
        {rooms.map((r) => (
          <button
            key={r.name}
            onClick={() => { setActiveRoom(r.name); setPopover(null); }}
            className={`flex-shrink-0 px-3.5 py-2 rounded-full text-[11px] font-bold border transition-all active:scale-95 ${
              activeRoom === r.name
                ? "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-200 dark:shadow-none"
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* ─── Timeline Grid ─── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Legend */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm bg-emerald-500/80" />
            <span className="text-[10px] font-semibold text-slate-400">Xác nhận</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm bg-amber-500/80" />
            <span className="text-[10px] font-semibold text-slate-400">Chờ duyệt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm bg-emerald-100 dark:bg-emerald-500/10 border border-dashed border-emerald-300 dark:border-emerald-500/30" />
            <span className="text-[10px] font-semibold text-slate-400">Trống</span>
          </div>
          {isToday && (
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="w-0.5 h-3 bg-red-500 rounded-full" />
              <span className="text-[10px] font-semibold text-red-400">Bây giờ</span>
            </div>
          )}
        </div>

        <div className="flex">
          {/* ─── Room Labels (Sticky Left) ─── */}
          <div
            className="flex-shrink-0 z-10 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700"
            style={{ width: 80 }}
          >
            {/* Header spacer */}
            <div className="h-8 border-b border-slate-100 dark:border-slate-700 flex items-center justify-center">
              <BedDouble size={12} className="text-slate-400" />
            </div>
            {/* Room labels */}
            {displayRooms.map((r) => (
              <div
                key={r.name}
                className="border-b border-slate-50 dark:border-slate-700/50 flex items-center px-2"
                style={{ height: ROW_HEIGHT }}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-white truncate leading-tight">
                    {r.name}
                  </p>
                  <p className="text-[9px] text-slate-400 truncate">{r.building}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ─── Scrollable Timeline ─── */}
          <div ref={scrollRef} className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="relative" style={{ width: 24 * HOUR_WIDTH }}>
              {/* Hour Headers */}
              <div className="flex h-8 border-b border-slate-100 dark:border-slate-700">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="flex-shrink-0 flex items-center justify-center border-r border-slate-50 dark:border-slate-700/30"
                    style={{ width: HOUR_WIDTH }}
                  >
                    <span className={`text-[10px] font-bold ${
                      h >= 6 && h <= 22 ? "text-slate-500 dark:text-slate-400" : "text-slate-300 dark:text-slate-600"
                    }`}>
                      {h.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Room Rows */}
              {displayRooms.map((room) => {
                const roomBookings = getBookingsForRoom(room.name);
                return (
                  <div
                    key={room.name}
                    className="relative border-b border-slate-50 dark:border-slate-700/50"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Hour grid lines */}
                    <div className="absolute inset-0 flex">
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          className={`flex-shrink-0 border-r ${
                            h % 6 === 0
                              ? "border-slate-100 dark:border-slate-700/50"
                              : "border-slate-50 dark:border-slate-700/20"
                          }`}
                          style={{ width: HOUR_WIDTH }}
                        />
                      ))}
                    </div>

                    {/* Booking Blocks */}
                    {roomBookings.map((b) => {
                      const style = statusStyle[b.status] || statusStyle.confirmed;
                      const left = b.startHour * HOUR_WIDTH;
                      const width = Math.max(b.duration * HOUR_WIDTH, 30);

                      return (
                        <button
                          key={b.id}
                          onClick={() => setPopover(popover?.id === b.id ? null : b)}
                          className={`absolute top-2 ${style.bg} ${style.border} ${style.text} border rounded-lg px-2 flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all shadow-sm overflow-hidden`}
                          style={{
                            left: `${left}px`,
                            width: `${width}px`,
                            height: ROW_HEIGHT - 16,
                            borderLeftWidth: b.startsBeforeDay ? 0 : undefined,
                            borderRightWidth: b.endsAfterDay ? 0 : undefined,
                            borderTopLeftRadius: b.startsBeforeDay ? 0 : undefined,
                            borderBottomLeftRadius: b.startsBeforeDay ? 0 : undefined,
                            borderTopRightRadius: b.endsAfterDay ? 0 : undefined,
                            borderBottomRightRadius: b.endsAfterDay ? 0 : undefined,
                          }}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              sourceColors[b.source] || "bg-white/50"
                            }`}
                          />
                          <span className="text-[10px] font-bold truncate">
                            {b.guestName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {/* ─── Now Indicator ─── */}
              {isToday && (
                <div
                  className="absolute top-0 bottom-0 z-20 pointer-events-none"
                  style={{ left: `${nowLeft}px` }}
                >
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full -translate-x-1/2 shadow-lg shadow-red-500/30" />
                  <div className="w-0.5 h-full bg-red-500/60 -translate-x-[0.5px]" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {displayRooms.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <BedDouble size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">Chưa có phòng nào</p>
          </div>
        )}
      </div>

      {/* ─── Booking Detail Popover ─── */}
      {popover && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-lg relative animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={() => setPopover(null)}
            className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${sourceColors[popover.source] || "bg-slate-400"}`} />
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">{popover.guestName}</h4>
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusStyle[popover.status]?.bg} ${statusStyle[popover.status]?.text}`}
            >
              {statusStyle[popover.status]?.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3 py-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Phòng</p>
              <p className="text-xs font-bold text-slate-700 dark:text-white">{popover.room}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3 py-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Nguồn</p>
              <p className="text-xs font-bold text-slate-700 dark:text-white">{popover.source}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3 py-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Check-in</p>
              <p className="text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1">
                <Clock size={10} /> {popover.checkIn}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3 py-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Check-out</p>
              <p className="text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1">
                <Clock size={10} /> {popover.checkOut}
              </p>
            </div>
          </div>

          <div className="mt-3 flex justify-between items-center">
            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
              {popover.amount}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              Mã đơn: {popover.id}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
