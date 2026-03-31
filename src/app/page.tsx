"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── GAME DEV DEPARTMENTS ────────────────────────────────────────────────────
const gameDepartments = [
  {
    name: "Production",
    color: "#f59e0b",
    darkColor: "#451a03",
    agents: [
      { name: "Xeno Producer", role: "Mission Commander", emoji: "👑", bio: "บริหาร sprint, milestone และประสานงานทีมให้ส่งงานตรงเวลา" },
      { name: "Xeno Designer", role: "Game Mechanics", emoji: "♟️", bio: "ออกแบบ core loop, progression และ mechanics ของเกม" },
    ],
  },
  {
    name: "Engineering",
    color: "#38bdf8",
    darkColor: "#0c1a2e",
    agents: [
      { name: "Xeno Coder", role: "Lead Programmer", emoji: "🔮", bio: "สถาปนิกโค้ด กำหนดมาตรฐานและ review code ทั้งทีม" },
      { name: "Xeno Engine", role: "Engine Systems", emoji: "⚙️", bio: "ดูแล rendering pipeline, physics และ core engine systems" },
      { name: "Xeno Gameplay", role: "Player Systems", emoji: "⚔️", bio: "สร้าง combat, player movement และ interactive features" },
      { name: "Xeno AI Bot", role: "NPC & Behavior", emoji: "🤺", bio: "พัฒนา AI พฤติกรรม NPC, pathfinding และ decision-making" },
      { name: "Xeno UI Dev", role: "Interface Dev", emoji: "🛡️", bio: "สร้าง HUD, เมนู และ UI systems ทั้งหมด" },
    ],
  },
  {
    name: "Creative",
    color: "#a78bfa",
    darkColor: "#1e0a3c",
    agents: [
      { name: "Xeno Director", role: "Creative Vision", emoji: "👁️", bio: "กำกับวิสัยทัศน์เกมและตัดสินใจด้าน aesthetic ทั้งหมด" },
      { name: "Xeno Narrator", role: "Story Architect", emoji: "📜", bio: "สร้างโครงสร้างเรื่อง, world-building และ character arcs" },
      { name: "Xeno Writer", role: "Dialogue & Lore", emoji: "🪄", bio: "เขียน dialogue, item descriptions และ lore entries" },
      { name: "Xeno Lore", role: "World Builder", emoji: "🌍", bio: "ออกแบบ factions, ประวัติศาสตร์ และ geography ของโลกเกม" },
    ],
  },
  {
    name: "Art & Audio",
    color: "#fb7185",
    darkColor: "#2d0a14",
    agents: [
      { name: "Xeno Artist", role: "Art Direction", emoji: "🎨", bio: "กำกับ style guide, art bible และ visual consistency" },
      { name: "Xeno Tech Art", role: "Shaders & VFX", emoji: "✨", bio: "พัฒนา shaders, VFX และ optimize art pipeline" },
      { name: "Xeno Audio", role: "Music Director", emoji: "🎵", bio: "กำกับทิศทางดนตรีและ sonic identity ของเกม" },
      { name: "Xeno Sound", role: "SFX Designer", emoji: "🔔", bio: "ออกแบบ sound effects และ audio events ทั้งหมด" },
    ],
  },
  {
    name: "Level & Balance",
    color: "#34d399",
    darkColor: "#022c22",
    agents: [
      { name: "Xeno Level", role: "Level Designer", emoji: "🗺️", bio: "ออกแบบ layout, encounter และ pacing ของแต่ละด่าน" },
      { name: "Xeno Balance", role: "Economy & Loot", emoji: "⚖️", bio: "วิเคราะห์ progression curves, loot tables และ economy" },
    ],
  },
  {
    name: "QA & DevOps",
    color: "#fb923c",
    darkColor: "#2c0a00",
    agents: [
      { name: "Xeno QA", role: "Quality Lead", emoji: "🔍", bio: "วางแผน test strategy และกำหนด quality gates" },
      { name: "Xeno Tester", role: "Bug Hunter", emoji: "🐉", bio: "เขียน test cases และ bug reports อย่างละเอียด" },
      { name: "Xeno DevOps", role: "Build Pipeline", emoji: "🚀", bio: "ดูแล CI/CD, build scripts และ deployment" },
    ],
  },
];

// ─── FACEBOOK DEPARTMENTS ─────────────────────────────────────────────────────
const facebookDepartments = [
  {
    name: "Strategy",
    color: "#1877F2",
    darkColor: "#0a1f52",
    agents: [
      { name: "FB Commander", role: "Page Strategist", emoji: "📘", bio: "วางกลยุทธ์ภาพรวม Facebook Page และกำหนดทิศทางคอนเทนต์ทั้งหมด" },
      { name: "FB Planner", role: "Content Calendar", emoji: "📅", bio: "วางแผน content calendar รายสัปดาห์และรายเดือน ให้ post ตรงเวลา" },
    ],
  },
  {
    name: "Content",
    color: "#00B2FF",
    darkColor: "#002d3d",
    agents: [
      { name: "FB Writer", role: "Post Copywriter", emoji: "✍️", bio: "เขียน caption, post copy และ storytelling ให้คนหยุดอ่านและกด Like" },
      { name: "FB Visual", role: "Graphic Direction", emoji: "🖼️", bio: "กำกับทิศทางภาพ, thumbnail และ infographic สำหรับ feed และ story" },
      { name: "FB Video", role: "Reels & Video", emoji: "🎬", bio: "สร้าง concept วิดีโอ Reels และ Facebook Video ให้ viral" },
    ],
  },
  {
    name: "Ads & Growth",
    color: "#F5A623",
    darkColor: "#3d2600",
    agents: [
      { name: "FB Ads", role: "Ad Specialist", emoji: "📣", bio: "ออกแบบ Facebook Ads campaign ตั้งแต่ creative จนถึง conversion" },
      { name: "FB Targeting", role: "Audience Segmentation", emoji: "🎯", bio: "วิเคราะห์ custom audience, lookalike และ retargeting strategy" },
      { name: "FB Boost", role: "Budget Optimizer", emoji: "💰", bio: "บริหาร ad budget ให้ได้ ROI สูงสุด และ scale campaign ที่ work" },
    ],
  },
  {
    name: "Community",
    color: "#42B72A",
    darkColor: "#0d2b08",
    agents: [
      { name: "FB Community", role: "Community Manager", emoji: "💬", bio: "ตอบ comment, DM และบริหาร community ให้ active และ positive" },
      { name: "FB Influencer", role: "Collab & KOL", emoji: "🤝", bio: "วางแผน KOL collaboration, influencer seeding และ partnership" },
    ],
  },
  {
    name: "Analytics",
    color: "#7B6CF7",
    darkColor: "#1a0f3d",
    agents: [
      { name: "FB Insights", role: "Data Analyst", emoji: "📊", bio: "วิเคราะห์ Facebook Insights, reach, engagement และ funnel performance" },
      { name: "FB Reporter", role: "Performance Report", emoji: "📈", bio: "สรุป weekly/monthly report และแนะนำ action items จาก data" },
    ],
  },
];

