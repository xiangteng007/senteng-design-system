import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Search,
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Folder,
  Loader2,
  LogOut,
  X,
  GripHorizontal,
  GripVertical,
  CalendarDays,
} from "lucide-react";

import { GoogleService } from "./services/googleService";

// ---------------- 共用工具 ----------------

const classNames = (...classes) => classes.filter(Boolean).join(" ");

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num =
    typeof value === "number"
      ? value
      : parseFloat(String(value).replace(/,/g, ""));
  if (isNaN(num)) return "-";
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// 將 Google Sheet 回傳的 values 轉成物件陣列
function sheetValuesToObjects(values, sheetName) {
  if (!values || !values.length) return [];
  const [header, ...rows] = values;
  return rows.map((row, idx) => {
    const obj = {};
    header.forEach((key, i) => {
      if (!key) return;
      obj[key] = row[i] ?? "";
    });
    if (!obj.id) obj.id = `${sheetName}-${idx + 1}`;
    return obj;
  });
}

// ---------------- Toast 系統 ----------------

const ToastContext = React.createContext(null);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 space-y-2 z-[9999]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={classNames(
              "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border bg-white/95 backdrop-blur-sm text-sm",
              toast.type === "success" && "border-emerald-100 text-emerald-900",
              toast.type === "error" && "border-rose-100 text-rose-900",
              toast.type === "info" && "border-slate-200 text-slate-900"
            )}
          >
            {toast.type === "success" && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
            {toast.type === "error" && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
            {toast.type === "info" && (
              <span className="w-2 h-2 rounded-full bg-slate-400" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => React.useContext(ToastContext);

// ---------------- 登入畫面 ----------------

const LoginScreen = ({ onLogin, loading }) => {
  const { addToast } = useToast();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-semibold tracking-[0.2em]">
              森
            </span>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold tracking-wide text-slate-900">
              森騰室內設計
            </h1>
            <p className="text-xs text-slate-500">
              請登入 Google 帳戶以存取雲端資料庫
            </p>
          </div>
        </div>

        <button
          onClick={onLogin}
          disabled={loading}
          className={classNames(
            "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium",
            "transition-all duration-150",
            "bg-white hover:bg-slate-50 active:bg-slate-100",
            "border-slate-200 text-slate-800",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>登入中...</span>
            </>
          ) : (
            <>
              <div className="w-5 h-5 rounded-[4px] bg-white flex items-center justify-center shadow-sm">
                <span className="text-[10px] font-bold bg-gradient-to-br from-sky-500 via-emerald-500 to-amber-500 bg-clip-text text-transparent">
                  G
                </span>
              </div>
              <span>使用 Google 帳戶登入</span>
            </>
          )}
        </button>

        <div className="pt-2 border-t border-dashed border-slate-100">
          <button
            onClick={() =>
              addToast(
                "目前為正式串接版，不再使用 Demo 假資料。請使用 Google 帳戶登入。",
                "info"
              )
            }
            className="w-full text-xs text-slate-400 hover:text-slate-600 text-center"
          >
            先不用：使用離線模式 (Demo Mode)
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------- 專案管理（真實資料 + Sheets + Drive） ----------------

const Projects = ({ projects, loading, onProjectsChange }) => {
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    clientName: "",
    type: "翻修",
    budget: "",
    dueDate: "",
  });

  const filtered = (projects || []).filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const content = `${p.name || ""} ${p.clientName || ""} ${p.code || ""}`;
    return content.toLowerCase().includes(q);
  });

  const handleAddProject = async () => {
    if (!newProject.name.trim()) {
      addToast("請輸入專案名稱", "error");
      return;
    }

    try {
      // 1. 建立 Drive 資料夾
      const driveFolder = await GoogleService.createDriveFolder(
        newProject.name
      );

      // 2. 建立前端專案物件
      const projectId = `p-${Date.now()}`;
      const code =
        newProject.code ||
        `P-${new Date().getFullYear().toString().slice(2)}${Math.floor(
          Math.random() * 900 + 100
        )}`;

      const project = {
        id: projectId,
        code,
        name: newProject.name,
        clientName: newProject.clientName || "",
        type: newProject.type || "翻修",
        status: "設計中",
        budget: Number(newProject.budget || 0),
        dueDate: newProject.dueDate || "",
        driveFolder,
      };

      const updated = [...(projects || []), project];

      // 3. 寫入 Google Sheet「projects」頁籤
      await GoogleService.syncToSheet("projects", updated);

      // 4. 更新前端 state
      onProjectsChange && onProjectsChange(updated);

      addToast(
        `專案「${project.name}」建立完成，已建立 Drive 資料夾 + Sheets 紀錄。`,
        "success"
      );
      setIsAddModalOpen(false);
      setNewProject({
        name: "",
        clientName: "",
        type: "翻修",
        budget: "",
        dueDate: "",
      });
    } catch (err) {
      console.error("[Projects] handleAddProject error:", err);
      addToast("建立專案失敗，請稍後再試。", "error");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-slate-500" />
            專案管理
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            所有專案將同步 Google Sheets「projects」與指定 Drive 資料夾。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setViewMode(viewMode === "grid" ? "list" : "grid")
            }
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50"
          >
            {viewMode === "grid" ? (
              <>
                <GripHorizontal className="w-4 h-4" />
                <span>卡片模式</span>
              </>
            ) : (
              <>
                <GripVertical className="w-4 h-4" />
                <span>表格模式</span>
              </>
            )}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs hover:bg-slate-800 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增專案</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5"
            placeholder="搜尋專案名稱、客戶名稱或編號..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-2">
            <Folder className="w-8 h-8 mb-1" />
            <p>目前尚未建立任何專案</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-1 text-[11px] text-slate-500 underline underline-offset-4"
            >
              立即新增一個專案
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="group text-left rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-900/10 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-slate-900/5 text-[11px] text-slate-700 mb-2">
                      <span className="font-mono">
                        {project.code || "未編碼"}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-400" />
                      <span>{project.type || "-"}</span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 mb-1">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{project.clientName || "未指定客戶"}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[11px] text-slate-500">
                      預算 {formatCurrency(project.budget)}
                    </span>
                    {project.dueDate && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 rounded-full px-2 py-0.5">
                        <CalendarDays className="w-3 h-3" />
                        {formatDate(project.dueDate)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Folder className="w-3 h-3" />
                    {project.driveFolder ? "已建立雲端資料夾" : "尚未建立雲端資料夾"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[11px] text-slate-500">
                  <th className="px-3 py-2 text-left font-normal">專案名稱</th>
                  <th className="px-3 py-2 text-left font-normal">客戶</th>
                  <th className="px-3 py-2 text-right font-normal">預算</th>
                  <th className="px-3 py-2 text-left font-normal">類型</th>
                  <th className="px-3 py-2 text-left font-normal">截止日</th>
                  <th className="px-3 py-2 text-left font-normal">雲端資料夾</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-slate-100 hover:bg-slate-50/40"
                  >
                    <td className="px-3 py-2 text-slate-900">
                      {project.name}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {project.clientName || "-"}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-900">
                      {formatCurrency(project.budget)}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {project.type || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {formatDate(project.dueDate)}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {project.driveFolder ? "已建立" : "尚未建立"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                新增專案
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 text-slate-600">專案名稱</label>
                <input
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="例如：信義區三房翻修案"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-600">客戶名稱</label>
                <input
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                  value={newProject.clientName}
                  onChange={(e) =>
                    setNewProject((p) => ({
                      ...p,
                      clientName: e.target.value,
                    }))
                  }
                  placeholder="例如：林先生"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-600">專案類型</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                    value={newProject.type}
                    onChange={(e) =>
                      setNewProject((p) => ({ ...p, type: e.target.value }))
                    }
                  >
                    <option value="翻修">翻修</option>
                    <option value="新成屋">新成屋</option>
                    <option value="商空">商空</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-slate-600">預算金額</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                    value={newProject.budget}
                    onChange={(e) =>
                      setNewProject((p) => ({ ...p, budget: e.target.value }))
                    }
                    placeholder="例：1500000"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-600">
                  預計完工日 (可選)
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                  value={newProject.dueDate}
                  onChange={(e) =>
                    setNewProject((p) => ({ ...p, dueDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                onClick={handleAddProject}
                className="px-3 py-1.5 rounded-xl text-xs bg-slate-900 text-white hover:bg-slate-800"
              >
                建立專案並同步雲端
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------- 行程管理（使用 Google Calendar 真實資料） ----------------

const Schedule = ({ events, loading, onEventCreated }) => {
  const { addToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    notes: "",
  });

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const startDay = startOfMonth.getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    setSelectedDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setSelectedDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.date) {
      addToast("請輸入行程名稱與日期", "error");
      return;
    }

    try {
      await GoogleService.addToCalendar(newEvent);
      onEventCreated && onEventCreated(newEvent);
      addToast("行程已建立並同步至 Google Calendar。", "success");
      setIsAddModalOpen(false);
      setNewEvent({
        title: "",
        date: "",
        time: "",
        location: "",
        notes: "",
      });
    } catch (err) {
      console.error("[Schedule] handleAddEvent error:", err);
      addToast("建立行程失敗，請稍後再試。", "error");
    }
  };

  const eventsByDate = (events || []).reduce((acc, evt) => {
    const key = evt.date;
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(evt);
    return acc;
  }, {});

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-slate-500" />
            行程管理
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            新增的行程會同步寫入 Google Calendar，並顯示在此月曆中。
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs hover:bg-slate-800 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>新增行程</span>
        </button>
      </div>

      <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-full hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <div className="text-sm font-medium text-slate-900">
              {currentYear} 年 {currentMonth + 1} 月
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-full hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            <span>已同步 Google 行事曆</span>
          </div>
        </div>

        <div className="grid grid-cols-7 text-[11px] text-slate-500 border-b border-slate-100">
          {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
            <div
              key={d}
              className="px-2 py-1 text-center bg-slate-50 select-none"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 text-xs">
          {Array.from({ length: startDay }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="border-b border-r border-slate-100 bg-slate-50/40"
            />
          ))}

          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dateStr = new Date(
              currentYear,
              currentMonth,
              day
            ).toISOString().slice(0, 10);
            const eventsOfDay = eventsByDate[dateStr] || [];
            const isToday = dateStr === todayStr;

            return (
              <div
                key={dateStr}
                className="border-b border-r border-slate-100 min-h-[72px] p-1.5 flex flex-col"
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={classNames(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[11px]",
                      isToday ? "bg-slate-900 text-white" : "text-slate-700"
                    )}
                  >
                    {day}
                  </div>
                  {eventsOfDay.length > 0 && (
                    <span className="text-[10px] text-slate-400">
                      {eventsOfDay.length} 件
                    </span>
                  )}
                </div>
                <div className="space-y-1 overflow-hidden">
                  {eventsOfDay.slice(0, 3).map((evt) => (
                    <div
                      key={evt.id || `${dateStr}-${evt.title}`}
                      className="px-1.5 py-0.5 rounded-md bg-slate-900/5 text-[10px] text-slate-700 truncate"
                    >
                      {evt.time && (
                        <span className="font-mono mr-1 opacity-70">
                          {evt.time}
                        </span>
                      )}
                      <span>{evt.title}</span>
                    </div>
                  ))}
                  {eventsOfDay.length > 3 && (
                    <div className="text-[10px] text-slate-400">
                      + {eventsOfDay.length - 3} 更多
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                新增行程
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 text-slate-600">行程名稱</label>
                <input
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent((ev) => ({ ...ev, title: e.target.value }))
                  }
                  placeholder="例如：丈量現場 / 與客戶開會"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-600">日期</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent((ev) => ({ ...ev, date: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600">
                    時間 (選填)
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                    value={newEvent.time}
                    onChange={(e) =>
                      setNewEvent((ev) => ({ ...ev, time: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-600">
                  地點 / 地址 (選填)
                </label>
                <input
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                  value={newEvent.location}
                  onChange={(e) =>
                    setNewEvent((ev) => ({ ...ev, location: e.target.value }))
                  }
                  placeholder="例如：高雄市三民區 ..."
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-600">
                  備註 (選填)
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5 resize-none"
                  value={newEvent.notes}
                  onChange={(e) =>
                    setNewEvent((ev) => ({ ...ev, notes: e.target.value }))
                  }
                  placeholder="例如：帶樣本板、提醒客戶準備平面圖 ..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                onClick={handleAddEvent}
                className="px-3 py-1.5 rounded-xl text-xs bg-slate-900 text-white hover:bg-slate-800"
              >
                建立行程並同步 Google
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------- App 根組件 ----------------

const INITIAL_DATA = {
  projects: [],
  calendar: [],
};

const AppInner = () => {
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = useState("projects");
  const [data, setData] = useState(INITIAL_DATA);
  const [googleReady, setGoogleReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // 從 Google 載入所有資料
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      // 1) projects from Sheets
      const projectsValues = await GoogleService.fetchSheetData("projects");
      const projects = sheetValuesToObjects(projectsValues, "projects");

      // 2) calendar from Google Calendar API
      const calendarEvents = await GoogleService.fetchCalendarEvents();
      const calendar = (calendarEvents || [])
        .map((evt) => {
          const start = evt.start || {};
          const date =
            start.date ||
            (start.dateTime ? start.dateTime.slice(0, 10) : undefined);
          const time = start.dateTime ? start.dateTime.slice(11, 16) : "";
          if (!date) return null;
          return {
            id: evt.id,
            title: evt.summary || "(未命名行程)",
            date,
            time,
          };
        })
        .filter(Boolean);

      setData({
        projects,
        calendar,
      });
    } catch (err) {
      console.error("[App] loadAllData error:", err);
      addToast("從 Google 載入資料失敗。", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // 初始化 GoogleService
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const signed = await GoogleService.initClient();
        if (!mounted) return;
        setGoogleReady(true);
        setSignedIn(signed);
        if (signed) {
          await loadAllData();
        }
      } catch (err) {
        console.error("[App] initClient error:", err);
        addToast("初始化 Google 服務失敗。", "error");
        setGoogleReady(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [addToast, loadAllData]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const user = await GoogleService.login();
      if (user) {
        setSignedIn(true);
        addToast("Google 登入成功。", "success");
        await loadAllData();
      }
    } catch (err) {
      console.error("[App] handleLogin error:", err);
      addToast("登入失敗，請稍後再試。", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await GoogleService.logout();
      setSignedIn(false);
      setData(INITIAL_DATA);
      addToast("已登出 Google 帳號。", "info");
    } catch (err) {
      console.error("[App] handleLogout error:", err);
      addToast("登出時發生錯誤。", "error");
    }
  };

  // 專案變動時，同步寫回 state + Sheets
  const handleProjectsChange = async (projects) => {
    setData((prev) => ({ ...prev, projects }));
    try {
      await GoogleService.syncToSheet("projects", projects);
    } catch (err) {
      console.error("[App] handleProjectsChange sync error:", err);
      addToast("同步專案資料到 Sheets 失敗。", "error");
    }
  };

  // 行程新增後，更新前端 state；Google Calendar 已由 GoogleService.addToCalendar 寫入
  const handleEventCreated = async (evt) => {
    // 直接重撈 Calendar，避免時間格式差異
    await loadAllData();
  };

  if (!googleReady || !signedIn) {
    return <LoginScreen onLogin={handleLogin} loading={loading} />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case "projects":
        return (
          <Projects
            projects={data.projects}
            loading={loading}
            onProjectsChange={handleProjectsChange}
          />
        );
      case "schedule":
        return (
          <Schedule
            events={data.calendar}
            loading={loading}
            onEventCreated={handleEventCreated}
          />
        );
      default:
        return (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            功能建構中，請先使用「專案管理」與「行程管理」。
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 側邊選單 */}
      <aside className="w-60 border-r border-slate-200 bg-white/80 backdrop-blur-sm flex flex-col">
        <div className="h-14 px-4 border-b border-slate-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-sm font-semibold">
            森
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-900">
              森騰設計
            </span>
            <span className="text-[10px] text-slate-500">
              Studio Operations
            </span>
          </div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1 text-xs">
          <button
            onClick={() => setActiveSection("projects")}
            className={classNames(
              "w-full flex items-center gap-2 px-3 py-2 rounded-xl",
              activeSection === "projects"
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-50"
            )}
          >
            <Briefcase className="w-4 h-4" />
            <span>專案管理</span>
          </button>
          <button
            onClick={() => setActiveSection("schedule")}
            className={classNames(
              "w-full flex items-center gap-2 px-3 py-2 rounded-xl",
              activeSection === "schedule"
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-50"
            )}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>行程管理</span>
          </button>
        </nav>
        <div className="px-3 py-3 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>登出 Google</span>
          </button>
        </div>
      </aside>

      {/* 主內容 */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 px-6 border-b border-slate-200 bg-white/70 backdrop-blur-sm flex items-center justify-between">
          <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-slate-500" />
            <span>森騰設計 · 管理後台</span>
          </div>
        </header>
        <main className="flex-1 p-4">
          <div className="h-full rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <ToastProvider>
    <AppInner />
  </ToastProvider>
);

export default App;
