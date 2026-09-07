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
  FolderPlus,
  Flame,
  ArrowLeft,
  Download,
  Palette,
  PenTool,
  Calendar as CalendarIcon,
  ShieldAlert,
  Radio,
  BellRing,
  AlertTriangle
} from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// 🔴 ฐานข้อมูลตารางข่าวกล่องแดงสหรัฐฯ (USD Red Folders Schedule) ตามเวลาไทย
const ECONOMIC_SCHEDULE = [
  {
    id: "nfp",
    name: "Non-Farm Payrolls (NFP) & Unemployment Rate",
    timeStr: "19:30 น.",
    desc: "ตัวเลขจ้างงานและอัตราว่างงานนอกภาคเกษตร กระชากแรงมาก",
    match: (d) => d.getDay() === 5 && d.getDate() <= 7 // ศุกร์แรกของเดือน
  },
  {
    id: "cpi",
    name: "CPI Inflation Data (MoM / YoY)",
    timeStr: "19:30 น.",
    desc: "ดัชนีเงินเฟ้อผู้บริโภค ปัจจัยหลักชี้นำทิศทางดอกเบี้ยเฟด",
    match: (d) => [10, 11, 12, 13, 14].includes(d.getDate()) && d.getDay() >= 2 && d.getDay() <= 4
  },
  {
    id: "ppi",
    name: "PPI Producer Price Index",
    timeStr: "19:30 น.",
    desc: "ดัชนีราคาผู้ผลิต ตัวเลขสะท้อนต้นทุนเงินเฟ้อล่วงหน้า",
    match: (d) => [13, 14, 15, 16].includes(d.getDate()) && d.getDay() >= 3 && d.getDay() <= 5
  },
  {
    id: "fomc",
    name: "FOMC Interest Rate Decision & Powell Speech",
    timeStr: "01:00 น. (ดึก)",
    desc: "การประกาศอัตราดอกเบี้ยและแถลงการณ์ประธาน FED ผันผวนสูงสุด",
    match: (d) => [18, 19, 20, 21].includes(d.getDate()) && (d.getDay() === 3 || d.getDay() === 4)
  },
  {
    id: "claims",
    name: "US Initial Jobless Claims",
    timeStr: "19:30 น.",
    desc: "ยอดผู้ขอรับสวัสดิการว่างงานรายสัปดาห์",
    match: (d) => d.getDay() === 4 // ทุกวันพฤหัสบดี
  },
  {
    id: "gdp",
    name: "US Advance GDP (QoQ)",
    timeStr: "19:30 น.",
    desc: "ประมาณการเติบโตทางเศรษฐกิจ GDP รายไตรมาส",
    match: (d) => [25, 26, 27, 28, 29, 30].includes(d.getDate()) && d.getDay() === 4
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("journal");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const RISK_USD = 250;
  const MULTIPLIER = 2;
  const SYMBOL = "MNQ";

  // Accent Theme
  const [theme, setTheme] = useState("cyan");

  // Notebooks
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

  // Photos & Modals
  const [customLogo, setCustomLogo] = useState(null);
  const [customBabe, setCustomBabe] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);

  // Stop Trading 1 Trade per Day Alert Modal
  const [showLossLimitModal, setShowLossLimitModal] = useState(false);

  // Real-Time Countdown to NY Open (20:30 Thai Time) & Live Economic News
  const [countdownText, setCountdownText] = useState("");
  const [isNyOpen, setIsNyOpen] = useState(false);
  const [todayRedNews, setTodayRedNews] = useState([]);
  const [currentDateFormatted, setCurrentDateFormatted] = useState("");

  // Canvas Drawing
  const [drawingModal, setDrawingModal] = useState({ open: false, imgIndex: 1 });
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#f43f5e");

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

  // Engine: ตรวจจับข่าวกล่องแดงและเวลานับถอยหลังเปิดตลาดสหรัฐฯ
  useEffect(() => {
    const updateCountdownAndNews = () => {
      const now = new Date();
      
      const dayNames = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
      const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      setCurrentDateFormatted(`${dayNames[now.getDay()]}ที่ ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear() + 543}`);

      // ตรวจสอบข่าวกล่องแดงวันนี้
      const matchingEvents = ECONOMIC_SCHEDULE.filter(event => event.match(now));
      setTodayRedNews(matchingEvents);

      // นับเวลาเปิดตลาด New York (20:30 น.)
      const nyOpen = new Date();
      nyOpen.setHours(20, 30, 0, 0);

      const nowTime = now.getTime();
      const openTime = nyOpen.getTime();

      if (nowTime >= openTime && now.getHours() < 24) {
        setIsNyOpen(true);
        setCountdownText("ตลาดกำลังเปิดทำการ (High Volatility)");
      } else {
        setIsNyOpen(false);
        let target = openTime;
        if (nowTime > openTime) target += 24 * 60 * 60 * 1000;
        const diff = target - nowTime;
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdownText(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updateCountdownAndNews();
    const timer = setInterval(updateCountdownAndNews, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedLogo = localStorage.getItem("tradee_custom_logo");
    const savedBabe = localStorage.getItem("tradee_custom_babe");
    const savedBooks = localStorage.getItem("tradee_books");
    const savedTheme = localStorage.getItem("tradee_theme");
    if (savedLogo) setCustomLogo(savedLogo);
    if (savedBabe) setCustomBabe(savedBabe);
    if (savedBooks) setBooks(JSON.parse(savedBooks));
    if (savedTheme) setTheme(savedTheme);

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

  const checkDailyLossRule = (inputVal) => {
    setSlPoints(inputVal);
    if (!inputVal) return;
    const todayStr = (entryTime || getNowString()).split("T")[0];
    const hasLossToday = bookTrades.some(
      (t) => (t.entry_time?.startsWith(todayStr)) && (t.outcome === "Loss" || t.pnl < 0)
    );
    if (hasLossToday) {
      setShowLossLimitModal(true);
    }
  };

  const handleCreateBook = (e) => {
    e.preventDefault();
    if (!newBookName.trim()) return;
    const newBook = { id: "book_" + Date.now(), name: newBookName.trim() };
    const updated = [...books, newBook];
    setBooks(updated);
    setCurrentBookId(newBook.id);
    localStorage.setItem("tradee_books", JSON.stringify(updated));
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
      if (supabase) await supabase.from("trades").delete().eq("book_id", bookIdToDelete);
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
    const headers = ["ID,Date,Session,Side,Setup,Contracts,SL_Points,RR,Outcome,PnL_USD,Reason,Mistake,Solution\n"];
    const rows = bookTrades.map(t => 
      `"${t.id}","${t.entry_time}","${t.session}","${t.side}","${t.setup_name}",${t.contracts},${t.sl_points},"${t.rr || '-'}",${t.outcome},${t.pnl},"${(t.reason||'').replace(/"/g, '""')}","${(t.mistake||'').replace(/"/g, '""')}","${(t.solution||'').replace(/"/g, '""')}"`
    );
    const blob = new Blob(["\uFEFF" + headers.concat(rows).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tradee_${activeBookName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openCanvasMarkup = (imgIndex) => {
    const targetImg = imgIndex === 1 ? img1 : img2;
    if (!targetImg) return;
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
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
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
    const editedBase64 = canvas.toDataURL("image/png");
    if (drawingModal.imgIndex === 1) setImg1(editedBase64);
    else setImg2(editedBase64);
    setDrawingModal({ open: false, imgIndex: 1 });
  };

  // Book Data & Metrics
  const bookTrades = trades.filter((t) => (t.book_id || "book_backtest") === currentBookId);
  const activeBookName = books.find((b) => b.id === currentBookId)?.name || "สมุดบันทึก";

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

  // Setup Breakdown
  const setupStats = [
    "Break Running Buy",
    "Break Running Sell",
    "Testing Running Buy",
    "Testing Running Sell",
    "Following Running Buy",
    "Following Running Sell"
  ].map((name) => {
    const list = bookTrades.filter((t) => t.setup_name === name);
    const wins = list.filter((t) => t.outcome === "Win" || t.pnl > 0).length;
    const wr = list.length > 0 ? ((wins / list.length) * 100).toFixed(0) : "-";
    const pnl = list.reduce((acc, c) => acc + (c.pnl || 0), 0);
    return { name, count: list.length, wins, wr, pnl };
  });

  // Session Breakdown
  const sessionStats = ["Asia", "London", "New York"].map((sess) => {
    const list = bookTrades.filter((t) => t.session === sess);
    const wins = list.filter((t) => t.outcome === "Win" || t.pnl > 0).length;
    const wr = list.length > 0 ? ((wins / list.length) * 100).toFixed(0) : "-";
    const netR = list.reduce((acc, c) => acc + (c.realized_rr || (c.outcome === "Win" ? 1 : -1)), 0);
    return { session: sess, count: list.length, wr, netR: netR.toFixed(1) };
  });

  // Equity Curve Points
  const sortedChronologicalTrades = [...bookTrades].sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time));
  let runningPnl = 0;
  const equityPoints = sortedChronologicalTrades.map((t, idx) => {
    runningPnl += (t.pnl || 0);
    return { x: idx, pnl: runningPnl };
  });

  // Monthly Heatmap Calendar Generator (31 Days)
  const currentYearMonth = (entryTime || getNowString()).slice(0, 7);
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
                MNQ Journal
              </span>
              <span className="text-xs">{isSammyHappy ? "🐢✨" : "🐢💚"}</span>
            </div>
            <p className="text-[11px] text-slate-400">Don't rush what takes time • ล็อก Risk ${RISK_USD} USD</p>
          </div>
        </div>

        {/* Notebook & Theme & Tab Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1 bg-[#0b1626] border border-cyan-900/60 p-1 rounded-xl">
            <Palette className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <button onClick={() => { setTheme("cyan"); localStorage.setItem("tradee_theme", "cyan"); }} className={`w-4 h-4 rounded-full bg-cyan-500 transition ${theme === "cyan" ? "ring-2 ring-white" : "opacity-60"}`} title="Midnight Cyan" />
            <button onClick={() => { setTheme("blue"); localStorage.setItem("tradee_theme", "blue"); }} className={`w-4 h-4 rounded-full bg-blue-500 transition ${theme === "blue" ? "ring-2 ring-white" : "opacity-60"}`} title="Deep Ocean Blue" />
            <button onClick={() => { setTheme("matcha"); localStorage.setItem("tradee_theme", "matcha"); }} className={`w-4 h-4 rounded-full bg-emerald-500 transition ${theme === "matcha" ? "ring-2 ring-white" : "opacity-60"}`} title="Forest Matcha" />
          </div>

          <div className="flex items-center gap-1.5 bg-[#0b1626] border border-cyan-900/60 px-2.5 py-1.5 rounded-xl">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={currentBookId}
              onChange={(e) => {
                setCurrentBookId(e.target.value);
                if (activeTab === "trade-detail") setActiveTab("dashboard");
              }}
              className="bg-transparent text-xs font-bold text-cyan-200 outline-none cursor-pointer"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#0b1626] text-white">
                  สมุด: {b.name}
                </option>
              ))}
            </select>

            <button onClick={() => setShowNewBookModal(true)} className="p-1 hover:bg-cyan-900/50 text-cyan-400 rounded-lg transition" title="สร้างสมุดใหม่">
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleDeleteBook(currentBookId)} className="p-1 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 rounded-lg transition" title="ลบสมุดนี้">
              <Trash2 className="w-3.5 h-3.5" />
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

      {/* 🔴 WIDGET ข่าวเศรษฐกิจกล่องแดงประจำวัน (บอกเวลาตรงตามเวลาไทย) + ตัวนับถอยหลังเปิดตลาด NY */}
      <div className="max-w-[1600px] mx-auto mt-3 space-y-2">
        
        {/* แถบแจ้งเตือนข่าวกล่องแดงประจำวันนี้ (เด่นชัดทันทีที่เปิดเว็บ) */}
        {todayRedNews.length > 0 ? (
          <div className="bg-gradient-to-r from-rose-950/90 via-[#1f0b12] to-rose-950/90 border-2 border-rose-500/80 rounded-2xl p-3.5 px-5 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-600/30 text-rose-300 border border-rose-500/50 animate-bounce">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-rose-300 uppercase tracking-wider bg-rose-950 border border-rose-700 px-2 py-0.5 rounded">
                    🚨 วันนี้มีข่าวกล่องแดง (High-Impact Red Folder)
                  </span>
                  <span className="text-xs text-slate-300 font-mono">({currentDateFormatted})</span>
                </div>
                <div className="text-sm font-bold text-white mt-1 flex flex-wrap items-center gap-3">
                  {todayRedNews.map(news => (
                    <span key={news.id} className="flex items-center gap-1.5">
                      <span className="text-amber-400 font-mono font-black">⏰ {news.timeStr}</span>
                      <span>— {news.name}</span>
                      <span className="text-[11px] text-rose-300 font-normal">({news.desc})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-bold bg-rose-500 text-white px-3 py-1 rounded-full shadow">
                ⚠️ งดเข้าออเดอร์ก่อน-หลังข่าว 3 นาที
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-[#0b1626]/80 border border-cyan-900/40 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>วันนี้ ({currentDateFormatted}): <strong className="text-emerald-400">ไม่มีข่าวกล่องแดงรุนแรง</strong> เทรดตามแผนปกติได้เลย</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Economic Calendar Active</span>
          </div>
        )}

        {/* บาร์นับถอยหลังเปิดตลาด US (New York 20:30 น.) */}
        <div className="bg-[#0b1626] border border-cyan-900/60 rounded-xl px-4 py-2 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 ${isNyOpen ? "text-emerald-400 animate-ping" : "text-amber-400"}`} />
            <span className="text-xs font-bold text-slate-200">US Market Session (New York):</span>
          </div>
          <div className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-md border ${
            isNyOpen 
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-700" 
              : "bg-amber-950/80 text-amber-300 border-amber-700 animate-pulse"
          }`}>
            {isNyOpen ? "🟢 ตลาดเปิดทำการแล้ว (High Volatility)" : `⏳ ตลาดเปิดในอีก: ${countdownText}`}
          </div>
        </div>

      </div>

      {/* BANNER รูปแฟน + กองทุนชาเขียวของแซมๆ */}
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
                <span>กองทุนชาเขียวของแซมๆ</span>
                {netPnL > 0 && <Sparkles className="w-3 h-3 text-emerald-300 animate-spin" />}
              </div>
              <div className="text-lg font-black text-white font-mono">
                {matchaCups} <span className="text-xs text-slate-400 font-normal">แก้ว</span>
                <span className={`text-xs ml-2 ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ({netPnL >= 0 ? `+$${netPnL}` : `-$${Math.abs(netPnL)}`})
                </span>
              </div>
              <div className="text-[9px] text-slate-400">ทุก $100 กำไร = ชาเขียว 10 แก้วให้แฟน</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN VIEW */}
      <main className="max-w-[1600px] mx-auto mt-4">
        
        {/* ================= 1. VIEW: หน้าบันทึก (JOURNAL FORM) ================= */}
        {activeTab === "journal" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            
            {/* ฝั่งซ้าย: รูปภาพกราฟใหญ่ ชัดเจนเต็มตา (Hero Charts) */}
            <div className="xl:col-span-7 space-y-4">
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

              {/* ภาพที่ 1: Reason of Setup */}
              <div
                tabIndex={0}
                onPaste={(e) => handlePaste(e, setImg1)}
                className={`relative bg-[#09121f] border-2 border-dashed border-cyan-900/80 hover:border-cyan-400 rounded-2xl transition focus:outline-none overflow-hidden shadow-xl ${
                  img1 ? "p-1.5" : "p-12 min-h-[360px] flex flex-col items-center justify-center cursor-pointer"
                }`}
              >
                {img1 ? (
                  <div className="relative w-full group">
                    <img src={img1} alt="ภาพที่ 1 การวิเคราะห์" className="w-full h-auto max-h-[850px] object-contain block rounded-xl" />
                    
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-cyan-800 shadow-xl opacity-80 group-hover:opacity-100 transition">
                      <button onClick={() => openCanvasMarkup(1)} className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow">
                        <PenTool className="w-3 h-3" /> วาดมาร์กเกอร์
                      </button>
                      <button onClick={() => setLightboxImg(img1)} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow">
                        <Maximize2 className="w-3 h-3" /> เต็มจอ
                      </button>
                      <button onClick={() => setImg1(null)} className="px-2 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold">
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

              {/* ภาพที่ 2: Close Up จุดเข้าจริง */}
              <div
                tabIndex={0}
                onPaste={(e) => handlePaste(e, setImg2)}
                className={`relative bg-[#09121f] border-2 border-dashed border-cyan-900/80 hover:border-cyan-400 rounded-2xl transition focus:outline-none overflow-hidden shadow-xl ${
                  img2 ? "p-1.5" : "p-12 min-h-[360px] flex flex-col items-center justify-center cursor-pointer"
                }`}
              >
                {img2 ? (
                  <div className="relative w-full group">
                    <img src={img2} alt="ภาพที่ 2 จุดเข้าจริง" className="w-full h-auto max-h-[850px] object-contain block rounded-xl" />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-cyan-800 shadow-xl opacity-80 group-hover:opacity-100 transition">
                      <button onClick={() => openCanvasMarkup(2)} className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow">
                        <PenTool className="w-3 h-3" /> วาดมาร์กเกอร์
                      </button>
                      <button onClick={() => setLightboxImg(img2)} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow">
                        <Maximize2 className="w-3 h-3" /> เต็มจอ
                      </button>
                      <button onClick={() => setImg2(null)} className="px-2 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold">
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

            {/* ฝั่งขวา: เน้น SL + สัญญาเด่นสะดุดตา และ 3 กล่องใหญ่ */}
            <div className="xl:col-span-5 space-y-4">
              
              {/* จุดคำนวณสัญญาด่วน */}
              <div className="bg-gradient-to-br from-[#0c182c] via-[#091526] to-[#070e1b] border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Flame className="w-4 h-4 text-amber-400 animate-pulse" /> จุดคำนวณสัญญาด่วน (Fast Position)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Risk ${RISK_USD} | $2/Point</span>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-7 space-y-1.5">
                    <label className="block text-xs font-black text-amber-300">
                      กรอกระยะ SL (จุด Points) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={slPoints}
                        onChange={(e) => checkDailyLossRule(e.target.value)}
                        placeholder="เช่น 20.0"
                        className="w-full bg-[#040810] border-2 border-amber-500/90 focus:border-amber-400 rounded-xl px-3 py-2 text-white font-mono text-xl font-bold tracking-wide outline-none shadow-inner"
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

                  <div className="col-span-5 bg-gradient-to-b from-emerald-950/80 to-emerald-900/40 border-2 border-emerald-400 rounded-2xl p-2.5 text-center shadow-lg shadow-emerald-500/10 flex flex-col justify-center">
                    <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">สัญญาที่เปิดได้</div>
                    <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tighter my-0.5 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]">
                      {calculatedContracts}
                    </div>
                    <div className="text-[10px] text-slate-300 font-medium">MNQ Contracts (ปัดลง)</div>
                  </div>
                </div>
              </div>

              {/* ข้อมูลการเทรดแบบกระชับ */}
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

              {/* 3 กล่องสะท้อนคิดขนาดใหญ่ */}
              <div className="space-y-3">
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
                className={`w-full py-4 ${themeClasses.primary} text-white font-black rounded-2xl shadow-xl transition disabled:opacity-50 text-sm flex items-center justify-center gap-2`}
              >
                {loading ? "กำลังบันทึกข้อมูล..." : `บันทึกหน้าใหม่ลงใน ${activeBookName}`}
              </button>
            </div>
          </div>
        )}

        {/* ================= 2. VIEW: แดชบอร์ดสรุปผลเชิงสถิติ (พร้อมปฏิทิน HEATMAP) ================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between bg-[#0b1626] p-4 rounded-2xl border border-cyan-900/50 gap-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>กำลังดูสถิติของ: <span className="text-cyan-300 underline">{activeBookName}</span></span>
                <span className="text-xs text-slate-400 font-normal">({totalTrades} ไม้)</span>
              </div>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 bg-[#070e17] hover:bg-cyan-950/60 text-cyan-300 border border-cyan-800/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow"
              >
                <Download className="w-3.5 h-3.5" /> ส่งออก CSV (Excel)
              </button>
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

            {/* 📅 MONTHLY TRADING HEATMAP CALENDAR (สไตล์ PROP FIRM) */}
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

              {/* Grid 31 Days */}
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
                          {d.dayPnL >= 0 ? `+$${d.dayPnL}` : `-$${Math.abs(d.dayPnL)}`}
                        </span>
                      ) : (
                        <span className="text-slate-700 text-[10px] font-normal">-</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 📈 Equity Curve Graph */}
            <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> กราฟการเติบโตของพอร์ต (Equity Curve - Cumulative P&L)
                </div>
                <span className={`text-xs font-mono font-bold ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Net: {netPnL >= 0 ? `+$${netPnL}` : `-$${Math.abs(netPnL)}`}
                </span>
              </div>

              {equityPoints.length > 1 ? (
                <div className="w-full h-44 bg-[#070e17] rounded-xl p-3 flex items-end relative overflow-hidden border border-cyan-950">
                  <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${Math.max(10, equityPoints.length - 1)} 100`} preserveAspectRatio="none">
                    <line x1="0" y1="50" x2={equityPoints.length - 1} y2="50" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
                    {(() => {
                      const maxVal = Math.max(...equityPoints.map(p => Math.abs(p.pnl)), 100);
                      const pointsStr = equityPoints.map((p, idx) => {
                        const y = 50 - ((p.pnl / maxVal) * 45);
                        return `${idx},${y}`;
                      }).join(" ");
                      return (
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={pointsStr}
                        />
                      );
                    })()}
                  </svg>
                </div>
              ) : (
                <div className="h-28 flex items-center justify-center text-slate-500 text-xs bg-[#070e17] rounded-xl">
                  บันทึกไม้เทรดอย่างน้อย 2 ไม้เพื่อเริ่มวาดกราฟการเติบโตของพอร์ต
                </div>
              )}
            </div>

            {/* 📊 Setup Win Rate & Session Breakdown */}
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
                          {s.pnl >= 0 ? `+$${s.pnl}` : `-$${Math.abs(s.pnl)}`}
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
                          {sess.session === "London" ? "14:00 - 19:30 น." : (sess.session === "New York" ? "19:30 - 03:00 น." : "06:00 - 14:00 น.")}
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

            {/* ตารางประวัติไม้เทรด */}
            <div className="bg-[#0b1626] border border-cyan-900/60 rounded-2xl p-6 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-100">ประวัติการเทรดใน {activeBookName} ({bookTrades.length} ไม้)</h2>
                <span className="text-xs text-cyan-400">💡 คลิกแถวเพื่อเปิดดูหน้าทบทวนเต็มจอ</span>
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
                      <th className="p-3 text-center">เปิดดูเต็มหน้า / ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-950/60">
                    {bookTrades.map((t) => (
                      <tr key={t.id} className="hover:bg-cyan-950/30 transition cursor-pointer" onClick={() => handleOpenTradeDetail(t)}>
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
                            <button onClick={() => handleOpenTradeDetail(t)} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow transition">
                              <Eye className="w-3.5 h-3.5" /> เปิดดูเต็มหน้า
                            </button>
                            <button onClick={() => deleteTrade(t.id)} className="text-slate-500 hover:text-rose-400 p-1.5 transition" title="ลบหน้าบันทึกนี้">
                              <Trash2 className="w-4 h-4" />
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
                    {selectedTrade.pnl >= 0 ? `+$${selectedTrade.pnl}` : `-$${Math.abs(selectedTrade.pnl)}`}
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteTrade(selectedTrade.id)}
                className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-700 text-rose-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-rose-800/60"
              >
                <Trash2 className="w-3.5 h-3.5" /> ลบไม้นี้
              </button>
            </div>

            {/* ภาพกราฟ 2 ภาพขนาดใหญ่ ชัดเจนเต็มตา */}
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

                <div className="rounded-xl overflow-hidden bg-[#070e17] flex items-center justify-center p-2 min-h-[440px]">
                  {selectedTrade.image_analysis ? (
                    <img src={selectedTrade.image_analysis} alt="Analysis Chart" className="w-full h-auto max-h-[850px] object-contain rounded-lg cursor-zoom-in hover:opacity-95 transition" onClick={() => setLightboxImg(selectedTrade.image_analysis)} />
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

                <div className="rounded-xl overflow-hidden bg-[#070e17] flex items-center justify-center p-2 min-h-[440px]">
                  {selectedTrade.image_trigger ? (
                    <img src={selectedTrade.image_trigger} alt="Trigger Chart" className="w-full h-auto max-h-[850px] object-contain rounded-lg cursor-zoom-in hover:opacity-95 transition" onClick={() => setLightboxImg(selectedTrade.image_trigger)} />
                  ) : (
                    <div className="text-slate-600 text-sm flex flex-col items-center">
                      <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
                      <span>ไม่ได้แนบภาพที่ 2</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3 กล่องทบทวนขนาดใหญ่พิเศษ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-[#0b1626] border-2 border-cyan-900/70 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="text-sm font-black text-cyan-300 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-cyan-950">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
                  <span>1. เหตุผลที่เข้า (Reason)</span>
                </div>
                <div className="bg-[#070e17] rounded-xl p-4 border border-cyan-950 text-sm text-slate-100 leading-relaxed min-h-[160px] whitespace-pre-wrap">
                  {selectedTrade.reason || 'ไม่มีบันทึกเหตุผล'}
                </div>
              </div>

              <div className="bg-[#0b1626] border-2 border-rose-900/50 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="text-sm font-black text-rose-400 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-rose-950">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span>
                  <span>2. ข้อผิดพลาด (Mistake)</span>
                </div>
                <div className="bg-[#070e17] rounded-xl p-4 border border-rose-950/60 text-sm text-rose-100 leading-relaxed min-h-[160px] whitespace-pre-wrap">
                  {selectedTrade.mistake || 'ไม่มีบันทึกข้อผิดพลาด'}
                </div>
              </div>

              <div className="bg-[#0b1626] border-2 border-emerald-900/50 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="text-sm font-black text-emerald-400 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-emerald-950">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                  <span>3. วิธีแก้ไข (Solution)</span>
                </div>
                <div className="bg-[#070e17] rounded-xl p-4 border border-emerald-950/60 text-sm text-emerald-100 leading-relaxed min-h-[160px] whitespace-pre-wrap">
                  {selectedTrade.solution || 'ไม่มีบันทึกวิธีแก้ไข'}
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

      {/* ================= 🛑 POPUP: กฎ 1 ไม้ต่อวัน ================= */}
      {showLossLimitModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#0e1b2e] to-[#070e17] border-2 border-rose-500 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-36 h-36 mx-auto rounded-3xl overflow-hidden border-4 border-rose-400 shadow-2xl bg-slate-900">
              {customBabe ? (
                <img src={customBabe} alt="เบ้บๆ" className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">👩‍❤️‍👨</div>
              )}
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-600 text-rose-300 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" /> กฎเหล็ก: วันละ 1 ไม้เท่านั้น!
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                “วันนี้พอก่อนน้าเบ้บๆ<br/>พรุ่งนี้ค่อยสู้ใหม่ มุมุ!”
              </h2>
              <p className="text-xs text-slate-300">
                วันนี้เราแพ้ไปแล้ว 1 ไม้ตามแผน ปิดจอไปพักผ่อน ดื่มชาเขียว พรุ่งนี้ค่อยหาจังหวะใหม่นะเบ้บ 🍵💚
              </p>
            </div>

            <button
              onClick={() => setShowLossLimitModal(false)}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl shadow-lg transition text-sm"
            >
              รับทราบครับเบ้บ จะปิดจอเดี๋ยวนี้! 🫡
            </button>
          </div>
        </div>
      )}

      {/* ================= 🎨 MODAL: วาดมาร์กเกอร์บนภาพกราฟ ================= */}
      {drawingModal.open && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl flex items-center justify-between pb-3 text-white">
            <span className="text-sm font-bold flex items-center gap-2">
              <PenTool className="w-4 h-4 text-amber-400" /> ลากวาดมาร์กเกอร์ / วงกลม / ลูกศรจุดเข้า
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700">
                <button onClick={() => setDrawColor("#f43f5e")} className={`w-5 h-5 rounded-full bg-rose-500 ${drawColor === "#f43f5e" ? "ring-2 ring-white" : ""}`} />
                <button onClick={() => setDrawColor("#10b981")} className={`w-5 h-5 rounded-full bg-emerald-500 ${drawColor === "#10b981" ? "ring-2 ring-white" : ""}`} />
                <button onClick={() => setDrawColor("#f59e0b")} className={`w-5 h-5 rounded-full bg-amber-500 ${drawColor === "#f59e0b" ? "ring-2 ring-white" : ""}`} />
                <button onClick={() => setDrawColor("#38bdf8")} className={`w-5 h-5 rounded-full bg-sky-400 ${drawColor === "#38bdf8" ? "ring-2 ring-white" : ""}`} />
              </div>
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
              className="cursor-crosshair max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

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
                <button type="button" onClick={() => setShowNewBookModal(false)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
                  ยกเลิก
                </button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition">
                  สร้างสมุด
                </button>
              </div>
            </form>
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
