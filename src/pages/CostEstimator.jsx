
import React, { useState, useEffect } from 'react';
import { Calculator, FolderPlus, RefreshCw, Plus, Trash2, Save, DollarSign, Package, Paintbrush, Hammer, Wrench, Layers, GlassWater, Info, Edit2, X, Check } from 'lucide-react';
import { SectionTitle } from '../components/common/Indicators';
import { GoogleService } from '../services/GoogleService';

// 預設物料資料（離線時使用）
const DEFAULT_MATERIALS = {
    '油漆': [
        { id: 1, name: '乳膠漆', spec: '5加侖桶', unit: '加侖', price: 1200, note: '每坪用量約0.5加侖' },
        { id: 2, name: '防水漆', spec: '5加侖桶', unit: '加侖', price: 1800, note: '浴室/屋頂用' },
        { id: 3, name: '油性漆', spec: '加侖', unit: '加侖', price: 600, note: '金屬/木作' },
    ],
    '木作': [
        { id: 4, name: '木芯板', spec: '4x8呎', unit: '片', price: 800, note: '36才/片' },
        { id: 5, name: '夾板', spec: '4x8呎', unit: '片', price: 450, note: '18mm厚' },
        { id: 6, name: '角材', spec: '1.2x1.2寸', unit: '支', price: 35, note: '12尺長' },
        { id: 7, name: '系統櫃', spec: '含五金', unit: '尺', price: 3500, note: '連工帶料' },
    ],
    '泥作': [
        { id: 8, name: '水泥', spec: '50kg/包', unit: '包', price: 180, note: '台泥' },
        { id: 9, name: '砂', spec: '立方', unit: '立方', price: 1200, note: '河砂' },
        { id: 10, name: '磁磚', spec: '60x60cm', unit: '坪', price: 2500, note: '含工資' },
        { id: 11, name: '拋光石英磚', spec: '80x80cm', unit: '坪', price: 4500, note: '含工資' },
    ],
    '水電': [
        { id: 12, name: '電線', spec: '2.0mm', unit: '尺', price: 8, note: '單芯線' },
        { id: 13, name: 'PVC管', spec: '3/4吋', unit: '支', price: 45, note: '4米長' },
        { id: 14, name: '開關插座', spec: '國際牌', unit: '組', price: 150, note: '含安裝' },
        { id: 15, name: '馬桶', spec: '二段式', unit: '組', price: 8000, note: '含安裝' },
    ],
    '玻璃': [
        { id: 16, name: '清玻璃', spec: '5mm', unit: '才', price: 35, note: '一般隔間' },
        { id: 17, name: '強化玻璃', spec: '10mm', unit: '才', price: 85, note: '淋浴間' },
        { id: 18, name: '膠合玻璃', spec: '5+5mm', unit: '才', price: 120, note: '安全玻璃' },
    ],
    '地板': [
        { id: 19, name: '超耐磨地板', spec: '卡扣式', unit: '坪', price: 3500, note: '含安裝' },
        { id: 20, name: 'SPC地板', spec: '卡扣式', unit: '坪', price: 2800, note: '防水' },
        { id: 21, name: '實木地板', spec: '海島型', unit: '坪', price: 6500, note: '含安裝' },
    ],
};

// 類別圖示映射
const CATEGORY_ICONS = {
    '油漆': Paintbrush,
    '木作': Hammer,
    '泥作': Layers,
    '水電': Wrench,
    '玻璃': GlassWater,
    '地板': Package,
};

// 格式化金額
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

