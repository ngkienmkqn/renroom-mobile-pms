"use client";

import { useState, useEffect } from "react";
import { 
  Home, Plus, Search, Pencil, Trash2, ChevronRight, 
  StickyNote, Wrench, Star, Banknote, Bell, X,
  CheckCircle2, Clock, AlertTriangle, Copy
} from "lucide-react";
import { Drawer } from "vaul";
import { toast } from "sonner";

// ─── Data Models ───────────────────────────────────────────
interface RoomNote {
  id: string;
  type: "general" | "maintenance" | "guest_feedback" | "financial" | "reminder";
  content: string;
  createdAt: string;
}

interface Room {
  id: string;
  name: string;
  building: string;
  contractPrice: number;
  defaultDailyPrice: number;
  status: "available" | "occupied" | "maintenance";
  notes: RoomNote[];
  // -- Leasing Info --
  bType?: "thue_dut" | "book_ho";
  ownerName?: string;
  ownerPhone?: string;
  contractMonths?: string;
  // -- Overhead Costs --
  electricityPrice?: number;
  waterPrice?: number;
  otherPrice?: number;
}

// ─── Config ────────────────────────────────────────────────
const statusConfig = {
  available: { label: "Trống", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle2 },
  occupied: { label: "Đang thuê", color: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500", icon: Clock },
  maintenance: { label: "Bảo trì", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", icon: AlertTriangle },
};

const noteTypeConfig = {
  general:        { label: "Ghi chú chung",  icon: StickyNote, bg: "bg-slate-100",   color: "text-slate-600" },
  maintenance:    { label: "Sửa chữa",       icon: Wrench,     bg: "bg-amber-50",    color: "text-amber-600" },
  guest_feedback: { label: "Phản hồi khách", icon: Star,       bg: "bg-sky-50",      color: "text-sky-600" },
  financial:      { label: "Tài chính",       icon: Banknote,   bg: "bg-emerald-50",  color: "text-emerald-600" },
  reminder:       { label: "Nhắc nhở",        icon: Bell,       bg: "bg-rose-50",     color: "text-rose-600" },
};

type NoteType = keyof typeof noteTypeConfig;

const formatVND = (val: number) =>
  new Intl.NumberFormat("vi-VN").format(val);

// ─── Component ─────────────────────────────────────────────
export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [detailRoom, setDetailRoom] = useState<Room | null>(null);

  // Add/Edit Room form
  const [formName, setFormName] = useState("");
  const [formBuilding, setFormBuilding] = useState("");
  const [formContractPrice, setFormContractPrice] = useState("");
  const [formDailyPrice, setFormDailyPrice] = useState("");
  const [formStatus, setFormStatus] = useState<Room["status"]>("available");
  const [formBType, setFormBType] = useState<"thue_dut" | "book_ho">("thue_dut");
  const [formOwnerName, setFormOwnerName] = useState("");
  const [formOwnerPhone, setFormOwnerPhone] = useState("");
  const [formContractMonths, setFormContractMonths] = useState("1 Tháng");
  
  const [formElectricity, setFormElectricity] = useState("");
  const [formWater, setFormWater] = useState("");
  const [formOtherCost, setFormOtherCost] = useState("");
  
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  // Add Note form
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("general");

  // ─── Load from KV ──────────
  useEffect(() => {
    fetch("/api/store?key=rooms")
      .then((r) => r.json())
      .then((d) => {
        if (d.data && Array.isArray(d.data)) setRooms(d.data);
      })
      .catch(console.error);
  }, []);

  const persistRooms = async (data: Room[]) => {
    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "rooms", data }),
      });
    } catch {
      toast.error("Lỗi đồng bộ dữ liệu");
    }
  };

  // ─── CRUD Handlers ──────────
  const resetForm = () => {
    setFormName("");
    setFormBuilding("");
    setFormContractPrice("");
    setFormDailyPrice("");
    setFormStatus("available");
    setFormBType("thue_dut");
    setFormOwnerName("");
    setFormOwnerPhone("");
    setFormContractMonths("1 Tháng");
    setFormElectricity("");
    setFormWater("");
    setFormOtherCost("");
    setEditingRoomId(null);
  };

  const handleSaveRoom = async () => {
    if (!formName.trim()) {
      toast.error("Vui lòng nhập tên phòng");
      return;
    }

    let newRooms: Room[];

    if (editingRoomId) {
      // Update existing
      newRooms = rooms.map((r) =>
        r.id === editingRoomId
          ? {
              ...r,
              name: formName.trim(),
              building: formBuilding.trim() || "Mặc định",
              contractPrice: Number(formContractPrice) || 0,
              defaultDailyPrice: Number(formDailyPrice) || 0,
              status: formStatus,
              bType: formBType,
              ownerName: formOwnerName.trim(),
              ownerPhone: formOwnerPhone.trim(),
              contractMonths: formContractMonths,
              electricityPrice: Number(formElectricity) || 0,
              waterPrice: Number(formWater) || 0,
              otherPrice: Number(formOtherCost) || 0,
            }
          : r
      );
      toast.success("Đã cập nhật phòng!");
    } else {
      // Create new
      const newRoom: Room = {
        id: `R${Date.now()}`,
        name: formName.trim(),
        building: formBuilding.trim() || "Mặc định",
        contractPrice: Number(formContractPrice) || 0,
        defaultDailyPrice: Number(formDailyPrice) || 0,
        status: formStatus,
        bType: formBType,
        ownerName: formOwnerName.trim(),
        ownerPhone: formOwnerPhone.trim(),
        contractMonths: formContractMonths,
        electricityPrice: Number(formElectricity) || 0,
        waterPrice: Number(formWater) || 0,
        otherPrice: Number(formOtherCost) || 0,
        notes: [],
      };
      newRooms = [newRoom, ...rooms];
      toast.success("Đã tạo phòng mới!");
    }

    setRooms(newRooms);
    await persistRooms(newRooms);
    resetForm();
    setIsAddOpen(false);
  };

  const handleDeleteRoom = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Xóa phòng này? Hành động không thể hoàn tác.")) return;
    const newRooms = rooms.filter((r) => r.id !== id);
    setRooms(newRooms);
    await persistRooms(newRooms);
    toast.success("Đã xóa phòng!");
  };

  const openEditDrawer = (room: Room, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRoomId(room.id);
    setFormName(room.name);
    setFormBuilding(room.building);
    setFormContractPrice(String(room.contractPrice));
    setFormDailyPrice(String(room.defaultDailyPrice));
    setFormStatus(room.status);
    setFormBType(room.bType || "thue_dut");
    setFormOwnerName(room.ownerName || "");
    setFormOwnerPhone(room.ownerPhone || "");
    setFormContractMonths(room.contractMonths || "1 Tháng");
    setFormElectricity(room.electricityPrice ? String(room.electricityPrice) : "");
    setFormWater(room.waterPrice ? String(room.waterPrice) : "");
    setFormOtherCost(room.otherPrice ? String(room.otherPrice) : "");
    setIsAddOpen(true);
  };

  // ─── Note Handlers ──────────
  const handleAddNote = async () => {
    if (!noteContent.trim() || !detailRoom) return;
    const note: RoomNote = {
      id: `N${Date.now()}`,
      type: noteType,
      content: noteContent.trim(),
      createdAt: new Date().toLocaleString("vi-VN"),
    };
    const updatedRooms = rooms.map((r) =>
      r.id === detailRoom.id ? { ...r, notes: [note, ...r.notes] } : r
    );
    setRooms(updatedRooms);
    setDetailRoom({ ...detailRoom, notes: [note, ...detailRoom.notes] });
    setNoteContent("");
    await persistRooms(updatedRooms);
    toast.success("Đã thêm ghi chú!");
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!detailRoom) return;
    const updatedNotes = detailRoom.notes.filter((n) => n.id !== noteId);
    const updatedRooms = rooms.map((r) =>
      r.id === detailRoom.id ? { ...r, notes: updatedNotes } : r
    );
    setRooms(updatedRooms);
    setDetailRoom({ ...detailRoom, notes: updatedNotes });
    await persistRooms(updatedRooms);
    toast.success("Đã xóa ghi chú");
  };

  // ─── Filtered list ──────────
  const filtered = rooms.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.building.toLowerCase().includes(q);
  });

  // ─── Summary stats ──────────
  const countByStatus = (s: Room["status"]) => rooms.filter((r) => r.status === s).length;

  return (
    <div className="flex flex-col min-h-full pb-24">
      {/* ─── Header ─── */}
      <header className="px-5 pt-14 pb-6 bg-gradient-to-br from-violet-700 via-violet-600 to-purple-800 dark:from-violet-900 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden transition-colors duration-300">
        <div className="absolute -top-14 -right-14 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Quản lý Phòng</h1>
            <p className="text-violet-200 text-xs mt-1">{rooms.length} phòng • {countByStatus("available")} trống</p>
          </div>
          <button
            onClick={() => { resetForm(); setIsAddOpen(true); }}
            className="w-10 h-10 bg-white/15 backdrop-blur-md rounded-xl flex justify-center items-center text-white border border-white/20 active:scale-95 transition-transform"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-300" />
          <input
            type="text"
            placeholder="Tìm phòng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl text-sm text-white placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </header>

      <main className="flex-1 px-5 pt-5">
        {/* ─── Summary Pills ─── */}
        <div className="flex gap-2 mb-5">
          <div className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{countByStatus("available")}</p>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Trống</p>
          </div>
          <div className="flex-1 bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-sky-700 dark:text-sky-400">{countByStatus("occupied")}</p>
            <p className="text-[10px] font-bold text-sky-500 uppercase tracking-wide">Đang thuê</p>
          </div>
          <div className="flex-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-amber-700 dark:text-amber-400">{countByStatus("maintenance")}</p>
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">Bảo trì</p>
          </div>
        </div>

        {/* ─── Room Cards ─── */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl mt-4">
              <Home size={40} className="mx-auto mb-3 opacity-30 text-violet-500" />
              <p className="text-sm font-semibold">Chưa có phòng nào</p>
              <p className="text-xs mt-1 text-slate-400">Bấm dấu (+) trên cùng để thêm phòng</p>
            </div>
          )}

          {filtered.map((room) => {
            const st = statusConfig[room.status];
            const StatusIcon = st.icon;
            return (
              <div
                key={room.id}
                onClick={() => setDetailRoom(room)}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                {/* Top */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">{room.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{room.building}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${st.color} flex items-center gap-1`}>
                    <StatusIcon size={11} />
                    {st.label}
                  </span>
                </div>

                {/* Pricing Row */}
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2.5 mb-3">
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hợp đồng/tháng</p>
                    <p className="text-sm font-black text-slate-800 dark:text-white">{formatVND(room.contractPrice)}₫</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-600" />
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Giá đêm (MĐ)</p>
                    <p className="text-sm font-black text-violet-600 dark:text-violet-400">{formatVND(room.defaultDailyPrice)}₫</p>
                  </div>
                </div>

                {/* Bottom */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                    <StickyNote size={13} />
                    <span>{room.notes.length} ghi chú</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => openEditDrawer(room, e)}
                      className="p-1.5 text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteRoom(room.id, e)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ════════════════════════════════════════
          ADD / EDIT ROOM DRAWER
         ════════════════════════════════════════ */}
      <Drawer.Root open={isAddOpen} onOpenChange={(o) => { if (!o) { resetForm(); setIsAddOpen(false); } }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-50 dark:bg-slate-900 flex flex-col rounded-t-[32px] max-h-[85vh] outline-none">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
            <div className="max-w-5xl w-full mx-auto flex flex-col px-6 pb-6 overflow-y-auto">
              <Drawer.Title className="font-extrabold text-xl text-slate-800 dark:text-white mb-1">
                {editingRoomId ? "Chỉnh sửa phòng" : "Thêm phòng mới"}
              </Drawer.Title>
              <p className="text-sm text-slate-500 mb-5">Nhập thông tin giá hợp đồng & giá cho khách HomeStay.</p>

              <div className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Tên phòng *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm font-semibold dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    placeholder="VD: P101, P202..."
                  />
                </div>

                {/* Building */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Khu / Tòa nhà</label>
                  <input
                    type="text"
                    value={formBuilding}
                    onChange={(e) => setFormBuilding(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    placeholder="Mặc định"
                  />
                </div>

                {/* Leasing Info (Merged from Tenants) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Thông tin Mặt bằng gốc</h3>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Mô hình đầu vào</label>
                    <select 
                      value={formBType}
                      onChange={(e) => setFormBType(e.target.value as "thue_dut" | "book_ho")}
                      className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-[13px] font-bold outline-none focus:ring-2 focus:ring-violet-500/30"
                    >
                      <option value="thue_dut">Phòng Thuê Khoán (Trả tiền cố định)</option>
                      <option value="book_ho">Phòng Ký Gửi (Bán hộ / Môi giới)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Chủ nhà / Người liên hệ</label>
                    <input 
                      type="text" 
                      value={formOwnerName}
                      onChange={(e) => setFormOwnerName(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" 
                      placeholder="VD: Chú Long" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Số điện thoại</label>
                      <input 
                        type="tel" 
                        value={formOwnerPhone}
                        onChange={(e) => setFormOwnerPhone(e.target.value)}
                        className="w-full px-3 py-3 bg-white dark:bg-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-sm focus:outline-none" 
                        placeholder="09xx..." 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Chu kỳ tiền nhà</label>
                      <select 
                        value={formContractMonths}
                        onChange={(e) => setFormContractMonths(e.target.value)}
                        className="w-full px-3 py-3 bg-white dark:bg-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-sm focus:outline-none"
                      >
                        <option>Ngày (Hoa hồng)</option>
                        <option>1 Tháng</option>
                        <option>6 Tháng</option>
                        <option>1 Năm</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Giá HĐ / tháng</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formContractPrice}
                        onChange={(e) => setFormContractPrice(e.target.value)}
                        className="w-full px-3 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm font-bold text-slate-700 dark:text-white focus:outline-none"
                        placeholder="5000000"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₫</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-violet-500 uppercase tracking-wider mb-2 block">Giá đêm (MĐ)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formDailyPrice}
                        onChange={(e) => setFormDailyPrice(e.target.value)}
                        className="w-full px-3 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-violet-100 dark:border-violet-500/30 shadow-sm text-sm font-bold text-violet-700 dark:text-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        placeholder="500000"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-violet-400">₫</span>
                    </div>
                  </div>
                </div>

                {/* Additional Operating Costs */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Chi phí Vận hành Khác / Tháng</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tiền Điện</label>
                      <input type="number" value={formElectricity} onChange={(e) => setFormElectricity(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none" placeholder="VD: 500000" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tiền Nước</label>
                      <input type="number" value={formWater} onChange={(e) => setFormWater(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none" placeholder="VD: 100000" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Các loại Phí khác (Dịch vụ, Net, Rác...)</label>
                    <input type="number" value={formOtherCost} onChange={(e) => setFormOtherCost(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none" placeholder="Tổng phần còn lại" />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Trạng thái</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Room["status"])}
                    className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm dark:text-white focus:outline-none"
                  >
                    <option value="available">Trống</option>
                    <option value="occupied">Đang thuê</option>
                    <option value="maintenance">Bảo trì</option>
                  </select>
                </div>

                <button
                  onClick={handleSaveRoom}
                  className="w-full mt-2 bg-violet-600 text-white font-bold py-4 rounded-2xl flex justify-center items-center shadow-lg shadow-violet-200 dark:shadow-none active:scale-[0.98] transition-transform"
                >
                  {editingRoomId ? "Cập nhật phòng" : "Tạo phòng mới"}
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* ════════════════════════════════════════
          ROOM DETAIL + NOTES DRAWER
         ════════════════════════════════════════ */}
      <Drawer.Root open={!!detailRoom} onOpenChange={(o) => { if (!o) setDetailRoom(null); }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-50 dark:bg-slate-900 flex flex-col rounded-t-[32px] max-h-[90vh] outline-none">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 my-4" />
            {detailRoom && (
              <div className="max-w-5xl w-full mx-auto flex flex-col px-6 pb-6 overflow-y-auto flex-1">
                {/* Room Info Header */}
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <Drawer.Title className="font-extrabold text-xl text-slate-800 dark:text-white">{detailRoom.name}</Drawer.Title>
                    <p className="text-sm text-slate-500 mt-1 mb-4">{detailRoom.building} • {statusConfig[detailRoom.status].label}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Close detail drawer before opening edit drawer to prevent stacking
                      setDetailRoom(null);
                      setTimeout(() => openEditDrawer(detailRoom, e), 300);
                    }}
                    className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 rounded-xl transition-colors shrink-0"
                  >
                    <Pencil size={18} />
                  </button>
                </div>

                {/* Pricing Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 mb-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Hợp đồng / tháng</p>
                      <p className="text-lg font-black text-slate-800 dark:text-white">{formatVND(detailRoom.contractPrice)}₫</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-violet-500 font-bold uppercase">Giá đêm mặc định</p>
                      <p className="text-lg font-black text-violet-600 dark:text-violet-400">{formatVND(detailRoom.defaultDailyPrice)}₫</p>
                    </div>
                  </div>
                </div>

                {/* ─── Add Note Section ─── */}
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">Thêm ghi chú</h3>
                
                {/* Note Type Selector */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide mb-3">
                  {(Object.keys(noteTypeConfig) as NoteType[]).map((t) => {
                    const cfg = noteTypeConfig[t];
                    const NoteIcon = cfg.icon;
                    return (
                      <button
                        key={t}
                        onClick={() => setNoteType(t)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-bold border transition-all active:scale-95 ${
                          noteType === t
                            ? `${cfg.bg} ${cfg.color} border-current shadow-sm`
                            : "bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700"
                        }`}
                      >
                        <NoteIcon size={12} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>

                {/* Note Input */}
                <div className="flex gap-2 mb-5">
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={2}
                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    placeholder="Nội dung ghi chú..."
                  />
                  <button
                    onClick={handleAddNote}
                    className="w-12 h-12 bg-violet-600 text-white rounded-2xl flex justify-center items-center shadow-lg shadow-violet-200 dark:shadow-none active:scale-95 transition-transform self-end"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* ─── Notes List ─── */}
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  Lịch sử ghi chú ({detailRoom.notes.length})
                </h3>
                <div className="flex flex-col gap-2">
                  {detailRoom.notes.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">Chưa có ghi chú nào cho phòng này</p>
                  )}
                  {detailRoom.notes.map((note) => {
                    const cfg = noteTypeConfig[note.type];
                    const NoteIcon = cfg.icon;
                    return (
                      <div key={note.id} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700 flex gap-3 items-start">
                        <div className={`w-8 h-8 ${cfg.bg} ${cfg.color} rounded-lg flex justify-center items-center shrink-0 mt-0.5`}>
                          <NoteIcon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{cfg.label} • {note.createdAt}</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{note.content}</p>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(note.content);
                              toast.success("Đã sao chép nội dung!");
                            }}
                            className="p-1 text-slate-300 hover:text-violet-500 transition-colors"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
