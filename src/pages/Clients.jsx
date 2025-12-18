
import React, { useState, useMemo } from 'react';
import { Modal } from '../components/common/Modal';
import { InputField, DynamicFieldEditor } from '../components/common/InputField';
import { LocationField } from '../components/common/LocationField';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { SectionTitle, LoadingSkeleton } from '../components/common/Indicators';
import {
    Phone, Mail, Folder, Edit2, Trash2, Cloud, ChevronLeft, Save, Plus,
    Search, Filter, User, UserCheck, UserX, Clock, MessageCircle,
    MapPin, Calendar, FileText, Star, X, ChevronRight, Briefcase
} from 'lucide-react';
import { GoogleService } from '../services/GoogleService';

// 狀態配置
const STATUS_CONFIG = {
    '洽談中': { color: 'blue', icon: Clock, bg: 'bg-blue-100 text-blue-700' },
    '提案/報價': { color: 'yellow', icon: FileText, bg: 'bg-yellow-100 text-yellow-700' },
    '已簽約': { color: 'green', icon: UserCheck, bg: 'bg-green-100 text-green-700' },
    '已完工': { color: 'gray', icon: Star, bg: 'bg-gray-100 text-gray-700' },
    '暫緩': { color: 'orange', icon: UserX, bg: 'bg-orange-100 text-orange-700' },
};

// 統計卡片
const StatCard = ({ icon: Icon, label, value, color = 'gray', onClick }) => (
    <button
        onClick={onClick}
        className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-all text-left w-full ${onClick ? 'cursor-pointer' : ''}`}
    >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color === 'blue' ? 'bg-blue-100 text-blue-600' :
            color === 'green' ? 'bg-green-100 text-green-600' :
                color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                    color === 'red' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
            }`}>
            <Icon size={20} />
        </div>
        <div>
            <div className="text-2xl font-bold text-gray-800">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
        </div>
    </button>
);

