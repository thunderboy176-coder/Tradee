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
  Trash2,
  Upload,
  Camera,
  Eye,
  X,
  Maximize2,
  BookOpen,
  FolderPlus
} from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function App() {
  const [activeTab, setActiveTab] = useState("journal");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // ค่าคงที่ของระบบ: MNQ, Risk = $250 USD, Multiplier = $2 ต่อจุด
  const RISK_USD = 250;
  const MULTIPLIER = 2;
  const SYMBOL = "MNQ";

  // State สำหรับสมุดบันทึก (Notebook System)
  const defaultBooks = [
    { id: "book_backtest", name: "Backtest MNQ" },
    { id: "book_prop", name: "สอบกองทุน (Prop Firm)" },
    { id: "book_live", name: "พอร์ตจริง (Live)" }
  ];
  const [books, setBooks] = useState(defaultBooks);
  const [currentBookId, setCurrentBookId] = useState("book_backtest");
  const [showNewBookModal, setShowNewBookModal] = useState(false);
  const [newBookName, setNewBookName] = useState("");

  const [trades, setTrades] = useState([]);

  // State รูปภาพ
  const [customLogo, setCustomLogo] = useState(null);
  const [customBabe, setCustomBabe] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const getNowString = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  // Form State
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
    const days = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    return days[new Date(y, m - 1, d).getDay()] || "-";
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

  const rawSl = parseFloat(slPoints) || 0;
  const bufferSl = rawSl * 1.5;
  const effectiveSl = useMfo ? bufferSl : rawSl;
  const denominator = effectiveSl * MULTIPLIER;
  const calculatedContracts = denominator > 0 ? Math.floor(RISK_USD / denominator) : 0;
  const tpVal = parseFloat(tpPoints) || 0;
  const calculatedRR = rawSl > 0 && tpVal > 0 ? (tpVal / rawSl).toFixed(2) : "-";

  useEffect(() => {
    const savedLogo = localStorage.getItem("tradee_custom_logo");
    const savedBabe = localStorage.getItem("tradee_custom_babe");
    const savedBooks = localStorage.getItem("tradee_books");
    if (savedLogo) setCustomLogo(savedLogo);
    if (savedBabe) setCustomBabe(savedBabe);
    if (savedBooks) setBooks(JSON.parse(savedBooks));

    loadTrades();
  }, []);

  const handleImageUpload = (e, setter, storageKey) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setter(base64);
      try {
        localStorage.setItem(storageKey, base64);
      } catch (err) {
        console.warn("Storage full", err);
      }
    };
    reader.readAsDataURL(file);
  };

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

  // ฟังก์ชันสร้างสมุดใหม่
  const handleCreateBook = (e) => {
    e.preventDefault();
    if (!newBookName.trim()) return;
    const newBook = {
      id: "book_" + Date.now(),
      name: newBookName.trim()
    };
    const updatedBooks = [...books, newBook];
    setBooks(updatedBooks);
    setCurrentBookId(newBook.id);
    localStorage.setItem("tradee_books", JSON.stringify(updatedBooks));
    setNewBookName("");
    setShowNewBookModal(false);
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
      book_id: currentBookId,
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
      image_analysis: img1 ? img1.slice(0, 300000) : null,
      image_trigger: img2 ? img2.slice(0, 300000) : null,
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

      setStatusMsg({ type: "success", text: "บันทึกไม้เทรดลงสมุดเรียบร้อยแล้ว!" });
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
    if (selectedTrade?.id === id) setSelectedTrade(null);
  };

  // กรองเฉพาะไม้ของสมุดที่เลือกอยู่ปัจจุบัน
  const bookTrades = trades.filter((t) => (t.book_id || "book_backtest") === currentBookId);
  const activeBookName = books.find((b) => b.id === currentBookId)?.name || "สมุดบันทึก";

  // Metrics แยกเฉพาะสมุดปัจจุบัน
  const totalTrades = bookTrades.length;
  const winTrades = bookTrades.filter((t) => t.outcome === "Win" || t.pnl > 0);
  const lossTrades = bookTrades.filter((t) => t.outcome === "Loss" || t.pnl < 0);
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

  return (
    <div className="min-h-screen bg-[#070e17] text-slate-200 p-4 md:p-8 font-sans">
      
      {/* HEADER SECTION */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-cyan-950/80">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-cyan-400/40 shadow-lg shadow-cyan-950/80 shrink-0 bg-slate-900 flex items-center justify-center overflow-hidden">
              {customLogo ? (
                <img src={customLogo} alt="Tradee Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-2 text-cyan-400 text-[10px] flex flex-col items-center justify-center h-full">
                  <Upload className="w-4 h-4 mb-1" />
                  <span>ใส่โลโก้</span>
                </div>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 bg-cyan-600 hover:bg-cyan-500 text-white p-1.5 rounded-full cursor-pointer shadow-md transition" title="อัปโหลดรูปโลโก้เต่า">
              <Camera className="w-3.5 h-3.5" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => handleImageUpload(e, setCustomLogo, "tradee_custom_logo")} 
              />
            </label>
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

        {/* Tab Switcher & Book Selector */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          
          {/* แถบเลือกสมุดบันทึก (Notebook Switcher) */}
          <div className="flex items-center gap-2 bg-[#0b1626] border border-cyan-900/60 px-3 py-1.5 rounded-2xl">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <select
              value={currentBookId}
              onChange={(e) => setCurrentBookId(e.target.value)}
              className="bg-transparent text-xs font-bold text-cyan-200 outline-none cursor-pointer"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#0b1626] text-white">
                  สมุด: {b.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowNewBookModal(true)}
              className="p-1 hover:bg-cyan-900/50 text-cyan-400 rounded-lg transition"
              title="สร้างสมุดเล่มใหม่"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          {/* ปุ่มสลับแท็บ */}
          <div className="flex bg-[#0b1626] border border-cyan-950 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab("journal")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition ${
                activeTab === "journal" ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30" : "text-slate-400 hover:text-white"
              }`}
            >
              <PlusCircle className="w-4 h-4" /> หน้าสมุดบันทึก
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition ${
                activeTab === "dashboard" ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30" : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> สรุปผลสมุดเล่มนี้
            </button>
          </div>
        </div>
      </header>

      {/* BANNER รูปแฟนขนาดใหญ่ */}
      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-gradient-to-r from-[#0a1829] via-[#0d1d33] to-[#0a1829] border border-cyan-900/50 rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
          <div className="relative group shrink-0">
            <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-3xl overflow-hidden border-4 border-cyan-500/60 shadow-2xl bg-slate-900 flex items-center justify-center">
              {customBabe ? (
                <img src={customBabe} alt="เบ้บๆ" className="w-full h-full object-cover object-top" />
              ) : (
                <div className="text-center p-4 text-slate-400 flex flex-col items-center justify-center">
                  <ImageIcon className="w-8 h-8 mb-2 text-cyan-500" />
                  <span className="text-xs">คลิกปุ่มกล้อง<br/>เพื่อเลือกรูปแฟน</span>
                </div>
              )}
            </div>
            <label className="absolute bottom-2 right-2 bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-2xl cursor-pointer shadow-lg transition flex items-center gap-1.5 text-xs font-semibold" title="อัปโหลดรูปแฟน">
              <Camera className="w-4 h-4" />
              <span>เลือกรูป</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => handleImageUpload(e, setCustomBabe, "tradee_custom_babe")} 
              />
            </label>
          </div>

          <div className="relative bg-white text-slate-900 rounded-2xl md:rounded-3xl px-6 py-4 md:py-5 shadow-2xl border border-cyan-200 max-w-xl">
            <div className="hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-10 border-r-white"></div>
            <div className="text-cyan-800 text-[11px] font-bold uppercase tracking-wider mb-1">Mumu's Support 🍵</div>
            <p className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-snug">
              “สู้ๆน้าเบ้บๆ หาตังซื้อชาเขียวให้แซมๆหน่อย”
            </p>
            <p className="text-xs text-slate-500 mt-1">
              กำลังบันทึกใน: <strong className="text-cyan-700">{activeBookName}</strong> • คุมความเสี่ยง ${RISK_USD} USD
            </p>
          </div>
        </div>
      </div>

      {/* MAIN VIEW */}
      <main className="max-w-7xl mx-auto mt-6">
        {activeTab === "journal" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* ฝั่งซ้าย: รูปภาพกราฟขยายใหญ่สะใจ + กล่อง Config เล็กกะทัดรัด */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* 1. กล่องบน: Mini Bar กะทัดรัด (กรอบสีเหลืองเดิม ย่อส่วนไม่เกะกะ) */}
              <div className="bg-[#0b1626] border border-cyan-900/60 rounded-xl px-4 py-2.5 shadow-md flex items-center justify-between text-xs">
                <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" /> ล็อกค่าระบบ:
                </span>
                <div className="flex items-center gap-4 font-mono text-slate-300">
                  <span>Symbol: <strong className="text-cyan-300">{SYMBOL}</strong></span>
                  <span>|</span>
                  <span>Risk: <strong className="text-emerald-400">${RISK_USD}</strong></span>
                  <span>|</span>
                  <span>Multiplier: <strong className="text-white">${MULTIPLIER}/pt</strong></span>
                </div>
              </div>

              {/* 2. ภาพที่ 1: Reason of Setup (ขยายใหญ่สะใจเต็มกรอบ) */}
              <div
                tabIndex={0}
                onPaste={(e) => handlePaste(e, setImg1)}
                className="relative bg-[#0b1626] border-2 border-dashed border-cyan-900/80 hover:border-cyan-500 rounded-2xl p-3 min-h-[460px] flex flex-col items-center justify-center cursor-pointer transition focus:outline-none overflow-hidden group shadow-lg"
              >
                {img1 ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <img 
                      src={img1} 
                      alt="ภาพที่ 1 การวิเคราะห์" 
                      className="w-full max-h-[500px] object-contain rounded-xl shadow-md" 
                    />
                    <div className="flex items-center gap-3 mt-3">
                      <button 
                        onClick={() => setLightboxImg(img1)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-md transition"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> ซูมดูภาพเต็มจอ
                      </button>
                      <button onClick={() => setImg1(null)} className="text-xs text-rose-400 hover:underline px-2">
                        ลบรูปภาพ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <ImageIcon className="w-14 h-14 text-cyan-600 mx-auto mb-3" />
                    <p className="text-lg font-bold text-slate-100">ภาพ reason of set up / ภาพการวิเคราะห์</p>
                    <p className="text-xs text-cyan-400 mt-1 font-mono">ภาพ 1 คลิกช่องนี้แล้วกด Ctrl + V วางได้ทันที (แสดงภาพใหญ่เต็มตา)</p>
                  </div>
                )}
              </div>

              {/* 3. ภาพที่ 2: Close up จุดเข้าจริงๆ (ขยายใหญ่สะใจเต็มกรอบ) */}
              <div
                tabIndex={0}
                onPaste={(e) => handlePaste(e, setImg2)}
                className="relative bg-[#0b1626] border-2 border-dashed border-cyan-900/80 hover:border-cyan-500 rounded-2xl p-3 min-h-[460px] flex flex-col items-center justify-center cursor-pointer transition focus:outline-none overflow-hidden group shadow-lg"
              >
                {img2 ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <img 
                      src={img2} 
                      alt="ภาพที่ 2 จุดเข้าจริง" 
                      className="w-full max-h-[500px] object-contain rounded-xl shadow-md" 
                    />
                    <div className="flex items-center gap-3 mt-3">
                      <button 
                        onClick={() => setLightboxImg(img2)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-md transition"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> ซูมดูภาพเต็มจอ
                      </button>
                      <button onClick={() => setImg2(null)} className="text-xs text-rose-400 hover:underline px-2">
                        ลบรูปภาพ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <ImageIcon className="w-14 h-14 text-cyan-600 mx-auto mb-3" />
                    <p className="text-lg font-bold text-slate-100">ภาพ close up จุดเข้าจริงๆ / ภาพที่ 2</p>
                    <p className="text-xs text-cyan-400 mt-1 font-mono">ภาพ 2 คลิกช่องนี้แล้วกด Ctrl + V วางได้ทันที (แสดงภาพใหญ่เต็มตา)</p>
                  </div>
                )}
              </div>
            </div>

            {/* ฝั่งขวา: ช่องกรอกข้อมูลตาม Wireframe */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* แถว 1: กรอก SL | SL Buffer | จำนวนสัญญา */}
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
                    {useMfo ? "ใช้ Buffer คำนวณ" : "ไม่ใช้ Buffer"}
                  </div>
                </div>

                <div className="bg-cyan-950/40 p-3 rounded-xl border border-cyan-700/60 text-center">
                  <div className="text-[11px] text-cyan-300 font-semibold">จำนวน สัญญา (ปัดลง)</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                    {calculatedContracts}
                  </div>
                  <div className="text-[10px] text-slate-400">สูตร: ${RISK_USD} / (SL * 2)</div>
                </div>
              </div>

              {/* แถว 2: Side | ชื่อ Setup */}
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
                <div className="text-xs font-semibold text-cyan-400 flex items-center justify-between">
                  <span>วัน/เวลา และ Session (คำนวณอัตโนมัติ)</span>
                  <span className="text-[10px] text-slate-400">สมุด: {activeBookName}</span>
                </div>
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

              {/* บันทึกผลลัพธ์ไม้ */}
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
                {loading ? "กำลังบันทึกข้อมูล..." : `บันทึกหน้าใหม่ลงใน ${activeBookName}`}
              </button>
            </div>
          </div>
        ) : (
          /* TAB 2: แดชบอร์ดสรุปผลเชิงสถิติ (เฉพาะสมุดเล่มที่เลือก) */
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-[#0b1626] p-4 rounded-2xl border border-cyan-900/50">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>กำลังดูสถิติของ: <span className="text-cyan-300 underline">{activeBookName}</span></span>
              </div>
              <span className="text-xs text-slate-400">รวมทั้งหมด {totalTrades} ไม้ในเล่มนี้</span>
            </div>

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

            {/* ตารางประวัติไม้เทรด */}
            <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-6 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-100">ประวัติการเทรดใน {activeBookName} ({bookTrades.length} ไม้)</h2>
                <span className="text-xs text-cyan-400">💡 คลิกแถวเพื่อเปิดดูรูปกราฟและรายละเอียดของหน้าบันทึกนั้น</span>
              </div>

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
                      <th className="p-3">รูปภาพ</th>
                      <th className="p-3 text-center">ดูรายละเอียด / ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-950/60">
                    {bookTrades.map((t) => (
                      <tr 
                        key={t.id} 
                        className="hover:bg-cyan-950/30 transition cursor-pointer"
                        onClick={() => setSelectedTrade(t)}
                      >
                        <td className="p-3 text-slate-400 whitespace-nowrap">
                          <div className="font-semibold text-slate-200">{t.entry_time?.replace('T', ' ') || '-'}</div>
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
                        <td className="p-3 text-slate-400">
                          <div className="flex items-center gap-1.5">
                            {t.image_analysis && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">ภาพ 1</span>}
                            {t.image_trigger && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">ภาพ 2</span>}
                            {!t.image_analysis && !t.image_trigger && <span className="text-slate-600">-</span>}
                          </div>
                        </td>
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedTrade(t)}
                              className="px-2.5 py-1 bg-cyan-900/60 hover:bg-cyan-700 text-cyan-200 rounded-lg text-xs flex items-center gap-1 transition"
                            >
                              <Eye className="w-3.5 h-3.5" /> เปิดดูหน้า
                            </button>
                            <button
                              onClick={() => deleteTrade(t.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {bookTrades.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-500">
                          ยังไม่มีบันทึกในสมุด "{activeBookName}" กดสลับไปแท็บหน้าสมุดบันทึกเพื่อเพิ่มไม้แรกได้เลย
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

      {/* MODAL: สร้างสมุดบันทึกเล่มใหม่ */}
      {showNewBookModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1626] border border-cyan-900 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-950">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-cyan-400" /> สร้างสมุดบันทึกใหม่
              </h3>
              <button onClick={() => setShowNewBookModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBook} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">ชื่อสมุด (เช่น Backtest 2024, สอบกองทุนรอบที่ 2)</label>
                <input
                  type="text"
                  value={newBookName}
                  onChange={(e) => setNewBookName(e.target.value)}
                  placeholder="ระบุชื่อสมุดบันทึก..."
                  required
                  className="w-full bg-[#070e17] border border-cyan-900 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewBookModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition"
                >
                  สร้างสมุด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ดูรายละเอียดหน้าสมุดบันทึกเดิม */}
      {selectedTrade && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1626] border border-cyan-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-cyan-950">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                  selectedTrade.side?.includes("Buy") ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"
                }`}>
                  {selectedTrade.side}
                </span>
                <h3 className="text-lg font-bold text-white">{selectedTrade.setup_name}</h3>
                <span className="text-xs text-slate-400">({selectedTrade.entry_time?.replace('T', ' ')})</span>
              </div>
              <button 
                onClick={() => setSelectedTrade(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-[#070e17] p-3 rounded-2xl border border-cyan-950">
                <div className="text-[11px] text-slate-400">สัญญา MNQ</div>
                <div className="text-xl font-bold text-cyan-400 font-mono mt-0.5">{selectedTrade.contracts}</div>
              </div>
              <div className="bg-[#070e17] p-3 rounded-2xl border border-cyan-950">
                <div className="text-[11px] text-slate-400">Realized R:R</div>
                <div className="text-xl font-bold text-white font-mono mt-0.5">
                  {selectedTrade.realized_rr ? `${selectedTrade.realized_rr >= 0 ? '+' : ''}${selectedTrade.realized_rr}R` : '-'}
                </div>
              </div>
              <div className="bg-[#070e17] p-3 rounded-2xl border border-cyan-950">
                <div className="text-[11px] text-slate-400">P&L ($ USD)</div>
                <div className={`text-xl font-bold font-mono mt-0.5 ${selectedTrade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedTrade.pnl >= 0 ? `+$${selectedTrade.pnl}` : `-$${Math.abs(selectedTrade.pnl)}`}
                </div>
              </div>
              <div className="bg-[#070e17] p-3 rounded-2xl border border-cyan-950">
                <div className="text-[11px] text-slate-400">ระยะเวลาถือครอง</div>
                <div className="text-xs font-semibold text-slate-300 mt-1">{selectedTrade.holding_time || '-'}</div>
              </div>
            </div>

            {/* ภาพกราฟ 2 รูปแบบใหญ่ คมชัด */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#070e17] p-3 rounded-2xl border border-cyan-950 space-y-2">
                <div className="text-xs font-semibold text-cyan-400 flex items-center justify-between">
                  <span>ภาพที่ 1: การวิเคราะห์ก่อนเข้า</span>
                  {selectedTrade.image_analysis && (
                    <button 
                      onClick={() => setLightboxImg(selectedTrade.image_analysis)}
                      className="text-[11px] text-cyan-300 hover:underline flex items-center gap-1"
                    >
                      <Maximize2 className="w-3 h-3" /> ขยายเต็มจอ
                    </button>
                  )}
                </div>
                {selectedTrade.image_analysis ? (
                  <img 
                    src={selectedTrade.image_analysis} 
                    alt="Analysis Chart" 
                    className="w-full max-h-72 object-contain rounded-xl cursor-pointer hover:opacity-90 transition"
                    onClick={() => setLightboxImg(selectedTrade.image_analysis)}
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-600 text-xs">ไม่ได้แนบภาพที่ 1</div>
                )}
              </div>

              <div className="bg-[#070e17] p-3 rounded-2xl border border-cyan-950 space-y-2">
                <div className="text-xs font-semibold text-cyan-400 flex items-center justify-between">
                  <span>ภาพที่ 2: Close Up จุดเข้าจริง</span>
                  {selectedTrade.image_trigger && (
                    <button 
                      onClick={() => setLightboxImg(selectedTrade.image_trigger)}
                      className="text-[11px] text-cyan-300 hover:underline flex items-center gap-1"
                    >
                      <Maximize2 className="w-3 h-3" /> ขยายเต็มจอ
                    </button>
                  )}
                </div>
                {selectedTrade.image_trigger ? (
                  <img 
                    src={selectedTrade.image_trigger} 
                    alt="Trigger Chart" 
                    className="w-full max-h-72 object-contain rounded-xl cursor-pointer hover:opacity-90 transition"
                    onClick={() => setLightboxImg(selectedTrade.image_trigger)}
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-600 text-xs">ไม่ได้แนบภาพที่ 2</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#070e17] p-3.5 rounded-2xl border border-cyan-950">
                <div className="text-slate-400 font-semibold mb-1">เหตุผลที่เข้า</div>
                <p className="text-slate-200 whitespace-pre-wrap">{selectedTrade.reason || '-'}</p>
              </div>
              <div className="bg-[#070e17] p-3.5 rounded-2xl border border-cyan-950">
                <div className="text-slate-400 font-semibold mb-1">ข้อผิดพลาด</div>
                <p className="text-rose-300 whitespace-pre-wrap">{selectedTrade.mistake || '-'}</p>
              </div>
              <div className="bg-[#070e17] p-3.5 rounded-2xl border border-cyan-950">
                <div className="text-slate-400 font-semibold mb-1">วิธีแก้ไข</div>
                <p className="text-emerald-300 whitespace-pre-wrap">{selectedTrade.solution || '-'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTrade(null)}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX: ขยายภาพเต็มจอ */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-6xl max-h-[95vh] w-full h-full flex flex-col items-center justify-center">
            <img src={lightboxImg} alt="Zoomed Chart" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
            <button 
              onClick={() => setLightboxImg(null)}
              className="absolute top-2 right-2 bg-slate-800/80 hover:bg-rose-600 text-white p-2.5 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
            <span className="text-slate-400 text-xs mt-2">คลิกตรงไหนก็ได้เพื่อปิดหน้าต่าง</span>
          </div>
        </div>
      )}

    </div>
  );
}
