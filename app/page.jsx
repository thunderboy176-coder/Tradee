"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Flame,
  ArrowLeft,
  Download,
  Palette,
  PenTool,
  Eraser,
  Calendar as CalendarIcon,
  ShieldAlert,
  Radio,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  RotateCcw,
  CheckCircle,
  Heart,
  Lock,
  ListOrdered,
  Settings,
  Plus,
  Coins
} from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// นิยามสเปกสินค้าและตัวคูณ (Multiplier / Point Value)
const INSTRUMENTS = {
  MNQ: { name: "Micro E-mini Nasdaq (MNQ)", symbol: "MNQ", multiplier: 2, unit: "pts" },
  MGC: { name: "Micro Gold Futures (MGC)", symbol: "MGC", multiplier: 10, unit: "pts" },
  GC: { name: "Gold Futures Standard (GC)", symbol: "GC", multiplier: 100, unit: "pts" }
};

export default function App() {
  const [activeTab, setActiveTab] = useState("journal");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const [theme, setTheme] = useState("cyan");

  const BOOKS = [
    { id: "book_live", name: "พอร์ตจริง (Live)", mode: "live" },
    { id: "book_practice", name: "พอร์ตซ้อม (Backtest)", mode: "practice" }
  ];
  const [currentBookId, setCurrentBookId] = useState("book_live");
  const isLiveMode = currentBookId === "book_live";

  // การตั้งค่าความเสี่ยงและ Default Symbol แยกรายสมุด
  const defaultSettings = {
    book_live: { riskUsd: 250, defaultSymbol: "MNQ" },
    book_practice: { riskUsd: 250, defaultSymbol: "MNQ" }
  };
  const [bookSettings, setBookSettings] = useState(defaultSettings);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempRiskInput, setTempRiskInput] = useState("250");
  const [tempDefaultSymbol, setTempDefaultSymbol] = useState("MNQ");

  // สินค้าปัจจุบันที่เลือกเทรดหน้าบันทึก
  const [selectedSymbol, setSelectedSymbol] = useState("MNQ");
  const currentInstrument = INSTRUMENTS[selectedSymbol] || INSTRUMENTS.MNQ;
  const MULTIPLIER = currentInstrument.multiplier;

  const defaultSetups = [
    "Break Running Buy",
    "Break Running Sell",
    "Testing Running Buy",
    "Testing Running Sell",
    "Following Running Buy",
    "Following Running Sell"
  ];
  const [availableSetups, setAvailableSetups] = useState(defaultSetups);
  const [newSetupInput, setNewSetupInput] = useState("");

  const activeRiskUsd = bookSettings[currentBookId]?.riskUsd || 250;

  const [trades, setTrades] = useState([]);
  const [customLogo, setCustomLogo] = useState(null);
  const [customBabe, setCustomBabe] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const [isSlLockedPostModal, setIsSlLockedPostModal] = useState(false);
  const [lockModal, setLockModal] = useState({ open: false, type: "" });
  const [showShareModal, setShowShareModal] = useState(false);

  const [marketStatusText, setMarketStatusText] = useState("");
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [todayRedNews, setTodayRedNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [currentDateFormatted, setCurrentDateFormatted] = useState("");

  const [drawingModal, setDrawingModal] = useState({ open: false, imgIndex: 1 });
  const canvasRef = useRef(null);
  const baseImageRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#f43f5e");
  const [isEraser, setIsEraser] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterSide, setFilterSide] = useState("all");
  const [filterSetup, setFilterSetup] = useState("all");
  const [filterSession, setFilterSession] = useState("all");
  const [filterOutcome, setFilterOutcome] = useState("all");

  const getThaiNowString = () => {
    const now = new Date();
    const thaiTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const year = thaiTime.getFullYear();
    const month = String(thaiTime.getMonth() + 1).padStart(2, "0");
    const day = String(thaiTime.getDate()).padStart(2, "0");
    const hours = String(thaiTime.getHours()).padStart(2, "0");
    const minutes = String(thaiTime.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [slPoints, setSlPoints] = useState("");
  const [isTradingActive, setIsTradingActive] = useState(false);
  const [side, setSide] = useState("Buy / Long");
  const [setupName, setSetupName] = useState(defaultSetups[0]);
  const [entryTime, setEntryTime] = useState(getThaiNowString());
  const [exitTime, setExitTime] = useState("");
  const [tpPoints, setTpPoints] = useState("");
  const [outcome, setOutcome] = useState("Win");
  const [pnlDollar, setPnlDollar] = useState("");
  const [img1, setImg1] = useState(null);
  const [img2, setImg2] = useState(null);
  const [reason, setReason] = useState("");
  const [mistake, setMistake] = useState("");
  const [solution, setSolution] = useState("");
  const [thoughtSteps, setThoughtSteps] = useState(["", "", "", "", ""]);

  const handleStepChange = (index, value) => {
    const updated = [...thoughtSteps];
    updated[index] = value;
    setThoughtSteps(updated);
  };

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
    if (time >= 5 && time < 14) return "Asia (เช้า)";
    if (time >= 14 && time < 19.5) return "London (บ่าย)";
    if (time >= 19.5 || time < 4) return "New York (ค่ำ/ดึก)";
    return "CME Break (04:00-05:00)";
  };

  const getHoldingTime = (entryDateTime, exitTimeStr) => {
    if (!entryDateTime || !exitTimeStr) return "-";
    const entryTimeOnly = entryDateTime.split("T")[1];
    if (!entryTimeOnly) return "-";

    const [eH, eM] = entryTimeOnly.split(":").map(Number);
    const [xH, xM] = exitTimeStr.split(":").map(Number);
    if (isNaN(eH) || isNaN(eM) || isNaN(xH) || isNaN(xM)) return "-";

    let startMinutes = eH * 60 + eM;
    let endMinutes = xH * 60 + xM;

    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    const diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) return "-";

    const hrs = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return hrs > 0 ? `${hrs} ชม. ${mins} นาที` : `${mins} นาที`;
  };

  const bookTrades = trades.filter((t) => (t.book_id || "book_live") === currentBookId);
  const activeBookName = isLiveMode ? "พอร์ตจริง (Live)" : "พอร์ตซ้อม (Backtest)";

  const todayDateStr = (entryTime || getThaiNowString()).split("T")[0];
  const hasLossTodayInLive = isLiveMode && bookTrades.some(
    (t) => (t.entry_time?.startsWith(todayDateStr)) && (t.outcome === "Loss" || t.pnl < 0)
  );

  const handleSlInteraction = (val = null) => {
    if (isLiveMode) {
      if (hasLossTodayInLive) {
        setLockModal({ open: true, type: "daily_loss" });
        return;
      }
      if (isTradingActive) {
        setLockModal({ open: true, type: "in_trade" });
        return;
      }
    }
    if (val !== null && (!isLiveMode || !isSlLockedPostModal)) {
      setSlPoints(val);
    }
  };

  const handleCloseLockModal = () => {
    setLockModal({ open: false, type: "" });
    if (isLiveMode) {
      setIsSlLockedPostModal(true);
    }
  };

  // คำนวณสัญญาอิงตาม Multiplier ของสินค้าที่เลือก
  const rawSl = parseFloat(slPoints) || 0;
  const denominator = rawSl * MULTIPLIER;

  const actualCalculatedContracts = denominator > 0 ? Math.floor(activeRiskUsd / denominator) : 0;
  const liveDisplayContracts = isTradingActive ? actualCalculatedContracts : 0;

  const tpVal = parseFloat(tpPoints) || 0;
  const calculatedRR = rawSl > 0 && tpVal > 0 ? (tpVal / rawSl).toFixed(2) : "-";

  const practiceCalculatedPnl = () => {
    if (outcome === "Win") return tpVal * MULTIPLIER * actualCalculatedContracts;
    if (outcome === "Loss") return -(rawSl * MULTIPLIER * actualCalculatedContracts);
    return 0;
  };

  const fetchLiveRedNews = async () => {
    setNewsLoading(true);
    try {
      const now = new Date();
      const thaiTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
      const localYear = thaiTime.getFullYear();
      const localMonth = String(thaiTime.getMonth() + 1).padStart(2, "0");
      const localDate = String(thaiTime.getDate()).padStart(2, "0");
      const todayISO = `${localYear}-${localMonth}-${localDate}`;

      const res = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Feed error");
      const data = await res.json();

      const redEventsToday = data
        .filter((item) => {
          if (item.country !== "USD" || item.impact !== "High") return false;
          const eventDateObj = new Date(item.date);
          const evThai = new Date(eventDateObj.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
          const evYear = evThai.getFullYear();
          const evMonth = String(evThai.getMonth() + 1).padStart(2, "0");
          const evDate = String(evThai.getDate()).padStart(2, "0");
          return `${evYear}-${evMonth}-${evDate}` === todayISO;
        })
        .map((item) => {
          const dateObj = new Date(item.date);
          const evThai = new Date(dateObj.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
          const thaiHour = String(evThai.getHours()).padStart(2, "0");
          const thaiMinute = String(evThai.getMinutes()).padStart(2, "0");
          return {
            id: item.title + item.date,
            name: item.title,
            timeStr: `${thaiHour}:${thaiMinute} น. (เวลาไทย)`
          };
        });

      setTodayRedNews(redEventsToday);
    } catch (err) {
      console.warn("News fallback", err);
      setTodayRedNews([]);
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    const updateMarketClock = () => {
      const now = new Date();
      const thaiNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));

      const dayNames = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
      const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      setCurrentDateFormatted(`${dayNames[thaiNow.getDay()]}ที่ ${thaiNow.getDate()} ${months[thaiNow.getMonth()]} ${thaiNow.getFullYear() + 543} (เวลาไทย)`);

      const currentHour = thaiNow.getHours();
      const currentMinute = thaiNow.getMinutes();
      const currentSecond = thaiNow.getSeconds();

      if (currentHour === 4) {
        setIsMarketOpen(false);
        const remMins = 59 - currentMinute;
        const remSecs = 59 - currentSecond;
        setMarketStatusText(`ตลาดเปิดในอีก: 00:${remMins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')} (รอเปิด 05:00 น. เวลาไทย)`);
      } else {
        setIsMarketOpen(true);
        const nyCashOpen = new Date(thaiNow);
        nyCashOpen.setHours(20, 30, 0, 0);

        if (thaiNow.getTime() < nyCashOpen.getTime()) {
          const diff = nyCashOpen.getTime() - thaiNow.getTime();
          const hrs = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          setMarketStatusText(`🟢 ตลาดเปิดเทรดได้ | US Cash Open ในอีก: ${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        } else {
          setMarketStatusText("🟢 ตลาด CME & US Open (Active Trading)");
        }
      }
    };

    updateMarketClock();
    fetchLiveRedNews();
    const timer = setInterval(updateMarketClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedLogo = localStorage.getItem("tradee_custom_logo");
    const savedBabe = localStorage.getItem("tradee_custom_babe");
    const savedTheme = localStorage.getItem("tradee_theme");
    const savedBookSettings = localStorage.getItem("tradee_book_settings");
    const savedSetups = localStorage.getItem("tradee_available_setups");

    if (savedLogo) setCustomLogo(savedLogo);
    if (savedBabe) setCustomBabe(savedBabe);
    if (savedTheme) setTheme(savedTheme);
    if (savedBookSettings) {
      try {
        const parsed = JSON.parse(savedBookSettings);
        setBookSettings(parsed);
        if (parsed[currentBookId]?.defaultSymbol) {
          setSelectedSymbol(parsed[currentBookId].defaultSymbol);
        }
      } catch (e) {
        console.warn(e);
      }
    }
    if (savedSetups) {
      try {
        const parsed = JSON.parse(savedSetups);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAvailableSetups(parsed);
          setSetupName(parsed[0]);
        }
      } catch (e) {
        console.warn(e);
      }
    }

    loadTrades();
  }, []);

  // เมื่อสลับสมุด ให้ปรับค่า Default Symbol ตามที่สมุดนั้นตั้งไว้
  const handleSwitchBook = (bookId) => {
    setCurrentBookId(bookId);
    setIsSlLockedPostModal(false);
    const defSym = bookSettings[bookId]?.defaultSymbol || "MNQ";
    setSelectedSymbol(defSym);
    if (activeTab === "trade-detail") setActiveTab("dashboard");
  };

  const handleOpenSettingsModal = () => {
    setTempRiskInput(String(activeRiskUsd));
    setTempDefaultSymbol(bookSettings[currentBookId]?.defaultSymbol || "MNQ");
    setNewSetupInput("");
    setShowSettingsModal(true);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const val = parseFloat(tempRiskInput) || 250;
    const updated = {
      ...bookSettings,
      [currentBookId]: { 
        riskUsd: val,
        defaultSymbol: tempDefaultSymbol
      }
    };
    setBookSettings(updated);
    setSelectedSymbol(tempDefaultSymbol);
    localStorage.setItem("tradee_book_settings", JSON.stringify(updated));
    localStorage.setItem("tradee_available_setups", JSON.stringify(availableSetups));
    setShowSettingsModal(false);
    setStatusMsg({ type: "success", text: `อัปเดตการตั้งค่าของ "${activeBookName}" เรียบร้อยแล้ว` });
  };

  const handleAddSetup = () => {
    const trimmed = newSetupInput.trim();
    if (!trimmed) return;
    if (availableSetups.includes(trimmed)) {
      alert("ชื่อ Setup นี้มีอยู่ในระบบแล้วครับ");
      return;
    }
    const updated = [...availableSetups, trimmed];
    setAvailableSetups(updated);
    localStorage.setItem("tradee_available_setups", JSON.stringify(updated));
    setNewSetupInput("");
  };

  const handleDeleteSetup = (setupToDelete) => {
    if (availableSetups.length <= 1) {
      alert("ต้องมี Setup อย่างน้อย 1 รูปแบบในระบบครับ");
      return;
    }
    if (!confirm(`ต้องการลบ Setup "${setupToDelete}" ออกจากรายการใช่ไหมครับ?`)) return;
    const updated = availableSetups.filter((s) => s !== setupToDelete);
    setAvailableSetups(updated);
    localStorage.setItem("tradee_available_setups", JSON.stringify(updated));
    if (setupName === setupToDelete) {
      setSetupName(updated[0]);
    }
  };

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

  const handleSubmitTrade = async () => {
    if (!slPoints) {
      setStatusMsg({ type: "error", text: "กรุณาระบุระยะ SL" });
      return;
    }

    if (isLiveMode && pnlDollar === "") {
      setStatusMsg({ type: "error", text: "พอร์ตจริง: ต้องกรอกตัวเลข P&L ($ USD) ที่เกิดขึ้นจริงด้วยตนเองครับ" });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: "", text: "" });

    const parsedRR = calculatedRR !== "-" ? parseFloat(calculatedRR) : 1;
    const finalRealizedRR = outcome === "Win" ? parsedRR : (outcome === "Loss" ? -1 : 0);
    
    const finalPnl = isLiveMode 
      ? parseFloat(pnlDollar) 
      : (pnlDollar !== "" ? parseFloat(pnlDollar) : practiceCalculatedPnl());

    const payload = {
      id: "trade_" + Date.now(),
      book_id: currentBookId,
      symbol: selectedSymbol,
      side,
      setup_name: setupName,
      sl_points: rawSl,
      tp_points: tpVal,
      contracts: actualCalculatedContracts,
      risk_usd: activeRiskUsd,
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
      thought_steps: thoughtSteps.filter(s => s.trim() !== ""),
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

      setStatusMsg({ type: "success", text: `บันทึกไม้เทรด (${selectedSymbol}) ลงใน "${activeBookName}" เรียบร้อยแล้ว!` });
      
      setSlPoints("");
      setTpPoints("");
      setPnlDollar("");
      setExitTime("");
      setImg1(null);
      setImg2(null);
      setReason("");
      setMistake("");
      setSolution("");
      setThoughtSteps(["", "", "", "", ""]);
      setIsTradingActive(false);
      setIsSlLockedPostModal(false);
    } catch (err) {
      const updated = [payload, ...trades];
      setTrades(updated);
      localStorage.setItem("tradee_cached_trades", JSON.stringify(updated));
      setStatusMsg({ type: "success", text: "บันทึกข้อมูลเข้าเครื่องเรียบร้อยแล้ว!" });
      setIsTradingActive(false);
      setIsSlLockedPostModal(false);
    } finally {
      setLoading(false);
    }
  };

  const deleteTrade = async (id) => {
    const target = trades.find((t) => t.id === id);
    if (isLiveMode && target && (target.outcome === "Loss" || target.pnl < 0)) {
      alert("⚠️ กฎเหล็กพอร์ตจริง: ระบบไม่อนุญาตให้ลบไม้แพ้ (Loss) ออกจากประวัติเด็ดขาด!");
      return;
    }

    if (!confirm("ต้องการลบหน้าบันทึกนี้ใช่ไหมครับ?")) return;
    try {
      if (supabase) await supabase.from("trades").delete().eq("id", id);
    } catch (e) {
      console.warn(e);
    }
    const updated = trades.filter((t) => t.id !== id);
    setTrades(updated);
    localStorage.setItem("tradee_cached_trades", JSON.stringify(updated));
    if (selectedTrade?.id === id) {
      setSelectedTrade(null);
      setActiveTab("dashboard");
    }
  };

  const handleOpenTradeDetail = (trade) => {
    setSelectedTrade(trade);
    setActiveTab("trade-detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExportCSV = () => {
    if (bookTrades.length === 0) {
      alert("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }
    const headers = ["ID,Book,Symbol,Date,Session,Side,Setup,Contracts,SL_Points,RR,Outcome,PnL_USD,Reason,Mistake,Solution,ThoughtProcess\n"];
    const rows = bookTrades.map(t => 
      `"${t.id}","${activeBookName}","${t.symbol || 'MNQ'}","${t.entry_time}","${t.session}","${t.side}","${t.setup_name}",${t.contracts},${t.sl_points},"${t.rr || '-'}",${t.outcome},${t.pnl},"${(t.reason||'').replace(/"/g, '""')}","${(t.mistake||'').replace(/"/g, '""')}","${(t.solution||'').replace(/"/g, '""')}","${(t.thought_steps?.join(' > ')||'').replace(/"/g, '""')}"`
    );
    const blob = new Blob(["\uFEFF" + headers.concat(rows).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tradee_${currentBookId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openCanvasMarkup = (imgIndex) => {
    const targetImg = imgIndex === 1 ? img1 : img2;
    if (!targetImg) return;
    setIsEraser(false);
    setDrawingModal({ open: true, imgIndex });
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const image = new window.Image();
      image.src = targetImg;
      image.onload = () => {
        canvas.width = image.naturalWidth || 800;
        canvas.height = image.naturalHeight || 600;
        ctx.drawImage(image, 0, 0);
        baseImageRef.current = image;
      };
    }, 100);
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.beginPath();
    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    
    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 24;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = 5;
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const saveCanvasMarkup = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const fCtx = finalCanvas.getContext("2d");
    if (baseImageRef.current) {
      fCtx.drawImage(baseImageRef.current, 0, 0);
    }
    fCtx.drawImage(canvas, 0, 0);

    const editedBase64 = canvas.toDataURL("image/png");
    if (drawingModal.imgIndex === 1) setImg1(editedBase64);
    else setImg2(editedBase64);
    setDrawingModal({ open: false, imgIndex: 1 });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterSide("all");
    setFilterSetup("all");
    setFilterSession("all");
    setFilterOutcome("all");
  };

  const filteredTrades = bookTrades.filter((t) => {
    const matchesSearch = 
      (t.symbol || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.setup_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.reason || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.mistake || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.entry_time || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSide = filterSide === "all" || t.side?.includes(filterSide);
    const matchesSetup = filterSetup === "all" || t.setup_name === filterSetup;
    const matchesSession = filterSession === "all" || t.session?.includes(filterSession);
    const matchesOutcome = filterOutcome === "all" || t.outcome === filterOutcome;

    return matchesSearch && matchesSide && matchesSetup && matchesSession && matchesOutcome;
  });

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
  const netPnL = grossProfit - grossLoss;
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? "∞" : "0.00");
  const pWin = totalTrades > 0 ? winTrades.length / totalTrades : 0;
  const pLoss = totalTrades > 0 ? lossTrades.length / totalTrades : 0;
  const expectancy = ((pWin * avgWinR) - (pLoss * avgLossR)).toFixed(2);

  const matchaCups = Math.max(0, Math.floor(netPnL / 10));
  const isSammyHappy = parseFloat(winRate) >= 55 || (bookTrades[0]?.outcome === "Win");

  const todayThaiDateOnly = getThaiNowString().split("T")[0];
  const todayTrades = bookTrades.filter(t => t.entry_time?.startsWith(todayThaiDateOnly));
  const todayPnL = todayTrades.reduce((acc, c) => acc + (c.pnl || 0), 0);
  const todayNetR = todayTrades.reduce((acc, c) => acc + (c.realized_rr ?? (c.outcome === "Win" ? 1 : -1)), 0);
  const todayMatchaUnlocked = Math.max(0, Math.floor(todayPnL / 10));

  const handleDownloadTopstepStyleCard = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");

    const bgGrad = ctx.createRadialGradient(850, 250, 50, 540, 540, 800);
    bgGrad.addColorStop(0, "#22354c");
    bgGrad.addColorStop(0.5, "#101a26");
    bgGrad.addColorStop(1, "#070b10");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
    ctx.lineWidth = 1;
    for (let x = 0; x < 1080; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1080); ctx.stroke();
    }
    for (let y = 0; y < 1080; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke();
    }

    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.moveTo(420, 720);
    ctx.lineTo(1020, 580);
    ctx.lineTo(1020, 920);
    ctx.lineTo(420, 1040);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.moveTo(380, 740);
    ctx.lineTo(420, 720);
    ctx.lineTo(420, 1040);
    ctx.lineTo(380, 1060);
    ctx.closePath();
    ctx.fill();

    const coinX = 760;
    const coinY = 380;
    const coinR = 210;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
    ctx.shadowBlur = 45;
    ctx.shadowOffsetX = -20;
    ctx.shadowOffsetY = 30;
    ctx.beginPath();
    ctx.arc(coinX, coinY, coinR, 0, Math.PI * 2);
    ctx.fillStyle = "#64748b";
    ctx.fill();
    ctx.restore();

    const rimGrad = ctx.createLinearGradient(coinX - coinR, coinY - coinR, coinX + coinR, coinY + coinR);
    rimGrad.addColorStop(0, "#ffffff");
    rimGrad.addColorStop(0.25, "#94a3b8");
    rimGrad.addColorStop(0.5, "#cbd5e1");
    rimGrad.addColorStop(0.75, "#475569");
    rimGrad.addColorStop(1, "#f8fafc");
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(coinX, coinY, coinR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(coinX, coinY, coinR - 25, 0, Math.PI * 2);
    ctx.fill();

    const innerGrad = ctx.createRadialGradient(coinX - 40, coinY - 40, 20, coinX, coinY, coinR - 50);
    innerGrad.addColorStop(0, "#ffffff");
    innerGrad.addColorStop(0.4, "#94a3b8");
    innerGrad.addColorStop(0.8, "#64748b");
    innerGrad.addColorStop(1, "#334155");
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(coinX, coinY, coinR - 55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SAMMY", coinX, coinY - coinR + 45);
    ctx.fillText("DISCIPLINED TRADER", coinX, coinY + coinR - 35);

    ctx.fillStyle = "#090d16";
    ctx.font = "900 40px sans-serif";
    ctx.fillText("TRADEE", coinX, coinY + 12);

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 64px sans-serif";
    ctx.fillText("TRADEE", 100, 140);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("✔ Proof of Discipline", 100, 195);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 24px sans-serif";
    ctx.fillText("Issued to", 100, 420);

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 48px sans-serif";
    ctx.fillText("Prachasant T.", 100, 475);

    ctx.fillStyle = todayPnL >= 0 ? "#ffffff" : "#f43f5e";
    ctx.font = "900 110px sans-serif";
    ctx.fillText(`${todayPnL >= 0 ? '+' : ''}$${Math.abs(todayPnL).toLocaleString()}`, 100, 610);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(`CME Futures Trader • Realized ${todayNetR >= 0 ? '+' : ''}${todayNetR.toFixed(1)}R (${todayTrades.length} ไม้)`, 100, 670);

    ctx.fillStyle = "#64748b";
    ctx.font = "22px sans-serif";
    ctx.fillText(`📅 ${currentDateFormatted}`, 100, 740);

    ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
    ctx.beginPath();
    ctx.roundRect(100, 780, 420, 56, 28);
    ctx.fill();
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#34d399";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(`🍵 กองทุนชาเขียววันนี้: +${todayMatchaUnlocked} แก้วให้แฟน!`, 130, 816);

    ctx.fillStyle = "rgba(30, 41, 59, 0.8)";
    ctx.beginPath();
    ctx.roundRect(100, 870, 360, 60, 30);
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#0284c7";
    ctx.beginPath();
    ctx.arc(135, 900, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("Funded Trader Discipline", 165, 907);

    ctx.font = "32px sans-serif";
    ctx.fillText("🇹🇭", 480, 912);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(860, 860, 120, 120);
    ctx.fillStyle = "#000000";
    ctx.fillRect(875, 875, 30, 30);
    ctx.fillRect(935, 875, 30, 30);
    ctx.fillRect(875, 935, 30, 30);
    ctx.fillRect(920, 920, 20, 20);
    ctx.fillRect(945, 945, 20, 20);

    const finishDownload = () => {
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Tradee_Certificate_${todayThaiDateOnly}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    if (customBabe) {
      const babeImg = new window.Image();
      babeImg.crossOrigin = "anonymous";
      babeImg.src = customBabe;
      babeImg.onload = () => {
        ctx.save();
        ctx.translate(620, 640);
        ctx.rotate(-0.06);

        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 25;
        ctx.shadowOffsetY = 15;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-10, -10, 220, 260);

        ctx.drawImage(babeImg, 0, 0, 200, 200);

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 17px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Mumu's Support 🍵", 100, 235);
        ctx.restore();

        finishDownload();
      };
      babeImg.onerror = finishDownload;
    } else {
      finishDownload();
    }
  };

  const setupStats = availableSetups.map((name) => {
    const list = bookTrades.filter((t) => t.setup_name === name);
    const wins = list.filter((t) => t.outcome === "Win" || t.pnl > 0).length;
    const wr = list.length > 0 ? ((wins / list.length) * 100).toFixed(0) : "-";
    const pnl = list.reduce((acc, c) => acc + (c.pnl || 0), 0);
    return { name, count: list.length, wins, wr, pnl };
  });

  const sessionStats = ["Asia", "London", "New York"].map((sess) => {
    const list = bookTrades.filter((t) => t.session?.includes(sess));
    const wins = list.filter((t) => t.outcome === "Win" || t.pnl > 0).length;
    const wr = list.length > 0 ? ((wins / list.length) * 100).toFixed(0) : "-";
    const netR = list.reduce((acc, c) => acc + (c.realized_rr || (c.outcome === "Win" ? 1 : -1)), 0);
    return { session: sess, count: list.length, wr, netR: netR.toFixed(1) };
  });

  const sortedChronologicalTrades = [...bookTrades].sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time));
  let runningPnl = 0;
  const equityPoints = [{ x: 0, pnl: 0 }, ...sortedChronologicalTrades.map((t, idx) => {
    runningPnl += (t.pnl || 0);
    return { x: idx + 1, pnl: runningPnl };
  })];

  const currentYearMonth = (entryTime || getThaiNowString()).slice(0, 7);
  const daysInMonth = 31;
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const datePattern = `${currentYearMonth}-${dayNum.toString().padStart(2, "0")}`;
    const dayTrades = bookTrades.filter(t => t.entry_time?.startsWith(datePattern));
    const dayPnL = dayTrades.reduce((acc, c) => acc + (c.pnl || 0), 0);
    const hasWin = dayTrades.some(t => t.outcome === "Win" || t.pnl > 0);
    const hasLoss = dayTrades.some(t => t.outcome === "Loss" || t.pnl < 0);
    return { dayNum, dayTrades, dayPnL, hasWin, hasLoss };
  });

  const themeClasses = {
    cyan: { primary: "bg-cyan-600 hover:bg-cyan-500", text: "text-cyan-400", border: "border-cyan-900/80", badge: "bg-cyan-950 text-cyan-400 border-cyan-800/60" },
    blue: { primary: "bg-blue-600 hover:bg-blue-500", text: "text-blue-400", border: "border-blue-900/80", badge: "bg-blue-950 text-blue-400 border-blue-800/60" },
    matcha: { primary: "bg-emerald-600 hover:bg-emerald-500", text: "text-emerald-400", border: "border-emerald-900/80", badge: "bg-emerald-950 text-emerald-400 border-emerald-800/60" },
  }[theme];

  return (
    <div className="min-h-screen bg-[#070e17] text-slate-200 p-3 md:p-6 font-sans">
      
      {/* HEADER */}
      <header className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-cyan-950/80">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-cyan-400/40 shadow-lg shrink-0 bg-slate-900 flex items-center justify-center overflow-hidden">
              {customLogo ? (
                <img src={customLogo} alt="Tradee Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <span className="text-2xl">{isSammyHappy ? "😎" : "🥺"}</span>
                </div>
              )}
            </div>

            <label className="absolute -bottom-1 -right-1 bg-cyan-600 hover:bg-cyan-500 text-white p-1 rounded-full cursor-pointer shadow-md transition" title="เปลี่ยนรูปโลโก้">
              <Camera className="w-3 h-3" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setCustomLogo, "tradee_custom_logo")} />
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-black tracking-tight text-white">Tradee</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${themeClasses.badge}`}>
                Futures Journal
              </span>
              <span className="text-xs">{isSammyHappy ? "🐢✨" : "🐢💚"}</span>
            </div>
            <p className="text-[11px] text-slate-400">Don't rush what takes time • ล็อก Risk ${activeRiskUsd} USD • เวลาไทย (ICT GMT+7)</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1 bg-[#0b1626] border border-cyan-900/60 p-1 rounded-xl">
            <Palette className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <button onClick={() => { setTheme("cyan"); localStorage.setItem("tradee_theme", "cyan"); }} className={`w-4 h-4 rounded-full bg-cyan-500 transition ${theme === "cyan" ? "ring-2 ring-white" : "opacity-60"}`} title="Midnight Cyan" />
            <button onClick={() => { setTheme("blue"); localStorage.setItem("tradee_theme", "blue"); }} className={`w-4 h-4 rounded-full bg-blue-500 transition ${theme === "blue" ? "ring-2 ring-white" : "opacity-60"}`} title="Deep Ocean Blue" />
            <button onClick={() => { setTheme("matcha"); localStorage.setItem("tradee_theme", "matcha"); }} className={`w-4 h-4 rounded-full bg-emerald-500 transition ${theme === "matcha" ? "ring-2 ring-white" : "opacity-60"}`} title="Forest Matcha" />
          </div>

          {/* สลับสมุด (จริง vs ซ้อม) + ปุ่มตั้งค่า */}
          <div className="flex items-center gap-1 bg-[#0b1626] border border-cyan-900/80 p-1 rounded-xl shadow-md">
            <button
              onClick={() => handleSwitchBook("book_live")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition ${
                currentBookId === "book_live"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-300 animate-pulse inline-block"></span>
              พอร์ตจริง (Live)
            </button>
            <button
              onClick={() => handleSwitchBook("book_practice")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition ${
                currentBookId === "book_practice"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block"></span>
              พอร์ตซ้อม (Backtest)
            </button>

            <button
              onClick={handleOpenSettingsModal}
              className="p-1.5 hover:bg-cyan-950/80 text-cyan-300 hover:text-white rounded-lg transition border-l border-cyan-900/60 ml-1"
              title={`ตั้งค่าความเสี่ยง, สินค้า และ Setup (${activeBookName})`}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex bg-[#0b1626] border border-cyan-950 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("journal")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "journal" ? `${themeClasses.primary} text-white shadow` : "text-slate-400 hover:text-white"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" /> หน้าบันทึก
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "dashboard" ? `${themeClasses.primary} text-white shadow` : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> แดชบอร์ดสรุปผล
            </button>
          </div>
        </div>
      </header>

      {/* 🔴 LIVE FOREX FACTORY BANNER + CME CLOCK */}
      <div className="max-w-[1600px] mx-auto mt-3 space-y-2">
        {newsLoading ? (
          <div className="bg-[#0b1626] border border-cyan-900/40 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              กำลังซิงค์ปฏิทินข่าวกล่องแดง Real-Time (เวลาไทย)...
            </span>
          </div>
        ) : todayRedNews.length > 0 ? (
          <div className="bg-gradient-to-r from-rose-950/90 via-[#210910] to-rose-950/90 border-2 border-rose-500/80 rounded-2xl p-3.5 px-5 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-600/30 text-rose-300 border border-rose-500/50 animate-bounce">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-rose-200 uppercase tracking-wider bg-rose-900/90 border border-rose-700 px-2 py-0.5 rounded">
                    🚨 วันนี้มีข่าวกล่องแดง USD (Forex Factory Live)
                  </span>
                  <span className="text-xs text-slate-300 font-mono">({currentDateFormatted})</span>
                </div>
                
                <div className="text-sm font-bold text-white mt-1.5 flex flex-wrap items-center gap-3">
                  {todayRedNews.map(news => (
                    <span key={news.id} className="inline-flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-rose-900/60">
                      <span className="text-amber-400 font-mono font-black">⏰ {news.timeStr}</span>
                      <span>— {news.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={fetchLiveRedNews}
                className="p-1.5 bg-rose-900/50 hover:bg-rose-800 text-rose-300 rounded-lg text-xs transition"
                title="รีเฟรชข้อมูลข่าวสด"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold bg-rose-600 text-white px-3 py-1 rounded-full shadow">
                ⚠️ งดเข้าออเดอร์ก่อน-หลังข่าว 3 นาที
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-[#0b1626]/80 border border-cyan-900/40 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>วันนี้ ({currentDateFormatted}): <strong className="text-emerald-400">ไม่มีข่าวกล่องแดง USD</strong> เทรดตามแผนปกติได้เลย</span>
            </div>
            <button onClick={fetchLiveRedNews} className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-mono">
              <RefreshCw className="w-3.5 h-3.5" /> อัปเดตสด
            </button>
          </div>
        )}

        <div className="bg-[#0b1626] border border-cyan-900/60 rounded-xl px-4 py-2 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 ${isMarketOpen ? "text-emerald-400 animate-ping" : "text-amber-400"}`} />
            <span className="text-xs font-bold text-slate-200">CME Market Status ({selectedSymbol} Futures - เวลาไทย):</span>
          </div>
          <div className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-md border ${
            isMarketOpen 
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-700" 
              : "bg-amber-950/80 text-amber-300 border-amber-700 animate-pulse"
          }`}>
            {marketStatusText}
          </div>
        </div>
      </div>

      {/* BANNER รูปแฟน + กองทุนชาเขียว */}
      <div className="max-w-[1600px] mx-auto mt-3">
        <div className="bg-gradient-to-r from-[#0a1829] via-[#0d1d33] to-[#0a1829] border border-cyan-900/40 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
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
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setCustomBabe, "tradee_custom_babe")} />
              </label>
            </div>

            <div className="bg-white text-slate-900 rounded-xl px-4 py-2 shadow border border-cyan-200">
              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                “สู้ๆน้าเบ้บๆ หาตังซื้อชาเขียวให้แซมๆหน่อย” 🍵
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {isSammyHappy 
                  ? "🐢 แซมมี่: สุดยอดมากเบ้บ เทรดคมแบบนี้ชาเขียวหวานเจี๊ยบ!" 
                  : "🐢 แซมมี่: ไม่เป็นไรเบ้บ ไม้หน้าเอาใหม่ คุม Risk ดีแล้ว เก่งมาก!"}
              </p>
            </div>
          </div>

          <div className="bg-[#070e17] border border-emerald-500/40 rounded-xl p-2.5 px-4 flex items-center gap-4 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-xl shadow">
              🍵
            </div>
            <div>
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <span>กองทุนชาเขียวของแซมๆ ({activeBookName})</span>
                {netPnL > 0 && <Sparkles className="w-3 h-3 text-emerald-300 animate-spin" />}
              </div>
              <div className="text-lg font-black text-white font-mono">
                {matchaCups} <span className="text-xs text-slate-400 font-normal">แก้ว</span>
                <span className={`text-xs ml-2 ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ({netPnL >= 0 ? `+$${netPnL.toFixed(0)}` : `-$${Math.abs(netPnL).toFixed(0)}`})
                </span>
              </div>
              <div className="text-[9px] text-slate-400">ทุก $100 กำไร = ชาเขียว 10 แก้วให้แฟน</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN VIEW */}
      <main className="max-w-[1600px] mx-auto mt-4">
        
        {/* ================= 1. VIEW: หน้าบันทึก ================= */}
        {activeTab === "journal" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <div className="xl:col-span-7 space-y-4">
              
              {/* แถบระบุสินค้าและตัวคูณ พร้อม Dropdown สลับสินค้าหน้างาน */}
              <div className="bg-[#0b1626] border border-cyan-900/60 rounded-xl px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" /> โหมด: <strong className={isLiveMode ? "text-rose-400" : "text-emerald-400"}>{activeBookName}</strong>
                  </span>
                </div>

                {/* 🌟 Dropdown เลือก Symbol หน้างาน */}
                <div className="flex items-center gap-2 bg-[#070e17] px-2.5 py-1 rounded-lg border border-cyan-900">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400 text-[11px]">สินค้า:</span>
                  <select
                    value={selectedSymbol}
                    onChange={(e) => setSelectedSymbol(e.target.value)}
                    className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer"
                  >
                    <option value="MNQ" className="bg-[#0b1626] text-white">MNQ ($2/pt - Nasdaq Micro)</option>
                    <option value="MGC" className="bg-[#0b1626] text-white">MGC ($10/pt - Gold Micro)</option>
                    <option value="GC" className="bg-[#0b1626] text-white">GC ($100/pt - Gold Standard)</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 font-mono text-slate-300">
                  <span>Risk: <strong className="text-emerald-400">${activeRiskUsd}</strong></span>
                  <span>|</span>
                  <span>Multiplier: <strong className="text-white">${MULTIPLIER}/pt</strong></span>
                </div>
              </div>

              {/* ภาพที่ 1 */}
              <div
                tabIndex={0}
                onPaste={(e) => handlePaste(e, setImg1)}
                className={`relative w-full bg-[#09121f] border-2 border-dashed border-cyan-900/80 hover:border-cyan-400 rounded-2xl transition focus:outline-none shadow-xl h-[400px] max-h-[400px] overflow-hidden ${
                  img1 ? "p-1.5" : "p-8 flex flex-col items-center justify-center cursor-pointer"
                }`}
              >
                {img1 ? (
                  <div className="relative w-full h-full group flex items-center justify-center bg-black/40 rounded-xl overflow-hidden">
                    <img src={img1} alt="ภาพที่ 1 การวิเคราะห์" className="w-full h-full object-contain block rounded-lg select-none" />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-cyan-800 shadow-xl opacity-80 group-hover:opacity-100 transition">
                      <button onClick={() => openCanvasMarkup(1)} className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow">
                        <PenTool className="w-3 h-3" /> วาด / ลบมาร์กเกอร์
                      </button>
                      <button onClick={() => setLightboxImg(img1)} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow">
                        <Maximize2 className="w-3.5 h-3.5" /> เต็มจอ
                      </button>
                      <button onClick={() => setImg1(null)} className="px-2 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold">
                        ลบ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center w-full">
                    <ImageIcon className="w-14 h-14 text-cyan-600 mx-auto mb-2" />
                    <p className="text-lg font-black text-slate-100">ภาพที่ 1: Reason of Setup / การวิเคราะห์</p>
                    <p className="text-xs text-cyan-400 mt-1 font-mono">คลิกที่นี่แล้วกด Ctrl + V เพื่อวางภาพ (กว้างเต็มพื้นที่ ล็อกความสูงคงที่)</p>
                  </div>
                )}
              </div>

              {/* ภาพที่ 2 */}
              <div
                tabIndex={0}
                onPaste={(e) => handlePaste(e, setImg2)}
                className={`relative w-full bg-[#09121f] border-2 border-dashed border-cyan-900/80 hover:border-cyan-400 rounded-2xl transition focus:outline-none shadow-xl h-[400px] max-h-[400px] overflow-hidden ${
                  img2 ? "p-1.5" : "p-8 flex flex-col items-center justify-center cursor-pointer"
                }`}
              >
                {img2 ? (
                  <div className="relative w-full h-full group flex items-center justify-center bg-black/40 rounded-xl overflow-hidden">
                    <img src={img2} alt="ภาพที่ 2 จุดเข้าจริง" className="w-full h-full object-contain block rounded-lg select-none" />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-cyan-800 shadow-xl opacity-80 group-hover:opacity-100 transition">
                      <button onClick={() => openCanvasMarkup(2)} className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow">
                        <PenTool className="w-3 h-3" /> วาด / ลบมาร์กเกอร์
                      </button>
                      <button onClick={() => setLightboxImg(img2)} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow">
                        <Maximize2 className="w-3.5 h-3.5" /> เต็มจอ
                      </button>
                      <button onClick={() => setImg2(null)} className="px-2 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold">
                        ลบ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center w-full">
                    <ImageIcon className="w-14 h-14 text-cyan-600 mx-auto mb-2" />
                    <p className="text-lg font-black text-slate-100">ภาพที่ 2: Close Up จุดเข้าจริงๆ</p>
                    <p className="text-xs text-cyan-400 mt-1 font-mono">คลิกที่นี่แล้วกด Ctrl + V เพื่อวางภาพ (กว้างเต็มพื้นที่ ล็อกความสูงคงที่)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="xl:col-span-5 space-y-4">
              <div className="bg-gradient-to-br from-[#0c182c] via-[#091526] to-[#070e1b] border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Flame className="w-4 h-4 text-amber-400 animate-pulse" /> จุดคำนวณสัญญาด่วน ({selectedSymbol})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Risk ${activeRiskUsd} | ${MULTIPLIER}/Point</span>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-7 space-y-1.5">
                    <label className="block text-xs font-black text-amber-300 flex items-center justify-between">
                      <span>กรอกระยะ SL (จุด Points) *</span>
                      {isLiveMode && isSlLockedPostModal && (
                        <span className="text-[10px] text-rose-400 flex items-center gap-1 animate-pulse">
                          <Lock className="w-3 h-3" /> ล็อกระบบ
                        </span>
                      )}
                    </label>

                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        disabled={isLiveMode && isSlLockedPostModal}
                        value={slPoints}
                        onClick={() => handleSlInteraction()}
                        onFocus={() => handleSlInteraction()}
                        onChange={(e) => handleSlInteraction(e.target.value)}
                        placeholder={isLiveMode && isSlLockedPostModal ? "ถูกล็อกตามกฎเหล็ก" : "เช่น 20.0 หรือ 5.0"}
                        className={`w-full bg-[#040810] border-2 rounded-xl px-3 py-2 text-white font-mono text-xl font-bold tracking-wide outline-none shadow-inner transition ${
                          isLiveMode && isSlLockedPostModal 
                            ? "border-rose-900/60 opacity-40 cursor-not-allowed bg-rose-950/20" 
                            : "border-amber-500/90 focus:border-amber-400 cursor-pointer"
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-amber-400/80 font-mono font-bold">{currentInstrument.unit}</span>
                    </div>

                    <div className="pt-1">
                      <div className="p-2 rounded-xl bg-[#070e17] border border-cyan-900/80 flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-cyan-300">
                          <input
                            type="checkbox"
                            checked={isTradingActive}
                            onChange={(e) => {
                              if (!slPoints && !isTradingActive) {
                                alert("กรุณากรอกระยะ SL ก่อนเริ่มเข้าเทรดครับ");
                                return;
                              }
                              setIsTradingActive(e.target.checked);
                            }}
                            className="w-4 h-4 rounded border-cyan-500 text-cyan-500 focus:ring-cyan-400 bg-[#070e17]"
                          />
                          <span>กำลังเทรด (ห้ามเข้าซ้อน)</span>
                        </label>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isTradingActive ? "bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse" : "text-slate-500"}`}>
                          {isTradingActive ? "IN POSITION" : "STANDBY"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-5 bg-gradient-to-b from-emerald-950/80 to-emerald-900/40 border-2 border-emerald-400 rounded-2xl p-2.5 text-center shadow-lg shadow-emerald-500/10 flex flex-col justify-center min-h-[140px]">
                    <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                      {isLiveMode ? "สัญญาที่เปิดได้" : "โหมดฝึกซ้อม (Backtest)"}
                    </div>

                    {isLiveMode ? (
                      <>
                        <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tighter my-0.5 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]">
                          {liveDisplayContracts}
                        </div>
                        <div className="text-[10px] text-slate-300 font-medium">
                          {isTradingActive ? `${selectedSymbol} Contracts (ปัดลง)` : "⚠️ ติ๊ก 'กำลังเทรด' เพื่อคำนวณ"}
                        </div>
                      </>
                    ) : (
                      <div className="my-auto py-2">
                        <div className="text-sm font-black text-amber-300 leading-snug animate-pulse">
                          “ซ้อมเยอะๆน้า<br/>เบ้บๆ 🍵💚”
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1">
                          ({selectedSymbol} • คำนวณ P&L ให้หลังบ้าน)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
                      {availableSetups.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
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
                      placeholder="เช่น 60.0 หรือ 15.0"
                      className="w-full bg-[#070e17] border border-cyan-900 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="bg-[#070e17] p-1.5 rounded-lg border border-cyan-950 text-center flex flex-col justify-center">
                    <div className="text-[10px] text-slate-400">RR คำนวณ</div>
                    <div className="text-sm font-bold text-cyan-300 font-mono">{calculatedRR !== "-" ? `1 : ${calculatedRR}` : "-"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Entry Time (เวลาไทย)</label>
                    <input
                      type="datetime-local"
                      value={entryTime}
                      onChange={(e) => setEntryTime(e.target.value)}
                      className="w-full bg-[#070e17] border border-cyan-900 rounded-lg px-2 py-1 text-white text-[11px] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Exit Time (เวลาออก HH:mm)</label>
                    <input
                      type="time"
                      value={exitTime}
                      onChange={(e) => setExitTime(e.target.value)}
                      className="w-full bg-[#070e17] border border-cyan-900 rounded-lg px-2 py-1 text-white text-[11px] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-[#070e17] px-3 py-1.5 rounded-lg border border-cyan-950 font-mono">
                  <span>วัน: <strong className="text-white">{getDayName(entryTime)}</strong></span>
                  <span>Session: <strong className="text-cyan-300">{getSessionName(entryTime)}</strong></span>
                  <span>Hold: <strong className="text-slate-300">{getHoldingTime(entryTime, exitTime)}</strong></span>
                </div>

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
                    <label className="block text-[10px] text-slate-400 mb-0.5 flex items-center justify-between">
                      <span>P&L ($ USD) {isLiveMode ? <strong className="text-rose-400">*กรอกเอง</strong> : "(Auto/Optional)"}</span>
                    </label>
                    <input
                      type="number"
                      value={pnlDollar}
                      onChange={(e) => setPnlDollar(e.target.value)}
                      placeholder={isLiveMode ? "ระบุกำไร/ขาดทุนจริง" : `Auto: ~$${practiceCalculatedPnl().toFixed(0)}`}
                      className={`w-full bg-[#070e17] border rounded-lg px-2 py-1 text-white text-xs font-mono outline-none ${
                        isLiveMode ? "border-rose-500/80 focus:border-rose-400" : "border-cyan-900 focus:border-cyan-500"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 3 กล่องเดิม + ลำดับการคิด (5 ช่องแนวตั้ง) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
                <div className="md:col-span-8 flex flex-col justify-between gap-2.5">
                  <div className="bg-[#0b1626] border border-cyan-900/60 rounded-xl p-3 shadow-md flex-1 flex flex-col">
                    <label className="block text-[11px] font-bold text-cyan-300 mb-1 flex items-center justify-between">
                      <span>1. เหตุผลที่เข้า (อธิบายภาพที่ 1)</span>
                      <span className="text-[9px] text-slate-500 font-normal">โครงสร้าง, Liquidity</span>
                    </label>
                    <textarea
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="มุมมองชัดเจน จุด Break, Retest..."
                      className="w-full bg-[#070e17] border border-cyan-900 rounded-lg p-2 text-white text-xs leading-relaxed focus:outline-none focus:border-cyan-400 flex-1 resize-none"
                    />
                  </div>

                  <div className="bg-[#0b1626] border border-cyan-900/60 rounded-xl p-3 shadow-md flex-1 flex flex-col">
                    <label className="block text-[11px] font-bold text-rose-400 mb-1 flex items-center justify-between">
                      <span>2. ข้อผิดพลาด (Mistake)</span>
                      <span className="text-[9px] text-slate-500 font-normal">เช่น เข้าเร็วไป, FOMO</span>
                    </label>
                    <textarea
                      rows={2}
                      value={mistake}
                      onChange={(e) => setMistake(e.target.value)}
                      placeholder="ย้ำเตือนข้อผิดพลาด เช่น เข้าซ้อน หรือไม่รอจังหวะ..."
                      className="w-full bg-[#070e17] border border-cyan-900 rounded-lg p-2 text-white text-xs leading-relaxed focus:outline-none focus:border-rose-400 flex-1 resize-none"
                    />
                  </div>

                  <div className="bg-[#0b1626] border border-cyan-900/60 rounded-xl p-3 shadow-md flex-1 flex flex-col">
                    <label className="block text-[11px] font-bold text-emerald-400 mb-1 flex items-center justify-between">
                      <span>3. วิธีแก้ไข / แนวทางปรับปรุง (Solution)</span>
                      <span className="text-[9px] text-slate-500 font-normal">กฎเหล็กในไม้ถัดไป</span>
                    </label>
                    <textarea
                      rows={2}
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      placeholder="รอบหน้าต้องรอการคอนเฟิร์มแบบไหน..."
                      className="w-full bg-[#070e17] border border-cyan-900 rounded-lg p-2 text-white text-xs leading-relaxed focus:outline-none focus:border-emerald-400 flex-1 resize-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-4 bg-gradient-to-b from-[#0b1626] to-[#070e17] border-2 border-amber-500/70 rounded-xl p-3 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 pb-1.5 border-b border-amber-500/30">
                      <ListOrdered className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>ลำดับการคิด (Action Steps)</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 mb-2">5 สเต็ปปฏิบัติการเพื่อให้ได้ออเดอร์นี้</p>
                  </div>

                  <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                    {[
                      "1. ตั้งแจ้งเตือน / เฝ้าโซนราคา",
                      "2. ตรวจสอบเงื่อนไข Setup",
                      "3. สังเกตพฤติกรรมแท่งเทียน/CF",
                      "4. ตรวจ Risk & กดยืนยันขนาดไม้",
                      "5. ตั้ง SL/TP และปล่อยรันตามแผน"
                    ].map((placeholderText, idx) => (
                      <div key={idx} className="relative flex items-center">
                        <span className="absolute left-2 text-[10px] font-black font-mono text-amber-400/90 select-none">
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          value={thoughtSteps[idx]}
                          onChange={(e) => handleStepChange(idx, e.target.value)}
                          placeholder={placeholderText}
                          className="w-full bg-[#040912] border border-amber-900/60 focus:border-amber-400 rounded-lg pl-6 pr-2 py-1 text-white text-[11px] outline-none shadow-inner transition placeholder:text-slate-600"
                        />
                      </div>
                    ))}
                  </div>
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
                className={`w-full py-4 ${isLiveMode ? "bg-rose-600 hover:bg-rose-500" : "bg-emerald-600 hover:bg-emerald-500"} text-white font-black rounded-2xl shadow-xl transition disabled:opacity-50 text-sm flex items-center justify-center gap-2`}
              >
                {loading ? "กำลังบันทึกข้อมูล..." : `บันทึกหน้าใหม่ลงใน ${activeBookName} (${selectedSymbol})`}
              </button>
            </div>
          </div>
        )}

        {/* ================= 2. VIEW: แดชบอร์ดสรุปผล ================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between bg-[#0b1626] p-4 rounded-2xl border border-cyan-900/50 gap-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>กำลังดูสถิติของ: <span className={`underline ${isLiveMode ? 'text-rose-400' : 'text-emerald-400'}`}>{activeBookName}</span></span>
                <span className="text-xs text-slate-400 font-normal">({totalTrades} ไม้ • Risk ${activeRiskUsd} • Default: {bookSettings[currentBookId]?.defaultSymbol || 'MNQ'})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-slate-200 to-slate-400 hover:from-white hover:to-slate-300 text-slate-900 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-lg"
                >
                  <Trophy className="w-3.5 h-3.5 text-slate-900" /> นามบัตรผลงานรายวัน (Certificate Card)
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-1.5 bg-[#070e17] hover:bg-cyan-950/60 text-cyan-300 border border-cyan-800/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow"
                >
                  <Download className="w-3.5 h-3.5" /> ส่งออก CSV
                </button>
              </div>
            </div>

            {/* 4 Cards Summary */}
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

            {/* ปฏิทิน Heatmap */}
            <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <CalendarIcon className="w-4 h-4 text-cyan-400" />
                  <span>ปฏิทินผลงานรายเดือน (Monthly Trading Heatmap - {currentYearMonth})</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> Win</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500 inline-block"></span> Loss</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#070e17] border border-cyan-950 inline-block"></span> No Trade</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {calendarDays.map((d) => (
                  <div
                    key={d.dayNum}
                    className={`rounded-xl p-2.5 min-h-[68px] border transition flex flex-col justify-between ${
                      d.hasWin
                        ? "bg-emerald-950/70 border-emerald-500/80 shadow-md shadow-emerald-500/10"
                        : d.hasLoss
                        ? "bg-rose-950/70 border-rose-500/80 shadow-md shadow-rose-500/10"
                        : "bg-[#070e17] border-cyan-950 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-slate-300">วันที่ {d.dayNum}</span>
                      {d.dayTrades.length > 0 && (
                        <span className="text-[10px] px-1 rounded bg-black/40 text-slate-300">
                          {d.dayTrades.length} ไม้
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 text-right font-mono font-black text-xs">
                      {d.dayTrades.length > 0 ? (
                        <span className={d.dayPnL >= 0 ? "text-emerald-400" : "text-rose-400"}>
                          {d.dayPnL >= 0 ? `+$${d.dayPnL.toFixed(0)}` : `-$${Math.abs(d.dayPnL).toFixed(0)}`}
                        </span>
                      ) : (
                        <span className="text-slate-700 text-[10px] font-normal">-</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* กราฟเส้น Equity Curve */}
            <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> กราฟการเติบโตของพอร์ต (Equity Curve Line Chart)
                </div>
                <span className={`text-xs font-mono font-bold ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Net Cumulative: {netPnL >= 0 ? `+$${netPnL.toFixed(0)}` : `-$${Math.abs(netPnL).toFixed(0)}`}
                </span>
              </div>

              {equityPoints.length > 1 ? (
                <div className="w-full h-52 bg-[#050b14] rounded-xl p-4 flex items-center justify-center relative overflow-hidden border border-cyan-950">
                  {(() => {
                    const width = 800;
                    const height = 180;
                    const padding = 20;
                    
                    const maxPnl = Math.max(...equityPoints.map(p => p.pnl), activeRiskUsd);
                    const minPnl = Math.min(...equityPoints.map(p => p.pnl), -activeRiskUsd);
                    const range = (maxPnl - minPnl) || 500;

                    const getX = (idx) => padding + (idx / (equityPoints.length - 1)) * (width - padding * 2);
                    const getY = (val) => height - padding - ((val - minPnl) / range) * (height - padding * 2);
                    const zeroY = getY(0);

                    const pointsArray = equityPoints.map((p, idx) => ({ x: getX(idx), y: getY(p.pnl), pnl: p.pnl }));
                    const pathData = pointsArray.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ");

                    return (
                      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
                        <line 
                          x1={padding} 
                          y1={zeroY} 
                          x2={width - padding} 
                          y2={zeroY} 
                          stroke="#334155" 
                          strokeWidth="1.5" 
                          strokeDasharray="4 4" 
                        />
                        <text x={padding + 5} y={zeroY - 5} fill="#64748b" fontSize="10" fontFamily="monospace">$0 (Base)</text>

                        <path
                          d={pathData}
                          fill="none"
                          stroke={netPnL >= 0 ? "#10b981" : "#f43f5e"}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {pointsArray.map((p, idx) => (
                          <g key={idx}>
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={idx === pointsArray.length - 1 ? "5" : "3.5"}
                              fill={p.pnl >= 0 ? "#34d399" : "#fb7185"}
                              stroke="#050b14"
                              strokeWidth="2"
                            />
                          </g>
                        ))}
                      </svg>
                    );
                  })()}
                </div>
              ) : (
                <div className="h-28 flex items-center justify-center text-slate-500 text-xs bg-[#070e17] rounded-xl">
                  บันทึกไม้เทรดเพื่อเริ่มวาดกราฟการเติบโตของพอร์ต
                </div>
              )}
            </div>

            {/* Setup & Session Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-cyan-300">ความแม่นยำแยกตาม Setup (Setup Breakdown)</h3>
                <div className="space-y-2">
                  {setupStats.map((s) => (
                    <div key={s.name} className="flex items-center justify-between bg-[#070e17] p-2.5 rounded-xl text-xs border border-cyan-950">
                      <div>
                        <span className="font-semibold text-slate-200">{s.name}</span>
                        <div className="text-[10px] text-slate-500">เทรด {s.count} ไม้ (ชนะ {s.wins})</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-white">WR: {s.wr}%</div>
                        <div className={`text-[11px] ${s.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {s.pnl >= 0 ? `+$${s.pnl.toFixed(0)}` : `-$${Math.abs(s.pnl).toFixed(0)}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-cyan-300">ผลงานแยกตาม Session เวลาไทย</h3>
                <div className="space-y-2">
                  {sessionStats.map((sess) => (
                    <div key={sess.session} className="flex items-center justify-between bg-[#070e17] p-3 rounded-xl text-xs border border-cyan-950">
                      <div>
                        <span className="font-bold text-cyan-400">{sess.session} Session</span>
                        <div className="text-[10px] text-slate-500">
                          {sess.session === "London" ? "14:00 - 19:30 น." : (sess.session === "New York" ? "19:30 - 04:00 น." : "05:00 - 14:00 น.")}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-white">{sess.count} ไม้ (WR: {sess.wr}%)</div>
                        <div className={`text-xs font-bold ${parseFloat(sess.netR) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {parseFloat(sess.netR) >= 0 ? `+${sess.netR}R` : `${sess.netR}R`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Table */}
            <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-cyan-950">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-bold text-slate-100">
                    ค้นหาและกรองไม้เทรดใน {activeBookName} (พบ {filteredTrades.length} จาก {bookTrades.length} ไม้)
                  </h2>
                </div>

                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1 bg-[#070e17] hover:bg-cyan-950/80 text-slate-400 hover:text-cyan-300 rounded-xl text-xs flex items-center gap-1 transition border border-cyan-950 self-start md:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> ล้างตัวกรองทั้งหมด
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="relative lg:col-span-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหาชื่อ, บันทึก, วัน..."
                    className="w-full bg-[#070e17] border border-cyan-900/80 rounded-xl pl-8 pr-3 py-2 text-white text-xs outline-none focus:border-cyan-500 placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <select
                    value={filterSide}
                    onChange={(e) => setFilterSide(e.target.value)}
                    className="w-full bg-[#070e17] border border-cyan-900/80 rounded-xl px-3 py-2 text-slate-300 text-xs outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="all">Side ทั้งหมด (Buy & Sell)</option>
                    <option value="Buy">ดูเฉพาะ Buy / Long</option>
                    <option value="Sell">ดูเฉพาะ Sell / Short</option>
                  </select>
                </div>

                <div>
                  <select
                    value={filterSetup}
                    onChange={(e) => setFilterSetup(e.target.value)}
                    className="w-full bg-[#070e17] border border-cyan-900/80 rounded-xl px-3 py-2 text-slate-300 text-xs outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="all">Setup ทั้งหมด</option>
                    {availableSetups.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={filterSession}
                    onChange={(e) => setFilterSession(e.target.value)}
                    className="w-full bg-[#070e17] border border-cyan-900/80 rounded-xl px-3 py-2 text-slate-300 text-xs outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="all">Session ทั้งหมด</option>
                    <option value="New York">เฉพาะ New York Session</option>
                    <option value="London">เฉพาะ London Session</option>
                    <option value="Asia">เฉพาะ Asia Session</option>
                  </select>
                </div>

                <div>
                  <select
                    value={filterOutcome}
                    onChange={(e) => setFilterOutcome(e.target.value)}
                    className="w-full bg-[#070e17] border border-cyan-900/80 rounded-xl px-3 py-2 text-slate-300 text-xs outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="all">ผลลัพธ์ทั้งหมด (Win / Loss)</option>
                    <option value="Win">ดูเฉพาะไม้ Win (ชนะ)</option>
                    <option value="Loss">ดูเฉพาะไม้ Loss (แพ้)</option>
                    <option value="BE">ดูเฉพาะไม้ BE (เสมอทุน)</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#070e17] text-[11px] text-slate-400 uppercase border-b border-cyan-950">
                    <tr>
                      <th className="p-3">วัน/เวลา (เวลาไทย)</th>
                      <th className="p-3">สินค้า</th>
                      <th className="p-3">Session</th>
                      <th className="p-3">Side</th>
                      <th className="p-3">Setup</th>
                      <th className="p-3">สัญญา</th>
                      <th className="p-3">RR</th>
                      <th className="p-3">P&L ($)</th>
                      <th className="p-3">รูปภาพ</th>
                      <th className="p-3 text-center">เปิดดูเต็มหน้า / ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-950/60">
                    {filteredTrades.map((t) => {
                      const isLossTrade = t.outcome === "Loss" || t.pnl < 0;
                      return (
                        <tr key={t.id} className="hover:bg-cyan-950/30 transition cursor-pointer" onClick={() => handleOpenTradeDetail(t)}>
                          <td className="p-3 text-slate-400 whitespace-nowrap">
                            <div className="font-semibold text-slate-200">{t.entry_time?.replace('T', ' ') || '-'}</div>
                            <div className="text-[10px] text-slate-500">{t.day_of_week}</div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-cyan-950 border border-cyan-800 text-cyan-300">
                              {t.symbol || 'MNQ'}
                            </span>
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
                            {t.pnl >= 0 ? `+$${Number(t.pnl).toFixed(0)}` : `-$${Math.abs(Number(t.pnl)).toFixed(0)}`}
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
                              <button onClick={() => handleOpenTradeDetail(t)} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow transition">
                                <Eye className="w-3.5 h-3.5" /> เปิดดูเต็มหน้า
                              </button>
                              
                              {(!isLiveMode || !isLossTrade) ? (
                                <button onClick={() => deleteTrade(t.id)} className="text-slate-500 hover:text-rose-400 p-1.5 transition" title="ลบหน้าบันทึกนี้">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="p-1.5 text-slate-700 cursor-not-allowed" title="พอร์ตจริง: ห้ามลบไม้แพ้เด็ดขาดตามกฎเหล็ก">
                                  <Lock className="w-4 h-4 text-rose-500/80" />
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTrades.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-500">
                          {bookTrades.length === 0 
                            ? `ยังไม่มีบันทึกใน "${activeBookName}" สลับไปแท็บหน้าบันทึกเพื่อเพิ่มไม้แรกได้เลย` 
                            : "ไม่พบไม้เทรดที่ตรงกับเงื่อนไขตัวกรองหรือคำค้นหา"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ================= 3. VIEW: หน้าทบทวนการเทรดแบบเต็มหน้าจอ ================= */}
        {activeTab === "trade-detail" && selectedTrade && (
          <div className="space-y-6 animate-in fade-in duration-300 pb-12">
            <div className="bg-[#0b1626] border border-cyan-900/80 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs md:text-sm flex items-center gap-2 transition shadow-lg"
              >
                <ArrowLeft className="w-4 h-4" /> ย้อนกลับไปแดชบอร์ด
              </button>

              <div className="flex items-center gap-3 font-mono">
                <div className="bg-[#070e17] border border-cyan-900/80 px-4 py-2 rounded-xl text-center shadow-inner">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-semibold">สินค้า (Symbol)</div>
                  <div className="text-xl font-black text-amber-300 mt-0.5">
                    {selectedTrade.symbol || "MNQ"}
                  </div>
                </div>

                <div className="bg-[#070e17] border border-cyan-900/80 px-4 py-2 rounded-xl text-center shadow-inner">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-semibold">Realized R:R</div>
                  <div className="text-2xl font-black text-cyan-300 mt-0.5">
                    {selectedTrade.realized_rr !== null && selectedTrade.realized_rr !== undefined 
                      ? `${selectedTrade.realized_rr >= 0 ? '+' : ''}${selectedTrade.realized_rr}R` 
                      : (selectedTrade.rr ? `1:${selectedTrade.rr}` : '-')}
                  </div>
                </div>

                <div className="bg-[#070e17] border border-cyan-900/80 px-4 py-2 rounded-xl text-center shadow-inner">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-semibold">กำไร / ขาดทุน (P&L)</div>
                  <div className={`text-2xl font-black mt-0.5 ${selectedTrade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedTrade.pnl >= 0 ? `+$${Number(selectedTrade.pnl).toFixed(0)}` : `-$${Math.abs(Number(selectedTrade.pnl)).toFixed(0)}`}
                  </div>
                </div>
              </div>

              {(!isLiveMode || (selectedTrade.outcome !== "Loss" && selectedTrade.pnl >= 0)) ? (
                <button
                  onClick={() => deleteTrade(selectedTrade.id)}
                  className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-700 text-rose-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-rose-800/60"
                >
                  <Trash2 className="w-3.5 h-3.5" /> ลบไม้นี้
                </button>
              ) : (
                <div className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-500" /> พอร์ตจริง: ล็อกห้ามลบไม้แพ้
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-[#0b1626] border border-cyan-900/80 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-cyan-950">
                  <span className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-cyan-400" /> ภาพที่ 1: Reason of Setup / การวิเคราะห์
                  </span>
                  {selectedTrade.image_analysis && (
                    <button onClick={() => setLightboxImg(selectedTrade.image_analysis)} className="px-2.5 py-1 bg-cyan-700/60 hover:bg-cyan-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition">
                      <Maximize2 className="w-3.5 h-3.5" /> ซูมเต็มจอ
                    </button>
                  )}
                </div>

                <div className="rounded-xl overflow-hidden bg-[#070e17] flex items-center justify-center p-2 h-[440px]">
                  {selectedTrade.image_analysis ? (
                    <img src={selectedTrade.image_analysis} alt="Analysis Chart" className="w-full h-full object-contain rounded-lg cursor-zoom-in hover:opacity-95 transition" onClick={() => setLightboxImg(selectedTrade.image_analysis)} />
                  ) : (
                    <div className="text-slate-600 text-sm flex flex-col items-center">
                      <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
                      <span>ไม่ได้แนบภาพที่ 1</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#0b1626] border border-cyan-900/80 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-cyan-950">
                  <span className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-cyan-400" /> ภาพที่ 2: Close Up จุดเข้าจริงๆ
                  </span>
                  {selectedTrade.image_trigger && (
                    <button onClick={() => setLightboxImg(selectedTrade.image_trigger)} className="px-2.5 py-1 bg-cyan-700/60 hover:bg-cyan-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition">
                      <Maximize2 className="w-3.5 h-3.5" /> ซูมเต็มจอ
                    </button>
                  )}
                </div>

                <div className="rounded-xl overflow-hidden bg-[#070e17] flex items-center justify-center p-2 h-[440px]">
                  {selectedTrade.image_trigger ? (
                    <img src={selectedTrade.image_trigger} alt="Trigger Chart" className="w-full h-full object-contain rounded-lg cursor-zoom-in hover:opacity-95 transition" onClick={() => setLightboxImg(selectedTrade.image_trigger)} />
                  ) : (
                    <div className="text-slate-600 text-sm flex flex-col items-center">
                      <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
                      <span>ไม่ได้แนบภาพที่ 2</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              <div className="md:col-span-8 flex flex-col gap-4">
                <div className="bg-[#0b1626] border-2 border-cyan-900/70 rounded-2xl p-4 shadow-xl flex-1">
                  <div className="text-sm font-black text-cyan-300 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-cyan-950">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
                    <span>1. เหตุผลที่เข้า (Reason)</span>
                  </div>
                  <div className="bg-[#070e17] rounded-xl p-3 border border-cyan-950 text-sm text-slate-100 leading-relaxed min-h-[90px] whitespace-pre-wrap mt-2">
                    {selectedTrade.reason || 'ไม่มีบันทึกเหตุผล'}
                  </div>
                </div>

                <div className="bg-[#0b1626] border-2 border-rose-900/50 rounded-2xl p-4 shadow-xl flex-1">
                  <div className="text-sm font-black text-rose-400 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-rose-950">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span>
                    <span>2. ข้อผิดพลาด (Mistake)</span>
                  </div>
                  <div className="bg-[#070e17] rounded-xl p-3 border border-rose-950/60 text-sm text-rose-100 leading-relaxed min-h-[90px] whitespace-pre-wrap mt-2">
                    {selectedTrade.mistake || 'ไม่มีบันทึกข้อผิดพลาด'}
                  </div>
                </div>

                <div className="bg-[#0b1626] border-2 border-emerald-900/50 rounded-2xl p-4 shadow-xl flex-1">
                  <div className="text-sm font-black text-emerald-400 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-emerald-950">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                    <span>3. วิธีแก้ไข (Solution)</span>
                  </div>
                  <div className="bg-[#070e17] rounded-xl p-3 border border-emerald-950/60 text-sm text-emerald-100 leading-relaxed min-h-[90px] whitespace-pre-wrap mt-2">
                    {selectedTrade.solution || 'ไม่มีบันทึกวิธีแก้ไข'}
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 bg-[#0b1626] border-2 border-amber-500/70 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="text-sm font-black text-amber-300 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-amber-950">
                    <ListOrdered className="w-4 h-4 text-amber-400" />
                    <span>ลำดับการคิด (Thought Process)</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">สเต็ปที่ทำก่อนตัดสินใจเข้าออเดอร์:</p>
                </div>

                <div className="space-y-2 mt-3 flex-1 flex flex-col justify-around">
                  {selectedTrade.thought_steps && selectedTrade.thought_steps.length > 0 ? (
                    selectedTrade.thought_steps.map((step, sIdx) => (
                      <div key={sIdx} className="bg-[#070e17] p-2.5 rounded-xl border border-amber-900/40 text-xs text-slate-200 flex items-start gap-2">
                        <span className="font-mono font-bold text-amber-400 shrink-0">{sIdx + 1}.</span>
                        <span className="leading-snug">{step}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-xs italic text-center my-auto">ไม่มีบันทึกลำดับการคิด</div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-center">
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-8 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl text-sm shadow-xl transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> กลับสู่แดชบอร์ดสรุปผล
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ================= ⚙️ MODAL: ตั้งค่าความเสี่ยง, DEFAULT SYMBOL & SETUP ================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1626] border border-cyan-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-950">
              <span className="text-base font-black text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" /> ตั้งค่าระบบ ({activeBookName})
              </span>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* 1. ส่วนตั้งค่าความเสี่ยง */}
              <div>
                <label className="block text-xs text-slate-200 mb-1.5 font-bold flex items-center justify-between">
                  <span>กำหนด Risk ต่อไม้ ($ USD):</span>
                  <span className="text-[10px] text-cyan-400 font-mono">สมุดปัจจุบัน: {activeBookName}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={tempRiskInput}
                    onChange={(e) => setTempRiskInput(e.target.value)}
                    placeholder="เช่น 250 หรือ 500"
                    className="w-full bg-[#040810] border-2 border-cyan-800 focus:border-cyan-400 rounded-xl pl-7 pr-3 py-2 text-white font-mono text-lg font-bold outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">USD</span>
                </div>
              </div>

              {/* 🌟 2. ส่วนเลือก Default Symbol ของสมุดนี้ */}
              <div className="pt-3 border-t border-cyan-950">
                <label className="block text-xs text-slate-200 mb-1.5 font-bold flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>ตั้งค่า Default Symbol ประจำสมุดนี้:</span>
                </label>
                <select
                  value={tempDefaultSymbol}
                  onChange={(e) => setTempDefaultSymbol(e.target.value)}
                  className="w-full bg-[#040810] border border-cyan-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-white text-xs outline-none cursor-pointer"
                >
                  <option value="MNQ">MNQ - Micro E-mini Nasdaq ($2 / point)</option>
                  <option value="MGC">MGC - Micro Gold Futures ($10 / point)</option>
                  <option value="GC">GC - Gold Futures Standard ($100 / point)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  เมื่อเปิดสมุดนี้ขึ้นมา ระบบจะเลือกสินค้านี้ให้เป็นค่าเริ่มต้นโดยอัตโนมัติ
                </p>
              </div>

              {/* 3. ส่วนจัดการ SETUP (เพิ่ม / ลบ / ดูรายชื่อ) */}
              <div className="pt-3 border-t border-cyan-950">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-slate-200 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>จัดการรายชื่อ Setup ({availableSetups.length})</span>
                  </label>
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSetupInput}
                    onChange={(e) => setNewSetupInput(e.target.value)}
                    placeholder="พิมพ์ชื่อ Setup ใหม่ เช่น OB Sweep..."
                    className="flex-1 bg-[#040810] border border-cyan-900 focus:border-cyan-400 rounded-xl px-3 py-1.5 text-white text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSetup}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow"
                  >
                    <Plus className="w-3.5 h-3.5" /> เพิ่ม
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {availableSetups.map((setupItem) => (
                    <div 
                      key={setupItem} 
                      className="flex items-center justify-between bg-[#070e17] border border-cyan-950 p-2 px-3 rounded-xl text-xs"
                    >
                      <span className="font-semibold text-slate-200">{setupItem}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSetup(setupItem)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition"
                        title={`ลบ Setup "${setupItem}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-cyan-950">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition shadow-lg"
                >
                  บันทึกการตั้งค่า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🛑 POPUP GIMMICK: ทำงานเฉพาะในพอร์ตจริง */}
      {lockModal.open && isLiveMode && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#0e1b2e] to-[#070e17] border-2 border-rose-500 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-36 h-36 mx-auto rounded-3xl overflow-hidden border-4 border-rose-400 shadow-2xl bg-slate-900">
              {customBabe ? (
                <img src={customBabe} alt="เบ้บๆ" className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">👩‍❤️‍👨</div>
              )}
            </div>

            {lockModal.type === "daily_loss" ? (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-600 text-rose-300 text-xs font-bold uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" /> กฎเหล็กพอร์ตจริง: วันนี้ติดลบ หยุดเทรดทันที!
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  “วันนี้พอก่อนน้าเบ้บๆ<br/>พรุ่งนี้ค่อยสู้ใหม่ มุมุ!”
                </h2>
                <p className="text-xs text-slate-300">
                  วันนี้พอร์ตจริงเรามีไม้แพ้ไปแล้ว ปิดจอไปพักผ่อน ดื่มชาเขียวกันนะเบ้บ ถ้าอยากฝึกต่อให้สลับไปที่ <strong>"พอร์ตซ้อม (Backtest)"</strong> นะคะ 🍵💚
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" /> ห้ามเข้าไม้ซ้อนเด็ดขาด!
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  “รอดูไม้นี้ก่อนน้าเบ้บๆ<br/>อย่าพึ่งใจร้อนนะคะ”
                </h2>
                <p className="text-xs text-slate-300">
                  พอร์ตจริงกำลังรันออเดอร์อยู่ 1 ไม้ รอดูผลไม้นี้ให้จบแล้วมากดบันทึกก่อนนะคะคนเก่ง 🍵✨
                </p>
              </div>
            )}

            <button
              onClick={handleCloseLockModal}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl shadow-lg transition text-sm"
            >
              รับทราบครับเบ้บ จะมีวินัยตามแผน! 🫡
            </button>
          </div>
        </div>
      )}

      {/* 🎨 MODAL: วาดมาร์กเกอร์ / มียางลบ (Eraser) */}
      {drawingModal.open && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl flex items-center justify-between pb-3 text-white">
            <span className="text-sm font-bold flex items-center gap-2">
              <PenTool className="w-4 h-4 text-amber-400" /> ลากวาดมาร์กเกอร์ / ยางลบจุดเข้า
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700">
                <button 
                  onClick={() => { setDrawColor("#f43f5e"); setIsEraser(false); }} 
                  className={`w-5 h-5 rounded-full bg-rose-500 transition ${(!isEraser && drawColor === "#f43f5e") ? "ring-2 ring-white scale-110" : "opacity-70"}`} 
                  title="ปากกาสีแดง"
                />
                <button 
                  onClick={() => { setDrawColor("#10b981"); setIsEraser(false); }} 
                  className={`w-5 h-5 rounded-full bg-emerald-500 transition ${(!isEraser && drawColor === "#10b981") ? "ring-2 ring-white scale-110" : "opacity-70"}`} 
                  title="ปากกาสีเขียว"
                />
                <button 
                  onClick={() => { setDrawColor("#f59e0b"); setIsEraser(false); }} 
                  className={`w-5 h-5 rounded-full bg-amber-500 transition ${(!isEraser && drawColor === "#f59e0b") ? "ring-2 ring-white scale-110" : "opacity-70"}`} 
                  title="ปากกาสีส้ม"
                />
                <button 
                  onClick={() => { setDrawColor("#38bdf8"); setIsEraser(false); }} 
                  className={`w-5 h-5 rounded-full bg-sky-400 transition ${(!isEraser && drawColor === "#38bdf8") ? "ring-2 ring-white scale-110" : "opacity-70"}`} 
                  title="ปากกาสีฟ้า"
                />
              </div>

              <button
                onClick={() => setIsEraser(!isEraser)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border ${
                  isEraser 
                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-white" 
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>{isEraser ? "กำลังใช้ยางลบ" : "ยางลบ"}</span>
              </button>

              <button onClick={saveCanvasMarkup} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow">
                บันทึกลงกราฟ
              </button>
              <button onClick={() => setDrawingModal({ open: false, imgIndex: 1 })} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative max-w-5xl max-h-[82vh] overflow-auto border-2 border-slate-700 rounded-2xl bg-[#070e17] flex items-center justify-center p-2">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className={`max-w-full max-h-[80vh] object-contain rounded-lg ${isEraser ? "cursor-cell" : "cursor-crosshair"}`}
            />
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightboxImg && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-pointer" onClick={() => setLightboxImg(null)}>
          <div className="relative max-w-7xl max-h-[96vh] w-full h-full flex flex-col items-center justify-center">
            <img src={lightboxImg} alt="Zoomed Chart" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
            <button onClick={() => setLightboxImg(null)} className="absolute top-2 right-2 bg-slate-800/80 hover:bg-rose-600 text-white p-2.5 rounded-full transition shadow-lg">
              <X className="w-6 h-6" />
            </button>
            <span className="text-slate-400 text-xs mt-2">คลิกตรงไหนก็ได้เพื่อปิดหน้าต่าง</span>
          </div>
        </div>
      )}

    </div>
  );
}