// 客戶列表項目
const ClientRow = ({ client, onSelect, onDelete }) => {
    const statusConfig = STATUS_CONFIG[client.status] || STATUS_CONFIG['洽談中'];

    return (
        <div
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group gap-2 sm:gap-0"
            onClick={() => onSelect(client)}
        >
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-base sm:text-lg font-bold text-gray-600 flex-shrink-0">
                    {client.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                        <span className="truncate">{client.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusConfig.bg}`}>
                            {client.status}
                        </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                        {client.phone && <span className="flex items-center gap-1"><Phone size={12} /> {client.phone}</span>}
                        {client.email && <span className="hidden sm:flex items-center gap-1"><Mail size={12} /> <span className="truncate max-w-[150px]">{client.email}</span></span>}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(client.id); }}
                    className="sm:opacity-0 sm:group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                    <Trash2 size={16} />
                </button>
                <ChevronRight size={20} className="text-gray-300" />
            </div>
        </div>
    );
};

// 聯絡記錄項目
const ContactLogItem = ({ log }) => (
    <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <MessageCircle size={14} className="text-blue-600" />
        </div>
        <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">{log.type}</div>
            <div className="text-xs text-gray-500 mt-0.5">{log.date} - {log.note}</div>
        </div>
    </div>
);

const Clients = ({ data = [], loading, addToast, onUpdateClients, allProjects = [] }) => {
    // 狀態管理
    const [activeClient, setActiveClient] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState(null);
    const [newClientData, setNewClientData] = useState({
        name: "", phone: "", email: "", lineId: "", address: "", status: "洽談中",
        customFields: [], contactLogs: [], source: "", budget: "", notes: ""
    });
    const [isSaving, setIsSaving] = useState(false);

    // 搜尋與篩選
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('全部');

    // 新增聯絡記錄 Modal
    const [isContactLogModalOpen, setIsContactLogModalOpen] = useState(false);
    const [newContactLog, setNewContactLog] = useState({ type: '電話聯繫', date: new Date().toISOString().split('T')[0], note: '' });

    // 計算統計
    const stats = useMemo(() => ({
        total: data.length,
        negotiating: data.filter(c => c.status === '洽談中').length,
        signed: data.filter(c => c.status === '已簽約').length,
        completed: data.filter(c => c.status === '已完工').length,
    }), [data]);

    // 篩選後的客戶列表
    const filteredClients = useMemo(() => {
        return data.filter(client => {
            const matchesSearch = searchTerm === '' ||
                client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.phone?.includes(searchTerm) ||
                client.email?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === '全部' || client.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [data, searchTerm, statusFilter]);

    // 操作函數
    const handleOpenAdd = () => {
        setNewClientData({
            name: "", phone: "", email: "", address: "", status: "洽談中",
            customFields: [{ label: "備註", value: "" }], contactLogs: [],
            source: "", budget: "", notes: ""
        });
        setIsAddModalOpen(true);
    };

    const handleSaveNewClient = async () => {
        if (!newClientData.name) return addToast("請輸入姓名", "error");

        setIsSaving(true);
        const driveResult = await GoogleService.createDriveFolder(newClientData.name);

        if (!driveResult.success) {
            setIsSaving(false);
            return addToast(`Drive 資料夾建立失敗: ${driveResult.error}`, "error");
        }

        const client = {
            ...newClientData,
            id: `c-${Date.now()}`,
            driveFolder: driveResult.url,
            createdAt: new Date().toISOString()
        };

        const updatedList = [...data, client];
        onUpdateClients(updatedList);

        const syncResult = await GoogleService.syncToSheet('clients', updatedList);
        setIsSaving(false);

        if (!syncResult.success) {
            addToast(`Sheets 同步失敗: ${syncResult.error}`, "error");
        } else {
            addToast("客戶新增成功！已同步到 Google Drive 和 Sheets", "success", {
                action: { label: '開啟 Drive 資料夾', onClick: () => window.open(driveResult.url, '_blank') }
            });
        }

        setIsAddModalOpen(false);
    };

    const handleDeleteClient = async (id) => {
        const updatedList = data.filter(c => c.id !== id);
        onUpdateClients(updatedList);
        await GoogleService.syncToSheet('clients', updatedList);
        addToast("客戶已刪除", "success");
        if (activeClient?.id === id) setActiveClient(null);
    };

    const startEdit = () => {
        setEditFormData({ ...activeClient });
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        setIsSaving(true);
        const updatedList = data.map(c => c.id === editFormData.id ? editFormData : c);
        onUpdateClients(updatedList);

        const syncResult = await GoogleService.syncToSheet('clients', updatedList);
        setIsSaving(false);

        if (!syncResult.success) {
            addToast(`Sheets 同步失敗: ${syncResult.error}`, "error");
        } else {
            setActiveClient(editFormData);
            setIsEditing(false);
            addToast("資料已更新", "success");
        }
    };

    // 新增聯絡記錄
    const handleAddContactLog = async () => {
        if (!newContactLog.note) return addToast("請輸入聯絡內容", "error");

        const updatedClient = {
            ...activeClient,
            contactLogs: [...(activeClient.contactLogs || []), { ...newContactLog, id: Date.now() }]
        };

        const updatedList = data.map(c => c.id === updatedClient.id ? updatedClient : c);
        onUpdateClients(updatedList);
        setActiveClient(updatedClient);

        await GoogleService.syncToSheet('clients', updatedList);
        setIsContactLogModalOpen(false);
        setNewContactLog({ type: '電話聯繫', date: new Date().toISOString().split('T')[0], note: '' });
        addToast("聯絡記錄已新增", "success");
    };

    // 客戶詳情頁
    if (activeClient) {
        const statusConfig = STATUS_CONFIG[activeClient.status] || STATUS_CONFIG['洽談中'];

        return (
            <div className="space-y-6 animate-fade-in">
                <button onClick={() => { setActiveClient(null); setIsEditing(false); }} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
                    <ChevronLeft size={16} /> 返回列表
                </button>

                {/* 客戶標題 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600">
                                {activeClient.name[0]}
                            </div>
                            <div>
                                {isEditing ? (
                                    <input value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} className="text-2xl font-bold text-gray-900 border-b border-gray-300 focus:outline-none bg-transparent" />
                                ) : (
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                                        {activeClient.name}
                                        <span className={`text-sm px-3 py-1 rounded-full ${statusConfig.bg}`}>
                                            {activeClient.status}
                                        </span>
                                    </h2>
                                )}
                                <div className="text-gray-500 text-sm flex flex-wrap items-center gap-3 mt-2">
                                    {isEditing ? (
                                        <div className="flex flex-wrap gap-2">
                                            <input placeholder="電話" value={editFormData.phone} onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })} className="border rounded px-2 py-1 text-sm" />
                                            <input placeholder="Email" value={editFormData.email} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} className="border rounded px-2 py-1 text-sm" />
                                        </div>
                                    ) : (
                                        <>
                                            {activeClient.phone && <span className="flex items-center gap-1"><Phone size={14} /> {activeClient.phone}</span>}
                                            {activeClient.email && <span className="flex items-center gap-1"><Mail size={14} /> {activeClient.email}</span>}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-600">取消</button>
                                    <button onClick={handleSaveEdit} disabled={isSaving} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-green-600 disabled:opacity-50">
                                        <Save size={14} /> {isSaving ? '儲存中...' : '儲存'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    {activeClient.driveFolder && (
                                        <a href={activeClient.driveFolder} target="_blank" rel="noreferrer" className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-100 border border-blue-100">
                                            <Folder size={16} /> 雲端資料夾
                                        </a>
                                    )}
                                    <button onClick={startEdit} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                                        <Edit2 size={14} /> 編輯
                                    </button>
                                    <button onClick={() => handleDeleteClient(activeClient.id)} className="bg-white border border-red-200 text-red-500 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50 flex items-center gap-2">
                                        <Trash2 size={14} /> 刪除
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* 內容區 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 基本資料 */}
                    <Card className="lg:col-span-2">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <User size={18} /> 基本資料
                        </h3>
                        {isEditing ? (
                            <div className="space-y-4">
                                <LocationField label="地址" value={editFormData.address} onChange={e => setEditFormData({ ...editFormData, address: e.target.value })} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">狀態</label>
                                        <select value={editFormData.status} onChange={e => setEditFormData({ ...editFormData, status: e.target.value })} className="w-full border rounded-lg px-3 py-2 bg-white">
                                            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <InputField label="預算範圍" value={editFormData.budget || ''} onChange={e => setEditFormData({ ...editFormData, budget: e.target.value })} placeholder="例：200-300萬" />
                                </div>
                                <InputField label="來源" value={editFormData.source || ''} onChange={e => setEditFormData({ ...editFormData, source: e.target.value })} placeholder="例：朋友介紹、網路搜尋" />
                                <DynamicFieldEditor fields={editFormData.customFields || []} onChange={(newFields) => setEditFormData({ ...editFormData, customFields: newFields })} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                {activeClient.address && (
                                    <div className="col-span-2">
                                        <span className="text-gray-500 block mb-1"><MapPin size={14} className="inline mr-1" />地址</span>
                                        <span className="text-gray-900">{activeClient.address}</span>
                                    </div>
                                )}
                                {activeClient.source && (
                                    <div>
                                        <span className="text-gray-500 block mb-1">來源</span>
                                        <span className="text-gray-900">{activeClient.source}</span>
                                    </div>
                                )}
                                {activeClient.budget && (
                                    <div>
                                        <span className="text-gray-500 block mb-1">預算</span>
                                        <span className="text-gray-900">{activeClient.budget}</span>
                                    </div>
                                )}
                                {activeClient.lineId && (
                                    <div>
                                        <span className="text-gray-500 block mb-1">LINE ID</span>
                                        <span className="text-gray-900">{activeClient.lineId}</span>
                                    </div>
                                )}
                                {activeClient.customFields?.map((field, idx) => (
                                    <div key={idx} className={field.value?.length > 20 ? "col-span-2" : ""}>
                                        <span className="text-gray-500 block mb-1">{field.label}</span>
                                        <span className="text-gray-900">{field.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* 聯絡記錄 */}
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <MessageCircle size={18} /> 聯絡記錄
                            </h3>
                            <button
                                onClick={() => setIsContactLogModalOpen(true)}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                <Plus size={14} /> 新增
                            </button>
                        </div>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {(activeClient.contactLogs || []).length > 0 ? (
                                activeClient.contactLogs.slice().reverse().map((log, idx) => (
                                    <ContactLogItem key={idx} log={log} />
                                ))
                            ) : (
                                <div className="text-sm text-gray-400 text-center py-8">
                                    尚無聯絡記錄
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* 關聯專案 */}
                    <Card className="lg:col-span-3">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Briefcase size={18} /> 參與專案
                        </h3>
                        {(() => {
                            const relatedProjects = allProjects.filter(p =>
                                p.client === activeClient.name ||
                                p.clientId === activeClient.id
                            );
                            return relatedProjects.length > 0 ? (
                                <div className="space-y-2">
                                    {relatedProjects.map(project => (
                                        <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <Briefcase size={14} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-800">{project.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {project.status || '進行中'} • {project.startDate || '未設定'}
                                                    </div>
                                                </div>
                                            </div>
                                            {project.folderUrl && (
                                                <a href={project.folderUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700">
                                                    <Folder size={16} />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400 text-center py-8">
                                    尚無關聯專案
                                </div>
                            );
                        })()}
                    </Card>
                </div>

                {/* 新增聯絡記錄 Modal */}
                <Modal
                    isOpen={isContactLogModalOpen}
                    onClose={() => setIsContactLogModalOpen(false)}
                    title="新增聯絡記錄"
                    onConfirm={handleAddContactLog}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">類型</label>
                                <select
                                    value={newContactLog.type}
                                    onChange={e => setNewContactLog({ ...newContactLog, type: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 bg-white"
                                >
                                    {['電話聯繫', '現場拜訪', 'LINE訊息', 'Email', '會議', '其他'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <InputField
                                label="日期"
                                type="date"
                                value={newContactLog.date}
                                onChange={e => setNewContactLog({ ...newContactLog, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">內容</label>
                            <textarea
                                value={newContactLog.note}
                                onChange={e => setNewContactLog({ ...newContactLog, note: e.target.value })}
                                placeholder="記錄聯絡內容..."
                                className="w-full border rounded-lg px-3 py-2 min-h-[100px] resize-none"
                            />
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }

    // 客戶列表頁
    return (
        <div className="space-y-6 animate-fade-in">
            <SectionTitle title="客戶管理" />

            {loading ? <LoadingSkeleton /> : (
                <>
                    {/* 統計卡片 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <StatCard icon={User} label="總客戶數" value={stats.total} color="gray" onClick={() => setStatusFilter('全部')} />
                        <StatCard icon={Clock} label="洽談中" value={stats.negotiating} color="blue" onClick={() => setStatusFilter('洽談中')} />
                        <StatCard icon={UserCheck} label="已簽約" value={stats.signed} color="green" onClick={() => setStatusFilter('已簽約')} />
                        <StatCard icon={Star} label="已完工" value={stats.completed} color="yellow" onClick={() => setStatusFilter('已完工')} />
                    </div>

                    {/* 搜尋與篩選列 */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="搜尋客戶姓名、電話、Email..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-blue-500 outline-none"
                        >
                            <option value="全部">全部狀態</option>
                            {Object.keys(STATUS_CONFIG).map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        {(searchTerm || statusFilter !== '全部') && (
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('全部'); }}
                                className="px-3 py-2.5 text-gray-500 hover:text-gray-700 flex items-center gap-1"
                            >
                                <X size={16} /> 清除
                            </button>
                        )}
                        <button
                            onClick={handleOpenAdd}
                            className="ml-auto bg-morandi-text-accent text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <Plus size={16} /> 新增客戶
                        </button>
                    </div>

                    {/* 客戶列表 */}
                    <div className="space-y-3">
                        {filteredClients.length > 0 ? (
                            filteredClients.map(client => (
                                <ClientRow
                                    key={client.id}
                                    client={client}
                                    onSelect={setActiveClient}
                                    onDelete={handleDeleteClient}
                                />
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                {searchTerm || statusFilter !== '全部' ? '無符合條件的客戶' : '尚無客戶資料'}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* 新增客戶 Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); setIsSaving(false); }}
                title="新增客戶"
                onConfirm={handleSaveNewClient}
                confirmDisabled={isSaving}
                confirmText={isSaving ? '處理中...' : '確定'}
            >
                <InputField label="姓名" value={newClientData.name} onChange={e => setNewClientData({ ...newClientData, name: e.target.value })} placeholder="必填" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="電話" value={newClientData.phone} onChange={e => setNewClientData({ ...newClientData, phone: e.target.value })} placeholder="例：0912-345-678" />
                    <InputField label="Email" value={newClientData.email} onChange={e => setNewClientData({ ...newClientData, email: e.target.value })} placeholder="例：test@email.com" />
                </div>
                <LocationField label="地址" value={newClientData.address} onChange={e => setNewClientData({ ...newClientData, address: e.target.value })} placeholder="例：台北市信義區松智路1號" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="來源" value={newClientData.source} onChange={e => setNewClientData({ ...newClientData, source: e.target.value })} placeholder="例：朋友介紹" />
                    <InputField label="預算範圍" value={newClientData.budget} onChange={e => setNewClientData({ ...newClientData, budget: e.target.value })} placeholder="例：200-300萬" />
                </div>
                <InputField label="LINE ID" value={newClientData.lineId} onChange={e => setNewClientData({ ...newClientData, lineId: e.target.value })} placeholder="例：@lineid 或 名稱" />
                <div className="border-t border-gray-100 pt-4 mt-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">自訂欄位</h4>
                    <DynamicFieldEditor fields={newClientData.customFields} onChange={(newFields) => setNewClientData({ ...newClientData, customFields: newFields })} />
                </div>
                <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg flex items-center gap-2">
                    <Cloud size={14} /> 系統將自動於 Google Drive 建立專屬資料夾
                </div>
            </Modal>
        </div>
    );
};

export default Clients;
