"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StartPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Client-side redirect ensures this page returns 200 OK for Chrome Android's PWA validation
    router.replace("/");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#4f46e5]">
       <div className="w-8 h-8 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
    </div>
  );
}
