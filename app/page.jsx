"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Calculator, 
  Clock, 
  Image as ImageIcon, 
  LayoutDashboard, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Trophy,
  Scale,
  Sparkles,
  ArrowUpRight,
  Trash2
} from "lucide-react";

// Supabase Client Initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function App() {
  const [activeTab, setActiveTab] = useState("journal"); // "journal" | "dashboard"
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // วันและเวลาท้องถิ่นไทย YYYY-MM-DDTHH:mm
  const getNowString = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  // Form State
  const [slPoints, setSlPoints] = useState("");
  const [tpPoints, setTpPoints] = useState("");
  const [useMfo, setUseMfo] = useState(false);
  const [side, setSide] = useState("Buy / Long");
  const [setupName, setSetupName] = useState("Break Running Buy");
  const [entryTime, setEntryTime] = useState(getNowString());
  const [exitTime, setExitTime] = useState("");
  const [outcome, setOutcome] = useState("Win"); // "Win" | "Loss" | "BE"
  const [pnlDollar, setPnlDollar] = useState("");
  const [img1, setImg1] = useState(null);
  const [img2, setImg2] = useState(null);
  const [reason, setReason] = useState("");
  const [mistake, setMistake] = useState("");
  const [solution, setSolution] = useState("");

  // Logic: แปลงวันในสัปดาห์
  const getDayName = (dateStr) => {
    if (!dateStr) return "-";
    const dateOnly = dateStr.split("T")[0];
    if (!dateOnly) return "-";
    const [y, m, d] = dateOnly.split("-").map(Number);
    if (!y || !m || !d) return "-";
    const dateObj = new Date(y, m - 1, d);
    const days = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    return days[dateObj.getDay()] || "-";
  };

  // Logic: ตรวจสอบ Session เทรดตามเวลาไทย
  const getSessionName = (dateStr) => {
    if (!dateStr || !dateStr.includes("T")) return "-";
    const timePart = dateStr.split("T")[1];
    if (!timePart) return "-";
    const [hours, minutes] = timePart.split(":").map(Number);
    if (isNaN(hours)) return "-";
    const time = hours + (minutes || 0) / 60;

    if (time >= 6 && time < 14) return "Asia";
    if (time >= 14 && time < 19.5) return "London";
    if (time >= 19.5 || time < 3) return "New York";
    return "Off-Hours";
  };

  // Logic: คำนวณ Holding Time
  const getHoldingTime = (start, end) => {
    if (!start || !end) return "-";
    const diffMs = new Date(end) - new Date(start);
    if (diffMs <= 0 || isNaN(diffMs)) return "-";
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hrs > 0 ? `${hrs} ชม. ${mins} นาที` : `${mins} นาที`;
  };

  // Logic: คำนวณสัญญา & RR (Gold Futures GC: Multiplier = 2, Risk ต่อไม้ = $100)
  const baseSl = parseFloat(slPoints) || 0;
  const effectiveSl = useMfo ? baseSl * 1.5 : baseSl;
  const calculatedContracts = effectiveSl > 0 ? Math.floor(100 / (effectiveSl * 2)) : 0;
  const tpVal = parseFloat(tpPoints) || 0;
  const calculatedRR = baseSl > 0 && tpVal > 0 ? (tpVal / baseSl).toFixed(2) : "-";

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      if (supabase) {
        const { data, error } = await supabase.from("trades").select("*").order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          setTrades(data);
          localStorage.setItem("tradee_cached_trades", JSON.stringify(data));
          return;
        }
      }
    } catch (err) {
      console.warn("Fetch fallback to LocalStorage", err);
    }
    const local = localStorage.getItem("tradee_cached_trades");
    if (local) setTrades(JSON.parse(local));
  };

  // Clipboard Paste Handler (Ctrl + V)
  const handlePaste = (e, setImageState) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => setImageState(event.target.result);
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  // บันทึกไม้เทรด
  const handleSubmitTrade = async () => {
    if (!slPoints) {
      setStatusMsg({ type: "error", text: "กรุณาระบุระยะ SL" });
      return;
    }
    setLoading(true);
    setStatusMsg({ type: "", text: "" });

    // คำนวณ Realized RR & PnL อัตโนมัติถ้าไม่ได้กรอก PnL มา
    const parsedRR = calculatedRR !== "-" ? parseFloat(calculatedRR) : 1;
    const finalRealizedRR = outcome === "Win" ? parsedRR : (outcome === "Loss" ? -1 : 0);
    const finalPnl = pnlDollar !== "" ? parseFloat(pnlDollar) : (outcome === "Win" ? parsedRR * 100 : (outcome === "Loss" ? -100 : 0));

    const payload = {
      id: "trade_" + Date.now(),
      side,
      setup_name: setupName,
      sl_points: baseSl,
      effective_sl: effectiveSl,
      tp_points: tpVal,
      contracts: calculatedContracts,
      rr: calculatedRR !== "-" ? parseFloat(calculatedRR) : null,
      realized_rr: finalRealizedRR,
      pnl: finalPnl,
      outcome: outcome,
      entry_time: entryTime,
      exit_time: exitTime || null,
      session: getSessionName(entryTime),
      day_of_week: getDayName(entryTime),
      holding_time: getHoldingTime(entryTime, exitTime),
      image_analysis: img1 ? img1.slice(0, 400000) : null, // ป้องกัน payload ล้น
      image_trigger: img2 ? img2.slice(0, 400000) : null,
      reason,
      mistake,
      solution,
      created_at: new Date().toISOString()
    };

    try {
      if (supabase) {
        const { error } = await supabase.from("trades").insert([payload]);
        if (error) console.warn("Supabase save note:", error.message);
      }

      const updated = [payload, ...trades];
      setTrades(updated);
      localStorage.setItem("tradee_cached_trades", JSON.stringify(updated));

      setStatusMsg({ type: "success", text: "บันทึกไม้เทรดเรียบร้อยแล้ว!" });
      setSlPoints("");
      setTpPoints("");
      setPnlDollar("");
      setImg1(null);
      setImg2(null);
      setReason("");
      setMistake("");
      setSolution("");
    } catch (err) {
      const updated = [payload, ...trades];
      setTrades(updated);
      localStorage.setItem("tradee_cached_trades", JSON.stringify(updated));
      setStatusMsg({ type: "success", text: "บันทึกข้อมูลเข้าหน่วยความจำเรียบร้อยแล้ว!" });
    } finally {
      setLoading(false);
    }
  };

  const deleteTrade = async (id) => {
    if (!confirm("ต้องการลบไม้นี้ใช่ไหมครับ?")) return;
    try {
      if (supabase) {
        await supabase.from("trades").delete().eq("id", id);
      }
    } catch (e) {
      console.warn(e);
    }
    const updated = trades.filter((t) => t.id !== id);
    setTrades(updated);
    localStorage.setItem("tradee_cached_trades", JSON.stringify(updated));
  };

  // ================= DASHBOARD CALCULATION =================
  const totalTrades = trades.length;
  const winTrades = trades.filter((t) => t.outcome === "Win" || t.pnl > 0);
  const lossTrades = trades.filter((t) => t.outcome === "Loss" || t.pnl < 0);

  // 1. Win Rate (%) = (ชนะ / ทั้งหมด) * 100
  const winRate = totalTrades > 0 ? ((winTrades.length / totalTrades) * 100).toFixed(1) : "0.0";

  // 2. Average Realized R:R
  const totalWinR = winTrades.reduce((acc, cur) => acc + Math.abs(cur.realized_rr ?? cur.rr ?? 1), 0);
  const totalLossR = lossTrades.reduce((acc, cur) => acc + Math.abs(cur.realized_rr ?? 1), 0);
  const avgWinR = winTrades.length > 0 ? totalWinR / winTrades.length : 0;
  const avgLossR = lossTrades.length > 0 ? totalLossR / lossTrades.length : 1;
  const avgRealizedRR = (avgWinR / (avgLossR || 1)).toFixed(2);

  // 3. Profit Factor = Gross Profit / Gross Loss
  const grossProfit = winTrades.reduce((acc, cur) => acc + Math.abs(cur.pnl ?? 0), 0);
  const grossLoss = lossTrades.reduce((acc, cur) => acc + Math.abs(cur.pnl ?? 0), 0);
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? "∞" : "0.00");

  // 4. Expectancy = (WinRate * AvgWin) - (LossRate * AvgLoss)
  const pWin = totalTrades > 0 ? winTrades.length / totalTrades : 0;
  const pLoss = totalTrades > 0 ? lossTrades.length / totalTrades : 0;
  const expectancy = ((pWin * avgWinR) - (pLoss * avgLossR)).toFixed(2);

  // สัญญารวมที่เทรด
  const totalContracts = trades.reduce((acc, cur) => acc + (cur.contracts || 0), 0);

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 p-4 md:p-8 font-sans">
      
      {/* HEADER SECTION */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {/* Turtle Sammy Custom SVG Logo */}
          <div className="w-12 h-12 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <svg viewBox="0 0 64 64" className="w-9 h-9" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="32" cy="35" rx="19" ry="15" fill="#10B981" />
              <ellipse cx="32" cy="35" rx="15" ry="11" fill="#047857" />
              <path d="M32 24 V46 M17 35 H47 M22 28 L42 42 M22 42 L42 28" stroke="#064E3B" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="32" cy="16" r="7.5" fill="#34D399" />
              {/* Gold Trader Glasses */}
              <rect x="25" y="13.5" width="5.5" height="4" rx="1" fill="#0B1329" stroke="#F59E0B" strokeWidth="1.2" />
              <rect x="33.5" y="13.5" width="5.5" height="4" rx="1" fill="#0B1329" stroke="#F59E0B" strokeWidth="1.2" />
              <line x1="30.5" y1="15.5" x2="33.5" y2="15.5" stroke="#F59E0B" strokeWidth="1.2" />
              <circle cx="15" cy="26" r="3.5" fill="#34D399" />
              <circle cx="49" cy="26" r="3.5" fill="#34D399" />
              <circle cx="16" cy="44" r="3.5" fill="#34D399" />
              <circle cx="48" cy="44" r="3.5" fill="#34D399" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white">Tradee</span>
              <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md font-semibold">Futures Journal</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Symbol: <span className="text-amber-400 font-semibold">GC (Gold Futures)</span> | Risk ต่อไม้: <span className="text-emerald-400 font-semibold">$100</span> | ตัวคูณสัญญา: <span className="text-white font-semibold">2</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("journal")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs md:text-sm font-semibold transition ${
              activeTab === "journal" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <PlusCircle className="w-4 h-4" /> บันทึกการเทรด
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs md:text-sm font-semibold transition ${
              activeTab === "dashboard" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> แดชบอร์ดสรุปผล
          </button>
        </div>
      </header>

      {/* ================= BANNER แฟนให้กำลังใจ (แสดงทุกหน้าสมุด) ================= */}
      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-emerald-400/60 shadow-md bg-slate-800">
            <img 
              src="/image.png" 
              alt="Mumu" 
              className="w-full h-full object-cover object-top hover:scale-105 transition duration-300" 
              onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"; }}
            />
          </div>

          <div className="relative bg-white text-slate-900 rounded-2xl px-5 py-3 shadow-md flex items-center gap-2 border border-emerald-200">
            {/* หางชี้บับเบิ้ลคำพูด */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white"></div>
            <span className="font-semibold text-sm sm:text-base tracking-wide text-slate-800 flex items-center gap-1.5">
              สู้ๆน้าเบ้บๆ หาตังซื้อชาเขียวให้แซมๆหน่อย
              <span className="text-lg">🍵</span>
            </span>
          </div>
        </div>
      </div>

      {/* MAIN BODY CONTAINER */}
      <main className="max-w-7xl mx-auto mt-6 space-y-6">
        {activeTab === "journal" ? (
          /* ================= 1. TAB: บันทึกการเทรด ================= */
          <div className="space-y-6">
            {/* Position Size Calculator */}
            <div className="bg-[#0e1526]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4 text-amber-400 font-semibold text-sm">
                <Calculator className="w-4 h-4" />
                <span>Position Size Calculator (คำนวณสัญญาอัตโนมัติ)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">กรอก SL (ระยะจุด)</label>
                  <input
                    type="number"
                    step="any"
                    value={slPoints}
                    onChange={(e) => setSlPoints(e.target.value)}
                    placeholder="เช่น 5.0"
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">เงื่อนไข MFO</label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={useMfo}
                      onChange={(e) => setUseMfo(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-[#070b13]"
                    />
                    ติ๊ก MFO (SL x 1.5)
                  </label>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Effective SL ที่ใช้จริง</label>
                  <div className="bg-[#070b13]/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 font-mono">
                    {effectiveSl > 0 ? effectiveSl.toFixed(2) : "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">จำนวนสัญญา (ปัดลงเสมอ)</label>
                  <div className="bg-[#070b13] border border-amber-500/40 rounded-xl px-4 py-2.5 text-right font-bold text-amber-400 flex items-center justify-between">
                    <span className="text-xl">{calculatedContracts}</span>
                    <span className="text-xs text-slate-500 font-normal">Contracts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Setup & Time Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Setup Box */}
              <div className="bg-[#0e1526]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" /> Setup & อัตราทด RR
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Side</label>
                    <select
                      value={side}
                      onChange={(e) => setSide(e.target.value)}
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-amber-500"
                    >
                      <option value="Buy / Long">Buy / Long</option>
                      <option value="Sell / Short">Sell / Short</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">ชื่อ Setup</label>
                    <input
                      type="text"
                      value={setupName}
                      onChange={(e) => setSetupName(e.target.value)}
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">กรอก ระยะ TP</label>
                    <input
                      type="number"
                      step="any"
                      value={tpPoints}
                      onChange={(e) => setTpPoints(e.target.value)}
                      placeholder="เช่น 15.0"
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Risk to Reward (RR)</label>
                    <div className="bg-[#070b13] border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold text-amber-400 font-mono">
                      {calculatedRR !== "-" ? `1 : ${calculatedRR}` : "-"}
                    </div>
                  </div>
                </div>

                {/* Additional Quick Outcome selector */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">ผลลัพธ์ไม้</label>
                    <select
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value)}
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                    >
                      <option value="Win">Win (ชนะตาม TP)</option>
                      <option value="Loss">Loss (ชน SL)</option>
                      <option value="BE">BE (เท่าทุน)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">P&L ($ กำไร/ขาดทุนสุทธิ)</label>
                    <input
                      type="number"
                      value={pnlDollar}
                      onChange={(e) => setPnlDollar(e.target.value)}
                      placeholder="+200 หรือ -100"
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Time Box */}
              <div className="bg-[#0e1526]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> วันและเวลา (คำนวณอัตโนมัติ)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Date & Time of Entry</label>
                    <input
                      type="datetime-local"
                      value={entryTime}
                      onChange={(e) => setEntryTime(e.target.value)}
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Date & Time of Exit</label>
                    <input
                      type="datetime-local"
                      value={exitTime}
                      onChange={(e) => setExitTime(e.target.value)}
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 bg-[#070b13]/80 border border-slate-800/60 p-3 rounded-xl text-center">
                  <div>
                    <div className="text-[10px] text-slate-400">วัน</div>
                    <div className="text-xs font-semibold text-white mt-0.5">{getDayName(entryTime)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Session (เวลาไทย)</div>
                    <div className="text-xs font-bold text-amber-400 mt-0.5">{getSessionName(entryTime)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Holding Time</div>
                    <div className="text-xs font-semibold text-slate-300 mt-0.5">{getHoldingTime(entryTime, exitTime)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Paste Image Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                tabIndex={0}
                onPaste={(e) => handlePaste(e, setImg1)}
                className="relative bg-[#0e1526]/60 border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 min-h-[180px] flex flex-col items-center justify-center cursor-pointer transition focus:outline-none focus:border-amber-500"
              >
                {img1 ? (
                  <div className="relative w-full flex flex-col items-center">
                    <img src={img1} alt="Setup Chart" className="max-h-56 object-contain rounded-lg" />
                    <button onClick={() => setImg1(null)} className="mt-2 text-xs text-rose-400 hover:underline">ลบรูปภาพ</button>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-300">ภาพที่ 1: Reason of Setup / การวิเคราะห์</p>
                    <p className="text-[11px] text-amber-400 mt-1">คลิกที่นี่แล้วกด Ctrl + V เพื่อวางภาพได้ทันที</p>
                  </div>
                )}
              </div>

              <div
                tabIndex={0}
                onPaste={(e) => handlePaste(e, setImg2)}
                className="relative bg-[#0e1526]/60 border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 min-h-[180px] flex flex-col items-center justify-center cursor-pointer transition focus:outline-none focus:border-amber-500"
              >
                {img2 ? (
                  <div className="relative w-full flex flex-col items-center">
                    <img src={img2} alt="Trigger Chart" className="max-h-56 object-contain rounded-lg" />
                    <button onClick={() => setImg2(null)} className="mt-2 text-xs text-rose-400 hover:underline">ลบรูปภาพ</button>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-300">ภาพที่ 2: Close Up จุดเข้าจริง</p>
                    <p className="text-[11px] text-amber-400 mt-1">คลิกที่นี่แล้วกด Ctrl + V เพื่อวางภาพได้ทันที</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reflection Texts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">เหตุผลที่เข้า (อธิบายภาพที่ 1)</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ระบุโครงสร้างราคา หรือแนวรับแนวด้าน..."
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">ข้อผิดพลาด</label>
                <textarea
                  rows={3}
                  value={mistake}
                  onChange={(e) => setMistake(e.target.value)}
                  placeholder="เช่น เข้าเร็วไป, ตั้ง SL แคบเกิน..."
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">วิธีแก้ไข</label>
                <textarea
                  rows={3}
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="รอบหน้าควรรอการคอนเฟิร์มแบบไหน..."
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {statusMsg.text && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-xs ${statusMsg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"}`}>
                {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <button
              onClick={handleSubmitTrade}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-2xl shadow-xl transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {loading ? "กำลังบันทึก..." : "บันทึกไม้เทรดนี้ลงระบบ"}
            </button>
          </div>
        ) : (
          /* ================= 2. TAB: แดชบอร์ดสรุปผล ================= */
          <div className="space-y-6">
            {/* 4 Professional Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Win Rate */}
              <div className="bg-[#0e1526] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Win Rate (%)</span>
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-black text-white">{winRate}%</div>
                <p className="text-[11px] text-slate-500 mt-2">ชนะ {winTrades.length} / แพ้ {lossTrades.length} ไม้</p>
                <div className="w-full bg-slate-800/60 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${winRate}%` }}></div>
                </div>
              </div>

              {/* Average Realized R:R */}
              <div className="bg-[#0e1526] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Avg Realized R:R</span>
                  <Scale className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-white">+{avgRealizedRR}R</div>
                <p className="text-[11px] text-slate-500 mt-2">Win Avg: +{avgWinR.toFixed(2)}R | Loss: -{avgLossR.toFixed(2)}R</p>
                <div className="text-[11px] text-emerald-400 font-medium mt-3">อัตราตอบแทนต่อ 1R</div>
              </div>

              {/* Profit Factor */}
              <div className="bg-[#0e1526] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Profit Factor</span>
                  <Sparkles className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-3xl font-black text-white">{profitFactor}</div>
                <p className="text-[11px] text-slate-500 mt-2">+${grossProfit.toFixed(0)} / -${grossLoss.toFixed(0)}</p>
                <div className="mt-2.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${parseFloat(profitFactor) >= 1.5 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                    {parseFloat(profitFactor) >= 1.5 ? 'Good System (> 1.5)' : 'Keep Refining'}
                  </span>
                </div>
              </div>

              {/* Expectancy */}
              <div className="bg-[#0e1526] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Expectancy (ต่อไม้)</span>
                  <ArrowUpRight className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-black text-white">{expectancy}R</div>
                <p className="text-[11px] text-slate-500 mt-2">Net P&L: ${(grossProfit - grossLoss).toFixed(2)}</p>
                <div className="text-[11px] text-amber-400 font-medium mt-3">สัญญารวม: {totalContracts} Contracts</div>
              </div>
            </div>

            {/* Recent Trades Table */}
            <div className="bg-[#0e1526] border border-slate-800/80 rounded-2xl p-6 shadow-xl overflow-hidden">
              <h2 className="text-sm font-bold text-slate-100 mb-4">ประวัติการเทรดล่าสุด ({trades.length} ไม้)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#070b13] text-[11px] text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3">วัน/เวลา</th>
                      <th className="p-3">Session</th>
                      <th className="p-3">Side</th>
                      <th className="p-3">Setup</th>
                      <th className="p-3">สัญญา</th>
                      <th className="p-3">RR</th>
                      <th className="p-3">ข้อผิดพลาด / บันทึก</th>
                      <th className="p-3 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {trades.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-3 text-slate-400 whitespace-nowrap">
                          <div>{t.entry_time?.replace('T', ' ') || '-'}</div>
                          <div className="text-[10px] text-slate-500">{t.day_of_week}</div>
                        </td>
                        <td className="p-3 text-amber-400 font-medium">{t.session || "-"}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.side?.includes("Buy") ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}>
                            {t.side}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-200">{t.setup_name}</td>
                        <td className="p-3 font-bold text-amber-400">{t.contracts}</td>
                        <td className="p-3 font-bold text-white">{t.rr ? `1:${t.rr}` : "-"}</td>
                        <td className="p-3 text-slate-400 max-w-[200px] truncate" title={t.mistake || t.reason}>
                          {t.mistake || t.reason || "-"}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => deleteTrade(t.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition"
                            title="ลบไม้นี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {trades.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          ยังไม่มีข้อมูลบันทึกในสมุดนี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