type Agent = { name: string; role: string; emoji: string; bio: string };
type Department = { name: string; color: string; darkColor: string; agents: Agent[] };
type SystemType = "gamedev" | "facebook" | "marketing";

function MarketingTab({ api }: { api: string }) {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${api}/marketing-stats`);
      const data = await res.json();
      if (data.error) { setError(data.error); } else { setStats(data); }
    } catch { setError("เชื่อมต่อ server ไม่ได้"); }
    setLoading(false);
  };

  const page = stats?.page as Record<string, unknown> | undefined;
  const insights = stats?.insights as Record<string, number> | undefined;
  const posts = stats?.posts as Record<string, unknown>[] | undefined;

  const overviewCards = [
    { label: "Followers", value: page?.followers_count ?? "—" },
    { label: "Fan Count", value: page?.fan_count ?? "—" },
    { label: "Impressions (7วัน)", value: insights?.page_impressions ?? "—" },
    { label: "Engaged Users (7วัน)", value: insights?.page_engaged_users ?? "—" },
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: "#f59e0b20" }}>📊</div>
          <div>
            <p className="text-white font-black text-base leading-none">{page ? String(page.name) : "Marketing Setup"}</p>
            <p className="text-[9px] text-amber-500/60 uppercase tracking-widest mt-1">Facebook Page Analytics</p>
          </div>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all disabled:opacity-50"
          style={{ backgroundColor: "#f59e0b", color: "#000" }}
        >
          {loading ? "⏳ Loading..." : "🔄 Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-red-400 text-[10px]">⚠ {error}</p>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Followers", value: page?.followers_count, icon: "👥", color: "#1877F2" },
          { label: "Fan Count", value: page?.fan_count, icon: "❤️", color: "#ef4444" },
          { label: "Impressions 7d", value: insights?.page_impressions, icon: "👁️", color: "#a78bfa" },
          { label: "Engaged 7d", value: insights?.page_engaged_users, icon: "⚡", color: "#34d399" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[8px] uppercase tracking-widest text-slate-600">{card.label}</p>
              <span className="text-base">{card.icon}</span>
            </div>
            <p className="text-3xl font-black" style={{ color: card.value !== undefined ? card.color : "#1e293b" }}>
              {card.value !== undefined ? Number(card.value).toLocaleString() : "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Post Performance */}
      <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Post Performance — 10 ล่าสุด</p>
        </div>
        {!posts && (
          <div className="py-8 text-center">
            <p className="text-slate-700 text-[10px]">กด Refresh เพื่อโหลดข้อมูล</p>
          </div>
        )}
        {posts && posts.length === 0 && <p className="text-slate-700 text-[10px] text-center py-8">ไม่พบโพสต์</p>}
        {posts && posts.length > 0 && (() => {
          const ranked = [...posts].map((post) => {
            const likes = (post.likes as Record<string, unknown>)?.summary as Record<string, unknown>;
            const comments = (post.comments as Record<string, unknown>)?.summary as Record<string, unknown>;
            const shares = post.shares as Record<string, unknown>;
            const insightsData = post.insights as Record<string, unknown>;
            const insightValues = (insightsData?.data as Record<string, unknown>[])?.[0]?.values as Record<string, unknown>[];
            const impressions = Number(insightValues?.[insightValues?.length - 1]?.value ?? 0);
            const score = Number(likes?.total_count ?? 0) + Number(comments?.total_count ?? 0) * 2 + Number(shares?.count ?? 0) * 3;
            // สร้าง URL จาก post id เป็น fallback
            const rawId = String(post.id ?? "");
            const parts = rawId.split("_");
            const fallbackUrl = parts.length === 2 ? `https://www.facebook.com/permalink.php?story_fbid=${parts[1]}&id=${parts[0]}` : "";
            const url = String(post.permalink_url || fallbackUrl);
            return { ...post, _likes: Number(likes?.total_count ?? 0), _comments: Number(comments?.total_count ?? 0), _shares: Number(shares?.count ?? 0), _score: score, _impressions: impressions, _url: url };
          }).sort((a, b) => b._score - a._score);

          const medals = ["🥇", "🥈", "🥉"];

          return (
            <div className="space-y-2">
              {ranked.map((post, i) => {
                const date = post.created_time ? new Date(String(post.created_time)).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : "";
                return (
                  <a
                    key={i}
                    href={post._url || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all"
                    style={{
                      backgroundColor: i === 0 ? "#f59e0b08" : "rgba(255,255,255,0.01)",
                      borderColor: i === 0 ? "#f59e0b30" : "rgba(255,255,255,0.04)",
                      cursor: post._url ? "pointer" : "default",
                    }}
                  >
                    <span className="text-base w-6 shrink-0 text-center">{i < 3 ? medals[i] : <span className="text-[9px] font-black text-slate-700">{i + 1}</span>}</span>
                    <p className="flex-1 text-[10px] text-slate-400 line-clamp-1 min-w-0 hover:text-white transition-colors">{String(post.message || "—").slice(0, 100)}</p>
                    <span className="text-[8px] text-slate-700 shrink-0">{date}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[9px] font-black" style={{ color: "#a78bfa" }}>👁 {post._impressions.toLocaleString()}</span>
                      <span className="text-[9px] font-black" style={{ color: "#1877F2" }}>👍 {post._likes}</span>
                      <span className="text-[9px] font-black" style={{ color: "#f59e0b" }}>💬 {post._comments}</span>
                      <span className="text-[9px] font-black" style={{ color: "#34d399" }}>🔁 {post._shares}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          );
        })()}
      </section>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">📣 Ads Overview</p>
          </div>
          <div className="py-8 text-center">
            <p className="text-2xl mb-2">📣</p>
            <p className="text-slate-700 text-[9px] uppercase tracking-widest">Coming Soon</p>
          </div>
        </section>
        <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">🤖 AI Analyst & Strategy</p>
          </div>
          <div className="py-8 text-center">
            <p className="text-2xl mb-2">🤖</p>
            <p className="text-slate-700 text-[9px] uppercase tracking-widest">Coming Soon</p>
          </div>
        </section>
      </div>

    </div>
  );
}

