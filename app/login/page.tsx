"use client";

import { Home, ArrowRight, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.success("Đăng nhập thành công!", { description: "Đang chuyển hướng về Bảng điều khiển..." });
    setTimeout(() => {
      router.push("/");
    }, 800);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative overflow-hidden w-full font-sans">
      {/* Decorative background */}
      <div className="absolute top-0 w-full h-[55vh] bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-800 rounded-b-[60px] shadow-lg">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center flex-1 px-6 pt-24 pb-10">
        {/* Logo/Icon */}
        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex justify-center items-center text-white shadow-inner border border-white/30 mb-6">
          <Home size={40} strokeWidth={2.5} />
        </div>
        
        <h1 className="text-3xl font-black text-white tracking-tight mb-2 drop-shadow-sm">Renroom</h1>
        <p className="text-indigo-100/90 text-sm font-medium mb-10 text-center px-4 max-w-xs">
          Nền tảng quản lý lưu trú & căn hộ dịch vụ thế hệ mới
        </p>

        {/* Login Form Card */}
        <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 relative">
          <h2 className="text-xl font-bold text-slate-800 mb-6 tracking-tight">Đăng nhập ngay</h2>
          
          <div className="space-y-4 mb-6">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  placeholder="admin@renroom.vn" 
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold placeholder:font-normal"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Mật khẩu</label>
                <Link href="#" className="text-xs text-indigo-600 font-semibold hover:opacity-80 transition-opacity">Quên?</Link>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold placeholder:font-normal"
                />
              </div>
            </div>
          </div>

          <button onClick={handleLogin} className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]">
            Đăng nhập <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </div>

        <p className="mt-8 text-xs text-slate-400 font-medium text-center">
          Hỗ trợ PWA • Quản lý tối ưu cho Mobile
        </p>
      </div>
    </div>
  );
}
