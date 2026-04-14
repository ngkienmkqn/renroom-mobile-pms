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
const HOUR_WIDTH = 120; // px per hour column — BIGGER
const ROW_HEIGHT = 100; // px per room row — MUCH TALLER
const LABEL_WIDTH = 90; // px for room label column

const statusStyle: Record<
  string,
  { bg: string; gradient: string; border: string; text: string; label: string; icon: typeof CheckCircle2 }
> = {
  confirmed: {
    bg: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-600",
    border: "border-emerald-300",
    text: "text-white",
    label: "Đã xác nhận",
    icon: CheckCircle2,
  },
  pending: {
    bg: "bg-amber-500",
    gradient: "from-amber-500 to-orange-600",
    border: "border-amber-300",
    text: "text-white",
    label: "Chờ duyệt",
    icon: AlertTriangle,
  },
  cancelled: {
    bg: "bg-red-500/40",
    gradient: "from-red-400/50 to-red-500/50",
    border: "border-red-300/50",
    text: "text-white/60",
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

  // ISO / datetime-local: "2026-04-14T14:00"
  if (dateStr.includes("T") || dateStr.includes("-")) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  }

  // "HH:mm (DD/MM)" from formatFriendlyDate
  const friendlyMatch = dateStr.match(
    /(\d{1,2}):(\d{2})\s*\((\d{1,2})\/(\d{1,2})\)/
  );
  if (friendlyMatch) {
    const [, h, m, day, month] = friendlyMatch;
    return new Date(referenceDate.getFullYear(), Number(month) - 1, Number(day), Number(h), Number(m));
  }

  // "DD/MM/YYYY"
  const slashMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  // "DD/MM"
  const shortMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (shortMatch) {
    const [, day, month] = shortMatch;
    return new Date(referenceDate.getFullYear(), Number(month) - 1, Number(day));
  }

  return null;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateVN(d: Date): string {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return `${days[d.getDay()]}, ${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
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

  // Auto-scroll to current hour
  useEffect(() => {
    if (scrollRef.current) {
      if (isToday) {
        const now = new Date();
        const scrollTo = Math.max(0, (now.getHours() - 1) * HOUR_WIDTH);
        scrollRef.current.scrollLeft = scrollTo;
      } else {
        scrollRef.current.scrollLeft = 7 * HOUR_WIDTH; // Start at 7 AM for other days
      }
    }
  }, [isToday, selectedDate]);

  const goDay = (offset: number) => {
    setSelectedDate((prev: Date) => {
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

  const displayRooms = activeRoom === "all" ? rooms : rooms.filter((r) => r.name === activeRoom);

  const getBookingsForRoom = (roomName: string) => {
    return bookings
      .filter((b) => {
        if (b.room !== roomName) return false;
        if (b.status === "cancelled") return false;

        const checkIn = parseBookingDate(b.checkIn, selectedDate);
        const checkOut = parseBookingDate(b.checkOut, selectedDate);
        if (!checkIn || !checkOut) return false;

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

  // Now line
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const nowLeft = nowHour * HOUR_WIDTH;

  // Total bookings today per room
  const getRoomBookingCount = (roomName: string) => getBookingsForRoom(roomName).length;

  return (
    <div className="flex flex-col gap-2 -mx-5">
      {/* ─── Date Navigation ─── */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={() => goDay(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 active:scale-90 transition-transform shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-indigo-500" />
          <button onClick={goToday} className="text-sm font-extrabold text-slate-800 dark:text-white">
            {isToday ? "Hôm nay" : formatDateVN(selectedDate)}
          </button>
          {!isToday && (
            <button
              onClick={goToday}
              className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20"
            >
              Về hôm nay
            </button>
          )}
        </div>

        <button
          onClick={() => goDay(1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 active:scale-90 transition-transform shadow-sm"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* ─── Room Filter ─── */}
      <div className="flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
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
        {rooms.map((r) => {
          const count = getRoomBookingCount(r.name);
          return (
          <button
            key={r.name}
            onClick={() => { setActiveRoom(r.name); setPopover(null); }}
            className={`flex-shrink-0 px-3.5 py-2 rounded-full text-[11px] font-bold border transition-all active:scale-95 ${
              activeRoom === r.name
                ? "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-200 dark:shadow-none"
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
            }`}
          >
            {r.name} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
          </button>
          );
        })}
      </div>

      {/* ─── FULL-WIDTH Timeline Grid ─── */}
      <div className="bg-white dark:bg-slate-800 border-t border-b border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Legend bar */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded bg-gradient-to-r from-emerald-500 to-teal-600" />
            <span className="text-[10px] font-bold text-slate-500">Xác nhận</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded bg-gradient-to-r from-amber-500 to-orange-600" />
            <span className="text-[10px] font-bold text-slate-500">Chờ duyệt</span>
          </div>
          {isToday && (
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="w-0.5 h-4 bg-red-500 rounded-full" />
              <span className="text-[10px] font-bold text-red-500">{now.getHours()}:{now.getMinutes().toString().padStart(2, '0')}</span>
            </div>
          )}
        </div>

        <div className="flex">
          {/* ─── Sticky Room Labels ─── */}
          <div
            className="flex-shrink-0 z-10 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700"
            style={{ width: LABEL_WIDTH }}
          >
            {/* Header spacer */}
            <div className="h-10 border-b border-slate-100 dark:border-slate-700 flex items-center justify-center">
              <BedDouble size={14} className="text-slate-400" />
            </div>
            {/* Room labels */}
            {displayRooms.map((r) => {
              const count = getRoomBookingCount(r.name);
              return (
              <div
                key={r.name}
                className="border-b border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center px-2 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-800"
                style={{ height: ROW_HEIGHT }}
              >
                <p className="text-[12px] font-extrabold text-slate-800 dark:text-white text-center leading-tight">
                  {r.name}
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">{r.building}</p>
                {count > 0 ? (
                  <span className="mt-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {count} booking
                  </span>
                ) : (
                  <span className="mt-1 text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">
                    Trống
                  </span>
                )}
              </div>
              );
            })}
          </div>

          {/* ─── Scrollable Timeline ─── */}
          <div ref={scrollRef} className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="relative" style={{ width: 24 * HOUR_WIDTH }}>
              {/* Hour Headers */}
              <div className="flex h-10 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                {HOURS.map((h) => {
                  const isPeak = h >= 8 && h <= 22;
                  return (
                    <div
                      key={h}
                      className={`flex-shrink-0 flex items-center justify-center border-r ${
                        h % 6 === 0
                          ? "border-slate-200 dark:border-slate-600"
                          : "border-slate-100 dark:border-slate-700/30"
                      }`}
                      style={{ width: HOUR_WIDTH }}
                    >
                      <span className={`text-[11px] font-bold ${
                        isPeak ? "text-slate-700 dark:text-slate-300" : "text-slate-300 dark:text-slate-600"
                      }`}>
                        {h.toString().padStart(2, "0")}:00
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Room Rows */}
              {displayRooms.map((room) => {
                const roomBookings = getBookingsForRoom(room.name);
                return (
                  <div
                    key={room.name}
                    className="relative border-b border-slate-100 dark:border-slate-700/50"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Hour grid lines + alternating shading */}
                    <div className="absolute inset-0 flex">
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          className={`flex-shrink-0 border-r ${
                            h % 6 === 0
                              ? "border-slate-200 dark:border-slate-600/50"
                              : "border-slate-50 dark:border-slate-700/15"
                          } ${h >= 22 || h < 6 ? "bg-slate-50/80 dark:bg-slate-900/30" : ""}`}
                          style={{ width: HOUR_WIDTH }}
                        />
                      ))}
                    </div>

                    {/* Booking Blocks — BIG, eye-catching */}
                    {roomBookings.map((b) => {
                      const style = statusStyle[b.status] || statusStyle.confirmed;
                      const left = b.startHour * HOUR_WIDTH;
                      const width = Math.max(b.duration * HOUR_WIDTH, 50);
                      const blockHeight = ROW_HEIGHT - 20;

                      return (
                        <button
                          key={b.id}
                          onClick={() => setPopover(popover?.id === b.id ? null : b)}
                          className={`absolute bg-gradient-to-r ${style.gradient} ${style.text} rounded-xl px-3 flex flex-col justify-center cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all shadow-md overflow-hidden group`}
                          style={{
                            left: `${left}px`,
                            width: `${width}px`,
                            top: 10,
                            height: blockHeight,
                            borderLeftWidth: b.startsBeforeDay ? 0 : undefined,
                            borderRightWidth: b.endsAfterDay ? 0 : undefined,
                            borderRadius: `${b.startsBeforeDay ? '0' : '12px'} ${b.endsAfterDay ? '0' : '12px'} ${b.endsAfterDay ? '0' : '12px'} ${b.startsBeforeDay ? '0' : '12px'}`,
                          }}
                        >
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          <div className="relative z-10 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sourceColors[b.source] || "bg-white/40"}`} />
                              <span className="text-[12px] font-extrabold truncate drop-shadow-sm">
                                {b.guestName}
                              </span>
                            </div>
                            {width > 100 && (
                              <p className="text-[10px] font-medium opacity-80 truncate">
                                {Math.floor(b.startHour)}:{String(Math.round((b.startHour % 1) * 60)).padStart(2, '0')} — {Math.floor(b.startHour + b.duration)}:{String(Math.round(((b.startHour + b.duration) % 1) * 60)).padStart(2, '0')}
                              </p>
                            )}
                          </div>
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
                  <div className="w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 shadow-lg shadow-red-500/40 ring-2 ring-red-500/20" />
                  <div className="w-0.5 h-full bg-red-500/50 -translate-x-[0.5px]" style={{ background: 'linear-gradient(180deg, rgba(239,68,68,0.7) 0%, rgba(239,68,68,0.1) 100%)' }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {displayRooms.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <BedDouble size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold">Chưa có phòng nào</p>
          </div>
        )}
      </div>

      {/* ─── Popover ─── */}
      {popover && (
        <div className="mx-4 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xl relative">
          <button
            onClick={() => setPopover(null)}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2.5 h-2.5 rounded-full ${sourceColors[popover.source] || "bg-slate-400"}`} />
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">{popover.guestName}</h4>
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${statusStyle[popover.status]?.gradient} ${statusStyle[popover.status]?.text}`}
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
              <p className="text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1">
                <Clock size={10} /> {popover.checkIn}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3 py-2.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Check-out</p>
              <p className="text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1">
                <Clock size={10} /> {popover.checkOut}
              </p>
            </div>
          </div>

          <div className="mt-3 flex justify-between items-center">
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {popover.amount}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              Mã: {popover.id}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