type UserRole = "admin" | "mod" | "member";
interface AuthUser { username: string; role: UserRole; token: string; }

function LoginScreen({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"); return; }
      localStorage.setItem("xeno_token", data.token);
      onLogin({ username: data.username, role: data.role, token: data.token });
    } catch {
      setError("ไม่สามารถเชื่อมต่อ server ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#08080f" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black tracking-tighter text-white">
            Xeno<span style={{ color: "#7c3aed" }}>.</span>
          </h1>
          <p className="text-slate-600 text-xs tracking-widest uppercase mt-2">AI Agent Dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white text-sm font-medium outline-none"
              style={{ background: "#ffffff08", border: "1px solid #ffffff10" }}
              autoFocus
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white text-sm font-medium outline-none"
              style={{ background: "#ffffff08", border: "1px solid #ffffff10" }}
            />
          </div>
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-40"
            style={{ background: "#7c3aed", color: "#fff", boxShadow: "0 4px 20px #7c3aed55" }}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeSystem, setActiveSystem] = useState<SystemType>("gamedev");
  const [command, setCommand] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [gameRunning, setGameRunning] = useState(false);
  const [runGameLoading, setRunGameLoading] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [imageLoading, setImageLoading] = useState(false);

  // FB Create Post states
  const [fbPrompt, setFbPrompt] = useState("");
  const [fbCaption, setFbCaption] = useState("");
  const [fbFooter, setFbFooter] = useState("📞 เบอร์ติดต่อ: \n💬 Line ID: \n📍 ที่อยู่ร้าน: ");
  const [fbCaptionLoading, setFbCaptionLoading] = useState(false);
  const [footerSaved, setFooterSaved] = useState(false);
  const [showFolderConfig, setShowFolderConfig] = useState(false);
  const [folderCategories, setFolderCategories] = useState([
    { name: "ทำสีผม", emoji: "🎨", url: process.env.NEXT_PUBLIC_FOLDER_TAMSIPOM || "" },
    { name: "ตัดผม", emoji: "💫", url: process.env.NEXT_PUBLIC_FOLDER_TATPOM || "" },
    { name: "ยืดผม", emoji: "✨", url: process.env.NEXT_PUBLIC_FOLDER_YEUTPOM || "" },
    { name: "ทรงผม", emoji: "✂️", url: process.env.NEXT_PUBLIC_FOLDER_SONGPOM || "" },
  ]);
  const [activeFolderIdx, setActiveFolderIdx] = useState<number | null>(null);
  const [driveImages, setDriveImages] = useState<{ id: string; name: string; previewUrl: string }[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [fbPostLoading, setFbPostLoading] = useState(false);
  const [fbPostResult, setFbPostResult] = useState<{ success: boolean; message: string } | null>(null);
  const [fbSmartLoading, setFbSmartLoading] = useState(false);
  const [fbSmartReason, setFbSmartReason] = useState("");
  const [fbRemaining, setFbRemaining] = useState<number | null>(null);
  const [fbTone, setFbTone] = useState("Lifestyle");
  const [openDepts, setOpenDepts] = useState<Set<string>>(new Set());
  const [usedImages, setUsedImages] = useState<{ id: string; name: string; date: string }[]>([]);
  const [showUsedImages, setShowUsedImages] = useState(false);
  const [showDriveUrl, setShowDriveUrl] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [driveFolders, setDriveFolders] = useState<{ id: string; name: string; folderLink: string }[]>([]);
  const [currentFolderName, setCurrentFolderName] = useState("");

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    // Check saved token
    const savedToken = localStorage.getItem("xeno_token");
    if (savedToken) {
      fetch(`${API}/me`, { headers: { Authorization: `Bearer ${savedToken}` } })
        .then((r) => r.json())
        .then((data) => {
          if (data.username) setAuthUser({ username: data.username, role: data.role, token: savedToken });
        })
        .catch(() => {})
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("xeno_token");
    setAuthUser(null);
  };

  // โหลดค่า default จาก localStorage
  useEffect(() => {
    const savedFooter = localStorage.getItem("fb_footer");
    const savedCategories = localStorage.getItem("fb_folder_categories");
    if (savedFooter) setFbFooter(savedFooter);
    if (savedCategories) {
      try { setFolderCategories(JSON.parse(savedCategories)); } catch {}
    }
  }, []);

  const departments: Department[] =
    activeSystem === "gamedev" ? gameDepartments : facebookDepartments;

  const getDept = (agent: Agent | null): Department | undefined =>
    departments.find((d) => d.agents.some((a) => a.name === agent?.name));

  const handleSystemSwitch = (system: SystemType) => {
    setActiveSystem(system);
    setSelectedAgent(null);
    setCommand("");
    setResult("");
    setGeneratedImage("");
  };

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setResult("");
    setTimeout(() => document.getElementById("console")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command || !selectedAgent) return;
    setLoading(true);
    const endpoint =
      activeSystem === "gamedev" ? "/ask-agent" : "/ask-facebook";
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, agent: selectedAgent.name }),
      });
      const data = await res.json();
      setResult(data.result || data.message || "ได้รับข้อมูลแล้ว");
    } catch {
      setResult("❌ ไม่สามารถติดต่อ Backend ได้ — กรุณาตรวจสอบว่า server กำลังทำงานอยู่ (python agents.py)");
    }
    setLoading(false);
  };

  const artistAgents = ["Xeno Artist", "Xeno Tech Art", "FB Visual", "FB Video"];
  const isArtistAgent = selectedAgent ? artistAgents.includes(selectedAgent.name) : false;

  const handleGenerateImage = async () => {
    if (!imagePrompt) return;
    setImageLoading(true);
    setGeneratedImage("");
    try {
      const res = await fetch(`${API}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      const data = await res.json();
      if (data.image_url) setGeneratedImage(data.image_url);
      else setResult(`❌ ${data.error || "สร้างรูปไม่สำเร็จ"}`);
    } catch {
      setResult("❌ ไม่สามารถติดต่อ Backend ได้");
    }
    setImageLoading(false);
  };

  // FB: Generate caption from AI
  const handleGenerateCaption = async () => {
    if (!fbPrompt) return;
    setFbCaptionLoading(true);
    setFbCaption("");
    try {
      const res = await fetch(`${API}/ask-facebook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: `Tone: ${fbTone}\nเรื่อง: ${fbPrompt}`,
          agent: "FB Writer",
        }),
      });
      const data = await res.json();
      setFbCaption(data.result || "");
    } catch {
      setFbCaption("❌ ไม่สามารถติดต่อ Backend ได้");
    }
    setFbCaptionLoading(false);
  };

  // FB: Smart Auto Select
  const activeFolderUrl = activeFolderIdx !== null ? folderCategories[activeFolderIdx]?.url : "";
  const handleSmartPost = async () => {
    if (!activeFolderUrl) return;
    setFbSmartLoading(true);
    setFbSmartReason("");
    setFbPostResult(null);
    try {
      const res = await fetch(`${API}/fb-smart-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_link: activeFolderUrl, prompt: fbPrompt }),
      });
      const data = await res.json();
      if (data.error) {
        setFbPostResult({ success: false, message: data.error });
      } else {
        setFbCaption(data.caption || "");
        setSelectedImageIds(data.selected_id ? [data.selected_id] : []);
        setFbSmartReason(data.reason || "");
        setFbRemaining(data.remaining ?? null);
        setDriveImages([{ id: data.selected_id, name: "selected", previewUrl: data.preview_url }]);
      }
    } catch {
      setFbPostResult({ success: false, message: "❌ ไม่สามารถติดต่อ Backend ได้" });
    }
    setFbSmartLoading(false);
  };

  // FB: Load images from Google Drive
  const handleLoadDriveImages = async (overrideLink?: string, folderName?: string) => {
    const link = overrideLink || activeFolderUrl;
    if (!link) return;
    setDriveLoading(true);
    setDriveImages([]);
    setDriveFolders([]);
    setSelectedImageIds([]);
    setCurrentFolderName(folderName || "");
    try {
      const res = await fetch(`${API}/fb-drive-images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_link: link }),
      });
      const data = await res.json();
      if (data.error) setFbPostResult({ success: false, message: data.error });
      else {
        console.log("Drive response:", data);
        setDriveImages(data.files || []);
        setDriveFolders(data.folders || []);
      }
    } catch {
      setFbPostResult({ success: false, message: "❌ ไม่สามารถติดต่อ Backend ได้" });
    }
    setDriveLoading(false);
  };

  // FB: โหลดประวัติรูปที่ใช้แล้ว
  const handleLoadUsedImages = async () => {
    try {
      const res = await fetch(`${API}/fb-used-images`);
      const data = await res.json();
      setUsedImages(data);
      setShowUsedImages(true);
    } catch {
      setUsedImages([]);
    }
  };

  // FB: ลบรูปออกจากประวัติ
  const handleDeleteUsedImage = async (imageId: string) => {
    const res = await fetch(`${API}/fb-delete-used-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: imageId }),
    });
    const data = await res.json();
    if (data.success) {
      setUsedImages((prev) => prev.filter((img) => img.id !== imageId));
    }
  };

  // FB: Post to Facebook
  const handleFbPost = async () => {
    if (!fbCaption) return;
    setFbPostLoading(true);
    setFbPostResult(null);
    try {
      const body: Record<string, string | null> = {
        caption: fbCaption,
        footer: fbFooter,
        file_ids: JSON.stringify(selectedImageIds),
      };
      if (scheduleEnabled && scheduledTime) {
        body.scheduled_time = scheduledTime;
      }
      const res = await fetch(`${API}/fb-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setFbPostResult({ success: data.success, message: data.message || data.error });
    } catch {
      setFbPostResult({ success: false, message: "❌ ไม่สามารถติดต่อ Backend ได้" });
    }
    setFbPostLoading(false);
  };

  const handleRunGame = async () => {
    setRunGameLoading(true);
    try {
      const res = await fetch(`${API}/run-game`, { method: "POST" });
      const data = await res.json();
      setGameRunning(data.running ?? true);
      setResult(`🎮 ${data.message || (data.running ? "Game is now running" : "Game stopped")}`);
    } catch {
      setResult("❌ ไม่สามารถติดต่อ Backend ได้ — กรุณาตรวจสอบว่า server กำลังทำงานอยู่ (python agents.py)");
    }
    setRunGameLoading(false);
    setTimeout(() => document.getElementById("console")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const dept = getDept(selectedAgent);

  // Theme colors per system
  const theme = {
    gamedev: { accent: "#7c3aed", accentLight: "#a78bfa", label: "GAME DEV", icon: "🎮" },
    facebook: { accent: "#1877F2", accentLight: "#00B2FF", label: "FACEBOOK", icon: "📘" },
    marketing: { accent: "#f59e0b", accentLight: "#fcd34d", label: "MARKETING", icon: "📊" },
  }[activeSystem];

  const outputBorderColor = activeSystem === "facebook" ? "#1877F2" : "#7c3aed";
  const outputBgColor = activeSystem === "facebook" ? "#1877F2" : "#7c3aed";

  if (!authChecked) return null;
  if (!authUser) return <LoginScreen onLogin={(u) => { setAuthUser(u); if (u.role !== "admin") setActiveSystem("facebook"); }} />;

  return (
    <main className="min-h-screen bg-[#08080f] text-slate-200" style={{ fontFamily: "'Courier New', monospace" }}>
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#08080f]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: theme.accent }}
            >
              {theme.icon}
            </div>
            <div>
              <div className="text-white font-black tracking-tighter text-base leading-none">
                XENO{" "}
                <span style={{ color: theme.accentLight }}>
                  {theme.label}
                </span>
              </div>
              <div className="text-[8px] tracking-[0.4em] text-slate-600 uppercase mt-0.5">
                Agent Command Center
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {activeSystem === "gamedev" && (
              <button
                onClick={handleRunGame}
                disabled={runGameLoading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all disabled:opacity-40"
                style={{
                  backgroundColor: gameRunning ? "#ef4444" : "#22c55e",
                  color: "#08080f",
                  boxShadow: gameRunning ? "0 4px 16px #ef444455" : "0 4px 16px #22c55e55",
                }}
              >
                <span>{runGameLoading ? "..." : gameRunning ? "⏹" : "▶"}</span>
                {runGameLoading ? "Loading..." : gameRunning ? "Stop Game" : "Run Game"}
              </button>
            )}
            <div className="text-right">
              <div className="text-[9px] text-slate-600 uppercase tracking-widest">
                {mounted ? currentTime.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() : ""}
              </div>
              <div className="text-xs font-black" style={{ color: theme.accentLight }}>
                {mounted ? currentTime.toLocaleTimeString() : ""}
              </div>
            </div>
            <div className="flex items-center gap-2 pl-4 border-l border-white/10">
              <div className="text-right">
                <div className="text-[9px] font-black text-white uppercase tracking-widest">{authUser?.username}</div>
                <div className="text-[8px] uppercase tracking-widest" style={{ color: authUser?.role === "admin" ? "#a78bfa" : authUser?.role === "mod" ? "#34d399" : "#60a5fa" }}>{authUser?.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all"
                style={{ background: "#ffffff08", color: "#475569", border: "1px solid #ffffff10" }}
              >
                ออก
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* TITLE */}
        <div className="mb-8">
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white leading-none">
            {activeSystem === "gamedev" ? "Studio" : "Social"}
            <span style={{ color: theme.accent }}>.</span>
          </h1>
          <p className="text-slate-600 text-xs tracking-[0.4em] uppercase mt-3">
            Select your agent — deploy your mission
          </p>
        </div>

        {/* SYSTEM MENU TABS */}
        <div className="flex gap-2 mb-10 p-1 rounded-2xl bg-white/[0.03] border border-white/5 w-fit">
          {authUser?.role === "admin" && (
            <button
              onClick={() => handleSystemSwitch("gamedev")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-200"
              style={
                activeSystem === "gamedev"
                  ? { backgroundColor: "#7c3aed", color: "#fff", boxShadow: "0 4px 16px #7c3aed55" }
                  : { color: "#475569" }
              }
            >
              🎮 Game Dev
            </button>
          )}
          <button
            onClick={() => handleSystemSwitch("facebook")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-200"
            style={
              activeSystem === "facebook"
                ? { backgroundColor: "#1877F2", color: "#fff", boxShadow: "0 4px 16px #1877F255" }
                : { color: "#475569" }
            }
          >
            📘 Facebook
          </button>
          {(authUser?.role === "admin" || authUser?.role === "mod") && (
            <button
              onClick={() => handleSystemSwitch("marketing")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-200"
              style={
                activeSystem === "marketing"
                  ? { backgroundColor: "#f59e0b", color: "#fff", boxShadow: "0 4px 16px #f59e0b55" }
                  : { color: "#475569" }
              }
            >
              📊 Marketing
            </button>
          )}
        </div>

        {/* DEPARTMENTS — Game Dev: always open / Facebook: toggle */}
        {activeSystem === "gamedev" ? (
          departments.map((d) => (
            <section key={d.name} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-5 h-0.5" style={{ backgroundColor: d.color }} />
                <span className="text-[9px] font-black uppercase tracking-[0.5em]" style={{ color: d.color }}>{d.name}</span>
                <div className="h-px flex-1 bg-white/[0.04]" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {d.agents.map((agent) => {
                  const isSelected = selectedAgent?.name === agent.name;
                  return (
                    <button key={agent.name} onClick={() => handleAgentClick(agent)}
                      className="rounded-2xl p-4 text-center transition-all duration-300 border"
                      style={{
                        backgroundColor: isSelected ? d.darkColor : "rgba(255,255,255,0.02)",
                        borderColor: isSelected ? d.color : "rgba(255,255,255,0.05)",
                        boxShadow: isSelected ? `0 0 24px ${d.color}35` : "none",
                        transform: isSelected ? "scale(1.03)" : undefined,
                      }}
                      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.transform = "none"; }}
                    >
                      <div className="w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center text-3xl"
                        style={{ background: `linear-gradient(145deg, ${d.darkColor} 0%, ${d.color}30 100%)`, border: `1px solid ${d.color}50` }}>
                        {agent.emoji}
                      </div>
                      <p className="text-white font-black text-[9px] leading-tight truncate">{agent.name}</p>
                      <p className="text-[7px] uppercase tracking-widest mt-1.5 font-bold" style={{ color: d.color }}>{agent.role}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          /* Facebook: Toggle Departments */
          <div className="mb-8">
            <p className="text-[8px] uppercase tracking-[0.4em] text-slate-700 mb-3">Agents</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {departments.map((d) => {
                const isOpen = openDepts.has(d.name);
                const hasSelected = d.agents.some((a) => a.name === selectedAgent?.name);
                return (
                  <button key={d.name}
                    onClick={() => {
                      const next = new Set(openDepts);
                      isOpen ? next.delete(d.name) : next.add(d.name);
                      setOpenDepts(next);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border"
                    style={{
                      borderColor: hasSelected ? d.color : isOpen ? `${d.color}60` : "rgba(255,255,255,0.06)",
                      backgroundColor: hasSelected ? `${d.color}15` : isOpen ? `${d.color}08` : "rgba(255,255,255,0.02)",
                      color: isOpen || hasSelected ? d.color : "#475569",
                    }}
                  >
                    <span>{isOpen ? "▾" : "▸"}</span>
                    {d.name}
                    {hasSelected && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />}
                  </button>
                );
              })}
            </div>

            {/* Expanded agents */}
            {departments.filter((d) => openDepts.has(d.name)).map((d) => (
              <div key={d.name} className="mb-4 rounded-2xl border p-4"
                style={{ borderColor: `${d.color}20`, backgroundColor: `${d.color}05` }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {d.agents.map((agent) => {
                    const isSelected = selectedAgent?.name === agent.name;
                    return (
                      <button key={agent.name} onClick={() => handleAgentClick(agent)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all"
                        style={{
                          backgroundColor: isSelected ? d.darkColor : "rgba(255,255,255,0.03)",
                          borderColor: isSelected ? d.color : "rgba(255,255,255,0.06)",
                          boxShadow: isSelected ? `0 0 12px ${d.color}30` : "none",
                        }}
                      >
                        <span className="text-xl shrink-0">{agent.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-white font-black text-[9px] truncate">{agent.name}</p>
                          <p className="text-[7px] uppercase tracking-wider truncate" style={{ color: d.color }}>{agent.role}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* COMMAND CONSOLE */}
        <div id="console" className="grid lg:grid-cols-3 gap-5 mt-10"
          style={{ display: activeSystem === "facebook" && !selectedAgent ? "none" : "grid" }}>
          {/* Input panel */}
          <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-white/[0.02] p-8">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/5">
              <div
                className={`w-2 h-2 rounded-full ${selectedAgent ? "animate-pulse" : "bg-slate-700"}`}
                style={selectedAgent ? { backgroundColor: theme.accent } : {}}
              />
              <span
                className="text-[9px] font-black uppercase tracking-[0.35em]"
                style={{ color: dept ? dept.color : "#475569" }}
              >
                {selectedAgent ? `Uplink: ${selectedAgent.name}` : "Terminal Standby"}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <textarea
                className="w-full bg-transparent border-none focus:ring-0 text-lg text-white placeholder:text-slate-800 min-h-[150px] font-light leading-relaxed resize-none"
                placeholder={selectedAgent ? `ส่งคำสั่งให้ ${selectedAgent.name}...` : "เลือก Agent ก่อนเริ่มพิมพ์..."}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
              />
              <div className="flex justify-between items-center border-t border-white/5 pt-5">
                <button
                  type="button"
                  onClick={() => { setSelectedAgent(null); setCommand(""); setResult(""); }}
                  className="text-[9px] font-bold uppercase tracking-widest text-slate-700 transition"
                  style={{ ["--hover-color" as string]: theme.accentLight }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = theme.accentLight)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#374151")}
                >
                  Reset Terminal
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedAgent}
                  className="px-10 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all disabled:opacity-20"
                  style={{
                    backgroundColor: dept ? dept.color : theme.accent,
                    boxShadow: dept ? `0 6px 20px ${dept.color}40` : "none",
                    color: "#08080f",
                  }}
                >
                  {loading ? "Executing..." : "Deploy Mission"}
                </button>
              </div>
            </form>
          </div>

          {/* Agent info panel */}
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8">
            <h4 className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-600 mb-6">Agent Intel</h4>
            {selectedAgent && dept ? (
              <div className="space-y-5">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto"
                  style={{
                    background: `linear-gradient(145deg, ${dept.darkColor} 0%, ${dept.color}30 100%)`,
                    border: `1px solid ${dept.color}50`,
                  }}
                >
                  {selectedAgent.emoji}
                </div>
                <div className="text-center">
                  <p className="text-white font-black text-sm">{selectedAgent.name}</p>
                  <p className="text-[8px] uppercase tracking-widest mt-1.5 font-bold" style={{ color: dept.color }}>
                    {selectedAgent.role}
                  </p>
                </div>
                <div className="border-t border-white/5 pt-4">
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">"{selectedAgent.bio}"</p>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[8px] text-slate-700 uppercase tracking-widest">Status</span>
                  <span className="text-[8px] font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded">READY</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-slate-700 uppercase tracking-widest">Dept.</span>
                  <span className="text-[8px] font-black" style={{ color: dept.color }}>{dept.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-slate-700 uppercase tracking-widest">System</span>
                  <span
                    className="text-[8px] font-black px-2 py-0.5 rounded"
                    style={{ color: theme.accent, backgroundColor: `${theme.accent}15` }}
                  >
                    {theme.label}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="text-5xl mb-4 opacity-10">
                  {activeSystem === "facebook" ? "📘" : "⚔️"}
                </div>
                <p className="text-[9px] text-slate-700 italic">เลือก Agent เพื่อดูข้อมูล</p>
              </div>
            )}
          </div>
        </div>

        {/* IMAGE GENERATOR — Artist agents only */}
        {isArtistAgent && (
          <div
            className="mt-6 rounded-3xl p-8"
            style={{
              border: `1px solid ${activeSystem === "facebook" ? "#1877F230" : "#ec489930"}`,
              backgroundColor: activeSystem === "facebook" ? "#1877F208" : "#ec489908",
            }}
          >
            <div className="flex items-center gap-4 mb-6">
              <span
                className="text-[9px] font-black uppercase tracking-[0.5em]"
                style={{ color: activeSystem === "facebook" ? "#00B2FF" : "#f472b6" }}
              >
                🎨 Image Generator
              </span>
              <div
                className="h-px flex-1"
                style={{ backgroundColor: activeSystem === "facebook" ? "#1877F220" : "#ec489920" }}
              />
              <span className="text-[8px] text-slate-600">DALL-E 3 · 1024×1024</span>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none"
                style={{ ["--focus-border" as string]: activeSystem === "facebook" ? "#1877F250" : "#ec489950" }}
                placeholder="อธิบายภาพที่ต้องการ เช่น 'a Facebook post cover for hair salon, modern design'"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerateImage()}
              />
              <button
                onClick={handleGenerateImage}
                disabled={imageLoading || !imagePrompt}
                className="px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all disabled:opacity-30"
                style={{
                  backgroundColor: activeSystem === "facebook" ? "#1877F2" : "#ec4899",
                  color: "#fff",
                }}
              >
                {imageLoading ? "Generating..." : "Generate"}
              </button>
            </div>
            {imageLoading && (
              <div className="mt-6 text-center text-slate-600 text-xs animate-pulse">กำลังสร้างรูป...</div>
            )}
            {generatedImage && (
              <div className="mt-6">
                <img src={generatedImage} alt="Generated" className="rounded-2xl w-full max-w-lg mx-auto block" />
                <div className="text-center mt-3">
                  <a href={generatedImage} target="_blank" rel="noreferrer" className="text-[9px] hover:underline uppercase tracking-widest" style={{ color: activeSystem === "facebook" ? "#00B2FF" : "#f472b6" }}>
                    เปิดรูปเต็ม ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* OUTPUT LOG */}
        {result && (
          <div
            className="mt-6 rounded-3xl p-10 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{
              border: `1px solid ${outputBorderColor}20`,
              backgroundColor: `${outputBgColor}05`,
            }}
          >
            <div className="flex items-center gap-4 mb-6">
              <span
                className="text-[9px] font-black uppercase tracking-[0.5em]"
                style={{ color: theme.accentLight }}
              >
                Mission Output
              </span>
              <div className="h-px flex-1" style={{ backgroundColor: `${outputBorderColor}20` }} />
            </div>
            <div className="text-sm font-light leading-relaxed whitespace-pre-wrap text-slate-300">{result}</div>
          </div>
        )}
      </div>

      {/* ─── FB CREATE POST PANEL ─── */}
      {activeSystem === "facebook" && (
        <div className="mt-10 rounded-3xl border p-8" style={{ borderColor: "#1877F220", backgroundColor: "#1877F205" }}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <span className="text-[9px] font-black uppercase tracking-[0.5em]" style={{ color: "#00B2FF" }}>
              📝 Create Post
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: "#1877F220" }} />
            <span className="text-[8px] text-slate-600">POST TO FACEBOOK PAGE</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN */}
            <div className="space-y-6">

              {/* STEP 1: AI Prompt */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest mb-2 block" style={{ color: "#1877F2" }}>
                  Step 1 — บอก AI ว่าอยากโพสต์อะไร
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none"
                    placeholder='เช่น "โพสต์คอนเทนต์ผมดัดดิจิตอล" หรือ "โปรโมชั่นลดราคา 20%"'
                    value={fbPrompt}
                    onChange={(e) => setFbPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerateCaption()}
                  />
                  <button
                    onClick={handleGenerateCaption}
                    disabled={fbCaptionLoading || !fbPrompt}
                    className="px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest disabled:opacity-30 transition-all"
                    style={{ backgroundColor: "#1877F2", color: "#fff" }}
                  >
                    {fbCaptionLoading ? "..." : "🤖 Generate"}
                  </button>
                </div>
              </div>

              {/* STEP 2: Tone Dropdown */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest mb-2 block" style={{ color: "#1877F2" }}>
                  Step 2 — อารมณ์คอนเทนต์
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "Educational", label: "📚 Educational", desc: "ให้ความรู้" },
                    { value: "Storytelling", label: "📖 Storytelling", desc: "เล่าเรื่อง" },
                    { value: "Case Study", label: "🔬 Case Study", desc: "ยกตัวอย่างจริง" },
                    { value: "Lifestyle", label: "✨ Lifestyle", desc: "ไลฟ์สไตล์" },
                    { value: "Emotional", label: "💛 Emotional", desc: "กระทบใจ" },
                    { value: "Direct Sales", label: "🛒 Direct Sales", desc: "ขายตรง" },
                    { value: "Hard Sell", label: "🔥 Hard Sell", desc: "กดดันให้ซื้อ" },
                    { value: "FOMO", label: "⏰ FOMO", desc: "กลัวพลาด" },
                    { value: "Trust", label: "🤝 Trust", desc: "สร้างความเชื่อมั่น" },
                    { value: "Social Proof", label: "⭐ Social Proof", desc: "รีวิว/ลูกค้าจริง" },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setFbTone(t.value)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all"
                      style={{
                        borderColor: fbTone === t.value ? "#1877F2" : "rgba(255,255,255,0.06)",
                        backgroundColor: fbTone === t.value ? "#1877F215" : "rgba(255,255,255,0.02)",
                        boxShadow: fbTone === t.value ? "0 0 12px #1877F225" : "none",
                      }}
                    >
                      <div>
                        <p className="text-[10px] font-black text-white">{t.label}</p>
                        <p className="text-[8px] text-slate-600">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption output */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest mb-2 block" style={{ color: "#00B2FF" }}>
                  Caption (แก้ได้)
                </label>
                <textarea
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none resize-none min-h-[120px] leading-relaxed"
                  placeholder="Caption จะปรากฏที่นี่หลังจาก Generate..."
                  value={fbCaption}
                  onChange={(e) => setFbCaption(e.target.value)}
                />
              </div>

              {/* STEP 3: Footer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#00B2FF" }}>
                    Step 3 — ข้อความท้ายโพสต์
                  </label>
                  <button
                    onClick={() => {
                      localStorage.setItem("fb_footer", fbFooter);
                      setFooterSaved(true);
                      setTimeout(() => setFooterSaved(false), 2000);
                    }}
                    className="text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-all"
                    style={{ backgroundColor: footerSaved ? "#42B72A20" : "#00B2FF15", color: footerSaved ? "#42B72A" : "#00B2FF" }}
                  >
                    {footerSaved ? "✓ Saved!" : "💾 Save Default"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[
                    { label: "📌 Kudos ดัดดิจิตอล", text: `📌 Kudos ดัดดิจิตอล "เพราะผมสวยเป็นเรื่องของมืออาชีพ"\n🔹️ สาขา ราชพฤกษ์      : 064-984-5587\n🔹️ สาขา คริสตัลปาร์ค  : 082-918-6859\n🔹️ สาขา นวมินทร์        : 097-1576-242\n📌 ติดต่อผ่าน LINE : @kudosbytarakorn` },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setFbFooter(preset.text)}
                      className="text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-all"
                      style={{ backgroundColor: "#00B2FF15", color: "#00B2FF", border: "1px solid #00B2FF30" }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none resize-none min-h-[90px] leading-relaxed"
                  placeholder="เบอร์โทร, Line, ที่อยู่..."
                  value={fbFooter}
                  onChange={(e) => setFbFooter(e.target.value)}
                />
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">

              {/* STEP 4: Google Drive */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#42B72A" }}>
                    Step 4 — รูปจาก Google Drive
                  </label>
                </div>

                {/* URL Config Panel */}
                {showFolderConfig && (
                  <div className="mb-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    {folderCategories.map((cat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[9px] w-20 shrink-0 font-bold text-slate-500">{cat.emoji} {cat.name}</span>
                        <input
                          type="text"
                          className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white placeholder:text-slate-700 focus:outline-none"
                          placeholder="https://drive.google.com/drive/folders/..."
                          value={cat.url}
                          onChange={(e) => {
                            const updated = [...folderCategories];
                            updated[idx] = { ...updated[idx], url: e.target.value };
                            setFolderCategories(updated);
                          }}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        localStorage.setItem("fb_folder_categories", JSON.stringify(folderCategories));
                        setShowFolderConfig(false);
                      }}
                      className="w-full mt-2 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all"
                      style={{ backgroundColor: "#42B72A", color: "#fff" }}
                    >
                      💾 บันทึก
                    </button>
                  </div>
                )}

                {/* Category Toggle Buttons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {folderCategories.map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (!cat.url) return;
                        if (activeFolderIdx === idx) {
                          setActiveFolderIdx(null);
                          setDriveImages([]);
                          setDriveFolders([]);
                        } else {
                          setActiveFolderIdx(idx);
                          console.log("Category URL:", JSON.stringify(cat.url));
                          handleLoadDriveImages(cat.url.trim(), cat.name);
                        }
                      }}
                      disabled={!cat.url}
                      className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all disabled:opacity-30"
                      style={{
                        backgroundColor: activeFolderIdx === idx ? "#42B72A20" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${activeFolderIdx === idx ? "#42B72A60" : "rgba(255,255,255,0.08)"}`,
                        color: activeFolderIdx === idx ? "#42B72A" : "#94a3b8",
                      }}
                    >
                      {cat.emoji} {cat.name}
                    </button>
                  ))}
                </div>

                {/* Auto Select Button */}
                <button
                  onClick={handleSmartPost}
                  disabled={fbSmartLoading || !activeFolderUrl}
                  className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#7B6CF7", color: "#fff", boxShadow: fbSmartLoading ? "none" : "0 4px 16px #7B6CF740" }}
                >
                  {fbSmartLoading
                    ? <><span className="animate-spin">⟳</span> AI กำลังเลือกรูป + เขียน Caption...</>
                    : <>🤖 Auto Select — AI เลือกรูป + เขียน Caption</>}
                </button>
                {fbSmartReason && (
                  <div className="mt-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-[9px] text-slate-500 italic">💡 {fbSmartReason}</p>
                    {fbRemaining !== null && (
                      <p className="text-[8px] text-slate-700 mt-1">รูปที่ยังไม่ได้ใช้: {fbRemaining} รูป</p>
                    )}
                  </div>
                )}

                {/* Image Grid */}
                {driveLoading && (
                  <p className="text-[9px] text-slate-600 italic mt-2">กำลังโหลด...</p>
                )}
                {driveImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {driveImages.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImageIds((prev) => prev.includes(img.id) ? prev.filter((id) => id !== img.id) : [...prev, img.id])}
                        className="relative rounded-xl overflow-hidden aspect-square border-2 transition-all"
                        style={{
                          borderColor: selectedImageIds.includes(img.id) ? "#1877F2" : "transparent",
                          boxShadow: selectedImageIds.includes(img.id) ? "0 0 12px #1877F255" : "none",
                        }}
                      >
                        <img
                          src={img.previewUrl}
                          alt={img.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.parentElement!.style.backgroundColor = "#1e293b";
                          }}
                        />
                        {selectedImageIds.includes(img.id) && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "#1877F240" }}>
                            <span className="text-white text-xl font-black">{selectedImageIds.indexOf(img.id) + 1}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {driveImages.length === 0 && !driveLoading && activeFolderIdx !== null && (
                  <p className="text-[9px] text-slate-600 italic">ยังไม่มีรูป — กด Load เพื่อดึงรูปจาก folder</p>
                )}
              </div>

              {/* PREVIEW */}
              {(fbCaption || fbFooter) && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest mb-3 text-slate-600">Preview</p>
                  {selectedImageIds.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {selectedImageIds.map((id) => (
                        <img
                          key={id}
                          src={driveImages.find((i) => i.id === id)?.previewUrl}
                          alt="selected"
                          className="rounded-xl object-cover max-h-24 flex-1 min-w-0"
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {fbCaption}
                    {fbCaption && fbFooter && "\n\n"}
                    {fbFooter}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SCHEDULE TOGGLE */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => { setScheduleEnabled(!scheduleEnabled); setScheduledTime(""); }}
              className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: scheduleEnabled ? "#1877F220" : "rgba(255,255,255,0.03)",
                border: `1px solid ${scheduleEnabled ? "#1877F260" : "rgba(255,255,255,0.06)"}`,
                color: scheduleEnabled ? "#1877F2" : "#475569",
              }}
            >
              📅 {scheduleEnabled ? "ตั้งเวลาอยู่" : "ตั้งเวลาโพสต์"}
            </button>
            {scheduleEnabled && (
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16)}
                className="text-xs px-3 py-2 rounded-lg outline-none"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e2e8f0",
                  colorScheme: "dark",
                }}
              />
            )}
          </div>

          {/* POST BUTTON */}
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={handleFbPost}
              disabled={fbPostLoading || !fbCaption || (scheduleEnabled && !scheduledTime)}
              className="flex items-center gap-3 px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-30"
              style={{ backgroundColor: "#1877F2", color: "#fff", boxShadow: "0 6px 24px #1877F240" }}
            >
              {fbPostLoading
                ? (scheduleEnabled ? "กำลังตั้งเวลา..." : "กำลังโพสต์...")
                : scheduleEnabled ? "📅 Schedule Post" : "📘 Post to Facebook"}
            </button>
            {fbCaption && (
              <button
                onClick={() => { setFbCaption(""); setFbPrompt(""); setSelectedImageIds([]); setFbPostResult(null); setScheduleEnabled(false); setScheduledTime(""); }}
                className="text-[9px] text-slate-700 hover:text-slate-400 uppercase tracking-widest font-bold transition"
              >
                Reset
              </button>
            )}
          </div>

          {/* RESULT */}
          {fbPostResult && (
            <div
              className="mt-5 rounded-2xl px-6 py-4 text-sm font-bold"
              style={{
                backgroundColor: fbPostResult.success ? "#42B72A15" : "#ef444415",
                border: `1px solid ${fbPostResult.success ? "#42B72A40" : "#ef444440"}`,
                color: fbPostResult.success ? "#42B72A" : "#ef4444",
              }}
            >
              {fbPostResult.success ? "✅ " : "❌ "}{fbPostResult.message}
            </div>
          )}
        </div>
      )}

      {/* ─── FB USED IMAGES LOG ─── */}
      {activeSystem === "facebook" && (
        <div className="mt-6">
          <button
            onClick={showUsedImages ? () => setShowUsedImages(false) : handleLoadUsedImages}
            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#475569" }}
          >
            🗂️ {showUsedImages ? "ซ่อนประวัติ" : "ดูรูปที่โพสต์แล้ว"}
            {usedImages.length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[8px]" style={{ backgroundColor: "#1877F220", color: "#1877F2" }}>
                {usedImages.length}
              </span>
            )}
          </button>

          {showUsedImages && (
            <div className="mt-4 rounded-3xl border border-white/5 bg-white/[0.02] p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#1877F2" }}>
                  รูปที่เคยโพสต์ไปแล้ว
                </span>
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[8px] text-slate-700">{usedImages.length} รูป</span>
              </div>

              {usedImages.length === 0 ? (
                <p className="text-[9px] text-slate-700 italic">ยังไม่มีประวัติ</p>
              ) : (
                <div className="space-y-2">
                  {[...usedImages].reverse().map((img, i) => (
                    <div key={img.id} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <img
                        src={`https://drive.google.com/thumbnail?id=${img.id}&sz=w80`}
                        alt={img.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-bold truncate">{img.name || `รูปที่ ${usedImages.length - i}`}</p>
                        <p className="text-[8px] mt-0.5" style={{ color: img.date ? "#64748b" : "#ef4444" }}>
                          📅 {img.date || "ไม่มีข้อมูลวันที่ — ลบแล้วใช้ Auto Select ใหม่"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteUsedImage(img.id)}
                        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all hover:bg-red-500/20"
                        style={{ color: "#ef4444" }}
                        title="ลบออกจากประวัติ (ใช้ซ้ำได้)"
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MARKETING SETUP */}
      {activeSystem === "marketing" && (
        <MarketingTab api={API} />
      )}

      <footer className="py-10 text-center text-[8px] uppercase tracking-[1em] text-slate-800">
        Xeno Command Center // {theme.label} Agent Terminal v3.0
      </footer>
    </main>
  );
}
