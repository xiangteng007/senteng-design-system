import React, { useState, useEffect, useCallback, useRef } from 'react';
import GoogleService from "./services/googleService";
import HealthCheck from "./components/HealthCheck";
// 移除外部依賴，改用 window.gapi 動態載入，避免預覽環境報錯
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Wallet, 
  HardHat, 
  Package, 
  Search, 
  Bell, 
  Calendar as CalendarIcon, 
  Plus, 
  MapPin, 
  Phone, 
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Circle,
  Star,
  RefreshCw,
  LogOut,
  Sheet,
  FileSpreadsheet,
  CalendarDays,
  Cloud,
  GripVertical,
  GripHorizontal,
  Maximize2,
  Minimize2,
  PieChart,
  UserPlus,
  MessageSquare,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Link as LinkIcon,
  X,
  Edit2,
  ArrowUpDown,
  Filter,
  Mail,
  FileText,
  Activity,
  AlertTriangle,
  Folder,
  Image as ImageIcon,
  Upload,
  File,
  Trash2,
  ExternalLink,
  Save,
  Loader2,
  AlertCircle
} from 'lucide-react';

// --- GOOGLE API CONFIGURATION ---
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; 
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY; 
const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar";

// --- MOCK DATA ---
const MOCK_DB = {
  clients: [
    { 
      id: "c-1", 
      name: "林先生", 
      status: "已簽約", 
      source: "網路廣告", 
      phone: "0912-345-678", 
      email: "lin@example.com", 
      address: "台北市信義區...", 
      driveFolder: "https://drive.google.com/drive/folders/mock-lin",
      customFields: [
        { label: "房屋類型", value: "電梯大樓" },
        { label: "風格偏好", value: "現代簡約" },
        { label: "家庭成員", value: "夫妻+1子" },
        { label: "預算範圍", value: "300-500萬" },
        { label: "備註", value: "喜歡大理石，主臥需有更衣室。" }
      ],
      lastContact: "2025-12-06"
    },
    { 
      id: "c-2", 
      name: "陳小姐", 
      status: "提案/報價", 
      source: "朋友介紹", 
      phone: "0922-333-444", 
      email: "chen@example.com", 
      address: "台北市大安區...", 
      driveFolder: "https://drive.google.com/drive/folders/mock-chen",
      customFields: [
        { label: "房屋類型", value: "電梯大樓" },
        { label: "風格偏好", value: "北歐風" },
        { label: "特殊需求", value: "有養兩隻貓，需貓跳台。" }
      ],
      lastContact: "2025-12-07"
    }
  ],
  projects: [
    { 
      id: "p-1", code: "P-23001", name: "信義區林公館", type: "翻修", status: "施工中", progress: 65, dueDate: "2025-03-15", clientName: "林先生", budget: 350, 
      milestones: [{date: "2025-12-15", name: "木工退場"}, {date: "2025-12-20", name: "油漆進場"}],
      records: [
        { id: "r-1", date: "2025-12-01", type: "工程", content: "水電配管完成，試壓正常。", photos: ["配管.jpg"], author: "Alex" },
        { id: "r-2", date: "2025-12-05", type: "會議", content: "業主確認磁磚樣式，選定馬可貝里 R60。", photos: [], author: "Alex" }
      ],
      files: [
        { id: "f-1", name: "平面配置圖_v3.pdf", type: "pdf", url: "#", size: "2.4MB", date: "2025-11-20" },
        { id: "f-2", name: "工程合約書.pdf", type: "pdf", url: "#", size: "1.1MB", date: "2025-11-15" }
      ]
    },
    { id: "p-2", code: "P-24002", name: "大安森林公園景觀", type: "新建", status: "設計中", progress: 30, dueDate: "2025-06-20", clientName: "大安區公所", budget: 980, milestones: [{date: "2025-12-18", name: "第二次提案會議"}], records: [], files: [] },
    { id: "p-3", code: "P-24003", name: "南港軟體園區辦公室", type: "商空", status: "完工驗收", progress: 95, dueDate: "2025-02-28", clientName: "科技股份公司", budget: 1280, milestones: [], records: [], files: [] },
    { id: "p-4", code: "P-24004", name: "內湖張公館", type: "翻修", status: "設計中", progress: 15, dueDate: "2025-08-10", clientName: "張先生", budget: 420, milestones: [{date: "2025-12-12", name: "現場丈量"}], records: [], files: [] }
  ],
  finance: {
    accounts: [
      { id: "a-1", name: "玉山營運", bank: "玉山銀行", number: "808-1234-5678-9012", balance: 2360, note: "主要收支帳戶" },
      { id: "a-2", name: "公司零用金", bank: "現金箱", number: "-", balance: -2, note: "日常雜支" },
      { id: "a-3", name: "台新薪轉", bank: "台新銀行", number: "987-654-321", balance: 0, note: "薪轉專用" }
    ],
    transactions: [
      { id: "t-1", date: "2025-12-05", type: "收入", amount: 800, accountId: "a-1", projectId: "p-1", desc: "信義林公館 - 第2期工程款", synced: true },
      { id: "t-2", date: "2025-12-08", type: "支出", amount: 30, accountId: "a-1", projectId: "p-1", desc: "水電建材料件", synced: false },
      { id: "t-3", date: "2025-12-10", type: "支出", amount: 2, accountId: "a-2", projectId: "p-2", desc: "辦公室文具", synced: false },
      { id: "t-4", date: "2025-12-11", type: "支出", amount: 15, accountId: "a-1", projectId: "p-3", desc: "油漆補料", synced: true },
      { id: "t-5", date: "2025-12-25", type: "收入", amount: 300, accountId: "a-3", projectId: "p-2", desc: "設計費首款 (預計)", synced: false }
    ]
  },
  vendors: [
    { id: "v-1", name: "大師兄精緻木工坊", category: "工程工班", tradeType: "木工", contactPerson: "王大哥", phone: "0912-345-678", address: "新北市板橋區文化路一段...", status: "長期合作", rating: 4.9, lastProject: "信義區林公館", tags: ["配合度高", "手工細緻"] },
    { id: "v-2", name: "永亮專業水電", category: "工程工班", tradeType: "水電", contactPerson: "張師傅", phone: "0922-333-444", address: "新店區...", status: "合作中", rating: 4.5, lastProject: "南港軟體園區", tags: ["配線整齊"] },
    { id: "v-3", name: "佳佳油漆", category: "工程工班", tradeType: "油漆", contactPerson: "李老闆", phone: "0911-222-333", address: "台北市松山區...", status: "觀察中", rating: 3.8, lastProject: "內湖張公館", tags: ["價格便宜"] },
    { id: "v-4", name: "美居家飾", category: "建材供應", tradeType: "軟裝", contactPerson: "Amy", phone: "02-2345-6789", address: "台北市內湖區...", status: "長期合作", rating: 4.8, lastProject: "大安森林公園", tags: ["品項多"] }
  ],
  inventory: [
    { id: "i-1", name: "Panasonic 開關", spec: "PN-001", quantity: 50, unit: "組", safeStock: 10, location: "A-01", restockDate: "2025-12-20", status: "充足" },
    { id: "i-2", name: "得利乳膠漆 (白)", spec: "PT-W01", quantity: 5, unit: "桶", safeStock: 10, location: "B-02", restockDate: "2025-12-15", status: "庫存偏低" },
    { id: "i-3", name: "T5 層板燈", spec: "LGT-T5", quantity: 100, unit: "支", safeStock: 20, location: "A-03", restockDate: "", status: "充足" }
  ],
  calendar: [
    { id: "evt-1", title: "信義林公館-木工進場", date: "2025-12-07", time: "10:00 AM", type: "construction", color: "orange" },
    { id: "evt-2", title: "陳小姐-平面圖提案會議", date: "2025-12-07", time: "02:00 PM", type: "meeting", color: "blue" },
    { id: "evt-3", title: "內湖張公館-丈量", date: "2025-12-12", time: "04:30 PM", type: "meeting", color: "blue" }
  ]
};

const EMPTY_DB = { calendar: [], projects: [], clients: [], vendors: [], inventory: [], finance: { accounts: [], transactions: [] } };




