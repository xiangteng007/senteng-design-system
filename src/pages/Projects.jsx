
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
import { GoogleService } from '../services/GoogleService';

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

const WidgetProjectFinanceDetail = ({ transactions, size, onAddTx, onSyncToSheet, project }) => {
    const income = transactions.filter(t => t.type === '收入').reduce((acc, c) => acc + c.amount, 0);
    const expense = transactions.filter(t => t.type === '支出').reduce((acc, c) => acc + c.amount, 0);
    const balance = income - expense;

    // 按類別分組支出
    const expenseByCategory = transactions
        .filter(t => t.type === '支出')
        .reduce((acc, t) => {
            const cat = t.category || '其他支出';
            acc[cat] = (acc[cat] || 0) + t.amount;
            return acc;
        }, {});

    const categoryColors = {
        '材料費': 'bg-orange-400',
        '人工費': 'bg-blue-400',
        '設備費': 'bg-purple-400',
        '運輸費': 'bg-yellow-400',
        '其他支出': 'bg-gray-400'
    };

    return (
        <div className="flex flex-col h-full">
            {/* 收支摘要 */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-green-50 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-500">收入</div>
                    <div className="text-sm font-bold text-green-600">${income.toLocaleString()}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-500">支出</div>
                    <div className="text-sm font-bold text-red-600">${expense.toLocaleString()}</div>
                </div>
                <div className={`${balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'} rounded-lg p-2 text-center`}>
                    <div className="text-xs text-gray-500">淨額</div>
                    <div className={`text-sm font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        ${balance.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* 支出類別分佈 */}
            {expense > 0 && (
                <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">支出分佈</div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                        {Object.entries(expenseByCategory).map(([cat, amount]) => (
                            <div
                                key={cat}
                                className={`${categoryColors[cat] || 'bg-gray-400'}`}
                                style={{ width: `${(amount / expense) * 100}%` }}
                                title={`${cat}: $${amount.toLocaleString()}`}
                            />
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                        {Object.entries(expenseByCategory).map(([cat, amount]) => (
                            <span key={cat} className="text-[10px] text-gray-500 flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${categoryColors[cat] || 'bg-gray-400'}`}></span>
                                {cat} ${amount.toLocaleString()}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* 交易列表 */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar mb-2">
                {transactions.length > 0 ? (
                    transactions.slice(0, 10).map(t => (
                        <div key={t.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-800 truncate">{t.desc || t.category || '無摘要'}</div>
                                <div className="text-[10px] text-gray-400">{t.date} · {t.category || '-'}</div>
                            </div>
                            <span className={`font-bold ml-2 ${t.type === '收入' ? 'text-green-600' : 'text-red-500'}`}>
                                {t.type === '收入' ? '+' : '-'}${t.amount.toLocaleString()}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-400 text-xs py-4">尚無收支記錄</div>
                )}
                {transactions.length > 10 && (
                    <div className="text-center text-xs text-gray-400">...還有 {transactions.length - 10} 筆</div>
                )}
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-2">
                <button onClick={onAddTx} className="flex-1 py-1.5 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    新增收支
                </button>
                {project?.folderId && (
                    <button onClick={onSyncToSheet} className="py-1.5 px-3 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" title="同步到專案 Sheet">
                        同步
                    </button>
                )}
            </div>
        </div>
    );
}

const Projects = ({ data, loading, addToast, onSelectProject, activeProject, setActiveProject, onUpdateProject, onDeleteProject, allTransactions, onAddGlobalTx, accounts, allVendors, allInventory }) => {

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
    const [newProject, setNewProject] = useState({
        name: "",
        client: "",
        type: "翻修",
        budget: "",
        location: "",
        startDate: "",
        endDate: "",
        status: "設計中"
    });

    // Edit & Delete State
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Vendor & Inventory Modals
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Folder selection state
    const [folderMode, setFolderMode] = useState('auto'); // 'auto' = 自動新增, 'link' = 關聯現有
    const [existingFolderUrl, setExistingFolderUrl] = useState('');
    const [existingFolders, setExistingFolders] = useState([]);
    const [projectRootId, setProjectRootId] = useState(null);


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

    // Add Project Handler with Google Drive Integration
    const handleAddProject = async () => {
        if (!newProject.name || !newProject.client) {
            addToast("請填寫專案名稱和客戶", 'error');
            return;
        }

        // 如果選擇關聯現有資料夾，需要填寫URL
        if (folderMode === 'link' && !existingFolderUrl) {
            addToast("請填寫或選擇現有資料夾", 'error');
            return;
        }

        setIsSaving(true);
        let driveUrl = existingFolderUrl;

        if (folderMode === 'auto') {
            // Step 1: 獲取或建立「專案管理」根資料夾
            const rootResult = await GoogleService.getOrCreateProjectRoot();
            if (!rootResult.success) {
                setIsSaving(false);
                return addToast(`無法建立專案管理資料夾: ${rootResult.error}`, 'error');
            }

            // Step 2: 在「專案管理」下建立專案資料夾
            const folderName = `${newProject.name} - ${newProject.client}`;
            const driveResult = await GoogleService.createDriveFolder(folderName, rootResult.folderId);

            if (!driveResult.success) {
                setIsSaving(false);
                return addToast(`Drive 資料夾建立失敗: ${driveResult.error}`, 'error');
            }
            driveUrl = driveResult.url;
        }

        const project = {
            ...newProject,
            id: `p-${Date.now()}`,
            driveFolder: driveUrl,
            vendors: [],
            inventory: [],
            files: [],
            records: [],
            transactions: []
        };

        onUpdateProject(project);

        // Sync to Google Sheets
        const allProjects = [...data, project];
        const syncResult = await GoogleService.syncToSheet('projects', allProjects);

        setIsSaving(false);

        if (!syncResult.success) {
            addToast(`專案已建立，但 Sheets 同步失敗: ${syncResult.error}`, 'warning');
        } else {
            addToast(`專案「${newProject.name}」已建立！已同步到 Google Drive 和 Sheets`, 'success', {
                link: driveUrl,
                linkText: '開啟 Drive 資料夾'
            });
        }

        setIsAddModalOpen(false);
        setFolderMode('auto');
        setExistingFolderUrl('');
        setNewProject({
            name: "",
            client: "",
            type: "翻修",
            budget: "",
            location: "",
            startDate: "",
            endDate: "",
            status: "設計中"
        });
    };

    // File Upload Handler - Upload to project's Drive folder
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!activeProject.driveFolder) {
                addToast('此專案沒有 Drive 資料夾', 'error');
                return;
            }

            addToast('正在上傳檔案...', 'info');
            const res = await GoogleService.uploadToDrive(file, activeProject.name, activeProject.driveFolder);

            if (res.success) {
                const fileRecord = {
                    id: `file-${Date.now()}`,
                    name: file.name,
                    url: res.url,
                    uploadDate: new Date().toLocaleDateString('zh-TW'),
                    size: file.size
                };
                const updatedProject = { ...activeProject, files: [...(activeProject.files || []), fileRecord] };
                onUpdateProject(updatedProject);
                setActiveProject(updatedProject);
                addToast(`檔案「${file.name}」已上傳至 Drive`, 'success', {
                    link: res.url,
                    linkText: '開啟檔案'
                });
            } else {
                addToast(`檔案上傳失敗: ${res.error}`, 'error');
            }
        }
    };
    // Delete Handler - 只從列表中移除，不刪除 Drive 資料夾
    const handleDeleteProject = () => {
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        // Remove project from data array
        if (onDeleteProject) {
            onDeleteProject(activeProject.id);
        }
        addToast(`專案「${activeProject.name}」已從列表移除（Drive 資料夾保留）`, 'success');
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

    // Record Handler - Save records with metadata and sync to Sheets
    const handleAddRecord = async () => {
        const record = {
            ...newRecord,
            id: `r-${Date.now()}`,
            date: new Date().toLocaleDateString('zh-TW'),
            time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
            author: '使用者A'
        };

        const updatedProject = { ...activeProject, records: [record, ...(activeProject.records || [])] };
        onUpdateProject(updatedProject);
        setActiveProject(updatedProject);

        // Sync updated project records to Sheets
        if (activeProject.driveFolder) {
            const allProjects = data.map(p => p.id === activeProject.id ? updatedProject : p);
            await GoogleService.syncToSheet('projects', allProjects);
        }

        setNewRecord({ type: '工程', content: '', photos: [] });
        setIsRecordModalOpen(false);
        addToast('工程紀錄已新增並同步至 Sheets', 'success');
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

    // Sync project transactions to Sheet
    const handleSyncProjectFinance = async () => {
        if (!activeProject?.folderId) {
            addToast('此專案沒有 Drive 資料夾', 'error');
            return;
        }

        const projectTx = allTransactions.filter(t => t.projectId === activeProject.id);
        if (projectTx.length === 0) {
            addToast('尚無收支記錄可同步', 'info');
            return;
        }

        addToast('正在同步專案收支...', 'info');
        try {
            const result = await GoogleService.syncAllProjectTransactions(
                activeProject.folderId,
                activeProject.name,
                projectTx.map(t => ({
                    date: t.date,
                    type: t.type,
                    category: t.category || '',
                    amount: t.amount,
                    target: '',
                    account: accounts?.find(a => a.id === t.accountId)?.name || '',
                    invoiceNo: '',
                    note: t.desc || ''
                }))
            );

            if (result.success) {
                addToast(`已同步 ${projectTx.length} 筆收支到專案 Sheet`, 'success', {
                    action: { label: '開啟 Sheet', onClick: () => window.open(result.sheetUrl, '_blank') }
                });
            } else {
                addToast(`同步失敗: ${result.error}`, 'error');
            }
        } catch (error) {
            addToast(`同步失敗: ${error.message}`, 'error');
        }
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
                            {w.type === 'finance' && <WidgetProjectFinanceDetail
                                transactions={projectTx}
                                size={w.size}
                                onAddTx={() => { }}
                                onSyncToSheet={handleSyncProjectFinance}
                                project={activeProject}
                            />}
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
                    title="從列表移除專案"
                    onConfirm={confirmDelete}
                    confirmText="確定移除"
                >
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-yellow-800 font-medium">📁 Drive 資料夾將會保留</p>
                        </div>
                        <p className="text-gray-700">
                            您確定要從列表移除專案「<span className="font-bold">{activeProject?.name}</span>」嗎？
                        </p>
                        <p className="text-sm text-gray-500">
                            專案將從系統列表中移除，但 Google Drive 中的資料夾及所有檔案將會保留。

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
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="建立新專案"
                onConfirm={handleAddProject}
                confirmDisabled={isSaving}
                confirmText={isSaving ? '處理中...' : '確認'}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="專案名稱" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} placeholder="例：信義區住宅翻修" />
                    <InputField label="客戶" value={newProject.client} onChange={e => setNewProject({ ...newProject, client: e.target.value })} placeholder="例：王小明" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="專案類型" type="select" value={newProject.type} onChange={e => setNewProject({ ...newProject, type: e.target.value })}>
                        <option value="翻修">翻修</option>
                        <option value="新建">新建</option>
                        <option value="設計">設計</option>
                        <option value="裝潢">裝潢</option>
                    </InputField>
                    <InputField label="預算" type="number" value={newProject.budget} onChange={e => setNewProject({ ...newProject, budget: e.target.value })} placeholder="例：500000" />
                </div>
                <LocationField label="專案地點" value={newProject.location || ''} onChange={e => setNewProject({ ...newProject, location: e.target.value })} placeholder="例：台北市信義區松智路1號" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="開始日期" type="date" value={newProject.startDate} onChange={e => setNewProject({ ...newProject, startDate: e.target.value })} />
                    <InputField label="預計完工" type="date" value={newProject.endDate} onChange={e => setNewProject({ ...newProject, endDate: e.target.value })} />
                </div>

                {/* Drive 資料夾設定 */}
                <div className="border-t pt-4 mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Drive 資料夾設定</label>
                    <div className="flex gap-4 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="folderMode"
                                value="auto"
                                checked={folderMode === 'auto'}
                                onChange={() => setFolderMode('auto')}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm">自動建立新資料夾</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="folderMode"
                                value="link"
                                checked={folderMode === 'link'}
                                onChange={() => setFolderMode('link')}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm">關聯現有資料夾</span>
                        </label>
                    </div>

                    {folderMode === 'auto' && (
                        <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            將在「專案管理」資料夾下自動建立：<strong>{newProject.name || '[專案名稱]'} - {newProject.client || '[客戶]'}</strong>
                        </p>
                    )}

                    {folderMode === 'link' && (
                        <InputField
                            label="現有資料夾連結"
                            value={existingFolderUrl}
                            onChange={e => setExistingFolderUrl(e.target.value)}
                            placeholder="貼上 Google Drive 資料夾連結，例：https://drive.google.com/drive/folders/xxxxx"
                        />
                    )}
                </div>
            </Modal>
        </>
    );
};
export default Projects;
