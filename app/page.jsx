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
  Folder,
  BookOpen
} from "lucide-react";

// Supabase Client Initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [activeTab, setActiveTab] = useState("journal"); // "journal" | "dashboard"
  const [folders, setFolders] = useState([]);
  const [books, setBooks] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // ค่าเริ่มต้นวันและเวลาท้องถิ่นไทย YYYY-MM-DDTHH:mm
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
  const [img1, setImg1] = useState(null);
  const [img2, setImg2] = useState(null);
  const [reason, setReason] = useState("");
  const [mistake, setMistake] = useState("");
  const [solution, setSolution] = useState("");

  // Logic: แปลงวันในสัปดาห์จากสตริงวันที่โดยตรง
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

  // ดึงข้อมูลโฟลเดอร์และสมุดบันทึก
  useEffect(() => {
    loadFoldersAndBooks();
    loadTrades();
  }, []);

  const loadFoldersAndBooks = async () => {
    try {
      const { data: fData } = await supabase.from("folders").select("*");
      const { data: bData } = await supabase.from("books").select("*");
      if (fData && fData.length > 0) {
        setFolders(fData);
        setSelectedFolder(fData[0].id);
      }
      if (bData && bData.length > 0) {
        setBooks(bData);
        setSelectedBook(bData[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTrades = async () => {
    try {
      const { data } = await supabase.from("trades").select("*").order("created_at", { ascending: false });
      if (data) setTrades(data);
    } catch (err) {
      console.error(err);
    }
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

    try {
      const payload = {
        folder_id: selectedFolder || null,
        book_id: selectedBook || null,
        side,
        setup_name: setupName,
        sl_points: baseSl,
        effective_sl: effectiveSl,
        tp_points: tpVal,
        contracts: calculatedContracts,
        rr: calculatedRR !== "-" ? parseFloat(calculatedRR) : null,
        entry_time: entryTime,
        exit_time: exitTime || null,
        session: getSessionName(entryTime),
        day_of_week: getDayName(entryTime),
        holding_time: getHoldingTime(entryTime, exitTime),
        image_analysis: img1,
        image_trigger: img2,
        reason,
        mistake,
        solution,
      };

      const { error } = await supabase.from("trades").insert([payload]);
      if (error) throw error;

      setStatusMsg({ type: "success", text: "บันทึกข้อมูลไม้เทรดเรียบร้อยแล้ว!" });
      loadTrades();
      // ล้างข้อมูลฟอร์ม
      setSlPoints("");
      setTpPoints("");
      setImg1(null);
      setImg2(null);
      setReason("");
      setMistake("");
      setSolution("");
    } catch (err) {
      setStatusMsg({ type: "error", text: "เกิดข้อผิดพลาด: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Top Header & Custom Logo */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {/* Turtle Sammy Logo */}
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/5">
            <svg viewBox="0 0 64 64" className="w-9 h-9" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Shell */}
              <ellipse cx="32" cy="34" rx="20" ry="16" fill="#10B981" />
              <ellipse cx="32" cy="34" rx="16" ry="12" fill="#047857" />
              {/* Shell Patterns */}
              <path d="M32 22 V46 M16 34 H48 M21 26 L43 42 M21 42 L43 26" stroke="#064E3B" strokeWidth="1.8" strokeLinecap="round" />
              {/* Head */}
              <circle cx="32" cy="15" r="8" fill="#34D399" />
              {/* Trader Glasses */}
              <rect x="25" y="12" width="6" height="4" rx="1" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.2" />
              <rect x="33" y="12" width="6" height="4" rx="1" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.2" />
              <line x1="31" y1="14" x2="33" y2="14" stroke="#F59E0B" strokeWidth="1.2" />
              {/* Legs */}
              <circle cx="15" cy="25" r="4" fill="#34D399" />
              <circle cx="49" cy="25" r="4" fill="#34D399" />
              <circle cx="16" cy="43" r="4" fill="#34D399" />
              <circle cx="48" cy="43" r="4" fill="#34D399" />
            </svg>
          </div>
          <div>
            <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
              Tradee
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("journal")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === "journal" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <PlusCircle className="w-4 h-4" /> บันทึกการเทรด
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === "dashboard" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> แดชบอร์ดสรุปผล
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto mt-8">
        {activeTab === "journal" ? (
          <div className="space-y-6">
            {/* Position Size Calculator */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2 mb-4 text-amber-400 font-semibold">
                <Calculator className="w-5 h-5" />
                <span>Position Size Calculator (คำนวณสัญญาอัตโนมัติ)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">กรอก SL (ระยะจุด)</label>
                  <input
                    type="number"
                    step="any"
                    value={slPoints}
                    onChange={(e) => setSlPoints(e.target.value)}
                    placeholder="เช่น 5.0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">เงื่อนไข MFO</label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={useMfo}
                      onChange={(e) => setUseMfo(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
                    />
                    ติ๊ก MFO (SL x 1.5)
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Effective SL ที่ใช้จริง</label>
                  <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl px-4 py-2.5 text-sm text-slate-300">
                    {effectiveSl > 0 ? effectiveSl.toFixed(2) : "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">จำนวนสัญญา (ปัดลงเสมอ)</label>
                  <div className="bg-slate-950 border border-amber-500/40 rounded-xl px-4 py-2.5 text-right font-bold text-amber-400 flex items-center justify-between">
                    <span className="text-xl">{calculatedContracts}</span>
                    <span className="text-xs text-slate-500 font-normal">Contracts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trade Details & Time Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Setup & RR */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" /> Setup & อัตราทด RR
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Side</label>
                    <select
                      value={side}
                      onChange={(e) => setSide(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Risk to Reward (RR)</label>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-amber-400">
                      {calculatedRR !== "-" ? `1 : ${calculatedRR}` : "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date & Time Real-time */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Date & Time of Exit (เว้นว่างได้)</label>
                    <input
                      type="datetime-local"
                      value={exitTime}
                      onChange={(e) => setExitTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-950/80 border border-slate-800/60 p-3 rounded-xl text-center">
                  <div>
                    <div className="text-[11px] text-slate-400">วัน</div>
                    <div className="text-sm font-semibold text-white mt-0.5">{getDayName(entryTime)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Session (เวลาไทย)</div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">{getSessionName(entryTime)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Holding Time</div>
                    <div className="text-sm font-semibold text-slate-300 mt-0.5">{getHoldingTime(entryTime, exitTime)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clipboard Image Upload Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image 1 */}
              <div
                tabIndex={0}
                onPaste={(e) => handlePaste(e, setImg1)}
                className="relative bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 min-h-[200px] flex flex-col items-center justify-center cursor-pointer transition focus:outline-none focus:border-amber-500"
              >
                {img1 ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <img src={img1} alt="Setup Chart" className="max-h-64 object-contain rounded-lg shadow-md" />
                    <button
                      onClick={() => setImg1(null)}
                      className="mt-2 text-xs text-rose-400 hover:underline"
                    >
                      ลบรูปภาพ
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-300">ภาพที่ 1: Reason of Setup / การวิเคราะห์</p>
                    <p className="text-xs text-amber-400 mt-1">คลิกที่นี่แล้วกด Ctrl + V เพื่อวางภาพได้ทันที</p>
                  </div>
                )}
              </div>

              {/* Image 2 */}
              <div
                tabIndex={0}
                onPaste={(e) => handlePaste(e, setImg2)}
                className="relative bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 min-h-[200px] flex flex-col items-center justify-center cursor-pointer transition focus:outline-none focus:border-amber-500"
              >
                {img2 ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <img src={img2} alt="Trigger Chart" className="max-h-64 object-contain rounded-lg shadow-md" />
                    <button
                      onClick={() => setImg2(null)}
                      className="mt-2 text-xs text-rose-400 hover:underline"
                    >
                      ลบรูปภาพ
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-300">ภาพที่ 2: Close Up จุดเข้าจริง</p>
                    <p className="text-xs text-amber-400 mt-1">คลิกที่นี่แล้วกด Ctrl + V เพื่อวางภาพได้ทันที</p>
                  </div>
                )}
              </div>
            </div>

            {/* Journal Reflection Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">เหตุผลที่เข้า (อธิบายภาพที่ 1)</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ระบุโครงสร้างราคา หรือแนวรับแนวด้าน..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">ข้อผิดพลาด</label>
                <textarea
                  rows={3}
                  value={mistake}
                  onChange={(e) => setMistake(e.target.value)}
                  placeholder="เช่น เข้าเร็วไป, ตั้ง SL แคบเกิน..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">วิธีแก้ไข</label>
                <textarea
                  rows={3}
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="รอบหน้าควรรอการคอนเฟิร์มแบบไหน..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Notification Messages */}
            {statusMsg.text && (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
                  statusMsg.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                }`}
              >
                {statusMsg.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSubmitTrade}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-2xl shadow-xl transition disabled:opacity-50 text-base flex items-center justify-center gap-2"
            >
              {loading ? "กำลังบันทึกข้อมูล..." : "บันทึกไม้เทรดนี้ลงระบบ"}
            </button>
          </div>
        ) : (
          /* Dashboard Tab */
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-100 mb-4">ประวัติการเทรดล่าสุด ({trades.length} ไม้)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3">วัน & Session</th>
                      <th className="p-3">Side & Setup</th>
                      <th className="p-3">SL (จุด)</th>
                      <th className="p-3">สัญญา</th>
                      <th className="p-3">RR</th>
                      <th className="p-3">Holding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t) => (
                      <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                        <td className="p-3">
                          <div className="font-semibold text-white">{t.day_of_week || "-"}</div>
                          <div className="text-xs text-amber-400">{t.session || "-"}</div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mr-2 ${
                            t.side?.includes("Buy") ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          }`}>
                            {t.side}
                          </span>
                          <span>{t.setup_name}</span>
                        </td>
                        <td className="p-3 font-mono">{t.effective_sl || t.sl_points}</td>
                        <td className="p-3 font-bold text-amber-400">{t.contracts}</td>
                        <td className="p-3 font-semibold">{t.rr ? `1:${t.rr}` : "-"}</td>
                        <td className="p-3 text-slate-400">{t.holding_time || "-"}</td>
                      </tr>
                    ))}
                    {trades.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          ยังไม่มีข้อมูลไม้เทรด บันทึกไม้แรกเพื่อดูผลได้เลย
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
