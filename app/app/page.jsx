"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Calculator, 
  BookOpen, 
  LayoutDashboard, 
  PlusCircle, 
  Image as ImageIcon,
  CheckCircle2,
  TrendingUp,
  AlertCircle
} from "lucide-react";

// ตั้งค่าการเชื่อมต่อ Supabase จาก Environment Variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [activeTab, setActiveTab] = useState("journal"); // 'journal' หรือ 'dashboard'
  
  // การตั้งค่าประจำสมุด (Config เบื้องหลัง)
  const [config, setConfig] = useState({
    symbol: "GC (Gold Futures)",
    riskUSD: 100,
    contractMultiplier: 2,
    commission: 0,
  });

  // ฟอร์มบันทึกไม้
  const [formData, setFormData] = useState({
    entryDatetime: "",
    exitDatetime: "",
    side: "Buy",
    setupName: "Break Running Buy",
    slDistance: "",
    isMfo: false,
    tpDistance: "",
    reasonEntry: "",
    mistakes: "",
    improvements: "",
    imgSetup: "",
    imgExecution: "",
  });

  const [trades, setTrades] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ตั้งค่าเวลาเริ่มต้นเมื่อโหลดหน้าเว็บ
  useEffect(() => {
    const now = new Date();
    const localIsoString = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormData((prev) => ({ ...prev, entryDatetime: localIsoString }));
    loadTrades();
  }, []);

  const loadTrades = async () => {
    if (!supabaseUrl || !supabaseKey) return;
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTrades(data);
  };

  // Logic: แปลงวันในสัปดาห์ (ภาษาไทย)
  const getDayName = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const days = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    return days[date.getDay()];
  };

  // Logic: ตรวจสอบ Session ตามเวลาไทย
  const getSessionName = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const time = hours + minutes / 60;

    if (time >= 6 && time < 14) return "Asia";
    if (time >= 14 && time < 19.5) return "London";
    if (time >= 19.5 || time < 3) return "New York";
    return "Off-Hours";
  };

  // Logic: คำนวณ Holding Time
  const getHoldingTime = (entryStr, exitStr) => {
    if (!entryStr || !exitStr) return "-";
    const start = new Date(entryStr);
    const end = new Date(exitStr);
    const diffMs = end - start;
    if (diffMs < 0) return "เวลาออกไม่ถูกต้อง";
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return hrs > 0 ? `${hrs} ชม. ${remMins} นาที` : `${mins} นาที`;
  };

  // Logic: คำนวณ Effective SL และจำนวนสัญญา (ปัดเศษลงเสมอ)
  const sl = parseFloat(formData.slDistance) || 0;
  const effectiveSL = formData.isMfo ? sl * 1.5 : sl;
  const contracts =
    effectiveSL > 0
      ? Math.floor(config.riskUSD / (effectiveSL * config.contractMultiplier))
      : 0;

  // Logic: คำนวณ RR
  const tp = parseFloat(formData.tpDistance) || 0;
  const rr = effectiveSL > 0 && tp > 0 ? (tp / effectiveSL).toFixed(2) : "-";

  // ดักจับการกด Ctrl + V เพื่อแปะภาพ
  const handlePasteImage = (e, field) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          setFormData((prev) => ({ ...prev, [field]: event.target.result }));
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  // ส่งข้อมูลบันทึกเข้า Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.slDistance) {
      alert("กรุณากรอกระยะ SL ก่อนบันทึก");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      entry_datetime: formData.entryDatetime ? new Date(formData.entryDatetime).toISOString() : null,
      exit_datetime: formData.exitDatetime ? new Date(formData.exitDatetime).toISOString() : null,
      day_of_week: getDayName(formData.entryDatetime),
      session: getSessionName(formData.entryDatetime),
      side: formData.side,
      setup_name: formData.setupName,
      sl_distance: sl,
      is_mfo: formData.isMfo,
      effective_sl: effectiveSL,
      contracts: contracts,
      tp_distance: tp || null,
      rr_ratio: rr !== "-" ? parseFloat(rr) : null,
      reason_entry: formData.reasonEntry,
      mistakes: formData.mistakes,
      improvements: formData.improvements,
      img_setup_url: formData.imgSetup,
      img_execution_url: formData.imgExecution,
    };

    if (supabaseUrl && supabaseKey) {
      const { error } = await supabase.from("trades").insert([payload]);
      if (error) {
        alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
      } else {
        alert("บันทึกไม้เทรดเรียบร้อยแล้ว!");
        loadTrades();
        // เคลียร์ฟอร์ม
        setFormData((prev) => ({
          ...prev,
          slDistance: "",
          isMfo: false,
          tpDistance: "",
          reasonEntry: "",
          mistakes: "",
          improvements: "",
          imgSetup: "",
          imgExecution: "",
        }));
      }
    } else {
      alert("จำลองการบันทึกสำเร็จ (ยังไม่ได้ผูก Key บน Vercel)");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* ส่วนหัว: เมนูสลับและข้อมูลระบบ */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="text-amber-400" /> Futures Trading Journal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Symbol: <span className="text-amber-300 font-semibold">{config.symbol}</span> | Risk ต่อไม้: <span className="text-emerald-400 font-semibold">${config.riskUSD}</span> | ตัวคูณสัญญา: <span className="text-slate-200 font-semibold">{config.contractMultiplier}</span>
          </p>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("journal")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "journal"
                ? "bg-amber-500 text-slate-950 font-semibold shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            บันทึกการเทรด
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "dashboard"
                ? "bg-amber-500 text-slate-950 font-semibold shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            แดชบอร์ดสรุปผล
          </button>
        </div>
      </header>

      {activeTab === "journal" ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* กล่องคำนวณสัญญา Position Size Calculator */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4 text-amber-400 font-semibold">
              <Calculator size={20} />
              <span>Position Size Calculator (คำนวณสัญญาอัตโนมัติ)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">กรอก SL (ระยะจุด)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.slDistance}
                  onChange={(e) => setFormData({ ...formData, slDistance: e.target.value })}
                  placeholder="เช่น 5.0"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="flex flex-col justify-center">
                <label className="text-xs text-slate-400 block mb-2">เงื่อนไข MFO</label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isMfo}
                    onChange={(e) => setFormData({ ...formData, isMfo: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-0"
                  />
                  <span className="text-sm font-medium text-slate-200">
                    ติ๊ก MFO (SL x 1.5)
                  </span>
                </label>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Effective SL ที่ใช้จริง</label>
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-amber-300 font-mono font-bold">
                  {effectiveSL ? effectiveSL.toFixed(2) : "-"}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">จำนวนสัญญา (ปัดลงเสมอ)</label>
                <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg px-3 py-2 text-amber-400 font-mono text-xl font-extrabold flex items-center justify-between">
                  <span>{contracts}</span>
                  <span className="text-xs text-slate-400 font-normal">Contracts</span>
                </div>
              </div>
            </div>
          </div>

          {/* ข้อมูลการเข้าเทรดและวันเวลา */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ซีกซ้าย: รายละเอียด Setup & TP */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-slate-200 border-b border-slate-800 pb-2">
                Setup & อัตราทด RR
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Side</label>
                  <select
                    value={formData.side}
                    onChange={(e) => setFormData({ ...formData, side: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Buy">Buy / Long</option>
                    <option value="Sell">Sell / Short</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">ชื่อ Setup</label>
                  <select
                    value={formData.setupName}
                    onChange={(e) => setFormData({ ...formData, setupName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
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

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">กรอก ระยะ TP</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.tpDistance}
                    onChange={(e) => setFormData({ ...formData, tpDistance: e.target.value })}
                    placeholder="เช่น 15.0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Risk to Reward (RR)</label>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold">
                    {rr !== "-" ? `1 : ${rr}` : "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* ซีกขวา: วันที่ เวลา และการแปลงอัตโนมัติ */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-slate-200 border-b border-slate-800 pb-2">
                วันและเวลา (คำนวณอัตโนมัติ)
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Date & Time of Entry</label>
                  <input
                    type="datetime-local"
                    value={formData.entryDatetime}
                    onChange={(e) => setFormData({ ...formData, entryDatetime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Date & Time of Exit</label>
                  <input
                    type="datetime-local"
                    value={formData.exitDatetime}
                    onChange={(e) => setFormData({ ...formData, exitDatetime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 text-center">
                <div>
                  <span className="text-[11px] text-slate-500 block">วัน</span>
                  <span className="text-sm font-semibold text-slate-200">
                    {getDayName(formData.entryDatetime)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Session (เวลาไทย)</span>
                  <span className="text-sm font-semibold text-amber-400">
                    {getSessionName(formData.entryDatetime)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Holding Time</span>
                  <span className="text-sm font-semibold text-slate-200">
                    {getHoldingTime(formData.entryDatetime, formData.exitDatetime)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* พื้นที่แปะภาพ Ctrl + V */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ภาพที่ 1 */}
            <div
              onPaste={(e) => handlePasteImage(e, "imgSetup")}
              className="bg-slate-900/40 border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px] text-center transition-all cursor-pointer relative overflow-hidden"
              tabIndex="0"
            >
              {formData.imgSetup ? (
                <img src={formData.imgSetup} alt="Reason of Setup" className="max-h-64 object-contain rounded-lg" />
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="mx-auto text-slate-500" size={36} />
                  <div className="text-sm font-medium text-slate-300">ภาพที่ 1: Reason of Setup / การวิเคราะห์</div>
                  <div className="text-xs text-amber-400">คลิกที่นี่แล้วกด Ctrl + V เพื่อวางภาพได้ทันที</div>
                </div>
              )}
            </div>

            {/* ภาพที่ 2 */}
            <div
              onPaste={(e) => handlePasteImage(e, "imgExecution")}
              className="bg-slate-900/40 border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px] text-center transition-all cursor-pointer relative overflow-hidden"
              tabIndex="0"
            >
              {formData.imgExecution ? (
                <img src={formData.imgExecution} alt="Execution Entry" className="max-h-64 object-contain rounded-lg" />
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="mx-auto text-slate-500" size={36} />
                  <div className="text-sm font-medium text-slate-300">ภาพที่ 2: Close Up จุดเข้าจริง</div>
                  <div className="text-xs text-amber-400">คลิกที่นี่แล้วกด Ctrl + V เพื่อวางภาพได้ทันที</div>
                </div>
              )}
            </div>
          </div>

          {/* บันทึกข้อความ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">เหตุผลที่เข้า (อธิบายภาพที่ 1)</label>
              <textarea
                rows={3}
                value={formData.reasonEntry}
                onChange={(e) => setFormData({ ...formData, reasonEntry: e.target.value })}
                placeholder="ระบุโครงสร้างราคา หรือแนวรับแนวต้าน..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">ข้อผิดพลาด</label>
              <textarea
                rows={3}
                value={formData.mistakes}
                onChange={(e) => setFormData({ ...formData, mistakes: e.target.value })}
                placeholder="เช่น เข้าเร็วไป, ตั้ง SL แคบเกิน..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">วิธีแก้ไข</label>
              <textarea
                rows={3}
                value={formData.improvements}
                onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
                placeholder="รอบหน้าควรรอการคอนเฟิร์มแบบไหน..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={20} />
            {isSubmitting ? "กำลังบันทึก..." : "บันทึกไม้เทรดนี้"}
          </button>
        </form>
      ) : (
        /* หน้าแดชบอร์ดสรุปผล */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <span className="text-slate-400 text-sm">จำนวนไม้ที่บันทึก</span>
              <p className="text-3xl font-bold text-white mt-1">{trades.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <span className="text-slate-400 text-sm">RR เฉลี่ย</span>
              <p className="text-3xl font-bold text-emerald-400 mt-1">
                {trades.length > 0
                  ? (
                      trades.reduce((acc, curr) => acc + (curr.rr_ratio || 0), 0) /
                      (trades.filter((t) => t.rr_ratio).length || 1)
                    ).toFixed(2)
                  : "-"}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <span className="text-slate-400 text-sm">สัญญารวมที่เทรด</span>
              <p className="text-3xl font-bold text-amber-400 mt-1">
                {trades.reduce((acc, curr) => acc + (curr.contracts || 0), 0)}
              </p>
            </div>
          </div>

          {/* ตารางประวัติไม้เทรด */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 font-semibold text-slate-200">
              ประวัติการเทรดล่าสุด
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">วัน/เวลา</th>
                    <th className="p-3">Session</th>
                    <th className="p-3">Side</th>
                    <th className="p-3">Setup</th>
                    <th className="p-3">สัญญา</th>
                    <th className="p-3">RR</th>
                    <th className="p-3">ข้อผิดพลาด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {trades.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/50">
                      <td className="p-3">
                        {new Date(t.entry_datetime).toLocaleDateString("th-TH")} ({t.day_of_week})
                      </td>
                      <td className="p-3 text-amber-400 font-medium">{t.session}</td>
                      <td className={`p-3 font-semibold ${t.side === "Buy" ? "text-emerald-400" : "text-rose-400"}`}>
                        {t.side}
                      </td>
                      <td className="p-3">{t.setup_name}</td>
                      <td className="p-3 font-mono">{t.contracts}</td>
                      <td className="p-3 text-emerald-400 font-mono">1 : {t.rr_ratio || "-"}</td>
                      <td className="p-3 text-slate-400 text-xs truncate max-w-[200px]">{t.mistakes || "-"}</td>
                    </tr>
                  ))}
                  {trades.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-6 text-center text-slate-500">
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
    </div>
  );
}