// --- HELPER COMPONENTS ---
const Card = ({ children, className = "", noPadding = false, onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-xl shadow-sm border border-gray-100 ${noPadding ? '' : 'p-6'} ${className} ${onClick ? 'cursor-pointer' : ''}`}>
    {children}
  </div>
);
const Badge = ({ children, color = "gray", className = "" }) => {
  const colors = { gray: "bg-gray-100 text-gray-700", blue: "bg-blue-50 text-blue-700", green: "bg-emerald-50 text-emerald-700", orange: "bg-orange-50 text-orange-700", purple: "bg-purple-50 text-purple-700", red: "bg-red-50 text-red-700" };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[color] || colors.gray} ${className}`}>{children}</span>;
};
const ProgressBar = ({ value }) => (
  <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-gray-800 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${value}%` }} /></div>
);
const SectionTitle = ({ title, action }) => (
  <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold text-gray-800">{title}</h2>{action}</div>
);
const LoadingSkeleton = ({ rows = 3 }) => (
  <div className="animate-pulse space-y-4">{[...Array(rows)].map((_, i) => <div key={i} className="flex gap-4"><div className="h-12 w-12 bg-gray-200 rounded-full"></div><div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-1/3"></div><div className="h-3 bg-gray-200 rounded w-1/2"></div></div></div>)}</div>
);
const Modal = ({ isOpen, onClose, title, children, onConfirm, confirmText = "確認" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center"><h3 className="font-bold text-lg text-gray-800">{title}</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button></div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition-colors">取消</button><button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm bg-gray-800 text-white hover:bg-gray-900 transition-colors shadow-lg shadow-gray-200">{confirmText}</button></div>
      </div>
    </div>
  );
};
const InputField = ({ label, type = "text", placeholder, value, onChange, options }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {type === "select" ? (
      <select value={value} onChange={onChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
        <option value="" disabled>請選擇</option>{options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : type === "textarea" ? (
      <textarea value={value} onChange={onChange} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"/>
    ) : (
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
    )}
  </div>
);
const WidgetWrapper = ({ widget, onResize, onDragStart, onDragEnter, onDragEnd, children }) => {
  const { id, size, title } = widget;
  const getGridSpan = (s) => { switch(s) { case 'S': return 'col-span-1'; case 'M': return 'col-span-1 md:col-span-2'; case 'L': return 'col-span-1 md:col-span-2 lg:col-span-4'; default: return 'col-span-1'; } };
  const nextSize = (current) => { if (current === 'S') return 'M'; if (current === 'M') return 'L'; return 'S'; };
  return (
    <div draggable onDragStart={onDragStart} onDragEnter={onDragEnter} onDragEnd={onDragEnd} className={`group relative bg-white rounded-2xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md ${getGridSpan(size)} flex flex-col`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/50 rounded-t-2xl"><div className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-700"><GripHorizontal size={16} /><h3 className="font-bold text-gray-700 text-sm select-none">{title}</h3></div><button onClick={() => onResize(id, nextSize(size))} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">{size === 'L' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</button></div>
      <div className="flex-1 p-4 overflow-hidden flex flex-col relative">{children}</div>
    </div>
  );
};
const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">{toasts.map(toast => (<div key={toast.id} className="bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up min-w-[300px]"><div className={`p-1 rounded-full ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}><CheckCircle2 size={16} className="text-white" /></div><div className="flex-1 text-sm font-medium">{toast.message}</div><button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-white"><X size={16}/></button></div>))}</div>
);
const TrendChart = ({ color = "#10B981" }) => {
  const values = [40, 35, 60, 50, 80, 75, 90]; const max = Math.max(...values); const min = Math.min(...values); const range = max - min || 1; const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${100 - ((v - min) / range) * 80}`).join(' ');
  return <div className="w-full h-16 mt-2 relative"><svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100"><polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="100" cy={100 - ((values[values.length-1] - min) / range) * 80} r="4" fill={color} /></svg></div>;
};
const DynamicFieldEditor = ({ fields, onChange }) => {
  const handleFieldChange = (idx, key, value) => { const newFields = [...fields]; newFields[idx][key] = value; onChange(newFields); };
  const addField = () => onChange([...fields, { label: "", value: "" }]);
  const removeField = (idx) => onChange(fields.filter((_, i) => i !== idx));
  return (
    <div className="space-y-2">
      {fields.map((field, idx) => (<div key={idx} className="flex gap-2 items-center"><input type="text" placeholder="欄位名稱" value={field.label} onChange={(e) => handleFieldChange(idx, 'label', e.target.value)} className="w-1/3 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"/><input type="text" placeholder="內容" value={field.value} onChange={(e) => handleFieldChange(idx, 'value', e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/><button onClick={() => removeField(idx)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={16}/></button></div>))}
      <button onClick={addField} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2"><Plus size={14}/> 新增自訂欄位</button>
    </div>
  );
};

// --- GLOBAL WIDGETS ---

// Client Widgets
const WidgetClientStats = ({ data, size }) => {
  const signed = data?.filter(c => c.status === '已簽約').length || 0;
  const total = data?.length || 0;
  if (size === 'S') return <div className="h-full flex flex-col justify-between"><Users size={20} className="text-blue-600" /><div><div className="text-3xl font-bold text-gray-900">{total}</div><div className="text-xs text-gray-500">客戶總數</div></div></div>;
  return <div className="h-full flex flex-col justify-center gap-2"><div className="flex justify-between items-center p-2 bg-green-50 rounded-lg"><span className="text-xs text-green-800 font-medium">已簽約</span><span className="text-xl font-bold text-green-900">{signed}</span></div><div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg"><span className="text-xs text-blue-800 font-medium">洽談中</span><span className="text-xl font-bold text-blue-900">{total - signed}</span></div></div>;
};
const WidgetClientList = ({ data, size, onSelectClient, onAddClient, onDeleteClient }) => {
  if (size === 'S') return <div className="h-full flex flex-col justify-center items-center gap-2"><div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-100" onClick={onAddClient}><Plus size={20} /></div><button className="text-xs font-bold text-gray-700 hover:text-blue-600" onClick={onAddClient}>新增客戶</button></div>;
  return (
    <div className="flex flex-col h-full"><div className="flex justify-between mb-2 items-center"><h4 className="font-bold text-gray-700 text-sm">客戶名單</h4>{size === 'L' && <button onClick={onAddClient} className="bg-gray-800 text-white px-2 py-1 text-xs rounded hover:bg-gray-700 flex items-center gap-1"><UserPlus size={12}/> 新增</button>}</div><div className="flex-1 overflow-y-auto space-y-2 pr-1">{(data || []).map(c => (<div key={c.id} className="group flex justify-between items-center border border-gray-100 rounded-lg p-2 hover:bg-gray-50 transition-all cursor-pointer" onClick={() => onSelectClient(c)}><div><div className="font-bold text-sm text-gray-800">{c.name}</div><div className="text-xs text-gray-400">{c.phone}</div></div><div className="flex items-center gap-2"><Badge color={c.status === '已簽約' ? 'green' : 'blue'}>{c.status}</Badge>{size === 'L' && <button onClick={(e) => { e.stopPropagation(); onDeleteClient(c.id); }} className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>}</div></div>))}</div></div>
  );
};

// Vendor Widgets
const WidgetVendorStats = ({ data, size }) => {
  const total = data?.length || 0;
  if (size === 'S') return <div className="h-full flex flex-col justify-between"><HardHat size={20} className="text-orange-600" /><div><div className="text-3xl font-bold text-gray-900">{total}</div><div className="text-xs text-gray-500">合作廠商</div></div></div>;
  return <div className="h-full flex items-center justify-center text-gray-500 text-sm">統計數據...</div>;
};
const WidgetVendorList = ({ data, size, onAdd, onEdit }) => {
  const [search, setSearch] = useState("");
  const filtered = (data || []).filter(v => v.name.includes(search) || v.tradeType.includes(search));
  if (size === 'S') return <div className="h-full flex flex-col justify-center items-center gap-2"><div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={onAdd}><Plus size={20} /></div><button className="text-xs font-bold text-gray-700 hover:text-blue-600" onClick={onAdd}>新增廠商</button></div>;
  return <div className="flex flex-col h-full"><div className="flex justify-between mb-4 gap-2"><div className="relative flex-1"><Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="搜尋廠商..." className="w-full text-sm pl-8 p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300" onChange={e=>setSearch(e.target.value)} /></div><button onClick={onAdd} className="bg-gray-800 text-white px-3 py-1 text-sm rounded-lg flex items-center gap-2 hover:bg-gray-700"><Plus size={14}/> 新增</button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1 pb-2">{filtered.map(vendor => (<div key={vendor.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-white relative group"><button onClick={() => onEdit(vendor)} className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100" title="編輯"><Edit2 size={14} /></button><div className="flex justify-between items-start mb-2 pr-6"><Badge color="blue">{vendor.tradeType}</Badge><div className={`px-2 py-0.5 rounded text-xs font-medium ${vendor.status === '長期合作' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>{vendor.status}</div></div><h3 className="font-bold text-gray-900 text-sm mb-1">{vendor.name}</h3><div className="flex items-center gap-1 text-orange-400 text-xs mb-3"><Star size={12} fill="currentColor" /><span className="font-bold text-gray-700">{vendor.rating}</span></div><div className="bg-gray-50 rounded p-2 flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">{vendor.contactPerson[0]}</div><div className="text-xs"><div className="font-medium text-gray-900">{vendor.contactPerson}</div><div className="text-gray-500 font-mono">{vendor.phone}</div></div></div><div className="flex flex-wrap gap-1">{vendor.tags?.map(t => <span key={t} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">#{t}</span>)}</div></div>))}</div></div>;
};

// Finance Widgets
const WidgetFinanceAccounts = ({ data, size, onEdit, onDragStartAccount, onDragOverAccount, onDragEndAccount }) => {
  const accounts = data || [];
  const total = accounts.reduce((acc, c) => acc + c.balance, 0);
  if (size === 'S') return <div className="h-full flex flex-col justify-between"><Wallet size={20} className="text-gray-700"/><div><div className="text-2xl font-bold text-gray-900">{total}</div><div className="text-xs text-gray-500">總資產 (萬)</div></div></div>;
  return <div className="h-full overflow-y-auto space-y-2">{accounts.map((acc, index) => (<div key={acc.id} draggable onDragStart={(e) => onDragStartAccount && onDragStartAccount(e, index)} onDragOver={(e) => onDragOverAccount && onDragOverAccount(e, index)} onDragEnd={onDragEndAccount} className="bg-white border border-gray-100 p-3 rounded-xl flex justify-between items-center group cursor-move hover:shadow-md transition-all"><div className="flex items-center gap-3"><div className="text-gray-300 group-hover:text-gray-500"><GripVertical size={14} /></div><div><div className="font-bold text-sm text-gray-800">{acc.name}</div><div className="text-xs text-gray-400 font-mono">{acc.bank}</div></div></div><div className="text-right"><div className={`font-bold text-sm ${acc.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>{acc.balance}</div><button onClick={(e) => { e.stopPropagation(); onEdit && onEdit(acc); }} className="text-xs text-blue-500 hover:text-blue-700 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">編輯</button></div></div>))}</div>;
};
const WidgetFinanceTrend = ({ size }) => { if (size === 'S') return <div className="h-full flex flex-col justify-center"><div className="text-xs text-gray-500 mb-1">近期趨勢</div><TrendChart color="#3B82F6" /></div>; return <div className="h-full flex flex-col"><div className="flex justify-between items-center mb-2"><span className="text-sm font-bold text-gray-700">收支趨勢圖</span><span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">+12.5%</span></div><div className="flex-1 flex items-end"><TrendChart color="#3B82F6" /></div></div> };
const WidgetFinanceTransactions = ({ data, size, onAddTx }) => { if (size === 'S') return <div className="h-full flex flex-col justify-center items-center gap-2"><div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center cursor-pointer hover:bg-emerald-100" onClick={onAddTx}><Plus size={20} /></div><button className="text-xs font-bold text-gray-700 hover:text-emerald-600" onClick={onAddTx}>記一筆</button></div>; const transactions = data || []; return <div className="flex flex-col h-full"><div className="flex justify-between mb-4 items-center"><h4 className="font-bold text-gray-700 text-sm">收支明細</h4>{size === 'L' && <button onClick={onAddTx} className="bg-gray-800 text-white px-2 py-1 text-xs rounded hover:bg-gray-700">記帳</button>}</div><div className="overflow-y-auto pr-1 flex-1"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500 font-medium sticky top-0"><tr><th className="p-2">摘要</th><th className="p-2 text-right">金額</th></tr></thead><tbody>{transactions.map(t => <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50"><td className="p-2"><div className="truncate w-24">{t.desc}</div><div className="text-[10px] text-gray-400">{t.date}</div></td><td className={`p-2 text-right font-bold ${t.type==='收入'?'text-emerald-600':'text-red-600'}`}>{t.type==='收入'?'+':'-'} {t.amount}</td></tr>)}</tbody></table></div></div>; };

// Inventory Widgets
const WidgetInventoryStats = ({ data, size }) => { const lowStock = (data || []).filter(i => i.status === '庫存偏低' || i.status === '缺貨').length; if (size === 'S') return <div className="h-full flex flex-col justify-between"><AlertTriangle size={20} className={lowStock > 0 ? "text-red-500" : "text-gray-400"} /><div><div className="text-3xl font-bold text-gray-900">{lowStock}</div><div className="text-xs text-gray-500">缺貨/低庫存</div></div></div>; return <div className="h-full flex items-center justify-center text-gray-500 text-sm">庫存分析圖表...</div>; };
const WidgetInventoryList = ({ data, size, onAdd, onSort }) => { if (size === 'S') return <div className="h-full flex flex-col justify-center items-center gap-2"><div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={onAdd}><Plus size={20} /></div><button className="text-xs font-bold text-gray-700 hover:text-blue-600" onClick={onAdd}>新增品項</button></div>; return <div className="flex flex-col h-full"><div className="flex justify-between mb-2 items-center"><h4 className="font-bold text-gray-700 text-sm">庫存清單</h4>{size === 'L' && <button onClick={onAdd} className="bg-gray-800 text-white px-2 py-1 text-xs rounded hover:bg-gray-700">新增</button>}</div><div className="overflow-y-auto pr-1 flex-1"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 cursor-pointer"><tr><th className="p-2" onClick={()=>onSort && onSort('name')}>品項</th><th className="p-2" onClick={()=>onSort && onSort('quantity')}>數量</th><th className="p-2" onClick={()=>onSort && onSort('status')}>狀態</th></tr></thead><tbody>{(data || []).map(i => (<tr key={i.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50"><td className="p-2"><div className="font-medium text-gray-800">{i.name}</div><div className="text-[10px] text-gray-400">{i.spec}</div></td><td className="p-2 font-bold">{i.quantity}</td><td className="p-2"><Badge color={i.status==='缺貨'?'red':i.status==='庫存偏低'?'orange':'green'}>{i.status}</Badge></td></tr>))}</tbody></table></div></div>; };

// Project Widgets (for Main List)
const WidgetProjectStats = ({ data, size }) => { 
  if (!Array.isArray(data)) return null; 
  const activeCount = data.filter(p => ["設計中", "施工中"].includes(p.status)).length; 
  if (size === 'S') return <div className="h-full flex flex-col justify-between"><Briefcase size={20} className="text-blue-500" /><div><div className="text-3xl font-bold text-gray-900">{activeCount}</div><div className="text-xs text-gray-500">進行中專案</div></div></div>; 
  const designCount = data.filter(p => p.status === "設計中").length; 
  const constructionCount = data.filter(p => p.status === "施工中").length; 
  return <div className="flex flex-col h-full justify-between"><div className="flex justify-between items-end"><div><div className="text-3xl font-bold text-gray-900">{activeCount}</div><div className="text-xs text-gray-500">總進行中</div></div><div className="space-y-1 text-right"><div className="text-xs"><span className="font-bold text-blue-600">{designCount}</span> 設計中</div><div className="text-xs"><span className="font-bold text-orange-600">{constructionCount}</span> 施工中</div></div></div>{size === 'L' && <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden flex"><div style={{width: `${(designCount/activeCount)*100}%`}} className="bg-blue-400 h-full"></div><div style={{width: `${(constructionCount/activeCount)*100}%`}} className="bg-orange-400 h-full"></div></div>}</div>; 
};
const WidgetProjectList = ({ data, size, onSelectProject, onAdd }) => { 
  if (!Array.isArray(data)) return null;
  if (size === 'S') return <div className="h-full flex flex-col justify-center items-center gap-2"><div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={onAdd}><Plus size={20} /></div><button className="text-xs font-bold text-gray-700 hover:text-blue-600" onClick={onAdd}>新增專案</button></div>; 
  return <div className="flex flex-col h-full"><div className="flex justify-between mb-4 gap-2"><span className="font-bold text-gray-500 text-xs">最近更新</span>{size === 'L' && <button onClick={onAdd} className="bg-gray-800 text-white px-2 py-1 text-xs rounded flex items-center gap-1 hover:bg-gray-700"><Plus size={12}/> 新增</button>}</div><div className={`overflow-y-auto pr-1 pb-2 ${size === 'L' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}`}>{data.map(p => (<div key={p.id} onClick={() => onSelectProject && onSelectProject(p)} className={`border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all bg-white cursor-pointer ${size === 'L' ? '' : 'flex justify-between items-center'}`}><div><div className="flex items-center gap-2 mb-1"><span className={`w-2 h-2 rounded-full ${p.status === '施工中' ? 'bg-orange-500' : 'bg-blue-500'}`}></span><h4 className="font-bold text-gray-800 text-sm truncate">{p.name}</h4></div><p className="text-xs text-gray-400 font-mono">{p.code}</p></div>{size === 'L' && <div className="mt-3"><div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>進度</span><span>{p.progress}%</span></div><ProgressBar value={p.progress} /></div>}{size === 'M' && <span className="text-xs font-bold text-gray-600">{p.progress}%</span>}</div>))}</div></div>; 
};

// Project Detail Widgets (for Detail View)
const WidgetProjectInfo = ({ project, size }) => {
  if (size === 'S') return <div className="h-full flex flex-col justify-between"><div className="text-xs text-gray-500">總預算</div><div className="text-2xl font-bold text-gray-900">{project.budget} 萬</div><ProgressBar value={project.progress} /></div>;
  return <div className="space-y-4"><div className="grid grid-cols-2 gap-4"><div className="bg-gray-50 p-3 rounded-lg"><span className="text-xs text-gray-500 block">業主</span><span className="font-bold text-gray-900">{project.clientName}</span></div><div className="bg-gray-50 p-3 rounded-lg"><span className="text-xs text-gray-500 block">類型</span><span className="font-bold text-gray-900">{project.type}</span></div></div><div><div className="flex justify-between text-xs text-gray-500 mb-1"><span>專案進度</span><span>{project.progress}%</span></div><ProgressBar value={project.progress} /></div>{size === 'L' && <div className="text-xs text-gray-400 mt-2">專案代號: {project.code}</div>}</div>
}
const WidgetProjectFinance = ({ transactions, size, onAddTx }) => {
  const income = transactions.filter(t=>t.type==='收入').reduce((acc,c)=>acc+c.amount,0); const expense = transactions.filter(t=>t.type==='支出').reduce((acc,c)=>acc+c.amount,0);
  if (size === 'S') return <div className="h-full flex flex-col justify-between"><div className="flex justify-between items-center"><span className="text-xs text-gray-500">淨收支</span><button onClick={onAddTx} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Plus size={14}/></button></div><div className={`text-2xl font-bold ${income-expense>=0?'text-emerald-600':'text-red-600'}`}>{income-expense}</div></div>;
  return <div className="flex flex-col h-full"><div className="flex justify-between mb-2"><div className="text-xs"><span className="text-gray-500">收</span> <span className="text-emerald-600 font-bold">{income}</span></div><div className="text-xs"><span className="text-gray-500">支</span> <span className="text-red-600 font-bold">{expense}</span></div><button onClick={onAddTx} className="text-xs bg-gray-800 text-white px-2 py-0.5 rounded flex items-center gap-1"><Plus size={10}/> 記帳</button></div><div className="flex-1 overflow-y-auto space-y-2 pr-1">{transactions.map(t => (<div key={t.id} className="flex justify-between text-xs border-b border-gray-50 pb-1 last:border-0"><span className="truncate w-2/3">{t.desc}</span><span className={t.type==='收入'?'text-emerald-600':'text-red-600'}>{t.amount}</span></div>))}</div></div>
}
const WidgetProjectRecords = ({ records, size, onAddRecord }) => {
  if (size === 'S') return <div className="h-full flex flex-col justify-center items-center gap-2"><div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center cursor-pointer" onClick={onAddRecord}><Edit2 size={16}/></div><span className="text-xs text-gray-500">新增紀錄</span></div>;
  return <div className="flex flex-col h-full"><div className="flex justify-between mb-2 items-center"><h4 className="text-xs font-bold text-gray-600">工程/會議紀錄</h4><button onClick={onAddRecord} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Plus size={14}/></button></div><div className="flex-1 overflow-y-auto space-y-3 pr-1">{records.map(r => (<div key={r.id} className="bg-gray-50 p-2 rounded-lg border border-gray-100"><div className="flex justify-between text-[10px] text-gray-400 mb-1"><span>{r.date} · {r.type}</span><span>{r.author}</span></div><div className="text-xs text-gray-800 mb-2">{r.content}</div>{r.photos && r.photos.length > 0 && (<div className="flex gap-2 overflow-x-auto pb-1">{r.photos.map((p, idx) => (<div key={idx} className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center shrink-0"><ImageIcon size={14} className="text-gray-400"/></div>))}</div>)}</div>))}</div></div>
}
const WidgetProjectFiles = ({ files, size, onUpload }) => {
  if (size === 'S') return <div className="h-full flex flex-col justify-center items-center gap-2"><div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center cursor-pointer" onClick={onUpload}><Upload size={16}/></div><span className="text-xs text-gray-500">上傳檔案</span></div>;
  return <div className="flex flex-col h-full"><div className="flex justify-between mb-2 items-center"><h4 className="text-xs font-bold text-gray-600">雲端檔案 (Drive)</h4><button onClick={onUpload} className="text-orange-600 hover:bg-orange-50 p-1 rounded"><Upload size={14}/></button></div><div className="flex-1 overflow-y-auto space-y-2 pr-1">{files.map(f => (<div key={f.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 cursor-pointer"><FileText size={16} className="text-gray-400" /><div className="min-w-0 flex-1"><div className="text-xs font-medium text-gray-700 truncate">{f.name}</div><div className="text-[10px] text-gray-400">{f.date} · {f.size}</div></div></div>))}</div></div>
}

// --- PROJECT DETAIL PAGE ---
const ProjectDetail = ({ project, transactions, onBack, onUpdateProject, addToast, accounts, onAddGlobalTx }) => {
  const [widgets, setWidgets] = useState([
    { id: 'wp-info', type: 'info', title: '專案資訊', size: 'S' },
    { id: 'wp-finance', type: 'finance', title: '收支概況', size: 'M' },
    { id: 'wp-records', type: 'records', title: '工程紀錄', size: 'L' },
    { id: 'wp-files', type: 'files', title: '檔案中心', size: 'M' },
    { id: 'wp-schedule', type: 'schedule', title: '專案時程', size: 'M' },
  ]);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({ type: '工程', content: '', photos: [] });
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [newTx, setNewTx] = useState({ type: "支出", amount: "", date: "", desc: "", accountId: "" });

  const dragItem = useRef(null); const dragOverItem = useRef(null);
  const handleDragStart = (e, idx) => { dragItem.current = idx; };
  const handleDragEnter = (e, idx) => { dragOverItem.current = idx; const copy = [...widgets]; const dragContent = copy[dragItem.current]; copy.splice(dragItem.current, 1); copy.splice(dragOverItem.current, 0, dragContent); dragItem.current = idx; setWidgets(copy); };
  const handleDragEnd = () => { dragItem.current = null; dragOverItem.current = null; };
  const handleResize = (id, size) => setWidgets(prev => prev.map(w => w.id === id ? {...w, size} : w));

  const handleAddRecord = async () => {
    const record = { id: `r-${Date.now()}`, date: new Date().toISOString().split('T')[0], author: 'Alex', ...newRecord };
    const updatedProject = { ...project, records: [record, ...(project.records || [])] };
    onUpdateProject(updatedProject);
    addToast("紀錄已新增，並同步至 Google Drive", 'success');
    setIsRecordModalOpen(false);
    setNewRecord({ type: '工程', content: '', photos: [] });
  };

  const handleUploadFile = async () => {
    await GoogleService.uploadToDrive({ name: "現場照片.jpg" }, project.name);
    const newFile = { id: `f-${Date.now()}`, name: "新上傳檔案.jpg", type: "jpg", size: "2MB", date: new Date().toISOString().split('T')[0], url: "#" };
    const updatedProject = { ...project, files: [newFile, ...(project.files || [])] };
    onUpdateProject(updatedProject);
    addToast("檔案上傳成功", 'success');
    setIsUploadModalOpen(false);
  };

  const handleAddTx = () => {
    onAddGlobalTx({ ...newTx, projectId: project.id, desc: `[${project.name}] ${newTx.desc}` });
    setIsTxModalOpen(false);
    setNewTx({ type: "支出", amount: "", date: "", desc: "", accountId: "" });
  };

  const renderWidget = (w) => {
    switch(w.type) {
      case 'info': return <WidgetProjectInfo project={project} size={w.size} />;
      case 'finance': return <WidgetProjectFinance transactions={transactions} size={w.size} onAddTx={() => setIsTxModalOpen(true)} />;
      case 'records': return <WidgetProjectRecords records={project.records || []} size={w.size} onAddRecord={() => setIsRecordModalOpen(true)} />;
      case 'files': return <WidgetProjectFiles files={project.files || []} size={w.size} onUpload={() => setIsUploadModalOpen(true)} />;
      case 'schedule': return (
         <div className="h-full overflow-y-auto space-y-2">
            {project.milestones?.map((m, i) => (
               <div key={i} className="flex justify-between items-center text-sm border-l-2 border-blue-500 pl-2">
                  <span>{m.name}</span><span className="text-gray-500 text-xs">{m.date}</span>
               </div>
            ))}
         </div>
      );
      default: return null;
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
          <div><h2 className="text-2xl font-bold text-gray-900">{project.name}</h2><p className="text-sm text-gray-500">{project.code} · {project.status}</p></div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-auto">
          {widgets.map((w, i) => (
            <WidgetWrapper key={w.id} widget={w} onResize={handleResize} onDragStart={(e) => handleDragStart(e, i)} onDragEnter={(e) => handleDragEnter(e, i)} onDragEnd={handleDragEnd}>
              {renderWidget(w)}
            </WidgetWrapper>
          ))}
       </div>
       {/* Modals for Project Detail */}
       <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} title="新增工程/會議紀錄" onConfirm={handleAddRecord}>
          <div className="flex gap-4 mb-4">
             {['工程', '會議', '驗收'].map(t => (<button key={t} onClick={() => setNewRecord({...newRecord, type: t})} className={`px-4 py-2 rounded-lg border text-sm ${newRecord.type === t ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-600'}`}>{t}</button>))}
          </div>
          <InputField label="內容描述" type="textarea" value={newRecord.content} onChange={e => setNewRecord({...newRecord, content: e.target.value})} placeholder="請輸入紀錄內容..." />
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors"><ImageIcon size={24} className="mb-2" /><span className="text-xs">點擊上傳照片 (模擬)</span></div>
       </Modal>
       <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="上傳檔案至 Google Drive" onConfirm={handleUploadFile}>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors"><Cloud size={32} className="mb-2 text-blue-400" /><span className="text-sm font-medium text-gray-600">拖曳檔案至此或點擊上傳</span><span className="text-xs mt-1">將儲存至 Drive/Projects/{project.name}/Files</span></div>
       </Modal>
       <Modal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} title="專案記帳" onConfirm={handleAddTx}>
         <div className="flex gap-4 mb-4">
            <button onClick={() => setNewTx({...newTx, type: '收入'})} className={`flex-1 py-2 rounded-lg border ${newTx.type === '收入' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-200'}`}>收入</button>
            <button onClick={() => setNewTx({...newTx, type: '支出'})} className={`flex-1 py-2 rounded-lg border ${newTx.type === '支出' ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-200'}`}>支出</button>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <InputField label="金額" type="number" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} />
            <InputField label="日期" type="date" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} />
         </div>
         <InputField label="摘要" value={newTx.desc} onChange={e => setNewTx({...newTx, desc: e.target.value})} placeholder="例：油漆補料" />
         <InputField label="帳戶" type="select" value={newTx.accountId} onChange={e => setNewTx({...newTx, accountId: e.target.value})} options={accounts.map(a => a.name)} />
      </Modal>
    </div>
  )
}

// 1. Schedule Page
const Schedule = ({ data, loading, addToast }) => {
  const [currentDate, setCurrentDate] = useState(new Date("2025-12-07"));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "10:00", type: "meeting", relatedId: "" });

  const getDaysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array(firstDay).fill(null).concat([...Array(daysInMonth).keys()].map(i => i + 1));

  const handleAddEvent = async () => {
    await GoogleService.addToCalendar(newEvent);
    addToast(`已新增行程：${newEvent.title}`, 'success');
    setIsAddModalOpen(false);
  };

  const getEventColor = (type) => ({ construction: 'bg-orange-100 text-orange-800', meeting: 'bg-blue-100 text-blue-800', finance: 'bg-green-100 text-green-800', inventory: 'bg-purple-100 text-purple-800' }[type] || 'bg-gray-100');

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">行程管理</h2>
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={20}/></button>
            <span className="px-4 font-bold text-gray-700 w-32 text-center">{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</span>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={20}/></button>
          </div>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors"><Plus size={16} /> 新增行程</button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className="py-3 text-center text-sm font-bold text-gray-500">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {days.map((day, idx) => {
            const dateStr = day ? `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : '';
            const events = data.filter(e => e.date === dateStr);
            return (
              <div key={idx} className={`border-b border-r border-gray-100 p-2 min-h-[100px] ${!day ? 'bg-gray-50/30' : 'hover:bg-gray-50 transition-colors'}`}>
                {day && (
                  <>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm mb-1 ${events.length > 0 ? 'bg-gray-900 text-white font-bold' : 'text-gray-500'}`}>{day}</div>
                    <div className="space-y-1">
                      {events.map(evt => (
                        <div key={evt.id} className={`text-[10px] px-1.5 py-1 rounded border truncate cursor-pointer ${getEventColor(evt.type)}`}>
                          {evt.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="新增行程" onConfirm={handleAddEvent}>
        <InputField label="標題" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="例：林公館開工拜拜" />
        <div className="grid grid-cols-2 gap-4">
          <InputField label="日期" type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
          <InputField label="時間" type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
        </div>
        <InputField label="類型" type="select" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})} options={['construction', 'meeting', 'finance', 'inventory']} />
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
           <p className="flex items-center gap-1"><LinkIcon size={12}/> 系統連動說明：</p>
           <ul className="list-disc pl-4 mt-1 space-y-1">
             <li>選擇 <b>construction</b> 將同步至專案里程碑。</li>
             <li>選擇 <b>finance</b> 將同步至財務預收/預付提醒。</li>
             <li>選擇 <b>inventory</b> 將同步至庫存進貨提醒。</li>
           </ul>
        </div>
      </Modal>
    </div>
  );
};

// 2. Projects Page (List View)
const Projects = ({ data, loading, addToast, onSelectProject, onAddGlobalTx, accounts }) => {
  const [widgets, setWidgets] = useState([{ id: 'wp-stats', type: 'project-stats', title: '專案概況', size: 'S' }, { id: 'wp-list', type: 'project-list', title: '專案列表', size: 'L' }]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); const [newProject, setNewProject] = useState({ name: "", client: "", type: "翻修", budget: "" });
  const dragItem = useRef(null); const dragOverItem = useRef(null); const handleDragStart = (e, idx) => { dragItem.current = idx; }; const handleDragEnter = (e, idx) => { dragOverItem.current = idx; const copy = [...widgets]; const dragContent = copy[dragItem.current]; copy.splice(dragItem.current, 1); copy.splice(dragOverItem.current, 0, dragContent); dragItem.current = idx; setWidgets(copy); }; const handleDragEnd = () => { dragItem.current = null; dragOverItem.current = null; }; const handleResize = (id, size) => setWidgets(prev => prev.map(w => w.id === id ? {...w, size} : w));
  const handleAddProject = async () => { addToast(`專案 ${newProject.name} 建立成功！`, 'success'); setIsAddModalOpen(false); };
  const renderWidget = (w) => { switch(w.type) { case 'project-stats': return <WidgetProjectStats data={data} size={w.size} />; case 'project-list': return <WidgetProjectList data={data} size={w.size} onSelectProject={onSelectProject} onAdd={() => setIsAddModalOpen(true)} />; default: return null; } }
  return ( <div className="space-y-6 animate-fade-in"> <SectionTitle title="專案管理" action={<button onClick={() => setIsAddModalOpen(true)} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors"><Plus size={16}/> 新增專案</button>} /> {loading ? <LoadingSkeleton /> : ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-auto"> {widgets.map((w, i) => ( <WidgetWrapper key={w.id} widget={w} onResize={handleResize} onDragStart={(e) => handleDragStart(e, i)} onDragEnter={(e) => handleDragEnter(e, i)} onDragEnd={handleDragEnd}> {renderWidget(w)} </WidgetWrapper> ))} </div> )} <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="新增專案" onConfirm={handleAddProject}> <InputField label="專案名稱" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="例：信義林公館" /> <InputField label="業主" value={newProject.client} onChange={e => setNewProject({...newProject, client: e.target.value})} placeholder="選擇客戶" /> <div className="grid grid-cols-2 gap-4"> <InputField label="類型" type="select" value={newProject.type} onChange={e => setNewProject({...newProject, type: e.target.value})} options={['翻修', '新建', '商空']} /> <InputField label="預算 (萬)" type="number" value={newProject.budget} onChange={e => setNewProject({...newProject, budget: e.target.value})} /> </div> </Modal> </div> );
};

// 3. Clients Page
const Clients = ({ data, loading, addToast, onUpdateClients }) => {
  const [widgets, setWidgets] = useState([ { id: 'wc-stats', type: 'client-stats', title: '客戶概況', size: 'S' }, { id: 'wc-list', type: 'client-list', title: '客戶名單', size: 'L' } ]);
  const [activeClient, setActiveClient] = useState(null); const [isEditing, setIsEditing] = useState(false); const [editFormData, setEditFormData] = useState(null); const [isAddModalOpen, setIsAddModalOpen] = useState(false); const [newClientData, setNewClientData] = useState({ name: "", phone: "", email: "", address: "", status: "洽談中", customFields: [] });
  const dragItem = useRef(null); const dragOverItem = useRef(null); const handleDragStart = (e, idx) => { dragItem.current = idx; }; const handleDragEnter = (e, idx) => { dragOverItem.current = idx; const copy = [...widgets]; const dragContent = copy[dragItem.current]; copy.splice(dragItem.current, 1); copy.splice(dragOverItem.current, 0, dragContent); dragItem.current = idx; setWidgets(copy); }; const handleDragEnd = () => { dragItem.current = null; dragOverItem.current = null; }; const handleResize = (id, size) => setWidgets(prev => prev.map(w => w.id === id ? {...w, size} : w));
  const handleOpenAdd = () => { setNewClientData({ name: "", phone: "", email: "", address: "", status: "洽談中", customFields: [{ label: "備註", value: "" }] }); setIsAddModalOpen(true); };
  const handleSaveNewClient = async () => { if(!newClientData.name) return addToast("請輸入姓名", "error"); const driveFolder = await GoogleService.createDriveFolder(newClientData.name); const client = { ...newClientData, id: `c-${Date.now()}`, driveFolder }; const updatedList = [...data, client]; onUpdateClients(updatedList); await GoogleService.syncToSheet('clients', updatedList); addToast("客戶新增成功！已自動建立雲端資料夾", "success"); setIsAddModalOpen(false); };
  const handleDeleteClient = async (id) => { if(!window.confirm("確定要刪除此客戶嗎？")) return; const updatedList = data.filter(c => c.id !== id); onUpdateClients(updatedList); await GoogleService.syncToSheet('clients', updatedList); addToast("客戶已刪除", "success"); if(activeClient?.id === id) setActiveClient(null); };
  const startEdit = () => { setEditFormData({ ...activeClient }); setIsEditing(true); };
  const handleSaveEdit = async () => { const updatedList = data.map(c => c.id === editFormData.id ? editFormData : c); onUpdateClients(updatedList); await GoogleService.syncToSheet('clients', updatedList); setActiveClient(editFormData); setIsEditing(false); addToast("資料已更新", "success"); };
  const renderWidget = (w) => { switch(w.type) { case 'client-stats': return <WidgetClientStats data={data} size={w.size} />; case 'client-list': return <WidgetClientList data={data} size={w.size} onSelectClient={setActiveClient} onAddClient={handleOpenAdd} onDeleteClient={handleDeleteClient} />; default: return <div>Unknown</div>; } };

  if (activeClient) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button onClick={() => { setActiveClient(null); setIsEditing(false); }} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4"><ChevronLeft size={16}/> 返回列表</button>
        <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-4"><div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">{activeClient.name[0]}</div><div>{isEditing ? (<input value={editFormData.name} onChange={e=>setEditFormData({...editFormData, name: e.target.value})} className="text-2xl font-bold text-gray-900 border-b border-gray-300 focus:outline-none mb-1" />) : (<h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">{activeClient.name} <Badge color={activeClient.status === '已簽約' ? 'green' : 'blue'}>{activeClient.status}</Badge></h2>)}<div className="text-gray-500 text-sm flex items-center gap-3 mt-1">{isEditing ? (<div className="flex gap-2"><input placeholder="電話" value={editFormData.phone} onChange={e=>setEditFormData({...editFormData, phone: e.target.value})} className="border rounded px-2 py-1" /><input placeholder="Email" value={editFormData.email} onChange={e=>setEditFormData({...editFormData, email: e.target.value})} className="border rounded px-2 py-1" /></div>) : (<><span className="flex items-center gap-1"><Phone size={12}/> {activeClient.phone}</span><span className="flex items-center gap-1"><Mail size={12}/> {activeClient.email}</span></>)}</div></div></div>
           <div className="flex gap-2">{isEditing ? (<><button onClick={() => setIsEditing(false)} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-600">取消</button><button onClick={handleSaveEdit} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700"><Save size={14}/> 儲存</button></>) : (<><a href={activeClient.driveFolder} target="_blank" rel="noreferrer" className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-100 border border-blue-100"><Folder size={16} /> 開啟雲端資料夾</a><button onClick={startEdit} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"><Edit2 size={14}/> 編輯資料</button><button onClick={() => handleDeleteClient(activeClient.id)} className="bg-white border border-red-200 text-red-500 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50 flex items-center gap-2"><Trash2 size={14}/> 刪除</button></>)}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Card className="md:col-span-2"><h3 className="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">基本資料 & 需求</h3>{isEditing ? (<><div className="mb-4"><label className="block text-sm text-gray-500 mb-1">地址</label><input value={editFormData.address} onChange={e=>setEditFormData({...editFormData, address: e.target.value})} className="w-full border rounded px-2 py-1" /></div><div className="mb-4"><label className="block text-sm text-gray-500 mb-1">狀態</label><select value={editFormData.status} onChange={e=>setEditFormData({...editFormData, status: e.target.value})} className="w-full border rounded px-2 py-1 bg-white">{['洽談中', '提案/報價', '已簽約', '已完工'].map(s => <option key={s} value={s}>{s}</option>)}</select></div><DynamicFieldEditor fields={editFormData.customFields || []} onChange={(newFields) => setEditFormData({...editFormData, customFields: newFields})} /></>) : (<div className="grid grid-cols-2 gap-y-4 text-sm"><div className="col-span-2"><span className="text-gray-500 block mb-1">地址</span> {activeClient.address}</div>{activeClient.customFields?.map((field, idx) => (<div key={idx} className={field.value.length > 20 ? "col-span-2" : "col-span-1"}><span className="text-gray-500 block mb-1">{field.label}</span><span className="text-gray-900">{field.value}</span></div>))}</div>)}</Card><div className="space-y-6"><Card><h3 className="font-bold text-gray-800 mb-4">專案歷史</h3><div className="text-sm text-gray-500 text-center py-4">尚無關聯專案</div></Card><Card><h3 className="font-bold text-gray-800 mb-4">聯絡紀錄</h3><div className="text-sm space-y-3"><div className="flex gap-3"><div className="w-1 bg-gray-200 rounded-full"></div><div><p className="font-bold text-gray-800">最後聯絡</p><p className="text-xs text-gray-400">{activeClient.lastContact} (系統紀錄)</p></div></div></div></Card></div></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle title="客戶管理" />
      {loading ? <LoadingSkeleton /> : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-auto">{widgets.map((w, i) => (<WidgetWrapper key={w.id} widget={w} onResize={handleResize} onDragStart={(e) => handleDragStart(e, i)} onDragEnter={(e) => handleDragEnter(e, i)} onDragEnd={handleDragEnd}>{renderWidget(w)}</WidgetWrapper>))}</div>)}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="新增客戶" onConfirm={handleSaveNewClient}>
         <InputField label="姓名" value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} />
         <div className="grid grid-cols-2 gap-4"><InputField label="電話" value={newClientData.phone} onChange={e => setNewClientData({...newClientData, phone: e.target.value})} /><InputField label="Email" value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} /></div>
         <InputField label="地址" value={newClientData.address} onChange={e => setNewClientData({...newClientData, address: e.target.value})} />
         <div className="border-t border-gray-100 pt-4 mt-4"><h4 className="text-sm font-bold text-gray-700 mb-3">詳細資訊 (可自訂欄位)</h4><DynamicFieldEditor fields={newClientData.customFields} onChange={(newFields) => setNewClientData({...newClientData, customFields: newFields})} /></div>
         <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg flex items-center gap-2"><Cloud size={14} /> 系統將自動於 Google Drive 建立專屬資料夾</div>
      </Modal>
    </div>
  );
};

// 4. Vendors Page
const Vendors = ({ data, loading, addToast }) => {
  const [widgets, setWidgets] = useState([{ id: 'wv-stats', type: 'vendor-stats', title: '廠商概況', size: 'S' }, { id: 'wv-list', type: 'vendor-list', title: '廠商名單', size: 'L' }]);
  const [vendorsList, setVendorsList] = useState(data); const [isModalOpen, setIsModalOpen] = useState(false); const [currentVendor, setCurrentVendor] = useState(null);
  useEffect(() => { setVendorsList(data); }, [data]);
  const handleOpenAdd = () => { setCurrentVendor({ name: "", category: "工程工班", tradeType: "", contactPerson: "", phone: "", address: "", rating: "5.0", status: "合作中", tags: "" }); setIsModalOpen(true); };
  const handleOpenEdit = (vendor) => { setCurrentVendor({ ...vendor, tags: vendor.tags ? vendor.tags.join(', ') : "" }); setIsModalOpen(true); };
  const handleSaveVendor = async () => { if (!currentVendor.name) return addToast("請輸入廠商名稱", 'error'); const tagsArray = currentVendor.tags.split(',').map(t => t.trim()).filter(t => t !== ""); const vendorToSave = { ...currentVendor, tags: tagsArray, id: currentVendor.id || `v-${Date.now()}` }; const newVendorsList = currentVendor.id ? vendorsList.map(v => v.id === vendorToSave.id ? vendorToSave : v) : [...vendorsList, vendorToSave]; setVendorsList(newVendorsList); await GoogleService.syncToSheet('vendors', newVendorsList); addToast(currentVendor.id ? "廠商資料已更新！" : "新廠商已建立！", 'success'); setIsModalOpen(false); };
  const handleResize = (id, size) => setWidgets(prev => prev.map(w => w.id === id ? {...w, size} : w));
  const renderWidget = (w) => { switch(w.type) { case 'vendor-stats': return <WidgetVendorStats data={vendorsList} size={w.size} />; case 'vendor-list': return <WidgetVendorList data={vendorsList} size={w.size} onAdd={handleOpenAdd} onEdit={handleOpenEdit} />; default: return <div>Unknown</div>; } };
  return ( <div className="space-y-6 animate-fade-in"> <SectionTitle title="廠商管理" /> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-auto"> {widgets.map((w, i) => <WidgetWrapper key={w.id} widget={w} onResize={handleResize}>{renderWidget(w)}</WidgetWrapper>)} </div> <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentVendor?.id ? "編輯廠商資料" : "新增廠商"} onConfirm={handleSaveVendor}> {currentVendor && ( <> <InputField label="廠商名稱" value={currentVendor.name} onChange={e => setCurrentVendor({...currentVendor, name: e.target.value})} placeholder="例：大師兄木工" /> <div className="grid grid-cols-2 gap-4"> <InputField label="類別" type="select" value={currentVendor.category} onChange={e => setCurrentVendor({...currentVendor, category: e.target.value})} options={['工程工班', '建材供應', '其他']} /> <InputField label="工種/項目" value={currentVendor.tradeType} onChange={e => setCurrentVendor({...currentVendor, tradeType: e.target.value})} placeholder="例：木工、水電" /> </div> <div className="grid grid-cols-2 gap-4"> <InputField label="聯絡人" value={currentVendor.contactPerson} onChange={e => setCurrentVendor({...currentVendor, contactPerson: e.target.value})} /> <InputField label="電話" value={currentVendor.phone} onChange={e => setCurrentVendor({...currentVendor, phone: e.target.value})} /> </div> <InputField label="地址" value={currentVendor.address} onChange={e => setCurrentVendor({...currentVendor, address: e.target.value})} /> <div className="grid grid-cols-2 gap-4"> <InputField label="評分 (1-5)" type="number" value={currentVendor.rating} onChange={e => setCurrentVendor({...currentVendor, rating: e.target.value})} /> <InputField label="合作狀態" type="select" value={currentVendor.status} onChange={e => setCurrentVendor({...currentVendor, status: e.target.value})} options={['長期合作', '合作中', '觀察中', '黑名單']} /> </div> <InputField label="標籤 (以逗號分隔)" value={currentVendor.tags} onChange={e => setCurrentVendor({...currentVendor, tags: e.target.value})} placeholder="例：配合度高, 手工細緻" /> </> )} </Modal> </div> );
};

// 5. Finance Page
const Finance = ({ data, loading, addToast }) => {
  // Fix: Safe access to data properties
  const [accounts, setAccounts] = useState(data?.accounts || []);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false); const [isAccModalOpen, setIsAccModalOpen] = useState(false); const [editingAcc, setEditingAcc] = useState(null); const [newTx, setNewTx] = useState({ type: "支出", amount: "", date: "", desc: "", accountId: "" }); const [newAcc, setNewAcc] = useState({ name: "", bank: "", number: "", balance: 0 }); const [widgets, setWidgets] = useState([ { id: 'wf-acc', type: 'finance-acc', title: '資金帳戶', size: 'L' }, { id: 'wf-trend', type: 'finance-trend', title: '收支趨勢', size: 'M' }, { id: 'wf-tx', type: 'finance-tx', title: '收支明細', size: 'L' } ]);
  const dragItem = useRef(null); const dragOverItem = useRef(null); const handleDragStartAccount = (e, idx) => { dragItem.current = idx; }; const handleDragOverAccount = (e, idx) => { e.preventDefault(); dragOverItem.current = idx; const copy = [...accounts]; const item = copy[dragItem.current]; copy.splice(dragItem.current, 1); copy.splice(dragOverItem.current, 0, item); dragItem.current = idx; setAccounts(copy); }; const handleDragEndAccount = () => { dragItem.current = null; dragOverItem.current = null; GoogleService.syncToSheet('accounts', accounts); }; const handleDragStart = (e, idx) => { dragItem.current = idx; }; const handleDragEnter = (e, idx) => { dragOverItem.current = idx; const copy = [...widgets]; const dragContent = copy[dragItem.current]; copy.splice(dragItem.current, 1); copy.splice(dragOverItem.current, 0, dragContent); dragItem.current = idx; setWidgets(copy); }; const handleDragEnd = () => { dragItem.current = null; dragOverItem.current = null; };
  const handleAddTransaction = async () => { await GoogleService.syncToSheet('transactions', newTx); addToast("記帳成功！", 'success'); setIsTxModalOpen(false); };
  const handleSaveAccount = async () => { const updatedAccounts = editingAcc ? accounts.map(a => a.id === editingAcc.id ? { ...editingAcc, ...newAcc } : a) : [...accounts, { ...newAcc, id: `a-${Date.now()}` }]; setAccounts(updatedAccounts); await GoogleService.syncToSheet('accounts', updatedAccounts); addToast(editingAcc ? "帳戶更新成功！" : "新帳戶建立成功！", 'success'); setIsAccModalOpen(false); setEditingAcc(null); };
  const openAddAcc = () => { setEditingAcc(null); setNewAcc({ name: "", bank: "", number: "", balance: 0 }); setIsAccModalOpen(true); }; const openEditAcc = (acc) => { setEditingAcc(acc); setNewAcc(acc); setIsAccModalOpen(true); }; const handleResize = (id, size) => setWidgets(prev => prev.map(w => w.id === id ? {...w, size} : w));
  
  const renderWidget = (w) => { switch (w.type) { case 'finance-acc': return ( <div className="h-full flex flex-col"> <div className="flex justify-end mb-2"><button onClick={openAddAcc} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Plus size={12}/> 新增帳戶</button></div> <WidgetFinanceAccounts data={accounts} size={w.size} onEdit={openEditAcc} onDragStartAccount={handleDragStartAccount} onDragOverAccount={handleDragOverAccount} onDragEndAccount={handleDragEndAccount} /> </div> ); case 'finance-trend': return <WidgetFinanceTrend size={w.size} />; case 'finance-tx': return <WidgetFinanceTransactions data={data?.transactions || []} size={w.size} onAddTx={() => setIsTxModalOpen(true)} />; default: return null; } }
  return ( <div className="space-y-6 animate-fade-in"> <SectionTitle title="財務管理" /> <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> {widgets.map((w, i) => ( <WidgetWrapper key={w.id} widget={w} onResize={handleResize} onDragStart={(e) => handleDragStart(e, i)} onDragEnter={(e) => handleDragEnter(e, i)} onDragEnd={handleDragEnd}>{renderWidget(w)}</WidgetWrapper> ))} </div> <Modal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} title="記一筆" onConfirm={handleAddTransaction}> <div className="flex gap-4 mb-4"> <button onClick={() => setNewTx({...newTx, type: '收入'})} className={`flex-1 py-2 rounded-lg border ${newTx.type === '收入' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-200'}`}>收入</button> <button onClick={() => setNewTx({...newTx, type: '支出'})} className={`flex-1 py-2 rounded-lg border ${newTx.type === '支出' ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-200'}`}>支出</button> </div> <div className="grid grid-cols-2 gap-4"> <InputField label="金額" type="number" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} /> <InputField label="日期" type="date" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} /> </div> <InputField label="摘要" value={newTx.desc} onChange={e => setNewTx({...newTx, desc: e.target.value})} placeholder="例：油漆補料" /> <InputField label="帳戶" type="select" value={newTx.accountId} onChange={e => setNewTx({...newTx, accountId: e.target.value})} options={accounts.map(a => a.name)} /> </Modal> <Modal isOpen={isAccModalOpen} onClose={() => setIsAccModalOpen(false)} title={editingAcc ? "編輯帳戶" : "新增帳戶"} onConfirm={handleSaveAccount}> <InputField label="帳戶名稱" value={newAcc.name} onChange={e => setNewAcc({...newAcc, name: e.target.value})} placeholder="例：公司零用金" /> <div className="grid grid-cols-2 gap-4"> <InputField label="銀行/機構" value={newAcc.bank} onChange={e => setNewAcc({...newAcc, bank: e.target.value})} /> <InputField label="帳號 (選填)" value={newAcc.number} onChange={e => setNewAcc({...newAcc, number: e.target.value})} /> </div> <InputField label="初始餘額" type="number" value={newAcc.balance} onChange={e => setNewAcc({...newAcc, balance: Number(e.target.value)})} /> </Modal> </div> );
};

