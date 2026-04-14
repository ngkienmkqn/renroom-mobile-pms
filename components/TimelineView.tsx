"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  Plus,
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
  onCreateBooking?: (room: string, checkIn: string, checkOut: string) => void;
}

// ─── Constants ────────────────────────────────────────
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const ROW_HEIGHT = 65; // Smaller rows
const LABEL_WIDTH = 75; // Smaller labels width
const SNAP_MINUTES = 30; // Snap to 30-min intervals

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
  if (dateStr.includes("T") || dateStr.includes("-")) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  }
  const friendlyMatch = dateStr.match(
    /(\d{1,2}):(\d{2})\s*\((\d{1,2})\/(\d{1,2})\)/
  );
  if (friendlyMatch) {
    const [, h, m, day, month] = friendlyMatch;
    return new Date(referenceDate.getFullYear(), Number(month) - 1, Number(day), Number(h), Number(m));
  }
  const slashMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
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

function snapHour(hour: number): number {
  const intervals = 60 / SNAP_MINUTES;
  return Math.round(hour * intervals) / intervals;
}

function formatHourMin(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h % 1) * 60);
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

// ─── Drag State ───────────────────────────────────────
interface DragState {
  roomName: string;
  startHour: number;
  endHour: number;
  isDragging: boolean;
}

