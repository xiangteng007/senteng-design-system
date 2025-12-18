
import React, { useState, useEffect, useMemo } from 'react';
import {
    Package, Plus, Search, Filter, Edit2, Trash2,
    ArrowDownCircle, ArrowUpCircle, AlertTriangle,
    CheckCircle, XCircle, X, Save, History, MapPin,
    BarChart3, TrendingDown, TrendingUp, Box,
    FileSpreadsheet, ExternalLink, RefreshCw
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { InputField } from '../components/common/InputField';
import { SectionTitle } from '../components/common/Indicators';
import { GoogleService } from '../services/GoogleService';

// 庫存類別 - 兩層結構
const CATEGORY_TREE = {
    '結構板材': ['木料', '板材', '防火板', '輕鋼架'],
    '裝飾建材': ['地面材料', '牆面材料', '天花材料', '塗料油漆'],
    '機電設備': ['電氣電線', '燈具照明', '開關插座', '弱電設備', '水管衛浴'],
    '五金配件': ['門窗五金', '櫃體五金', '結構五金', '裝飾五金'],
    '消耗品': ['黏著劑', '填縫材料', '防護用品', '清潔用品']
};

// 主類別列表（含「全部」選項）
const MAIN_CATEGORIES = ['全部', ...Object.keys(CATEGORY_TREE)];

// 所有子類別的扁平列表
const ALL_SUB_CATEGORIES = Object.values(CATEGORY_TREE).flat();

// 根據主類別獲取子類別
const getSubCategories = (mainCategory) => {
    if (mainCategory === '全部' || !mainCategory) return ALL_SUB_CATEGORIES;
    return CATEGORY_TREE[mainCategory] || [];
};

// 根據子類別找主類別
const getMainCategory = (subCategory) => {
    for (const [main, subs] of Object.entries(CATEGORY_TREE)) {
        if (subs.includes(subCategory)) return main;
    }
    return '消耗品'; // 預設
};

// 狀態選項
const STATUS_OPTIONS = ['全部', '充足', '庫存偏低', '缺貨'];


// 狀態顏色
const getStatusColor = (status) => {
    switch (status) {
        case '缺貨': return 'red';
        case '庫存偏低': return 'orange';
        case '充足': return 'green';
        default: return 'gray';
    }
};

// 計算狀態
const calculateStatus = (quantity, safeStock) => {
    if (quantity <= 0) return '缺貨';
    if (quantity < safeStock) return '庫存偏低';
    return '充足';
};

// 格式化日期
const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-TW');
};

