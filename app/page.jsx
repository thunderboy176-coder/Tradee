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

  // ค่าคงที่ของระบบ: MNQ, Risk = $250 USD, Multiplier = $2 ต่อจุด
  const RISK_USD = 250;
  const MULTIPLIER = 2;
  const SYMBOL = "MNQ";

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
  const [outcome, setOutcome] = useState("Win");
  const [pnlDollar, setPnlDollar] = useState("");
  const [img1, setImg1] = useState(null);
  const [img2, setImg2] = useState(null);
  const [reason, setReason] = useState("");
  const [mistake, setMistake] = useState("");
  const [solution, setSolution] = useState("");

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

  const getHoldingTime = (start, end) => {
    if (!start || !end) return "-";
    const diffMs = new Date(end) - new Date(start);
    if (diffMs <= 0 || isNaN(diffMs)) return "-";
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hrs > 0 ? `${hrs} ชม. ${mins} นาที` : `${mins} นาที`;
  };

  // Logic: MNQ Multiplier = 2, Risk ต่อไม้ = $250 USD
  const baseSl = parseFloat(slPoints) || 0;
  const effectiveSl = useMfo ? baseSl * 1.5 : baseSl;
  const denominator = effectiveSl * MULTIPLIER;
  const calculatedContracts = denominator > 0 ? Math.floor(RISK_USD / denominator) : 0;
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

  const handleSubmitTrade = async () => {
    if (!slPoints) {
      setStatusMsg({ type: "error", text: "กรุณาระบุระยะ SL" });
      return;
    }
    setLoading(true);
    setStatusMsg({ type: "", text: "" });

    const parsedRR = calculatedRR !== "-" ? parseFloat(calculatedRR) : 1;
    const finalRealizedRR = outcome === "Win" ? parsedRR : (outcome === "Loss" ? -1 : 0);
    const finalPnl = pnlDollar !== "" ? parseFloat(pnlDollar) : (outcome === "Win" ? parsedRR * RISK_USD : (outcome === "Loss" ? -RISK_USD : 0));

    const payload = {
      id: "trade_" + Date.now(),
      symbol: SYMBOL,
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
      image_analysis: img1 ? img1.slice(0, 400000) : null,
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

      setStatusMsg({ type: "success", text: "บันทึกไม้เทรด MNQ เรียบร้อยแล้ว!" });
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

  // Metrics
  const totalTrades = trades.length;
  const winTrades = trades.filter((t) => t.outcome === "Win" || t.pnl > 0);
  const lossTrades = trades.filter((t) => t.outcome === "Loss" || t.pnl < 0);

  const winRate = totalTrades > 0 ? ((winTrades.length / totalTrades) * 100).toFixed(1) : "0.0";
  const totalWinR = winTrades.reduce((acc, cur) => acc + Math.abs(cur.realized_rr ?? cur.rr ?? 1), 0);
  const totalLossR = lossTrades.reduce((acc, cur) => acc + Math.abs(cur.realized_rr ?? 1), 0);
  const avgWinR = winTrades.length > 0 ? totalWinR / winTrades.length : 0;
  const avgLossR = lossTrades.length > 0 ? totalLossR / lossTrades.length : 1;
  const avgRealizedRR = (avgWinR / (avgLossR || 1)).toFixed(2);

  const grossProfit = winTrades.reduce((acc, cur) => acc + Math.abs(cur.pnl ?? 0), 0);
  const grossLoss = lossTrades.reduce((acc, cur) => acc + Math.abs(cur.pnl ?? 0), 0);
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? "∞" : "0.00");

  const pWin = totalTrades > 0 ? winTrades.length / totalTrades : 0;
  const pLoss = totalTrades > 0 ? lossTrades.length / totalTrades : 0;
  const expectancy = ((pWin * avgWinR) - (pLoss * avgLossR)).toFixed(2);
  const totalContracts = trades.reduce((acc, cur) => acc + (cur.contracts || 0), 0);

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 p-4 md:p-8 font-sans">
      
      {/* HEADER SECTION */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          
          {/* SAMMY TURTLE LOGO (ถอดแบบจากตุ๊กตาเต่าเขียวตาโต มีเปลือกตาอ้อนๆ) */}
          <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-950/40 border-2 border-emerald-500/50 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/10 shrink-0 p-1">
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Shell Base */}
              <ellipse cx="50" cy="62" rx="38" ry="30" fill="#7fa648" />
              <ellipse cx="50" cy="62" rx="33" ry="25" fill="#5e8230" />
              <path d="M50 40 V80 M24 62 H76 M31 50 L69 74 M31 74 L69 50" stroke="#436120" strokeWidth="2.5" strokeLinecap="round" />
              
              {/* Head */}
              <circle cx="50" cy="42" r="30" fill="#9cd966" />
              <path d="M24 38 C24 24 36 16 50 16 C64 16 76 24 76 38" fill="#88c551" />
              
              {/* Left Sammy Eye (Big, glassy, heavy lid) */}
              <circle cx="36" cy="40" r="10" fill="#132b0e" />
              <circle cx="36" cy="40" r="8.5" fill="#081805" />
              <circle cx="38" cy="38" r="3" fill="#ffffff" />
              {/* Plush Eyebrow/Lid */}
              <path d="M26 33 C30 28 42 28 46 33" stroke="#669c32" strokeWidth="4" strokeLinecap="round" />

              {/* Right Sammy Eye */}
              <circle cx="64" cy="40" r="10" fill="#132b0e" />
              <circle cx="64" cy="40" r="8.5" fill="#081805" />
              <circle cx="66" cy="38" r="3" fill="#ffffff" />
              {/* Plush Eyebrow/Lid */}
              <path d="M54 33 C58 28 70 28 74 33" stroke="#669c32" strokeWidth="4" strokeLinecap="round" />

              {/* Nostrils & Soft Smile */}
              <circle cx="47" cy="50" r="1.3" fill="#4d7729" />
              <circle cx="53" cy="50" r="1.3" fill="#4d7729" />
              <path d="M42 56 Q50 63 58 56" stroke="#365719" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl md:text-4xl font-black tracking-tight text-white">Tradee</span>
              <span className="text-xs md:text-sm bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wider">
                MNQ Journal
              </span>
            </div>
            <div className="text-xs md:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>Symbol: <strong className="text-amber-400">MNQ (Micro Nasdaq-100)</strong></span>
              <span className="text-slate-600">|</span>
              <span>Risk: <strong className="text-emerald-400">$250 / ไม้</strong></span>
              <span className="text-slate-600">|</span>
              <span>Multiplier: <strong className="text-white">$2 / Point</strong></span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab("journal")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold transition ${
              activeTab === "journal" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <PlusCircle className="w-4 h-4" /> บันทึกการเทรด
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold transition ${
              activeTab === "dashboard" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> แดชบอร์ดสรุปผล
          </button>
        </div>
      </header>

      {/* ================= BANNER รูปแฟนขนาดใหญ่ + ข้อความให้กำลังใจ ================= */}
      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-gradient-to-r from-emerald-950/60 via-[#0c1524] to-emerald-950/60 border border-emerald-500/40 rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row items-center gap-6 shadow-2xl relative overflow-hidden">
          
          {/* กรอบรูปแฟนขนาดใหญ่ ชัดเจน */}
          <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-3xl overflow-hidden shrink-0 border-4 border-emerald-400/80 shadow-2xl bg-slate-800 relative">
            <img 
              src="/image.png" 
              alt="เบ้บๆ" 
              className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" 
              onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"; }}
            />
          </div>

          {/* บับเบิ้ลคำพูดสีขาวมีหางชี้ */}
          <div className="relative bg-white text-slate-900 rounded-2xl md:rounded-3xl px-6 py-4 md:py-5 shadow-2xl border-2 border-emerald-300 max-w-xl">
            <div className="hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-t-10 border-t-transparent border-b-10 border-b-transparent border-r-12 border-r-white"></div>
            
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Mumu's Support</span>
              <span>💚</span>
            </div>
            <p className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-snug">
              “สู้ๆน้าเบ้บๆ หาตังซื้อชาเขียวให้แซมๆหน่อย” 
              <span className="text-xl md:text-2xl ml-1.5">🍵</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">เทรด MNQ ตามแผน ล็อกความเสี่ยงไม่เกิน $250 USD เสมอนะครับ</p>
          </div>
        </div>
      </div>

      {/* MAIN VIEW CONTENT */}
      <main className="max-w-7xl mx-auto mt-6 space-y-6">
        {activeTab === "journal" ? (
          /* ================= TAB 1: บันทึกการเทรด MNQ ($250 RISK) ================= */
          <div className="space-y-6">
            
            {/* Position Size Calculator for MNQ */}
            <div className="bg-[#0e1526]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm md:text-base">
                  <Calculator className="w-5 h-5" />
                  <span>MNQ Position Size Calculator (ล็อกความเสี่ยง $250 USD)</span>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-semibold">
                  1 Point = $2 USD
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">กรอกระยะ SL (จุด Points)</label>
                  <input
                    type="number"
                    step="any"
                    value={slPoints}
                    onChange={(e) => setSlPoints(e.target.value)}
                    placeholder="เช่น 25.0 จุด"
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
                  <label className="block text-xs text-slate-400 mb-1.5">Effective SL จุดที่ใช้จริง</label>
                  <div className="bg-[#070b13]/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 font-mono">
                    {effectiveSl > 0 ? `${effectiveSl.toFixed(2)} pts` : "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">สัญญา MNQ ที่เปิดได้ (ปัดลง)</label>
                  <div className="bg-[#070b13] border border-amber-500/50 rounded-xl px-4 py-2.5 text-right font-bold text-amber-400 flex items-center justify-between shadow-inner">
                    <span className="text-2xl">{calculatedContracts}</span>
                    <span className="text-xs text-slate-400 font-normal">Contracts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Setup & Time Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Setup Box */}
              <div className="bg-[#0e1526]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
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
                    <label className="block text-xs text-slate-400 mb-1.5">กรอกระยะ TP (จุด Points)</label>
                    <input
                      type="number"
                      step="any"
                      value={tpPoints}
                      onChange={(e) => setTpPoints(e.target.value)}
                      placeholder="เช่น 75.0 จุด"
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Risk to Reward (RR)</label>
                    <div className="bg-[#070b13] border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-amber-400 font-mono">
                      {calculatedRR !== "-" ? `1 : ${calculatedRR}` : "-"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">ผลลัพธ์ไม้</label>
                    <select
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value)}
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                    >
                      <option value="Win">Win (ชนะตามเป้า)</option>
                      <option value="Loss">Loss (ชน SL)</option>
                      <option value="BE">BE (เสมอทุน)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">P&L ($ กำไร/ขาดทุนสุทธิ)</label>
                    <input
                      type="number"
                      value={pnlDollar}
                      onChange={(e) => setPnlDollar(e.target.value)}
                      placeholder="+500 หรือ -250"
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Time Box */}
              <div className="bg-[#0e1526]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
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

                <div className="mt-4 grid grid-cols-3 gap-2 bg-[#070b13]/80 border border-slate-800/60 p-3.5 rounded-xl text-center">
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
                className="relative bg-[#0e1526]/60 border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 min-h-[190px] flex flex-col items-center justify-center cursor-pointer transition focus:outline-none focus:border-amber-500"
              >
                {img1 ? (
                  <div className="relative w-full flex flex-col items-center">
                    <img src={img1} alt="Setup Chart" className="max-h-56 object-contain rounded-lg" />
                    <button onClick={() => setImg1(null)} className="mt-2 text-xs text-rose-400 hover:underline">ลบรูปภาพ</button>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-300">ภาพที่ 1: Reason of Setup / การวิเคราะห์กราฟ</p>
                    <p className="text-[11px] text-amber-400 mt-1">คลิกที่นี่แล้วกด Ctrl + V เพื่อวางภาพได้ทันที</p>
                  </div>
                )}
              </div>

              <div
                tabIndex={0}
                onPaste={(e) => handlePaste(e, setImg2)}
                className="relative bg-[#0e1526]/60 border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 min-h-[190px] flex flex-col items-center justify-center cursor-pointer transition focus:outline-none focus:border-amber-500"
              >
                {img2 ? (
                  <div className="relative w-full flex flex-col items-center">
                    <img src={img2} alt="Trigger Chart" className="max-h-56 object-contain rounded-lg" />
                    <button onClick={() => setImg2(null)} className="mt-2 text-xs text-rose-400 hover:underline">ลบรูปภาพ</button>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-300">ภาพที่ 2: Close Up จุดเข้าออเดอร์จริง</p>
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
                  placeholder="ระบุโครงสร้างราคา Liquidity หรือ Setup..."
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">ข้อผิดพลาด</label>
                <textarea
                  rows={3}
                  value={mistake}
                  onChange={(e) => setMistake(e.target.value)}
                  placeholder="เช่น เข้าเร็วไป, อารมณ์ FOMO..."
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">วิธีแก้ไข</label>
                <textarea
                  rows={3}
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="แนวทางปรับปรุงในไม้ถัดไป..."
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
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-black rounded-2xl shadow-xl transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {loading ? "กำลังบันทึก..." : "บันทึกไม้เทรด MNQ ($250 Risk) นี้ลงระบบ"}
            </button>
          </div>
        ) : (
          /* ================= TAB 2: แดชบอร์ดสรุปผล MNQ ================= */
          <div className="space-y-6">
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
                <p className="text-[11px] text-slate-500 mt-2">Win: +{avgWinR.toFixed(2)}R | Loss: -{avgLossR.toFixed(2)}R</p>
                <div className="text-[11px] text-emerald-400 font-medium mt-3">อัตราตอบแทนต่อความเสี่ยง</div>
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
                <div className="text-[11px] text-amber-400 font-medium mt-3">สัญญารวม: {totalContracts} MNQ</div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-[#0e1526] border border-slate-800/80 rounded-2xl p-6 shadow-xl overflow-hidden">
              <h2 className="text-sm font-bold text-slate-100 mb-4">ประวัติการเทรด MNQ ล่าสุด ({trades.length} ไม้)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#070b13] text-[11px] text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3">วัน/เวลา</th>
                      <th className="p-3">Session</th>
                      <th className="p-3">Side</th>
                      <th className="p-3">Setup</th>
                      <th className="p-3">สัญญา MNQ</th>
                      <th className="p-3">RR</th>
                      <th className="p-3">P&L ($)</th>
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
                        <td className={`p-3 font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.pnl >= 0 ? `+$${t.pnl}` : `-$${Math.abs(t.pnl)}`}
                        </td>
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
                        <td colSpan={9} className="p-8 text-center text-slate-500">
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