// ─── Component ────────────────────────────────────────
export default function TimelineView({ bookings, rooms, onCreateBooking }: TimelineViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [activeRoom, setActiveRoom] = useState<string>("all");
  const [hourWidth, setHourWidth] = useState(80); // Zoom state
  const [popover, setPopover] = useState<Booking | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isToday = isSameDay(selectedDate, today);

  useEffect(() => {
    if (scrollRef.current) {
      if (isToday) {
        const now = new Date();
        const scrollTo = Math.max(0, (now.getHours() - 1) * hourWidth);
        scrollRef.current.scrollLeft = scrollTo;
      } else {
        scrollRef.current.scrollLeft = 7 * hourWidth;
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
    setDrag(null);
  };

  const goToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
    setPopover(null);
  };

  const displayRooms = activeRoom === "all" ? rooms : rooms.filter((r) => r.name === activeRoom);

  const getBookingsForRoom = useCallback((roomName: string) => {
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
  }, [bookings, selectedDate]);

  // ─── Drag-to-Create Handlers ────────────────────────
  const getHourFromX = useCallback((clientX: number, rowElement: HTMLElement): number => {
    const rect = rowElement.getBoundingClientRect();
    const x = clientX - rect.left + (scrollRef.current?.scrollLeft || 0);
    const hour = Math.max(0, Math.min(24, x / hourWidth));
    return snapHour(hour);
  }, []);

  const handleDragStart = useCallback((roomName: string, clientX: number, rowElement: HTMLElement) => {
    const hour = getHourFromX(clientX, rowElement);
    setDrag({
      roomName,
      startHour: hour,
      endHour: hour + 0.5, // Minimum 30 min
      isDragging: true,
    });
    setPopover(null);
  }, [getHourFromX]);

  const handleDragMove = useCallback((clientX: number, rowElement: HTMLElement) => {
    if (!drag?.isDragging) return;
    const hour = getHourFromX(clientX, rowElement);
    setDrag((prev) => prev ? { ...prev, endHour: hour } : null);
  }, [drag?.isDragging, getHourFromX]);

  const handleDragEnd = useCallback(() => {
    if (!drag?.isDragging) return;

    const start = Math.min(drag.startHour, drag.endHour);
    const end = Math.max(drag.startHour, drag.endHour);

    if (end - start < 0.5) {
      setDrag(null);
      return;
    }

    // Keep selection visible (don't setDrag(null) yet)
    setDrag((prev) => prev ? { ...prev, isDragging: false } : null);
  }, [drag]);

  const handleConfirmDrag = useCallback(() => {
    if (!drag || !onCreateBooking) return;

    const start = Math.min(drag.startHour, drag.endHour);
    const end = Math.max(drag.startHour, drag.endHour);

    const checkInDate = new Date(selectedDate);
    checkInDate.setHours(Math.floor(start), Math.round((start % 1) * 60), 0, 0);

    const checkOutDate = new Date(selectedDate);
    checkOutDate.setHours(Math.floor(end), Math.round((end % 1) * 60), 0, 0);

    // Format as datetime-local value: "YYYY-MM-DDTHH:MM"
    const pad = (n: number) => n.toString().padStart(2, "0");
    const formatDTL = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    onCreateBooking(drag.roomName, formatDTL(checkInDate), formatDTL(checkOutDate));
    setDrag(null);
  }, [drag, onCreateBooking, selectedDate]);

  const handleCancelDrag = useCallback(() => {
    setDrag(null);
  }, []);

  // ─── Touch/Mouse event handlers for room rows ───────
  const handleRowPointerDown = useCallback((roomName: string, e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore if clicking on a booking block (button)
    if ((e.target as HTMLElement).closest("button")) return;

    const rowEl = e.currentTarget;

    // For touch: use a long-press (300ms) to start dragging to avoid conflicting with scroll
    if (e.pointerType === "touch") {
      dragTimeoutRef.current = setTimeout(() => {
        handleDragStart(roomName, e.clientX, rowEl);
        // Prevent scrolling during drag
        rowEl.setPointerCapture(e.pointerId);
      }, 300);
    } else {
      handleDragStart(roomName, e.clientX, rowEl);
    }
  }, [handleDragStart]);

  const handleRowPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragTimeoutRef.current) {
      // If finger moved too much before long-press, cancel
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
    if (!drag?.isDragging) return;
    e.preventDefault();
    handleDragMove(e.clientX, e.currentTarget);
  }, [drag?.isDragging, handleDragMove]);

  const handleRowPointerUp = useCallback(() => {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
    if (drag?.isDragging) {
      handleDragEnd();
    }
  }, [drag?.isDragging, handleDragEnd]);

  // Now line
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const nowLeft = nowHour * hourWidth;

  const getRoomBookingCount = (roomName: string) => getBookingsForRoom(roomName).length;

  // Computed drag selection
  const dragSelection = drag
    ? {
        left: Math.min(drag.startHour, drag.endHour) * hourWidth,
        width: Math.abs(drag.endHour - drag.startHour) * hourWidth,
        startTime: formatHourMin(Math.min(drag.startHour, drag.endHour)),
        endTime: formatHourMin(Math.max(drag.startHour, drag.endHour)),
      }
    : null;

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
          onClick={() => { setActiveRoom("all"); setPopover(null); setDrag(null); }}
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
            onClick={() => { setActiveRoom(r.name); setPopover(null); setDrag(null); }}
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

      {/* ─── Drag hint ─── */}
      {!drag && onCreateBooking && (
        <p className="text-[10px] text-slate-400 text-center font-medium px-4">
          💡 Nhấn giữ + kéo trên timeline để tạo booking nhanh
        </p>
      )}

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
          <div className="flex items-center gap-3 ml-auto">
            {isToday && (
              <div className="flex items-center gap-1.5">
                <div className="w-0.5 h-4 bg-red-500 rounded-full" />
                <span className="text-[10px] font-bold text-red-500">{now.getHours()}:{now.getMinutes().toString().padStart(2, '0')}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Zoom</span>
              <input 
                type="range" 
                min="40" 
                max="150" 
                value={hourWidth} 
                onChange={(e) => setHourWidth(Number(e.target.value))} 
                className="w-16 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
              />
            </div>
          </div>
        </div>

        <div className="flex">
          {/* ─── Sticky Room Labels ─── */}
          <div
            className="flex-shrink-0 z-10 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700"
            style={{ width: LABEL_WIDTH }}
          >
            <div className="h-10 border-b border-slate-100 dark:border-slate-700 flex items-center justify-center">
              <BedDouble size={14} className="text-slate-400" />
            </div>
            {displayRooms.map((r) => {
              const count = getRoomBookingCount(r.name);
              return (
              <div
                key={r.name}
                className="border-b border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center px-2 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-800"
                style={{ height: ROW_HEIGHT }}
              >
                <p className="text-[11px] font-extrabold text-slate-800 dark:text-white text-center leading-tight truncate w-full px-1">
                  {r.name}
                </p>
                {count > 0 && (
                  <span className="mt-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {count}
                  </span>
                )}
              </div>
              );
            })}
          </div>

          {/* ─── Scrollable Timeline ─── */}
          <div ref={scrollRef} className="flex-1 overflow-x-auto scrollbar-hide" style={{ touchAction: drag?.isDragging ? "none" : "auto" }}>
            <div className="relative" style={{ width: 24 * hourWidth }}>
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
                      style={{ width: hourWidth }}
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
                const isThisRoomDragging = drag?.roomName === room.name;
                return (
                  <div
                    key={room.name}
                    className={`relative border-b border-slate-100 dark:border-slate-700/50 ${
                      onCreateBooking ? "cursor-crosshair" : ""
                    }`}
                    style={{ height: ROW_HEIGHT }}
                    onPointerDown={onCreateBooking ? (e) => handleRowPointerDown(room.name, e) : undefined}
                    onPointerMove={onCreateBooking ? handleRowPointerMove : undefined}
                    onPointerUp={onCreateBooking ? handleRowPointerUp : undefined}
                    onPointerCancel={onCreateBooking ? handleRowPointerUp : undefined}
                  >
                    {/* Hour grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          className={`flex-shrink-0 border-r ${
                            h % 6 === 0
                              ? "border-slate-200 dark:border-slate-600/50"
                              : "border-slate-50 dark:border-slate-700/15"
                          } ${h >= 22 || h < 6 ? "bg-slate-50/80 dark:bg-slate-900/30" : ""}`}
                          style={{ width: hourWidth }}
                        />
                      ))}
                    </div>

                    {/* ─── Drag Selection Indicator ─── */}
                    {isThisRoomDragging && dragSelection && dragSelection.width > 0 && (
                      <div
                        className="absolute z-30 rounded-xl border-2 border-dashed border-indigo-500 bg-indigo-500/15 flex items-center justify-center transition-[width,left] duration-75"
                        style={{
                          left: `${dragSelection.left}px`,
                          width: `${dragSelection.width}px`,
                          top: 6,
                          height: ROW_HEIGHT - 12,
                        }}
                      >
                        <div className="bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap">
                          {dragSelection.startTime} → {dragSelection.endTime}
                        </div>
                      </div>
                    )}

                    {/* Booking Blocks */}
                    {roomBookings.map((b) => {
                      const style = statusStyle[b.status] || statusStyle.confirmed;
                      const left = b.startHour * hourWidth;
                      const width = Math.max(b.duration * hourWidth, 50);
                      const blockHeight = ROW_HEIGHT - 20;

                      return (
                        <button
                          key={b.id}
                          onClick={(e) => { e.stopPropagation(); setPopover(popover?.id === b.id ? null : b); }}
                          className={`absolute bg-gradient-to-r ${style.gradient} ${style.text} rounded-xl px-3 flex flex-col justify-center cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all shadow-md overflow-hidden group z-10`}
                          style={{
                            left: `${left}px`,
                            width: `${width}px`,
                            top: 10,
                            height: blockHeight,
                            borderRadius: `${b.startsBeforeDay ? '0' : '12px'} ${b.endsAfterDay ? '0' : '12px'} ${b.endsAfterDay ? '0' : '12px'} ${b.startsBeforeDay ? '0' : '12px'}`,
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative z-10 min-w-0 flex items-center justify-between h-full px-1">
                            <div className="flex items-center gap-1.5 truncate">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sourceColors[b.source] || "bg-white/40"}`} />
                              <span className="text-[11px] font-extrabold truncate drop-shadow-sm leading-none">
                                {b.guestName}
                              </span>
                            </div>
                            {width > 80 && hourWidth > 60 && (
                              <span className="text-[9px] font-bold opacity-80 whitespace-nowrap ml-2">
                                {Math.round(b.duration * 10) / 10}h
                              </span>
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

      {/* ─── Drag Confirmation Bar ─── */}
      {drag && !drag.isDragging && onCreateBooking && (
        <div className="mx-4 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="bg-indigo-600 rounded-2xl p-4 shadow-xl shadow-indigo-500/30 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white font-extrabold text-sm">{drag.roomName}</p>
              <p className="text-indigo-200 text-xs mt-0.5">
                {dragSelection?.startTime} → {dragSelection?.endTime} • {formatDateVN(selectedDate)}
              </p>
            </div>
            <button
              onClick={handleConfirmDrag}
              className="bg-white text-indigo-700 px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 active:scale-95 transition-transform shadow-lg"
            >
              <Plus size={14} /> Đặt phòng
            </button>
            <button
              onClick={handleCancelDrag}
              className="p-2 text-white/50 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Popover ─── */}
      {popover && !drag && (
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
