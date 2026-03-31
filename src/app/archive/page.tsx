"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
// ✅ Import Component Image ของ Next.js เพื่อใช้จัดการรูปภาพ
import Image from "next/image"; 

// รายชื่อ Agent ทั้งหมด (เหมือนเดิม)
const xenoAgents = ["All", "Xeno Content", "Xeno Scout", "Xeno Video", "Xeno Color", "Xeno Account", "Xeno Booking", "Xeno Coder", "Xeno GameDev", "Xeno XAU", "Xeno Commander", "Xeno Gemini", "Xeno Auditor"];

export default function ArchivePage() {
  const [logs, setLogs] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/get-logs")
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Connection Error:", err);
        setLoading(false);
      });
  }, []);

  const filteredLogs = activeFilter === "All" 
    ? logs 
    : logs.filter((log: any) => log.agent === activeFilter);

  // --- 📝 ฟังก์ชันสำหรับแปลงชื่อ Agent เป็นชื่อไฟล์รูปภาพ (.png ตัวเล็กทั้งหมด) ---
// --- 📝 ฟังก์ชันสำหรับแปลงชื่อ Agent เป็นชื่อไฟล์รูปภาพ ให้ตรงกับหน้า Dashboard ---
    const getWorkerIconPath = (agentName: string) => {
        // 1. ตรวจสอบก่อนว่าชื่อที่ส่งมาเป็น "All" หรือไม่ (ถ้าเป็น All ให้ใช้ไอคอนกลาง)
        if (agentName === "All") return "/worker/xeno-commander.png"; 

        // 2. แปลง "Xeno Content" -> "xeno-content" 
        // และเปลี่ยน Path จาก /workers/ เป็น /worker/ (ตามหน้า Home)
        const fileName = agentName.toLowerCase().replace(/\s+/g, "-");
        return `/worker/${fileName}.png`; 
    };

  return (
    <main className="min-h-screen bg-[#03060b] text-slate-200 p-8 md:p-20 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER SECTION (เหมือนเดิม) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,1)]"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-500/70">Database Access Granted</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
              Mission <span className="text-cyan-500">Archive.</span>
            </h1>
          </div>
          <Link href="/" className="group flex items-center gap-3 bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/50 px-8 py-4 rounded-2xl text-[11px] font-black tracking-widest transition-all">
            <span className="group-hover:-translate-x-1 transition-transform">🛸</span> RETURN TO HQ
          </Link>
        </div>

        {/* 🔍 AGENT FILTER SYSTEM (เหมือนเดิม) */}
        <div className="mb-12">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4 block ml-2">Filter by Intelligence Unit</span>
          <div className="flex flex-wrap gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-[2rem] backdrop-blur-sm">
            {xenoAgents.map((agent) => (
              <button
                key={agent}
                onClick={() => setActiveFilter(agent)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeFilter === agent 
                  ? "bg-cyan-500 text-[#03060b] shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-105" 
                  : "bg-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5"
                }`}
              >
                {agent}
              </button>
            ))}
          </div>
        </div>

        {/* LOG DISPLAY AREA */}
        <div className="grid gap-8">
          {loading ? (
            <div className="text-center py-20 font-mono text-cyan-500 animate-pulse uppercase tracking-[1em]">Establishing Uplink...</div>
          ) : filteredLogs.length > 0 ? (
            filteredLogs.map((log: any) => (
              <div key={log.id} className="group relative bg-white/[0.01] border border-white/5 p-10 rounded-[3.5rem] hover:bg-white/[0.03] hover:border-cyan-500/20 transition-all duration-500 shadow-2xl">
                
                {/* 🟢 แก้ไขส่วนหัว: ใส่รูป Worker เข้าไป */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-5 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                      {/* ✅ แสดงรูปภาพ Pixel Art ของ Worker */}
                      <Image 
                        src={getWorkerIconPath(log.agent)} // ดึง Path รูปภาพ
                        alt={log.agent}
                        width={24} // กำหนดขนาดให้พอดีกับ Tag
                        height={24}
                        className="pixelated" // (ไม่บังคับ) ใส่ Class เพื่อให้ Pixel ไม่แตก
                        unoptimized // ✅ เพิ่มตัวนี้เพื่อให้รูปเล็กๆ ไม่เบลอ
                      />
                      <span className="text-cyan-400 text-[10px] font-black uppercase tracking-widest">{log.agent}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 tracking-tighter">{log.timestamp}</span>
                  </div>
                </div>

                {/* ส่วนอื่นๆ (เหมือนเดิม เป๊ะๆ) */}
                <div className="space-y-8">
                  <div className="relative pl-6 border-l-2 border-slate-800">
                    <span className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-slate-800"></span>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-3 block">User Command</span>
                    <h3 className="text-xl md:text-2xl font-bold text-white leading-snug">“{log.command}”</h3>
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <details className="group/details cursor-pointer outline-none">
                      <summary className="list-none flex items-center gap-3 text-[10px] font-black text-cyan-500/60 hover:text-cyan-400 uppercase tracking-[0.3em] transition-colors">
                        <span className="group-open/details:rotate-90 transition-transform duration-300">▶</span>
                        Xeno Intelligence Report (Click to Expand)
                      </summary>
                      
                      <div className="mt-8 text-slate-400 text-lg leading-relaxed whitespace-pre-wrap font-light font-sans bg-white/[0.02] p-8 rounded-[2rem] border border-white/5">
                        {log.response}
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-40 border-2 border-dashed border-white/5 rounded-[4rem]">
              <div className="text-5xl mb-6 grayscale opacity-20">📁</div>
              <p className="text-slate-600 font-mono text-[11px] uppercase tracking-[0.6em]">No missions recorded in this sector.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-32 pb-12 text-center text-[9px] uppercase tracking-[1.5em] text-slate-800 font-medium">
        Xeno Intelligence Archive // System Version 1.4.3
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        summary::-webkit-details-marker { display: none; }
        /* ✅ เพิ่ม CSS เพื่อให้ภาพ Pixel Art ดูคมชัด (ไม่เบลอเวลาขยาย) */
        .pixelated {
          image-rendering: pixelated; 
          image-rendering: -moz-crisp-edges; 
          image-rendering: crisp-edges;
        }
      `}</style>
    </main>
  );
}