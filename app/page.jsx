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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function App() {
  const [activeTab, setActiveTab] = useState("journal");
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // ล็อกพารามิเตอร์ระบบ: MNQ, Risk = $250 USD, Multiplier = $2 ต่อจุด
  const RISK_USD = 250;
  const MULTIPLIER = 2;
  const SYMBOL = "MNQ";

  const getNowString = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  // Form State ตาม Wireframe
  const [slPoints, setSlPoints] = useState("");
  const [useMfo, setUseMfo] = useState(false);
  const [side, setSide] = useState("Buy / Long");
  const [setupName, setSetupName] = useState("Break Running Buy");
  const [entryTime, setEntryTime] = useState(getNowString());
  const [exitTime, setExitTime] = useState("");
  const [tpPoints, setTpPoints] = useState("");
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

  // Logic การคำนวณสัญญา: Risk / (SL * 2) และปัดเศษลงเสมอ
  const rawSl = parseFloat(slPoints) || 0;
  const bufferSl = rawSl * 1.5;
  const effectiveSl = useMfo ? bufferSl : rawSl;
  const denominator = effectiveSl * MULTIPLIER;
  const calculatedContracts = denominator > 0 ? Math.floor(RISK_USD / denominator) : 0;
  const tpVal = parseFloat(tpPoints) || 0;
  const calculatedRR = rawSl > 0 && tpVal > 0 ? (tpVal / rawSl).toFixed(2) : "-";

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
      console.warn(err);
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
      sl_points: rawSl,
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
        if (error) console.warn(error.message);
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
      setStatusMsg({ type: "success", text: "บันทึกข้อมูลเข้าเครื่องเรียบร้อยแล้ว!" });
    } finally {
      setLoading(false);
    }
  };

  const deleteTrade = async (id) => {
    if (!confirm("ต้องการลบไม้นี้ใช่ไหมครับ?")) return;
    try {
      if (supabase) await supabase.from("trades").delete().eq("id", id);
    } catch (e) {
      console.warn(e);
    }
    const updated = trades.filter((t) => t.id !== id);
    setTrades(updated);
    localStorage.setItem("tradee_cached_trades", JSON.stringify(updated));
  };

  // Dashboard Calculations
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
    <div className="min-h-screen bg-[#070e17] text-slate-200 p-4 md:p-8 font-sans">
      
      {/* HEADER: โลโก้เดิมเป๊ะ + แบรนด์ Tradee */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-cyan-950/80">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-cyan-500/40 shadow-lg shadow-cyan-950/50 bg-slate-900 shrink-0">
            <img 
              src="/logo.png" 
              alt="Tradee Turtle Sammy" 
              className="w-full h-full object-contain"
              onError={(e) => { e.currentTarget.src = "/Gemini_Generated_Image_higdjrhigdjrhigd.jpg"; }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl md:text-4xl font-black tracking-tight text-white">Tradee</span>
              <span className="text-xs bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2.5 py-0.5 rounded-lg font-bold uppercase">
                MNQ Journal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Don't rush what takes time • ล็อก Risk ${RISK_USD} USD</p>
          </div>
        </div>

        <div className="flex bg-[#0b1626] border border-cyan-950 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("journal")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs md:text-sm font-bold transition ${
              activeTab === "journal" ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <PlusCircle className="w-4 h-4" /> บันทึกการเทรด (Page 1)
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs md:text-sm font-bold transition ${
              activeTab === "dashboard" ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> แดชบอร์ดสรุปผล
          </button>
        </div>
      </header>

      {/* BANNER รูปแฟนขนาดใหญ่ + ข้อความให้กำลังใจ */}
      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-gradient-to-r from-[#0a1829] via-[#0d1d33] to-[#0a1829] border border-cyan-900/50 rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
          <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-3xl overflow-hidden shrink-0 border-4 border-cyan-500/60 shadow-2xl bg-slate-900">
            <img 
              src="/image.png" 
              alt="เบ้บๆ" 
              className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.currentTarget.src = "/babe.png"; }}
            />
          </div>

          <div className="relative bg-white text-slate-900 rounded-2xl md:rounded-3xl px-6 py-4 md:py-5 shadow-2xl border border-cyan-200 max-w-xl">
            <div className="hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-10 border-r-white"></div>
            <div className="text-cyan-800 text-[11px] font-bold uppercase tracking-wider mb-1">Mumu's Support 🍵</div>
            <p className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-snug">
              “สู้ๆน้าเบ้บๆ หาตังซื้อชาเขียวให้แซมๆหน่อย”
            </p>
            <p className="text-xs text-slate-500 mt-1">เทรด MNQ สบายใจ คุมความเสี่ยงไม่เกิน $250 USD ต่อไม้นะครับ</p>
          </div>
        </div>
      </div>

      {/* MAIN VIEW */}
      <main className="max-w-7xl mx-auto mt-6">
        {activeTab === "journal" ? (
          /* ================= LAYOUT ตรงตาม WIREFRAME รูปแบบเป๊ะ ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* ฝั่งซ้าย (LEFT COLUMN) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* 1. กล่องบน: Symbol / Risk / Comist */}
              <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-4 shadow-md">
                <div className="text-[11px] text-cyan-400 font-semibold uppercase tracking-wider mb-2">
                  Symbol / จำนวน Risk เป็น USD / Comist (ล็อกไว้เบื้องหลัง)
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#070e17] p-2.5 rounded-xl border border-cyan-950">
                    <div className="text-[10px] text-slate-400">Symbol</div>
                    <div className="text-base font-black text-cyan-300 mt-0.5">{SYMBOL}</div>
                  </div>
                  <div className="bg-[#070e17] p-2.5 rounded-xl border border-cyan-950">
                    <div className="text-[10px] text-slate-400">Risk / ไม้</div>
                    <div className="text-base font-black text-emerald-400 mt-0.5">${RISK_USD}</div>
                  </div>
                  <div className="bg-[#070e17] p-2.5 rounded-xl border border-cyan-950">
                    <div className="text-[10px] text-slate-400">Multiplier</div>
                    <div className="text-base font-black text-white mt-0.5">${MULTIPLIER}/pt</div>
                  </div>
                </div>
              </div>

              {/* 2. ภาพที่ 1: Reason of set up / ภาพการวิเคราะห์ */}
              <div
                tabIndex={0}
                onPaste={(e) => handlePaste(e, setImg1)}
                className="relative bg-[#0b1626] border-2 border-dashed border-cyan-900/70 hover:border-cyan-500 rounded-2xl p-4 min-h-[220px] flex flex-col items-center justify-center cursor-pointer transition focus:outline-none"
              >
                {img1 ? (
                  <div className="relative w-full flex flex-col items-center">
                    <img src={img1} alt="ภาพที่ 1 การวิเคราะห์" className="max-h-56 object-contain rounded-lg" />
                    <button onClick={() => setImg1(null)} className="mt-2 text-xs text-rose-400 hover:underline">ลบรูปภาพ</button>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-200">ภาพ reason of set up / ภาพการวิเคราะห์</p>
                    <p className="text-xs text-cyan-400 mt-1 font-mono">ภาพ 1 คลิกแล้วกด Ctrl + V วางได้เลย</p>
                  </div>
                )}
              </div>

              {/* 3. ภาพที่ 2: Close up จุดเข้าจริงๆ */}
              <div
                tabIndex={0}
                onPaste={(e) => handlePaste(e, setImg2)}
                className="relative bg-[#0b1626] border-2 border-dashed border-cyan-900/70 hover:border-cyan-500 rounded-2xl p-4 min-h-[220px] flex flex-col items-center justify-center cursor-pointer transition focus:outline-none"
              >
                {img2 ? (
                  <div className="relative w-full flex flex-col items-center">
                    <img src={img2} alt="ภาพที่ 2 จุดเข้าจริง" className="max-h-56 object-contain rounded-lg" />
                    <button onClick={() => setImg2(null)} className="mt-2 text-xs text-rose-400 hover:underline">ลบรูปภาพ</button>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-200">ภาพ close up จุดเข้าจริงๆ / ภาพที่ 2</p>
                    <p className="text-xs text-cyan-400 mt-1 font-mono">ภาพ 2 คลิกแล้วกด Ctrl + V วางได้เลย</p>
                  </div>
                )}
              </div>
            </div>

            {/* ฝั่งขวา (RIGHT COLUMN) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* แถว 1: กรอก SL | SL Buffer = SL * 1.5 | จำนวนสัญญา (Risk / (SL * 2)) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-4 shadow-md items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">กรอก SL (จุด)</label>
                  <input
                    type="number"
                    step="any"
                    value={slPoints}
                    onChange={(e) => setSlPoints(e.target.value)}
                    placeholder="เช่น 20.0"
                    className="w-full bg-[#070e17] border border-cyan-900 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <div className="mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-cyan-300">
                      <input
                        type="checkbox"
                        checked={useMfo}
                        onChange={(e) => setUseMfo(e.target.checked)}
                        className="rounded border-cyan-800 text-cyan-600 focus:ring-cyan-500 bg-[#070e17]"
                      />
                      <span>ติ๊ก MFO, MOF</span>
                    </label>
                  </div>
                </div>

                <div className="bg-[#070e17] p-3 rounded-xl border border-cyan-950 text-center">
                  <div className="text-[11px] text-slate-400">SL Buffer (SL * 1.5)</div>
                  <div className="text-sm font-mono font-bold text-cyan-400 mt-1">
                    {rawSl > 0 ? bufferSl.toFixed(2) : "-"}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {useMfo ? "กำลังใช้ Buffer คำนวณ" : "ไม่ได้ใช้ Buffer"}
                  </div>
                </div>

                <div className="bg-cyan-950/40 p-3 rounded-xl border border-cyan-700/60 text-center">
                  <div className="text-[11px] text-cyan-300 font-semibold">จำนวน สัญญา (ปัดลงเสมอ)</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                    {calculatedContracts}
                  </div>
                  <div className="text-[10px] text-slate-400">สูตร: ${RISK_USD} / (SL * 2)</div>
                </div>
              </div>

              {/* แถว 2: Side | ชื่อ Setup เลือกจาก 6 ชนิด */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-4 shadow-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Side</label>
                  <select
                    value={side}
                    onChange={(e) => setSide(e.target.value)}
                    className="w-full bg-[#070e17] border border-cyan-900 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Buy / Long">Buy / Long</option>
                    <option value="Sell / Short">Sell / Short</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">ชื่อ set up</label>
                  <select
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    className="w-full bg-[#070e17] border border-cyan-900 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Break Running Buy">Break Running Buy</option>
                    <option value="Break Running Sell">Break Running Sell</option>
                    <option value="Testing Running Buy">Testing Running Buy</option>
                    <option value="Testing Running Sell">Testing Running Sell</option>
                    <option value="Following Running Buy">Following Running Buy</option>
                    <option value="Following Running Sell">Following Running Sell</option>
                  </select>
                </div>
              </div>

              {/* แถว 3: วัน & Session & เวลา */}
              <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-4 shadow-md space-y-3">
                <div className="text-xs font-semibold text-cyan-400">วัน/เวลา และ Session (คำนวณอัตโนมัติ)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Date & Time of Entry</label>
                    <input
                      type="datetime-local"
                      value={entryTime}
                      onChange={(e) => setEntryTime(e.target.value)}
                      className="w-full bg-[#070e17] border border-cyan-900 rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Date & Time of Exit</label>
                    <input
                      type="datetime-local"
                      value={exitTime}
                      onChange={(e) => setExitTime(e.target.value)}
                      className="w-full bg-[#070e17] border border-cyan-900 rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#070e17] p-2.5 rounded-xl border border-cyan-950 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400">วัน (จ-ศ)</div>
                    <div className="text-xs font-bold text-white mt-0.5">{getDayName(entryTime)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Session (เวลาไทย)</div>
                    <div className="text-xs font-bold text-cyan-300 mt-0.5">{getSessionName(entryTime)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Holding TIME</div>
                    <div className="text-xs font-bold text-slate-300 mt-0.5">{getHoldingTime(entryTime, exitTime)}</div>
                  </div>
                </div>
              </div>

              {/* แถว 4: กรอกระยะ TP | RR ที่ถูกคำนวณ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-4 shadow-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">กรอก ระยะ TP (จุด)</label>
                  <input
                    type="number"
                    step="any"
                    value={tpPoints}
                    onChange={(e) => setTpPoints(e.target.value)}
                    placeholder="เช่น 60.0"
                    className="w-full bg-[#070e17] border border-cyan-900 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="bg-[#070e17] p-2.5 rounded-xl border border-cyan-950 flex flex-col justify-center text-center">
                  <div className="text-[11px] text-slate-400">RR ที่ถูกคำนวณ</div>
                  <div className="text-xl font-bold text-cyan-400 font-mono mt-0.5">
                    {calculatedRR !== "-" ? `1 : ${calculatedRR}` : "-"}
                  </div>
                </div>
              </div>

              {/* กล่องบันทึกผลลัพธ์ไม้ */}
              <div className="grid grid-cols-2 gap-3 bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-3.5 shadow-md">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">ผลลัพธ์ของไม้</label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="w-full bg-[#070e17] border border-cyan-900 rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:border-cyan-500"
                  >
                    <option value="Win">Win (ชนะ)</option>
                    <option value="Loss">Loss (แพ้/ชน SL)</option>
                    <option value="BE">BE (เสมอทุน)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">P&L ($ USD กำไร/ขาดทุน)</label>
                  <input
                    type="number"
                    value={pnlDollar}
                    onChange={(e) => setPnlDollar(e.target.value)}
                    placeholder="+500 หรือ -250"
                    className="w-full bg-[#070e17] border border-cyan-900 rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              {/* แถว 5: เหตุผลที่เข้า | ข้อผิดพลาด | วิธีแก้ไข */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-3 shadow-md">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    เหตุผลที่เข้า (อธิบายภาพที่ 1)
                  </label>
                  <textarea
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="โครงสร้างราคา, แนวรับต้าน..."
                    className="w-full bg-[#070e17] border border-cyan-900 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-3 shadow-md">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ข้อผิดพลาด
                  </label>
                  <textarea
                    rows={4}
                    value={mistake}
                    onChange={(e) => setMistake(e.target.value)}
                    placeholder="เช่น เข้าเร็วไป, อารมณ์..."
                    className="w-full bg-[#070e17] border border-cyan-900 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-3 shadow-md">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    วิธีแก้ไข
                  </label>
                  <textarea
                    rows={4}
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="รอบหน้าต้องรอคอนเฟิร์ม..."
                    className="w-full bg-[#070e17] border border-cyan-900 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {statusMsg.text && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-xs ${statusMsg.type === "success" ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800" : "bg-rose-950/70 text-rose-400 border border-rose-800"}`}>
                  {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              <button
                onClick={handleSubmitTrade}
                disabled={loading}
                className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl shadow-xl transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {loading ? "กำลังบันทึกข้อมูล..." : "บันทึกไม้เทรด MNQ ($250 Risk) นี้ลงระบบ"}
              </button>
            </div>
          </div>
        ) : (
          /* ================= TAB 2: แดชบอร์ดสรุปผลเชิงสถิติ ================= */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Win Rate (%)</span>
                  <Trophy className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-3xl font-black text-white">{winRate}%</div>
                <p className="text-[11px] text-slate-500 mt-2">ชนะ {winTrades.length} / แพ้ {lossTrades.length} ไม้</p>
                <div className="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${winRate}%` }}></div>
                </div>
              </div>

              <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Avg Realized R:R</span>
                  <Scale className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-white">+{avgRealizedRR}R</div>
                <p className="text-[11px] text-slate-500 mt-2">Win: +{avgWinR.toFixed(2)}R | Loss: -{avgLossR.toFixed(2)}R</p>
              </div>

              <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Profit Factor</span>
                  <Sparkles className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-3xl font-black text-white">{profitFactor}</div>
                <p className="text-[11px] text-slate-500 mt-2">+${grossProfit.toFixed(0)} / -${grossLoss.toFixed(0)}</p>
              </div>

              <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Expectancy (ต่อไม้)</span>
                  <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-3xl font-black text-white">{expectancy}R</div>
                <p className="text-[11px] text-slate-500 mt-2">Net P&L: ${(grossProfit - grossLoss).toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-6 shadow-xl overflow-hidden">
              <h2 className="text-sm font-bold text-slate-100 mb-4">ประวัติการเทรด MNQ ล่าสุด ({trades.length} ไม้)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#070e17] text-[11px] text-slate-400 uppercase border-b border-cyan-950">
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
                  <tbody className="divide-y divide-cyan-950/60">
                    {trades.map((t) => (
                      <tr key={t.id} className="hover:bg-cyan-950/20 transition">
                        <td className="p-3 text-slate-400 whitespace-nowrap">
                          <div>{t.entry_time?.replace('T', ' ') || '-'}</div>
                          <div className="text-[10px] text-slate-500">{t.day_of_week}</div>
                        </td>
                        <td className="p-3 text-cyan-300 font-medium">{t.session || "-"}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.side?.includes("Buy") ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"
                          }`}>
                            {t.side}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-200">{t.setup_name}</td>
                        <td className="p-3 font-bold text-cyan-300">{t.contracts}</td>
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
