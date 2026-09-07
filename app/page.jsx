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
  FolderPlus,
  Flame
} from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function App() {
  const [activeTab, setActiveTab] = useState("journal");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const RISK_USD = 250;
  const MULTIPLIER = 2;
  const SYMBOL = "MNQ";

  // State สมุดบันทึก
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

  // State รูปภาพและโมดอล
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

  const handleDeleteBook = async (bookIdToDelete) => {
    if (books.length <= 1) {
      alert("ต้องมีสมุดบันทึกอย่างน้อย 1 เล่มครับ");
      return;
    }
    const bookTarget = books.find((b) => b.id === bookIdToDelete);
    if (!confirm(`ต้องการลบสมุด "${bookTarget?.name}" และข้อมูลไม้ทั้งหมดที่อยู่ในเล่มนี้ใช่ไหมครับ?`)) return;

    const updatedBooks = books.filter((b) => b.id !== bookIdToDelete);
    setBooks(updatedBooks);
    setCurrentBookId(updatedBooks[0].id);
    localStorage.setItem("tradee_books", JSON.stringify(updatedBooks));

    try {
      if (supabase) {
        await supabase.from("trades").delete().eq("book_id", bookIdToDelete);
      }
    } catch (e) {
      console.warn(e);
    }
    const updatedTrades = trades.filter((t) => (t.book_id || "book_backtest") !== bookIdToDelete);
    setTrades(updatedTrades);
    localStorage.setItem("tradee_cached_trades", JSON.stringify(updatedTrades));
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
    if (!confirm("ต้องการลบหน้าบันทึกนี้ใช่ไหมครับ?")) return;
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

  const bookTrades = trades.filter((t) => (t.book_id || "book_backtest") === currentBookId);
  const activeBookName = books.find((b) => b.id === currentBookId)?.name || "สมุดบันทึก";

  // Metrics
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
    <div className="min-h-screen bg-[#070e17] text-slate-200 p-3 md:p-6 font-sans">
      
      {/* HEADER SECTION */}
      <header className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-cyan-950/80">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-cyan-400/40 shadow-lg shadow-cyan-950/80 shrink-0 bg-slate-900 flex items-center justify-center overflow-hidden">
              {customLogo ? (
                <img src={customLogo} alt="Tradee Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-2 text-cyan-400 text-[10px] flex flex-col items-center justify-center h-full">
                  <Upload className="w-4 h-4 mb-1" />
                  <span>ใส่โลโก้</span>
                </div>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 bg-cyan-600 hover:bg-cyan-500 text-white p-1 rounded-full cursor-pointer shadow-md transition" title="อัปโหลดรูปโลโก้เต่า">
              <Camera className="w-3 h-3" />
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
              <span className="text-2xl md:text-3xl font-black tracking-tight text-white">Tradee</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded-md font-bold uppercase">
                MNQ Journal
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Don't rush what takes time • ล็อก Risk ${RISK_USD} USD</p>
          </div>
        </div>

        {/* Tab & Notebook Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 bg-[#0b1626] border border-cyan-900/60 px-2.5 py-1.5 rounded-xl">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
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
              title="สร้างสมุดใหม่"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleDeleteBook(currentBookId)}
              className="p-1 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 rounded-lg transition"
              title="ลบสมุดนี้"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex bg-[#0b1626] border border-cyan-950 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("journal")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "journal" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" /> หน้าบันทึก
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "dashboard" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> แดชบอร์ดสรุปผล
            </button>
          </div>
        </div>
      </header>

      {/* BANNER รูปแฟน (กะทัดรัด ไม่แย่งพื้นที่) */}
      <div className="max-w-[1600px] mx-auto mt-4">
        <div className="bg-gradient-to-r from-[#0a1829] via-[#0d1d33] to-[#0a1829] border border-cyan-900/40 rounded-2xl p-3 flex items-center gap-4 shadow-md">
          <div className="relative group shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-cyan-500/60 shadow-md bg-slate-900 flex items-center justify-center">
              {customBabe ? (
                <img src={customBabe} alt="เบ้บๆ" className="w-full h-full object-cover object-top" />
              ) : (
                <div className="text-center p-1 text-slate-400 text-[10px] flex flex-col items-center">
                  <ImageIcon className="w-4 h-4 text-cyan-400 mb-0.5" />
                  <span>เลือกรูป</span>
                </div>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 bg-cyan-600 hover:bg-cyan-500 text-white p-1 rounded-full cursor-pointer shadow" title="อัปโหลดรูปแฟน">
              <Camera className="w-3 h-3" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => handleImageUpload(e, setCustomBabe, "tradee_custom_babe")} 
              />
            </label>
          </div>

          <div className="bg-white text-slate-900 rounded-xl px-4 py-2 shadow border border-cyan-200 flex-1 max-w-xl">
            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
              “สู้ๆน้าเบ้บๆ หาตังซื้อชาเขียวให้แซมๆหน่อย” 🍵
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              สมุด: <strong className="text-cyan-700">{activeBookName}</strong> • ความเสี่ยง ${RISK_USD} USD
            </p>
          </div>
        </div>
      </div>

      {/* MAIN VIEW */}
      <main className="max-w-[1600px] mx-auto mt-4">
        {activeTab === "journal" ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            
            {/* ================= ฝั่งซ้าย: รูปภาพกราฟใหญ่ ชัดเจนเต็มตา (XL: col-span-7) ================= */}
            <div className="xl:col-span-7 space-y-4">
              
              {/* ภาพที่ 1: Reason of Setup (Hero Image: กว้างเต็มกรอบ คมชัด 100%) */}
              <div
                tabIndex={0}
                onPaste={(e) => handlePaste(e, setImg1)}
                className={`relative bg-[#09121f] border-2 border-dashed border-cyan-900/80 hover:border-cyan-400 rounded-2xl transition focus:outline-none overflow-hidden shadow-xl ${
                  img1 ? "p-1.5" : "p-12 min-h-[360px] flex flex-col items-center justify-center cursor-pointer"
                }`}
              >
                {img1 ? (
                  <div className="relative w-full group">
                    <img 
                      src={img1} 
                      alt="ภาพที่ 1 การวิเคราะห์" 
                      className="w-full h-auto max-h-[850px] object-contain block rounded-xl"
                    />
                    
                    {/* Floating Actions */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-cyan-800 shadow-xl opacity-80 group-hover:opacity-100 transition">
                      <button 
                        onClick={() => setLightboxImg(img1)}
                        className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow"
                      >
                        <Maximize2 className="w-3 h-3" /> เต็มจอ
                      </button>
                      <button 
                        onClick={() => setImg1(null)} 
                        className="px-2 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-14 h-14 text-cyan-600 mx-auto mb-2" />
                    <p className="text-lg font-black text-slate-100">ภาพที่ 1: Reason of Setup / การวิเคราะห์</p>
                    <p className="text-xs text-cyan-400 mt-1 font-mono">คลิกที่นี่แล้วกด Ctrl + V เพื่อวางภาพ (แสดงภาพขนาดใหญ่ คมชัดเต็มจอ)</p>
                  </div>
                )}
              </div>

              {/* ภาพที่ 2: Close Up จุดเข้าจริง (Hero Image) */}
              <div
                tabIndex={0}
                onPaste={(e) => handlePaste(e, setImg2)}
                className={`relative bg-[#09121f] border-2 border-dashed border-cyan-900/80 hover:border-cyan-400 rounded-2xl transition focus:outline-none overflow-hidden shadow-xl ${
                  img2 ? "p-1.5" : "p-12 min-h-[360px] flex flex-col items-center justify-center cursor-pointer"
                }`}
              >
                {img2 ? (
                  <div className="relative w-full group">
                    <img 
                      src={img2} 
                      alt="ภาพที่ 2 จุดเข้าจริง" 
                      className="w-full h-auto max-h-[850px] object-contain block rounded-xl"
                    />
                    
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-cyan-800 shadow-xl opacity-80 group-hover:opacity-100 transition">
                      <button 
                        onClick={() => setLightboxImg(img2)}
                        className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow"
                      >
                        <Maximize2 className="w-3 h-3" /> เต็มจอ
                      </button>
                      <button 
                        onClick={() => setImg2(null)} 
                        className="px-2 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-14 h-14 text-cyan-600 mx-auto mb-2" />
                    <p className="text-lg font-black text-slate-100">ภาพที่ 2: Close Up จุดเข้าจริงๆ</p>
                    <p className="text-xs text-cyan-400 mt-1 font-mono">คลิกที่นี่แล้วกด Ctrl + V เพื่อวางภาพ (แสดงภาพขนาดใหญ่ คมชัดเต็มจอ)</p>
                  </div>
                )}
              </div>
            </div>

            {/* ================= ฝั่งขวา: เน้น SL + สัญญาเด่นสะดุดตา และกล่องสะท้อนคิดใหญ่ (XL: col-span-5) ================= */}
            <div className="xl:col-span-5 space-y-4">
              
              {/* แถบไฮไลต์ฉุกเฉิน: ช่อง SL เด่นเตะตา + โชว์สัญญาขนาดจัมโบ้ */}
              <div className="bg-gradient-to-br from-[#0c182c] via-[#091526] to-[#070e1b] border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Flame className="w-4 h-4 text-amber-400 animate-pulse" /> จุดคำนวณสัญญาด่วน (Fast Position)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Risk ${RISK_USD} | $2/Point</span>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center">
                  {/* ช่องกรอก SL เด่นที่สุด */}
                  <div className="col-span-7 space-y-1.5">
                    <label className="block text-xs font-black text-amber-300">
                      กรอกระยะ SL (จุด Points) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={slPoints}
                        onChange={(e) => setSlPoints(e.target.value)}
                        placeholder="เช่น 20.0"
                        className="w-full bg-[#040810] border-2 border-amber-500/90 focus:border-amber-400 rounded-xl px-3 py-2 text-white font-mono text-xl font-bold tracking-wide outline-none shadow-inner focus:ring-2 focus:ring-amber-500/30"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-amber-400/80 font-mono font-bold">pts</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-300">
                        <input
                          type="checkbox"
                          checked={useMfo}
                          onChange={(e) => setUseMfo(e.target.checked)}
                          className="w-4 h-4 rounded border-amber-600 text-amber-500 focus:ring-amber-500 bg-[#070e17]"
                        />
                        <span>ติ๊ก MFO (SL x 1.5)</span>
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Buffer: <strong className="text-amber-300">{rawSl > 0 ? bufferSl.toFixed(2) : "-"}</strong>
                      </span>
                    </div>
                  </div>

                  {/* ช่องโชว์สัญญาขนาดจัมโบ้ เรืองแสงเด่นชัด */}
                  <div className="col-span-5 bg-gradient-to-b from-emerald-950/80 to-emerald-900/40 border-2 border-emerald-400 rounded-2xl p-2.5 text-center shadow-lg shadow-emerald-500/10 flex flex-col justify-center">
                    <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">สัญญาที่เปิดได้</div>
                    <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tighter my-0.5 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]">
                      {calculatedContracts}
                    </div>
                    <div className="text-[10px] text-slate-300 font-medium">MNQ Contracts (ปัดลง)</div>
                  </div>
                </div>
              </div>

              {/* ข้อมูลการเทรดแบบกระชับ (Compact Form: Side, Setup, TP, RR) */}
              <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-3.5 shadow-md space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Side</label>
                    <select
                      value={side}
                      onChange={(e) => setSide(e.target.value)}
                      className="w-full bg-[#070e17] border border-cyan-900 rounded-lg px-2.5 py-1.5 text-white text-xs font-medium focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Buy / Long">Buy / Long</option>
                      <option value="Sell / Short">Sell / Short</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">ชื่อ Setup</label>
                    <select
                      value={setupName}
                      onChange={(e) => setSetupName(e.target.value)}
                      className="w-full bg-[#070e17] border border-cyan-900 rounded-lg px-2.5 py-1.5 text-white text-xs font-medium focus:outline-none focus:border-cyan-500"
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

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">ระยะ TP (จุด)</label>
                    <input
                      type="number"
                      step="any"
                      value={tpPoints}
                      onChange={(e) => setTpPoints(e.target.value)}
                      placeholder="เช่น 60.0"
                      className="w-full bg-[#070e17] border border-cyan-900 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="bg-[#070e17] p-1.5 rounded-lg border border-cyan-950 text-center flex flex-col justify-center">
                    <div className="text-[10px] text-slate-400">RR คำนวณ</div>
                    <div className="text-sm font-bold text-cyan-300 font-mono">{calculatedRR !== "-" ? `1 : ${calculatedRR}` : "-"}</div>
                  </div>
                </div>

                {/* วัน/เวลา และ Session แบบกระชับบรรทัดเดียว */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Entry Time</label>
                    <input
                      type="datetime-local"
                      value={entryTime}
                      onChange={(e) => setEntryTime(e.target.value)}
                      className="w-full bg-[#070e17] border border-cyan-900 rounded-lg px-2 py-1 text-white text-[11px] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Exit Time</label>
                    <input
                      type="datetime-local"
                      value={exitTime}
                      onChange={(e) => setExitTime(e.target.value)}
                      className="w-full bg-[#070e17] border border-cyan-900 rounded-lg px-2 py-1 text-white text-[11px] outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-[#070e17] px-3 py-1.5 rounded-lg border border-cyan-950 font-mono">
                  <span>วัน: <strong className="text-white">{getDayName(entryTime)}</strong></span>
                  <span>Session: <strong className="text-cyan-300">{getSessionName(entryTime)}</strong></span>
                  <span>Hold: <strong className="text-slate-300">{getHoldingTime(entryTime, exitTime)}</strong></span>
                </div>

                {/* ผลลัพธ์ไม้ */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">ผลลัพธ์</label>
                    <select
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value)}
                      className="w-full bg-[#070e17] border border-cyan-900 rounded-lg px-2 py-1 text-white text-xs outline-none"
                    >
                      <option value="Win">Win (ชนะ)</option>
                      <option value="Loss">Loss (แพ้)</option>
                      <option value="BE">BE (เสมอทุน)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">P&L ($ USD)</label>
                    <input
                      type="number"
                      value={pnlDollar}
                      onChange={(e) => setPnlDollar(e.target.value)}
                      placeholder="+500 หรือ -250"
                      className="w-full bg-[#070e17] border border-cyan-900 rounded-lg px-2 py-1 text-white text-xs font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ================= กล่องข้อความ 3 กล่อง เน้นขนาดใหญ่ พิมพ์อธิบายได้จุใจ ================= */}
              <div className="space-y-3">
                {/* 1. เหตุผลที่เข้า */}
                <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-3.5 shadow-md">
                  <label className="block text-xs font-bold text-cyan-300 mb-1.5 flex items-center justify-between">
                    <span>1. เหตุผลที่เข้า (อธิบายภาพที่ 1)</span>
                    <span className="text-[10px] text-slate-500 font-normal">โครงสร้าง, Liquidity, Confirmation</span>
                  </label>
                  <textarea
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="พิมพ์อธิบายโครงสร้างราคา จุดสะสม หรือเหตุผลทางเทคนิคตามภาพที่ 1..."
                    className="w-full bg-[#070e17] border border-cyan-900 rounded-xl p-3 text-white text-xs leading-relaxed focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* 2. ข้อผิดพลาด */}
                <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-3.5 shadow-md">
                  <label className="block text-xs font-bold text-rose-400 mb-1.5 flex items-center justify-between">
                    <span>2. ข้อผิดพลาด (Mistake)</span>
                    <span className="text-[10px] text-slate-500 font-normal">เช่น เข้าเร็วไป, อารมณ์ FOMO</span>
                  </label>
                  <textarea
                    rows={4}
                    value={mistake}
                    onChange={(e) => setMistake(e.target.value)}
                    placeholder="บันทึกข้อผิดพลาดของไม้นี้อย่างตรงไปตรงมา..."
                    className="w-full bg-[#070e17] border border-cyan-900 rounded-xl p-3 text-white text-xs leading-relaxed focus:outline-none focus:border-rose-400"
                  />
                </div>

                {/* 3. วิธีแก้ไข */}
                <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-3.5 shadow-md">
                  <label className="block text-xs font-bold text-emerald-400 mb-1.5 flex items-center justify-between">
                    <span>3. วิธีแก้ไข / แนวทางปรับปรุง (Solution)</span>
                    <span className="text-[10px] text-slate-500 font-normal">กฎเหล็กในไม้ถัดไป</span>
                  </label>
                  <textarea
                    rows={4}
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="รอบหน้าต้องรอการคอนเฟิร์มแบบไหน หรือต้องปรับพฤติกรรมอย่างไร..."
                    className="w-full bg-[#070e17] border border-cyan-900 rounded-xl p-3 text-white text-xs leading-relaxed focus:outline-none focus:border-emerald-400"
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
                <span className="text-xs text-cyan-400">💡 คลิกแถวเพื่อเปิดดูรูปกราฟและรายละเอียด</span>
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
                              <Eye className="w-3.5 h-3.5" /> เปิดดู
                            </button>
                            <button
                              onClick={() => deleteTrade(t.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition"
                              title="ลบหน้าบันทึกนี้"
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
                          ยังไม่มีบันทึกในสมุด "{activeBookName}" สลับไปแท็บหน้าบันทึกเพื่อเพิ่มไม้แรกได้เลย
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

      {/* MODAL: สร้างสมุดใหม่ */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#070e17] p-3 rounded-2xl border border-cyan-950 space-y-2">
                <div className="text-xs font-semibold text-cyan-400">ภาพที่ 1: การวิเคราะห์ก่อนเข้า</div>
                {selectedTrade.image_analysis ? (
                  <img 
                    src={selectedTrade.image_analysis} 
                    alt="Analysis Chart" 
                    className="w-full max-h-80 object-contain rounded-xl cursor-pointer hover:opacity-90 transition"
                    onClick={() => setLightboxImg(selectedTrade.image_analysis)}
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-600 text-xs">ไม่ได้แนบภาพที่ 1</div>
                )}
              </div>

              <div className="bg-[#070e17] p-3 rounded-2xl border border-cyan-950 space-y-2">
                <div className="text-xs font-semibold text-cyan-400">ภาพที่ 2: Close Up จุดเข้าจริง</div>
                {selectedTrade.image_trigger ? (
                  <img 
                    src={selectedTrade.image_trigger} 
                    alt="Trigger Chart" 
                    className="w-full max-h-80 object-contain rounded-xl cursor-pointer hover:opacity-90 transition"
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