// 統計卡片組件
const StatCard = ({ icon: Icon, label, value, color = 'gray', onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
        <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-lg bg-${color}-100 flex items-center justify-center`}>
                <Icon size={20} className={`text-${color}-600`} />
            </div>
            <div className="text-right">
                <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
            </div>
        </div>
    </div>
);

// 新增/編輯品項 Modal
const ItemModal = ({ isOpen, onClose, item, onSave, isEdit }) => {
    const [form, setForm] = useState({
        name: '', spec: '', mainCategory: '消耗品', category: '黏著劑', quantity: 0,
        unit: '個', safeStock: 10, location: '', status: '充足'
    });

    useEffect(() => {
        if (item) {
            // 若舊資料沒有 mainCategory，根據 category 推算
            const mainCat = item.mainCategory || getMainCategory(item.category);
            setForm({ ...item, mainCategory: mainCat });
        } else {
            setForm({
                name: '', spec: '', mainCategory: '消耗品', category: '黏著劑', quantity: 0,
                unit: '個', safeStock: 10, location: '', status: '充足'
            });
        }
    }, [item, isOpen]);

    const handleMainCategoryChange = (newMain) => {
        const subCats = CATEGORY_TREE[newMain] || [];
        setForm({
            ...form,
            mainCategory: newMain,
            category: subCats[0] || '' // 預設選第一個子類別
        });
    };

    const handleSave = () => {
        const status = calculateStatus(parseInt(form.quantity), parseInt(form.safeStock));
        onSave({ ...form, quantity: parseInt(form.quantity), safeStock: parseInt(form.safeStock), status });
    };

    const availableSubCategories = CATEGORY_TREE[form.mainCategory] || [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? '編輯庫存品項' : '新增庫存品項'}
            onConfirm={handleSave}
        >
            <div className="space-y-4">
                <InputField
                    label="品項名稱"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="例：Panasonic 開關"
                />
                <div className="grid grid-cols-2 gap-4">
                    <InputField
                        label="規格/型號"
                        value={form.spec}
                        onChange={e => setForm({ ...form, spec: e.target.value })}
                        placeholder="例：PN-001"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">主類別</label>
                        <select
                            value={form.mainCategory}
                            onChange={e => handleMainCategoryChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {Object.keys(CATEGORY_TREE).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">子類別</label>
                        <select
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {availableSubCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <InputField
                        label="單位"
                        value={form.unit}
                        onChange={e => setForm({ ...form, unit: e.target.value })}
                        placeholder="個、組、箱"
                    />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <InputField
                        label="數量"
                        type="number"
                        value={form.quantity}
                        onChange={e => setForm({ ...form, quantity: e.target.value })}
                    />
                    <InputField
                        label="安全庫存"
                        type="number"
                        value={form.safeStock}
                        onChange={e => setForm({ ...form, safeStock: e.target.value })}
                    />
                    <InputField
                        label="存放位置"
                        value={form.location}
                        onChange={e => setForm({ ...form, location: e.target.value })}
                        placeholder="A-01"
                    />
                </div>
            </div>
        </Modal>
    );
};


// 出入庫 Modal
const StockMovementModal = ({ isOpen, onClose, item, type, onConfirm }) => {
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');

    useEffect(() => {
        setQuantity(1);
        setNote('');
    }, [isOpen]);

    const handleConfirm = () => {
        onConfirm({
            itemId: item.id,
            itemName: item.name,
            type: type,
            quantity: parseInt(quantity),
            date: new Date().toISOString().split('T')[0],
            operator: 'Admin',
            note
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={type === '入' ? '入庫登記' : '出庫登記'}
            onConfirm={handleConfirm}
        >
            <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-500">品項</div>
                    <div className="font-bold text-gray-800">{item?.name}</div>
                    <div className="text-xs text-gray-400">{item?.spec}</div>
                    <div className="mt-2 text-sm">
                        當前數量: <span className="font-bold">{item?.quantity}</span> {item?.unit}
                    </div>
                </div>
                <InputField
                    label={`${type === '入' ? '入庫' : '出庫'}數量`}
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    min={1}
                />
                <InputField
                    label="備註"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder={type === '入' ? '例：批量採購' : '例：出貨至林公館'}
                />
                {type === '出' && parseInt(quantity) > (item?.quantity || 0) && (
                    <div className="text-red-500 text-sm flex items-center gap-1">
                        <AlertTriangle size={14} />
                        出庫數量超過庫存！
                    </div>
                )}
            </div>
        </Modal>
    );
};

// 刪除確認 Modal
const DeleteConfirmModal = ({ isOpen, onClose, item, onConfirm }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="確認刪除" onConfirm={onConfirm}>
        <div className="text-center py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-500" />
            </div>
            <p className="text-gray-600">確定要刪除以下品項嗎？</p>
            <p className="font-bold text-gray-800 mt-2">{item?.name}</p>
            <p className="text-sm text-gray-500">{item?.spec}</p>
            <p className="text-sm text-red-500 mt-4">此操作無法還原</p>
        </div>
    </Modal>
);

// 主組件
const Inventory = ({ data, addToast }) => {
    const [items, setItems] = useState(data || []);
    const [movements, setMovements] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [mainCategoryFilter, setMainCategoryFilter] = useState('全部');
    const [subCategoryFilter, setSubCategoryFilter] = useState('全部');
    const [statusFilter, setStatusFilter] = useState('全部');

    // Modal 狀態
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [movementType, setMovementType] = useState('入');

    // 庫存 Sheet 狀態
    const [inventorySheet, setInventorySheet] = useState(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // 初始化
    useEffect(() => {
        if (data) setItems(data);
    }, [data]);

    // 篩選邏輯
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchSearch = !searchTerm ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.spec?.toLowerCase().includes(searchTerm.toLowerCase());

            // 主類別篩選
            const itemMainCat = item.mainCategory || getMainCategory(item.category);
            const matchMainCategory = mainCategoryFilter === '全部' || itemMainCat === mainCategoryFilter;

            // 子類別篩選
            const matchSubCategory = subCategoryFilter === '全部' || item.category === subCategoryFilter;

            const matchStatus = statusFilter === '全部' || item.status === statusFilter;
            return matchSearch && matchMainCategory && matchSubCategory && matchStatus;
        });
    }, [items, searchTerm, mainCategoryFilter, subCategoryFilter, statusFilter]);

    // 統計數據
    const stats = useMemo(() => {
        const total = items.length;
        const lowStock = items.filter(i => i.status === '庫存偏低').length;
        const outOfStock = items.filter(i => i.status === '缺貨').length;
        const thisMonth = movements.filter(m => {
            const moveDate = new Date(m.date);
            const now = new Date();
            return moveDate.getMonth() === now.getMonth() && moveDate.getFullYear() === now.getFullYear();
        });
        const monthIn = thisMonth.filter(m => m.type === '入').reduce((sum, m) => sum + m.quantity, 0);
        const monthOut = thisMonth.filter(m => m.type === '出').reduce((sum, m) => sum + m.quantity, 0);
        return { total, lowStock, outOfStock, monthIn, monthOut };
    }, [items, movements]);

    // 新增品項
    const handleAddItem = async (newItem) => {
        const itemToAdd = { ...newItem, id: `i-${Date.now()}` };
        const newItems = [...items, itemToAdd];
        setItems(newItems);
        await GoogleService.syncToSheet('inventory', newItems);
        addToast('品項新增成功！', 'success');
        setIsAddModalOpen(false);
    };

    // 編輯品項
    const handleEditItem = async (updatedItem) => {
        const newItems = items.map(i => i.id === updatedItem.id ? updatedItem : i);
        setItems(newItems);
        await GoogleService.syncToSheet('inventory', newItems);
        addToast('品項更新成功！', 'success');
        setIsEditModalOpen(false);
        setSelectedItem(null);
    };

    // 刪除品項
    const handleDeleteItem = async () => {
        const newItems = items.filter(i => i.id !== selectedItem.id);
        setItems(newItems);
        await GoogleService.syncToSheet('inventory', newItems);
        addToast('品項已刪除', 'info');
        setIsDeleteModalOpen(false);
        setSelectedItem(null);
    };

    // 出入庫
    const handleStockMovement = async (movement) => {
        // 更新庫存數量
        const delta = movement.type === '入' ? movement.quantity : -movement.quantity;
        const newItems = items.map(i => {
            if (i.id === movement.itemId) {
                const newQty = Math.max(0, i.quantity + delta);
                return { ...i, quantity: newQty, status: calculateStatus(newQty, i.safeStock) };
            }
            return i;
        });

        // 記錄出入庫
        const newMovement = { ...movement, id: `sm-${Date.now()}` };
        const newMovements = [...movements, newMovement];

        setItems(newItems);
        setMovements(newMovements);
        await GoogleService.syncToSheet('inventory', newItems);
        addToast(`${movement.type === '入' ? '入庫' : '出庫'}成功！`, 'success');
        setIsMovementModalOpen(false);
        setSelectedItem(null);
    };

    // 開啟編輯
    const openEdit = (item) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
    };

    // 開啟刪除確認
    const openDelete = (item) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    // 開啟出入庫
    const openMovement = (item, type) => {
        setSelectedItem(item);
        setMovementType(type);
        setIsMovementModalOpen(true);
    };

    // 初始化庫存 Sheet
    const initSheet = async () => {
        setIsInitializing(true);
        try {
            const result = await GoogleService.initInventorySheet();
            if (result.success) {
                setInventorySheet({
                    sheetId: result.sheetId,
                    sheetUrl: result.sheetUrl,
                    folderUrl: result.folderUrl
                });
                addToast('庫存 Sheet 建立成功！', 'success');
            } else {
                addToast('建立失敗：' + result.error, 'error');
            }
        } catch (err) {
            addToast('建立失敗：' + err.message, 'error');
        }
        setIsInitializing(false);
    };

    // 同步到 Sheet
    const syncToSheet = async () => {
        if (!inventorySheet?.sheetId) {
            addToast('請先建立庫存 Sheet', 'warning');
            return;
        }
        setIsSyncing(true);
        try {
            const result = await GoogleService.syncInventoryToSheet(inventorySheet.sheetId, items);
            if (result.success) {
                addToast('同步成功！', 'success');
            } else {
                addToast('同步失敗：' + result.error, 'error');
            }
        } catch (err) {
            addToast('同步失敗：' + err.message, 'error');
        }
        setIsSyncing(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <SectionTitle title="庫存管理" />
                <div className="flex flex-wrap items-center gap-2">
                    {/* Sheet 管理按鈕 */}
                    {!inventorySheet ? (
                        <button
                            onClick={initSheet}
                            disabled={isInitializing}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                        >
                            {isInitializing ? (
                                <RefreshCw size={16} className="animate-spin" />
                            ) : (
                                <FileSpreadsheet size={16} />
                            )}
                            建立 Sheet
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={syncToSheet}
                                disabled={isSyncing}
                                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm"
                            >
                                {isSyncing ? (
                                    <RefreshCw size={16} className="animate-spin" />
                                ) : (
                                    <RefreshCw size={16} />
                                )}
                                同步到 Sheet
                            </button>
                            <a
                                href={inventorySheet.sheetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                            >
                                <ExternalLink size={16} />
                                開啟 Sheet
                            </a>
                        </>
                    )}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={18} />
                        新增品項
                    </button>
                </div>
            </div>

            {/* 統計卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    icon={Box}
                    label="總品項數"
                    value={stats.total}
                    color="blue"
                />
                <StatCard
                    icon={AlertTriangle}
                    label="庫存偏低"
                    value={stats.lowStock}
                    color="orange"
                    onClick={() => setStatusFilter('庫存偏低')}
                />
                <StatCard
                    icon={XCircle}
                    label="缺貨"
                    value={stats.outOfStock}
                    color="red"
                    onClick={() => setStatusFilter('缺貨')}
                />
                <StatCard
                    icon={TrendingDown}
                    label="本月出庫"
                    value={stats.monthOut}
                    color="purple"
                />
            </div>

            {/* 搜尋與篩選 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* 搜尋框 */}
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="搜尋品名或規格..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 主類別篩選 */}
                    <select
                        value={mainCategoryFilter}
                        onChange={(e) => {
                            setMainCategoryFilter(e.target.value);
                            setSubCategoryFilter('全部'); // 重置子類別
                        }}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        {MAIN_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat === '全部' ? '所有主類別' : cat}</option>
                        ))}
                    </select>

                    {/* 子類別篩選 */}
                    <select
                        value={subCategoryFilter}
                        onChange={(e) => setSubCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="全部">所有子類別</option>
                        {getSubCategories(mainCategoryFilter).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    {/* 狀態篩選 */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>{status === '全部' ? '所有狀態' : status}</option>
                        ))}
                    </select>

                    {/* 清除篩選 */}
                    {(searchTerm || mainCategoryFilter !== '全部' || subCategoryFilter !== '全部' || statusFilter !== '全部') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setMainCategoryFilter('全部');
                                setSubCategoryFilter('全部');
                                setStatusFilter('全部');
                            }}
                            className="px-4 py-2 text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                            <X size={16} />
                            清除
                        </button>
                    )}
                </div>
            </div>

            {/* 庫存列表 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="text-left p-4 font-medium">品名</th>
                                <th className="text-left p-4 font-medium">規格</th>
                                <th className="text-left p-4 font-medium">類別</th>
                                <th className="text-center p-4 font-medium">數量</th>
                                <th className="text-center p-4 font-medium">安全存量</th>
                                <th className="text-left p-4 font-medium">位置</th>
                                <th className="text-center p-4 font-medium">狀態</th>
                                <th className="text-center p-4 font-medium">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
                                        <Package size={48} className="mx-auto mb-2 opacity-50" />
                                        <p>沒有找到符合條件的品項</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map(item => (
                                    <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-800">{item.name}</div>
                                        </td>
                                        <td className="p-4 text-gray-500">{item.spec || '-'}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs text-gray-400">{item.mainCategory || getMainCategory(item.category)}</span>
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs inline-block w-fit">
                                                    {item.category || '其他'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-mono font-bold text-gray-800">{item.quantity}</span>
                                            <span className="text-gray-400 ml-1">{item.unit}</span>
                                        </td>
                                        <td className="p-4 text-center text-gray-500">{item.safeStock}</td>
                                        <td className="p-4">
                                            {item.location ? (
                                                <span className="flex items-center gap-1 text-gray-600">
                                                    <MapPin size={14} />
                                                    {item.location}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <Badge color={getStatusColor(item.status)}>{item.status}</Badge>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => openMovement(item, '入')}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="入庫"
                                                >
                                                    <ArrowDownCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openMovement(item, '出')}
                                                    className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="出庫"
                                                >
                                                    <ArrowUpCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openEdit(item)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="編輯"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openDelete(item)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="刪除"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 列表底部資訊 */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
                    顯示 {filteredItems.length} / {items.length} 筆資料
                </div>
            </div>

            {/* 最近出入庫記錄 */}
            {movements.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <History size={18} />
                        最近出入庫記錄
                    </h4>
                    <div className="space-y-2">
                        {movements.slice(-5).reverse().map(m => (
                            <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <div className="flex items-center gap-3">
                                    {m.type === '入' ? (
                                        <ArrowDownCircle size={18} className="text-green-500" />
                                    ) : (
                                        <ArrowUpCircle size={18} className="text-purple-500" />
                                    )}
                                    <div>
                                        <div className="font-medium text-gray-700">{m.itemName}</div>
                                        <div className="text-xs text-gray-400">{m.note || '-'}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-bold ${m.type === '入' ? 'text-green-600' : 'text-purple-600'}`}>
                                        {m.type === '入' ? '+' : '-'}{m.quantity}
                                    </div>
                                    <div className="text-xs text-gray-400">{formatDate(m.date)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            <ItemModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                item={null}
                onSave={handleAddItem}
                isEdit={false}
            />
            <ItemModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setSelectedItem(null); }}
                item={selectedItem}
                onSave={handleEditItem}
                isEdit={true}
            />
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setSelectedItem(null); }}
                item={selectedItem}
                onConfirm={handleDeleteItem}
            />
            <StockMovementModal
                isOpen={isMovementModalOpen}
                onClose={() => { setIsMovementModalOpen(false); setSelectedItem(null); }}
                item={selectedItem}
                type={movementType}
                onConfirm={handleStockMovement}
            />
        </div>
    );
};

export default Inventory;
