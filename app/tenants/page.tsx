"use client";

import { useState, useEffect } from "react";
import { Users, Search, Phone, Mail, MoreHorizontal, Home, Calendar, ChevronRight, UserPlus, Trash2 } from "lucide-react";
import { Drawer } from "vaul";
import { toast } from "sonner";

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

const statusConfig = {
  active: { label: "Đang thuê", dot: "bg-emerald-500" },
  expiring: { label: "Sắp hết hạn", dot: "bg-amber-500" },
  overdue: { label: "Quá hạn thanh toán", dot: "bg-red-500" },
};

const avatarColors = ["bg-violet-500", "bg-sky-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500"];

export default function TenantsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [bType, setBType] = useState<"thue_dut" | "book_ho">("thue_dut");
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [room, setRoom] = useState("");
  const [months, setMonths] = useState("6 Tháng");
  const [rent, setRent] = useState("");

  useEffect(() => {
    fetch('/api/store?key=tenants')
      .then(r => r.json())
      .then(d => {
        if (d.data && Array.isArray(d.data)) setTenants(d.data);
      })
      .catch(err => console.error(err));
  }, []);

  const formatCurrency = (val: string) => {
    if (!val) return "0₫";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(val));
  };

  const handleCreateTenant = async () => {
    if (!name) {
      toast.error("Vui lòng nhập tên khách thuê");
      return;
    }
    const newTenant: Tenant = {
      id: `T${Math.floor(Math.random() * 1000)}`,
      name,
      room,
      phone,
      email: "khachmoi@email.com",
      startDate: new Date().toLocaleDateString('vi-VN'),
      contractMonths: parseInt(months.split(" ")[0]) || 1,
      monthlyRent: formatCurrency(rent),
      status: "active",
      avatar: name.charAt(0).toUpperCase()
    };
    
    const newArr = [newTenant, ...tenants];
    setTenants(newArr);
    
    // Reset & Close
    setName("");
    setPhone("");
    setRent("");
    setIsDrawerOpen(false);

    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'tenants', data: newArr })
      });
      toast.success("Thành công!", { description: bType === 'thue_dut' ? "Dữ liệu hợp thuê đứt đã đẩy lên KV." : "Đã đồng bộ giao dịch lên KV." });
    } catch {
      toast.error("Lỗi đồng bộ", { description: "Lưu ngoại tuyến." });
    }
  };

  const handleDeleteTenant = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa khách thuê này? Hành động này không thể hoàn tác.")) return;

    const newArr = tenants.filter(t => t.id !== id);
    setTenants(newArr);

    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'tenants', data: newArr })
      });
      toast.success("Đã xóa hồ sơ khách thuê!");
    } catch {
      toast.error("Lỗi khi xóa trên máy chủ");
    }
  };

  const filtered = tenants.filter((t) => {
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
            <p className="text-teal-100 text-xs mt-1">{tenants.length} khách đang thuê định kỳ</p>
          </div>
          <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <Drawer.Trigger asChild>
              <button className="w-10 h-10 bg-white/15 backdrop-blur-md rounded-xl flex justify-center items-center text-white border border-white/20 active:scale-95 transition-transform">
                <UserPlus size={20} strokeWidth={2.5} />
              </button>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm" />
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-50 flex flex-col rounded-t-[32px] h-[95vh] outline-none">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 my-4" />
                <div className="max-w-md w-full mx-auto flex flex-col overflow-auto px-6 pb-6 h-full">
                  <Drawer.Title className="font-extrabold text-xl text-slate-800 mb-1">Thêm khách thuê / Quản lý</Drawer.Title>
                  <p className="text-[13px] text-slate-500 mb-5 leading-relaxed">Khai báo thông tin hợp đồng. Các cơ sở thuê đứt tự vận hành sẽ tính phụ phí điện nước tự động.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Kiểu tòa nhà quản lý</label>
                      <select 
                        value={bType}
                        onChange={(e) => setBType(e.target.value as "thue_dut" | "book_ho")}
                        className="w-full px-4 py-3.5 bg-white rounded-2xl border border-teal-500 shadow-sm text-[13px] font-bold text-teal-700 outline-none focus:ring-2 focus:ring-teal-500/30"
                      >
                        <option value="thue_dut">Căn thuê đứt (Thu full tiền, quản lý Điện/Nước)</option>
                        <option value="book_ho">Căn book hộ (Chỉ thu % hoặc tiền hoa hồng)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Họ và tên khách</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" 
                        placeholder="VD: Trần Thị B" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Số điện thoại</label>
                        <input 
                          type="tel" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm focus:outline-none" 
                          placeholder="09xx..." 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Kỳ hạn Hợp đồng</label>
                        <select 
                          value={months}
                          onChange={(e) => setMonths(e.target.value)}
                          className="w-full px-3 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm focus:outline-none"
                        >
                          <option>Ngày (Môi giới)</option>
                          <option>1 Tháng</option>
                          <option>6 Tháng</option>
                          <option>1 Năm</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Phòng</label>
                      <input 
                          type="text"
                          list="tenants-rooms-list"
                          value={room}
                          onChange={(e) => setRoom(e.target.value)}
                          className="w-full px-4 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm font-bold text-slate-700 focus:outline-none"
                          placeholder="Gõ tên phòng..."
                      />
                      <datalist id="tenants-rooms-list">
                          {Array.from(new Set(tenants.map(t => t.room))).map((r, i) => (
                            <option key={i} value={r} />
                          ))}
                      </datalist>
                    </div>

                    {bType === "thue_dut" && (
                      <div className="grid grid-cols-2 gap-3 mt-2 bg-slate-100/50 p-3 rounded-2xl border border-slate-100">
                        <div className="col-span-2 mb-1">
                          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Chỉ số tiện ích đầu kỳ</p>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 mb-1.5 block">Số Điện (kWh)</label>
                          <input type="number" className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-sm font-semibold text-slate-700 focus:outline-none" placeholder="135" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 mb-1.5 block">Số Nước (m³)</label>
                          <input type="number" className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-sm font-semibold text-slate-700 focus:outline-none" placeholder="25" />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2 block">
                        {bType === "thue_dut" ? "Giá thuê tháng (VNĐ)" : "Số tiền nhận / Hoa hồng (VNĐ)"}
                      </label>
                      <input 
                        type="number" 
                        value={rent}
                        onChange={(e) => setRent(e.target.value)}
                        className="w-full px-4 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm font-bold text-slate-800 placeholder:font-normal focus:outline-none" 
                        placeholder="Ví dụ: 3000000" 
                      />
                    </div>

                    <button 
                      onClick={handleCreateTenant}
                      className="w-full mt-4 bg-teal-600 text-white font-bold py-4 rounded-2xl flex justify-center items-center shadow-lg shadow-teal-200 active:scale-[0.98] transition-transform"
                    >
                      Lưu hồ sơ khách mới
                    </button>
                  </div>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        </div>

        {/* Search */}
        <div className="relative mt-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-200" />
          <input
            type="text"
            placeholder="Tìm theo tên khách, phòng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl text-sm text-white placeholder-teal-200 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </header>

      <main className="flex-1 px-5 pt-5">
        {/* Summary Pills */}
        <div className="flex gap-2 mb-5">
          <div className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{tenants.filter(t => t.status === "active").length}</p>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Đang thuê</p>
          </div>
          <div className="flex-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-amber-700 dark:text-amber-400">{tenants.filter(t => t.status === "expiring").length}</p>
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">Sắp hết hạn</p>
          </div>
          <div className="flex-1 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-red-600 dark:text-red-400">{tenants.filter(t => t.status === "overdue").length}</p>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Nợ tiền</p>
          </div>
        </div>

        {/* Tenant Cards */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl mt-4">
              <Users size={40} className="mx-auto mb-3 opacity-30 text-teal-500" />
              <p className="text-sm font-semibold">Chưa có khách thuê nào</p>
              <p className="text-xs mt-1 text-slate-400">Click dấu cộng (+) trên cùng để thêm khách</p>
            </div>
          )}
          {filtered.map((tenant, idx) => {
            const st = statusConfig[tenant.status];
            return (
              <div key={tenant.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-3.5">
                  {/* Avatar */}
                  <div className={`w-11 h-11 ${avatarColors[idx % avatarColors.length]} rounded-2xl flex justify-center items-center text-white font-bold text-sm shadow-sm shrink-0`}>
                    {tenant.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{tenant.name}</h4>
                      <span className={`w-2 h-2 rounded-full ${st.dot} shrink-0`} />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                        <Home size={11} /> {tenant.room}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                        <Calendar size={11} /> {tenant.contractMonths} tháng
                      </span>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-800 dark:text-white">{tenant.monthlyRent}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">/tháng</p>
                  </div>
                </div>

                {/* Quick Actions Row */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                  <a href={`tel:${tenant.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-700 transition-colors">
                    <Phone size={13} /> Gọi
                  </a>
                  <a href={`mailto:${tenant.email}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-700 transition-colors">
                    <Mail size={13} /> Email
                  </a>
                  <button 
                    onClick={(e) => handleDeleteTenant(tenant.id, e)}
                    className="flex justify-center items-center py-2 px-3 bg-red-50 dark:bg-red-500/10 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={15} />
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