export const CostEstimator = ({ addToast }) => {
    // 狀態
    const [materials, setMaterials] = useState(DEFAULT_MATERIALS);
    const [selectedCategory, setSelectedCategory] = useState('油漆');
    const [estimateItems, setEstimateItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [driveFolder, setDriveFolder] = useState(null);
    const [isInitializing, setIsInitializing] = useState(false);

    // 編輯物料狀態
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', spec: '', unit: '', price: 0, note: '' });

    // 計算總價
    const totalCost = estimateItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 新增估算項目
    const addEstimateItem = (material) => {
        const existing = estimateItems.find(item => item.id === material.id);
        if (existing) {
            setEstimateItems(items =>
                items.map(item =>
                    item.id === material.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            );
        } else {
            setEstimateItems([...estimateItems, { ...material, quantity: 1 }]);
        }
        addToast?.(`已加入 ${material.name}`, 'success');
    };

    // 更新數量
    const updateQuantity = (id, quantity) => {
        if (quantity <= 0) {
            setEstimateItems(items => items.filter(item => item.id !== id));
        } else {
            setEstimateItems(items =>
                items.map(item =>
                    item.id === id ? { ...item, quantity } : item
                )
            );
        }
    };

    // 移除項目
    const removeItem = (id) => {
        setEstimateItems(items => items.filter(item => item.id !== id));
    };

    // 清空估算
    const clearEstimate = () => {
        setEstimateItems([]);
        addToast?.('已清空估算清單', 'info');
    };

    // 初始化 Drive 資料夾
    const initializeDriveFolder = async () => {
        setIsInitializing(true);
        try {
            const result = await GoogleService.createCostEstimatorFolder();
            if (result.success) {
                setDriveFolder(result);
                addToast?.('已建立 Drive 資料夾及資料庫', 'success');
            } else {
                addToast?.(result.error || '建立失敗', 'error');
            }
        } catch (error) {
            console.error('Initialize folder error:', error);
            addToast?.('初始化失敗：' + error.message, 'error');
        } finally {
            setIsInitializing(false);
        }
    };

    // 從 Drive 載入物料資料
    const loadMaterialsFromDrive = async () => {
        setIsLoading(true);
        try {
            const result = await GoogleService.getMaterialPrices();
            if (result.success && result.data?.materials) {
                setMaterials(result.data.materials);
                addToast?.('已從 Drive 載入物料資料', 'success');
            } else {
                // 使用預設資料
                addToast?.('使用本機預設資料', 'info');
            }
        } catch (error) {
            console.error('Load materials error:', error);
            addToast?.('載入失敗，使用本機資料', 'warning');
        } finally {
            setIsLoading(false);
        }
    };

    // 開始編輯物料
    const startEditMaterial = (material) => {
        setEditingMaterial(material.id);
        setEditForm({ ...material });
    };

    // 儲存編輯
    const saveEditMaterial = async () => {
        setMaterials(prev => ({
            ...prev,
            [selectedCategory]: prev[selectedCategory].map(m =>
                m.id === editingMaterial ? { ...m, ...editForm, price: parseFloat(editForm.price) } : m
            )
        }));
        setEditingMaterial(null);
        addToast?.('已更新物料價格', 'success');

        // 同步到 Drive（背景執行）
        GoogleService.updateMaterialPrice(selectedCategory, editForm).catch(console.error);
    };

    // 取消編輯
    const cancelEdit = () => {
        setEditingMaterial(null);
        setEditForm({ name: '', spec: '', unit: '', price: 0, note: '' });
    };

    const categories = Object.keys(materials);
    const currentMaterials = materials[selectedCategory] || [];

    return (
        <div className="space-y-6 animate-fade-in">
            <SectionTitle title="營建物料成本快速估算" />

            {/* 說明區 */}
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-3">
                <Info size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                    <p className="font-medium mb-1">快速估算材料成本</p>
                    <p className="text-orange-600">選擇物料類別，點擊加入估算清單，系統將自動計算總價。可連結 Google Drive 同步物料資料庫。</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左側：類別選擇與物料列表 */}
                <div className="lg:col-span-2 space-y-4">
                    {/* 類別選擇 */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-medium text-gray-700">物料類別</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={loadMaterialsFromDrive}
                                    disabled={isLoading}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                                    同步
                                </button>
                                <button
                                    onClick={initializeDriveFolder}
                                    disabled={isInitializing}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <FolderPlus size={14} />
                                    {isInitializing ? '建立中...' : '初始化資料庫'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            {categories.map(category => {
                                const Icon = CATEGORY_ICONS[category] || Package;
                                return (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${selectedCategory === category
                                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon size={20} />
                                        <span className="font-medium text-xs">{category}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 物料列表 */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            {React.createElement(CATEGORY_ICONS[selectedCategory] || Package, { size: 20 })}
                            {selectedCategory}物料價格表
                        </h4>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 px-2 font-medium text-gray-600">名稱</th>
                                        <th className="text-left py-2 px-2 font-medium text-gray-600">規格</th>
                                        <th className="text-right py-2 px-2 font-medium text-gray-600">單位</th>
                                        <th className="text-right py-2 px-2 font-medium text-gray-600">單價</th>
                                        <th className="text-center py-2 px-2 font-medium text-gray-600">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentMaterials.map(material => (
                                        <tr key={material.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            {editingMaterial === material.id ? (
                                                <>
                                                    <td className="py-2 px-2">
                                                        <input
                                                            type="text"
                                                            value={editForm.name}
                                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                            className="w-full px-2 py-1 border rounded text-sm"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        <input
                                                            type="text"
                                                            value={editForm.spec}
                                                            onChange={(e) => setEditForm({ ...editForm, spec: e.target.value })}
                                                            className="w-full px-2 py-1 border rounded text-sm"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-right">
                                                        <input
                                                            type="text"
                                                            value={editForm.unit}
                                                            onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                                                            className="w-16 px-2 py-1 border rounded text-sm text-right"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-right">
                                                        <input
                                                            type="number"
                                                            value={editForm.price}
                                                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                                            className="w-20 px-2 py-1 border rounded text-sm text-right"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-center">
                                                        <div className="flex justify-center gap-1">
                                                            <button onClick={saveEditMaterial} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                                                <Check size={16} />
                                                            </button>
                                                            <button onClick={cancelEdit} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="py-2 px-2 font-medium">{material.name}</td>
                                                    <td className="py-2 px-2 text-gray-500">{material.spec}</td>
                                                    <td className="py-2 px-2 text-right text-gray-500">{material.unit}</td>
                                                    <td className="py-2 px-2 text-right font-bold text-orange-600">
                                                        {formatCurrency(material.price)}
                                                    </td>
                                                    <td className="py-2 px-2 text-center">
                                                        <div className="flex justify-center gap-1">
                                                            <button
                                                                onClick={() => addEstimateItem(material)}
                                                                className="p-1.5 bg-orange-100 text-orange-600 hover:bg-orange-200 rounded-lg transition-colors"
                                                                title="加入估算"
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => startEditMaterial(material)}
                                                                className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                                                title="編輯價格"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {currentMaterials.length > 0 && currentMaterials[0].note && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                                <strong>備註：</strong>
                                {currentMaterials.map((m, i) => (
                                    <span key={m.id}>
                                        {m.name}: {m.note}{i < currentMaterials.length - 1 ? ' | ' : ''}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 右側：估算清單與總計 */}
                <div className="space-y-4">
                    {/* 估算清單 */}
                    <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-2xl p-5 text-white">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold flex items-center gap-2">
                                <Calculator size={20} />
                                估算清單
                            </span>
                            {estimateItems.length > 0 && (
                                <button
                                    onClick={clearEstimate}
                                    className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                                >
                                    清空
                                </button>
                            )}
                        </div>

                        {estimateItems.length === 0 ? (
                            <div className="text-center py-8 text-orange-200">
                                <Package size={40} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">點擊物料 + 加入估算</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {estimateItems.map(item => (
                                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/20 last:border-0">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{item.name}</div>
                                            <div className="text-xs text-orange-200">
                                                {formatCurrency(item.price)} / {item.unit}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded text-sm"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                                                className="w-14 text-center bg-white/20 rounded py-1 text-sm"
                                            />
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded text-sm"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="p-1 hover:bg-white/20 rounded text-red-300"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 小計 */}
                        {estimateItems.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/30">
                                {estimateItems.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm text-orange-100 mb-1">
                                        <span>{item.name} × {item.quantity}</span>
                                        <span>{formatCurrency(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 總計 */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">材料總計</span>
                            <span className="text-3xl font-bold text-orange-600">
                                {formatCurrency(totalCost)}
                            </span>
                        </div>
                        <div className="text-xs text-gray-400 text-right">
                            共 {estimateItems.length} 項材料
                        </div>

                        {/* 快速估算 */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="text-sm font-medium text-gray-700 mb-2">快速估算（含工資）</div>
                            <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>+工資（約30%）</span>
                                    <span>{formatCurrency(totalCost * 0.3)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>+管理費（約10%）</span>
                                    <span>{formatCurrency(totalCost * 0.1)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-gray-800 pt-2 border-t">
                                    <span>預估總價</span>
                                    <span className="text-orange-600">{formatCurrency(totalCost * 1.4)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Drive 資料夾連結 */}
                    {driveFolder && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="text-sm font-medium text-green-800 mb-1">資料庫已同步</div>
                            <a
                                href={driveFolder.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 hover:underline"
                            >
                                開啟 Google Drive 資料夾 →
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* 估算公式說明 */}
            <div className="bg-gray-50 rounded-2xl p-5">
                <h4 className="font-bold text-gray-800 mb-3">常用估算公式</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded-xl">
                        <div className="font-medium text-gray-700 mb-1">🎨 油漆用量</div>
                        <div className="text-gray-500">面積(坪) × 0.5 = 用量(加侖)</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl">
                        <div className="font-medium text-gray-700 mb-1">🪵 木作板材</div>
                        <div className="text-gray-500">面積(才) ÷ 36 = 需要片數</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl">
                        <div className="font-medium text-gray-700 mb-1">🧱 磁磚損耗</div>
                        <div className="text-gray-500">面積(坪) × 1.1 = 含損耗量</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CostEstimator;
