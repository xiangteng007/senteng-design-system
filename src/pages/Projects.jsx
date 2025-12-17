
import React, { useState } from 'react';
import { WidgetWrapper } from '../components/common/WidgetWrapper';
import { WidgetProjectStats, WidgetProjectList, WidgetProjectInfo, WidgetProjectFiles } from '../components/widgets/ProjectWidgets';
import { WidgetProjectVendors } from '../components/widgets/ProjectVendorsWidget';
import { WidgetProjectInventory } from '../components/widgets/ProjectInventoryWidget';
import { AddVendorModal } from '../components/project/AddVendorModal';
import { AddInventoryModal } from '../components/project/AddInventoryModal';
import { Plus, ChevronLeft, Calendar as CalendarIcon, Upload, ImageIcon, Edit2, Save, X, Trash2 } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { InputField } from '../components/common/InputField';
import { LocationField } from '../components/common/LocationField';
import { ProgressBar } from '../components/common/Indicators';

// --- Missing Detail Widgets (Implementing inline for safety) ---
const WidgetProjectRecords = ({ records, size, onAddRecord }) => (
    <div className="flex flex-col h-full">
        <div className="flex justify-between mb-3 items-center"><h4 className="text-xs font-bold text-gray-600">工程/會議紀錄</h4><button onClick={onAddRecord} className="text-morandi-blue-600 hover:bg-morandi-blue-50 p-1.5 rounded-lg transition-colors"><Plus size={14} /></button></div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {records.map(r => (
                <div key={r.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-morandi-blue-200 transition-colors">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1"><span>{r.date} · {r.type}</span><span>{r.author}</span></div>
                    <div className="text-xs text-gray-800 mb-2 leading-relaxed">{r.content}</div>
                    {r.photos && r.photos.length > 0 && (<div className="flex gap-2 overflow-x-auto pb-1">{r.photos.map((p, idx) => (<div key={idx} className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center shrink-0"><ImageIcon size={14} className="text-gray-400" /></div>))}</div>)}
                </div>
            ))}
        </div>
    </div>
);

const WidgetProjectFinanceDetail = ({ transactions, size, onAddTx }) => {
    const income = transactions.filter(t => t.type === '收入').reduce((acc, c) => acc + c.amount, 0); const expense = transactions.filter(t => t.type === '支出').reduce((acc, c) => acc + c.amount, 0);
    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between mb-2 p-2 bg-gray-50 rounded-xl">
                <div className="text-xs"><span className="text-gray-500">收</span> <span className="text-green-600 font-bold ml-1">{income}</span></div>
                <div className="text-xs"><span className="text-gray-500">支</span> <span className="text-red-600 font-bold ml-1">{expense}</span></div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {transactions.map(t => (
                    <div key={t.id} className="flex justify-between text-xs border-b border-gray-50 pb-2 last:border-0 hover:bg-gray-50 p-1 rounded">
                        <span className="truncate w-2/3 text-gray-700">{t.desc}</span>
                        <span className={`font-bold ${t.type === '收入' ? 'text-green-600' : 'text-red-500'}`}>{t.amount}</span>
                    </div>
                ))}
            </div>
            <button onClick={onAddTx} className="mt-2 w-full py-1.5 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">新增收支</button>
        </div>
    )
}

const Projects = ({ data, loading, addToast, onSelectProject, activeProject, setActiveProject, onUpdateProject, allTransactions, onAddGlobalTx, accounts, allVendors, allInventory }) => {

    // List View State
    const [listWidgets, setListWidgets] = useState([{ id: 'wp-stats', type: 'project-stats', title: '專案概況', size: 'S' }, { id: 'wp-list', type: 'project-list', title: '專案列表', size: 'L' }]);

    // Detail View State
    const [detailWidgets, setDetailWidgets] = useState([
        { id: 'wp-info', type: 'info', title: '基本資訊', size: 'S' },
        { id: 'wp-vendors', type: 'vendors', title: '參與廠商', size: 'M' },
        { id: 'wp-records', type: 'records', title: '工程紀錄', size: 'L' },
        { id: 'wp-finance', type: 'finance', title: '專案收支', size: 'M' },
        { id: 'wp-inventory', type: 'inventory', title: '庫存追蹤', size: 'M' },
        { id: 'wp-files', type: 'files', title: '檔案中心', size: 'M' },
    ]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: "", client: "", type: "翻修", budget: "" });

    // Edit & Delete State
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Vendor & Inventory Modals
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);


    // Detail Modals
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [newRecord, setNewRecord] = useState({ type: '工程', content: '', photos: [] });

    const handleResize = (widgets, setWidgets) => (id, size) => setWidgets(prev => prev.map(w => w.id === id ? { ...w, size } : w));

    // Edit Handlers
    const startEdit = () => {
        setEditFormData({ ...activeProject });
        setIsEditing(true);
    };

    const saveEdit = () => {
        onUpdateProject(editFormData);
        setActiveProject(editFormData);
        setIsEditing(false);
        addToast('專案資訊已更新！', 'success');
    };

    const cancelEdit = () => {
        setEditFormData({});
        setIsEditing(false);
    };

    // Delete Handler
    const handleDeleteProject = () => {
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        // In real app, would call API to delete
        addToast(`專案「${activeProject.name}」已刪除`, 'success');
        setIsDeleteModalOpen(false);
        setActiveProject(null);
    };

    // Vendor Handlers
    const handleAddVendor = (vendorData) => {
        const updatedProject = {
            ...activeProject,
            vendors: [...(activeProject.vendors || []), vendorData]
        };
        onUpdateProject(updatedProject);
        setActiveProject(updatedProject);
        setIsVendorModalOpen(false);
        addToast(`廠商「${vendorData.name}」已加入專案`, 'success');
    };

    const handleRemoveVendor = (vendorId) => {
        const updatedProject = {
            ...activeProject,
            vendors: activeProject.vendors.filter(v => v.vendorId !== vendorId)
        };
        onUpdateProject(updatedProject);
        setActiveProject(updatedProject);
        addToast('廠商已移除', 'info');
    };

    // Inventory Handlers
    const handleAddInventory = (inventoryData) => {
        const updatedProject = {
            ...activeProject,
            inventory: [...(activeProject.inventory || []), inventoryData]
        };
        onUpdateProject(updatedProject);
        setActiveProject(updatedProject);
        setIsInventoryModalOpen(false);
        addToast(`已記錄${inventoryData.type === '出' ? '出庫' : '入庫'}：${inventoryData.itemName} x${inventoryData.quantity}`, 'success');
    };

    if (activeProject) {
        const projectTx = allTransactions.filter(t => t.projectId === activeProject.id);

        return (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
                <button onClick={() => setActiveProject(null)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-4">
                    <ChevronLeft size={16} /> 返回列表
                </button>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div>
                            {isEditing ? (
                                <input
                                    value={editFormData.name}
                                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="text-2xl font-bold text-gray-800 bg-yellow-50 border-2 border-yellow-300 rounded px-2 py-1"
                                />
                            ) : (
                                <h2 className="text-2xl font-bold text-gray-800">{activeProject.name}</h2>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span className="font-mono bg-gray-100 px-1.5 rounded">{activeProject.code}</span>
                                <span>·</span>
                                {isEditing ? (
                                    <select
                                        value={editFormData.status}
                                        onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                                        className="px-2 py-0.5 rounded-full text-xs border-2 border-blue-300"
                                    >
                                        <option>設計中</option>
                                        <option>施工中</option>
                                        <option>完工驗收</option>
                                        <option>已完工</option>
                                    </select>
                                ) : (
                                    <span className={`px-2 py-0.5 rounded-full text-xs text-white ${activeProject.status === '施工中' ? 'bg-morandi-orange-500' : 'bg-morandi-blue-500'}`}>{activeProject.status}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <button onClick={cancelEdit} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors">
                                    <X size={16} /> 取消
                                </button>
                                <button onClick={saveEdit} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 transition-colors">
                                    <Save size={16} /> 儲存
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={startEdit} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center gap-2 transition-colors">
                                    <Edit2 size={16} /> 編輯
                                </button>
                                <button onClick={handleDeleteProject} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center gap-2 transition-colors">
                                    <Trash2 size={16} /> 刪除
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-auto">
                    {detailWidgets.map((w, i) => (
                        <WidgetWrapper key={w.id} widget={w} onResize={handleResize(detailWidgets, setDetailWidgets)}>
                            {w.type === 'info' && <WidgetProjectInfo project={activeProject} size={w.size} />}
                            {/* Reuse Widgets */}
                            {w.type === 'files' && <WidgetProjectFiles files={activeProject.files} size={w.size} onUpload={() => { }} />}
                            {w.type === 'records' && <WidgetProjectRecords records={activeProject.records} size={w.size} onAddRecord={() => setIsRecordModalOpen(true)} />}
                            {w.type === 'finance' && <WidgetProjectFinanceDetail transactions={projectTx} size={w.size} onAddTx={() => { }} />}
                            {w.type === 'vendors' && <WidgetProjectVendors vendors={activeProject.vendors || []} size={w.size} onAddVendor={() => setIsVendorModalOpen(true)} onRemoveVendor={handleRemoveVendor} />}
                            {w.type === 'inventory' && <WidgetProjectInventory inventory={activeProject.inventory || []} size={w.size} onAddRecord={() => setIsInventoryModalOpen(true)} />}
                        </WidgetWrapper>
                    ))}

                </div>

                <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} title="新增紀錄" onConfirm={() => {
                    // Mock Implementation
                    const record = { id: `r-${Date.now()}`, date: new Date().toISOString().split('T')[0], author: 'Alex', ...newRecord };
                    onUpdateProject({ ...activeProject, records: [record, ...(activeProject.records || [])] });
                    setIsRecordModalOpen(false);
                }}>
                    <InputField label="內容" type="textarea" value={newRecord.content} onChange={e => setNewRecord({ ...newRecord, content: e.target.value })} />
                </Modal>

                <AddVendorModal
                    isOpen={isVendorModalOpen}
                    onClose={() => setIsVendorModalOpen(false)}
                    onConfirm={handleAddVendor}
                    allVendors={allVendors || []}
                />

                <AddInventoryModal
                    isOpen={isInventoryModalOpen}
                    onClose={() => setIsInventoryModalOpen(false)}
                    onConfirm={handleAddInventory}
                    allInventory={allInventory || []}
                />

                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    title="確認刪除專案"
                    onConfirm={confirmDelete}
                    confirmText="確定刪除"
                >
                    <div className="space-y-4">
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                            <p className="text-red-800 font-medium">⚠️ 警告：此操作無法復原</p>
                        </div>
                        <p className="text-gray-700">
                            您確定要刪除專案「<span className="font-bold">{activeProject?.name}</span>」嗎？
                        </p>
                        <p className="text-sm text-gray-500">
                            刪除後，所有相關的工程紀錄、檔案、收支記錄將會一併移除。
                        </p>
                    </div>
                </Modal>
            </div>
        );
    }

    return (
        <>
            {/* Projects List View */}
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-morandi-text-primary">專案管理</h2>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-morandi-text-accent text-white rounded-xl hover:bg-gray-800 transition-colors shadow-lg">
                        <Plus size={16} /> <span className="hidden sm:inline">新增專案</span><span className="sm:hidden">新增</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-auto">
                    {listWidgets.map((w, i) => (
                        <WidgetWrapper key={w.id} widget={w} onResize={handleResize(listWidgets, setListWidgets)}>
                            {w.type === 'project-stats' && <WidgetProjectStats data={data} size={w.size} />}
                            {w.type === 'project-list' && <WidgetProjectList data={data} size={w.size} onSelectProject={setActiveProject} onAdd={() => setIsAddModalOpen(true)} />}
                        </WidgetWrapper>
                    ))}
                </div>
            </div>
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="建立新專案" onConfirm={() => setIsAddModalOpen(false)}>
                <InputField label="專案名稱" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
                <InputField label="預算" value={newProject.budget} onChange={e => setNewProject({ ...newProject, budget: e.target.value })} />
                <LocationField label="專案地點" value={newProject.location || ''} onChange={e => setNewProject({ ...newProject, location: e.target.value })} placeholder="例：台北市信義區松智路1號" />
            </Modal>
        </div >
    );
};

export default Projects;