// 6. Inventory Page
const Inventory = ({ data, loading, addToast }) => {
  const [items, setItems] = useState(data); const [widgets, setWidgets] = useState([{ id: 'wi-stats', type: 'inventory-stats', title: '庫存概況', size: 'S' }, { id: 'wi-list', type: 'inventory-list', title: '庫存清單', size: 'L' }]); const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' }); const [isAddModalOpen, setIsAddModalOpen] = useState(false); const [newItem, setNewItem] = useState({ name: "", spec: "", quantity: 0, unit: "個", status: "充足" });
  const dragItem = useRef(null); const dragOverItem = useRef(null); const handleDragStart = (e, idx) => { dragItem.current = idx; }; const handleDragEnter = (e, idx) => { dragOverItem.current = idx; const copy = [...widgets]; const dragContent = copy[dragItem.current]; copy.splice(dragItem.current, 1); copy.splice(dragOverItem.current, 0, dragContent); dragItem.current = idx; setWidgets(copy); }; const handleDragEnd = () => { dragItem.current = null; dragOverItem.current = null; }; const handleResize = (id, size) => setWidgets(prev => prev.map(w => w.id === id ? {...w, size} : w));
  const handleSort = (key) => { let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }); const sorted = [...items].sort((a, b) => { if (a[key] < b[key]) return direction === 'asc' ? -1 : 1; if (a[key] > b[key]) return direction === 'asc' ? 1 : -1; return 0; }); setItems(sorted); };
  const handleAddItem = async () => { const itemToAdd = { ...newItem, id: `i-${Date.now()}` }; const newItems = [...items, itemToAdd]; setItems(newItems); await GoogleService.syncToSheet('inventory', newItems); addToast("品項新增成功！(已同步至 Google Sheet)", 'success'); setIsAddModalOpen(false); };
  const renderWidget = (w) => { switch(w.type) { case 'inventory-stats': return <WidgetInventoryStats data={items} size={w.size} />; case 'inventory-list': return <WidgetInventoryList data={items} size={w.size} onAdd={() => setIsAddModalOpen(true)} onSort={handleSort} />; default: return <div>Unknown</div>; } }
  return ( <div className="space-y-6 animate-fade-in"> <SectionTitle title="庫存管理" /> {loading ? <LoadingSkeleton /> : ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-auto"> {widgets.map((w, i) => ( <WidgetWrapper key={w.id} widget={w} onResize={handleResize} onDragStart={(e) => handleDragStart(e, i)} onDragEnter={(e) => handleDragEnter(e, i)} onDragEnd={handleDragEnd}> {renderWidget(w)} </WidgetWrapper> ))} </div> )} <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="新增庫存品項" onConfirm={handleAddItem}> <InputField label="品項名稱" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} /> <InputField label="規格/型號" value={newItem.spec} onChange={e => setNewItem({...newItem, spec: e.target.value})} /> <div className="grid grid-cols-2 gap-4"> <InputField label="數量" type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} /> <InputField label="單位" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} /> </div> <div className="grid grid-cols-2 gap-4"> <InputField label="存放位置" value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})} /> <InputField label="安全庫存量" type="number" value={newItem.safeStock} onChange={e => setNewItem({...newItem, safeStock: e.target.value})} /> </div> </Modal> </div> );
};

// --- MAIN APP ---
const App = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(EMPTY_DB);
  const [toasts, setToasts] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [user, setUser] = useState(null); // Real User State
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // Initialize Google API on Load (Redirect + PKCE)
useEffect(() => {
  let cancelled = false;

  const toRowObjects = (values) => {
    if (!Array.isArray(values) || values.length === 0) return [];
    const [header, ...rows] = values;
    if (!Array.isArray(header)) return [];
    return rows
      .filter(r => Array.isArray(r) && r.some(v => String(v ?? "").trim() !== ""))
      .map((r) => {
        const obj = {};
        header.forEach((h, i) => {
          const key = String(h ?? "").trim();
          if (!key) return;
          obj[key] = r[i] ?? "";
        });
        return obj;
      });
  };

  const safeGetValues = async (sheetName) => {
    const res = await GoogleService.fetchSheetData(sheetName);
    return res?.values || [];
  };

  const loadAllData = async () => {
    // Sheet names are assumed to match these tabs. Adjust if your Google Sheet uses different names.
    const [projectsV, clientsV, vendorsV, inventoryV, accountsV, transactionsV] = await Promise.all([
      safeGetValues("projects"),
      safeGetValues("clients"),
      safeGetValues("vendors"),
      safeGetValues("inventory"),
      safeGetValues("accounts"),
      safeGetValues("transactions"),
    ]);

    const calendarItems = await GoogleService.fetchCalendarEvents().catch(() => []);

    return {
      projects: toRowObjects(projectsV),
      clients: toRowObjects(clientsV),
      vendors: toRowObjects(vendorsV),
      inventory: toRowObjects(inventoryV),
      finance: {
        accounts: toRowObjects(accountsV),
        transactions: toRowObjects(transactionsV),
      },
      calendar: Array.isArray(calendarItems) ? calendarItems : [],
    };
  };

  const fetchUserInfo = async () => {
    const token = window.gapi?.client?.getToken?.()?.access_token;
    if (!token) return null;
    const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return {
      name: u?.name || u?.email || "Google User",
      email: u?.email || "",
      photo: u?.picture || "",
    };
  };

  (async () => {
    setLoading(true);
    try {
      const { signedIn } = await GoogleService.initClient();
      if (cancelled) return;

      if (signedIn) {
        const u = await fetchUserInfo();
        if (!cancelled) setUser(u);

        const realData = await loadAllData();
        if (!cancelled) setData({ ...EMPTY_DB, ...realData });

        addToast("登入成功，已載入 Google 雲端資料", "success");
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("[App] initClient error:", err);
      if (!cancelled) {
        setUser(null);
        setData(EMPTY_DB);
        addToast(err?.message || "初始化失敗", "error");
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();

  return () => {
    cancelled = true;
  };
}, []);


  const handleLogin = () => {
  // Redirect-based OAuth (no popup) to avoid browser policy issues
  setIsLoggingIn(true);
  try {
    GoogleService.loginRedirect();
  } catch (e) {
    console.error("[App] loginRedirect error:", e);
    addToast(e?.message || "登入啟動失敗", "error");
    setIsLoggingIn(false);
  }
};



  const handleLogout = async () => {
  await GoogleService.logout();
  setUser(null);
  setData(EMPTY_DB);
  setActiveProject(null);
  setActiveTab('schedule');
  addToast("已登出", 'info');
};


  const handleUpdateProject = (updatedProject) => {
    const newProjects = data.projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    setData({ ...data, projects: newProjects });
    setActiveProject(updatedProject);
  };

  const handleAddGlobalTx = (newTx) => {
    const tx = { ...newTx, id: `t-${Date.now()}` };
    const updatedTx = [tx, ...data.finance.transactions];
    setData({ ...data, finance: { ...data.finance, transactions: updatedTx } });
    addToast("記帳成功！(已同步至財務中心)", 'success');
  };

  const handleUpdateClients = (newClients) => {
    setData({ ...data, clients: newClients });
  };

  // Auth Guard
  if (!user && !loading) {
     // Show Login Screen
     return (
       <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center text-white text-2xl font-serif mx-auto mb-6 shadow-lg shadow-gray-200">森</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">森騰室內設計</h1>
            <p className="text-gray-500 mb-8">請登入 Google 帳戶以存取雲端資料庫</p>
            <button onClick={handleLogin} disabled={isLoggingIn} className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all relative overflow-hidden group">
              {isLoggingIn ? <RefreshCw className="animate-spin text-gray-400" /> : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  使用 Google 帳戶登入
                </>
              )}
            </button>
            <div className="mt-4 pt-4 border-t border-gray-100">
</div>
            {!CLIENT_ID && <p className="text-xs text-red-400 mt-2 bg-red-50 p-2 rounded flex items-center justify-center gap-1"><AlertCircle size={12}/> 未偵測到 Client ID</p>}
          </div>
       </div>
     )
  }

  const renderContent = () => {
    if (activeProject) {
       // Safe access for finance.transactions with fallback
       const transactions = data.finance?.transactions || [];
       const projectTx = transactions.filter(t => t.projectId === activeProject.id);
       const accounts = data.finance?.accounts || [];
       return ( <ProjectDetail project={activeProject} transactions={projectTx} accounts={accounts} onBack={() => setActiveProject(null)} onUpdateProject={handleUpdateProject} addToast={addToast} onAddGlobalTx={handleAddGlobalTx} /> );
    }

    switch(activeTab) {
      case 'schedule': return <Schedule data={data.calendar} loading={loading} addToast={addToast} />;
      // Safe access for projects
      case 'projects': return <Projects data={data?.projects || []} loading={loading} addToast={addToast} onSelectProject={setActiveProject} />;
      // Safe access for finance (Corrected path)
      case 'finance': return <Finance data={data?.finance || { accounts: [], transactions: [] }} loading={loading} addToast={addToast} />;
      // Safe access for clients
      case 'clients': return <Clients data={data?.clients || []} loading={loading} addToast={addToast} onUpdateClients={handleUpdateClients} />;
      case 'vendors': return <Vendors data={data?.vendors || []} loading={loading} addToast={addToast} />;
      case 'inventory': return <Inventory data={data?.inventory || []} loading={loading} addToast={addToast} />;
      default: return <Schedule data={data.calendar} loading={loading} addToast={addToast} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-8"><h1 className="text-xl font-bold flex items-center gap-2"><div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-serif">森</div>森騰室內設計</h1></div>
        <nav className="flex-1 px-4 space-y-2">
          {[{ id: 'schedule', icon: CalendarIcon, label: '行程管理' }, { id: 'projects', icon: Briefcase, label: '專案管理' }, { id: 'clients', icon: Users, label: '客戶管理' }, { id: 'finance', icon: Wallet, label: '財務管理' }, { id: 'vendors', icon: HardHat, label: '廠商管理' }, { id: 'inventory', icon: Package, label: '庫存管理' }].map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setActiveProject(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              <item.icon size={20} /> <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        {/* User Profile */}
        <div className="p-4 border-t border-gray-100">
           <div className="flex-1 overflow-auto p-8">
              <img src={user?.photo || "https://ui-avatars.com/api/?name=User"} alt="User" className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-bold text-gray-900 truncate">{user?.name || "Loading..."}</p>
                 <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500"><LogOut size={16}/></button>
           </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white/80 border-b border-gray-100 flex items-center justify-between px-8 backdrop-blur-md z-10">
           <h2 className="text-xl font-bold text-gray-800">{{schedule:'行程管理', projects:'專案管理', finance:'財務管理', clients:'客戶管理', vendors:'廠商管理', inventory:'庫存管理'}[activeTab]}</h2>
           <div className="flex items-center gap-4"><Bell size={20} className="text-gray-400"/><div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">{user?.name?.[0] || "A"}</div></div>
        </header>
         <div className="flex-1 overflow-auto p-8">
           {renderContent()}
           <HealthCheck />
         </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </main>
    </div>
  );
};

export default App;

