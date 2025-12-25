
import React, { useState, useMemo } from 'react';
import { Modal } from '../components/common/Modal';
import { InputField } from '../components/common/InputField';
import { LocationField } from '../components/common/LocationField';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { SectionTitle, LoadingSkeleton } from '../components/common/Indicators';
import {
    Phone, Folder, Edit2, Trash2, Cloud, ChevronLeft, Save, Plus,
    Search, HardHat, Star, Building, MapPin, User, Tag, X, ChevronRight,
    ThumbsUp, ThumbsDown, MessageSquare, Clock, Wrench, Briefcase
} from 'lucide-react';
import { GoogleService } from '../services/GoogleService';

// 狀態配置
const STATUS_CONFIG = {
    '長期合作': { color: 'green', bg: 'bg-green-100 text-green-700' },
    '合作中': { color: 'blue', bg: 'bg-blue-100 text-blue-700' },
    '觀察中': { color: 'yellow', bg: 'bg-yellow-100 text-yellow-700' },
    '黑名單': { color: 'red', bg: 'bg-red-100 text-red-700' },
};

// 類別配置
const CATEGORY_CONFIG = {
    '工程工班': { icon: HardHat, color: 'orange' },
    '建材供應': { icon: Building, color: 'blue' },
    '設備廠商': { icon: Wrench, color: 'purple' },
    '其他': { icon: Tag, color: 'gray' },
};

// 星星評分組件
const StarRating = ({ rating, onChange, readonly = false }) => {
    const stars = [1, 2, 3, 4, 5];
    const currentRating = parseFloat(rating) || 0;

    return (
        <div className="flex items-center gap-1">
            {stars.map(star => (
                <button
                    key={star}
                    type="button"
                    onClick={() => !readonly && onChange?.(star.toString())}
                    className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
                    disabled={readonly}
                >
                    <Star
                        size={readonly ? 14 : 20}
                        className={star <= currentRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                </button>
            ))}
            {!readonly && <span className="ml-2 text-sm text-gray-500">{currentRating}/5</span>}
        </div>
    );
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
                    color === 'orange' ? 'bg-orange-100 text-orange-600' :
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

// 廠商列表項目
const VendorRow = ({ vendor, onSelect, onDelete }) => {
    const statusConfig = STATUS_CONFIG[vendor.status] || STATUS_CONFIG['合作中'];
    const categoryConfig = CATEGORY_CONFIG[vendor.category] || CATEGORY_CONFIG['其他'];
    const CategoryIcon = categoryConfig.icon;

    return (
        <div
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group gap-2 sm:gap-0"
            onClick={() => onSelect(vendor)}
        >
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${categoryConfig.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                    categoryConfig.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        categoryConfig.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                            'bg-gray-100 text-gray-600'
                    }`}>
                    <CategoryIcon size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                        <span className="truncate">{vendor.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusConfig.bg}`}>
                            {vendor.status}
                        </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                        {vendor.tradeType && <span className="flex items-center gap-1"><Wrench size={12} /> {vendor.tradeType}</span>}
                        {vendor.contactPerson && <span className="hidden sm:flex items-center gap-1"><User size={12} /> {vendor.contactPerson}</span>}
                        <StarRating rating={vendor.rating} readonly />
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(vendor.id); }}
                    className="sm:opacity-0 sm:group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                    <Trash2 size={16} />
                </button>
                <ChevronRight size={20} className="text-gray-300" />
            </div>
        </div>
    );
};

// 評價記錄項目
const ReviewItem = ({ review }) => (
    <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${review.sentiment === 'positive' ? 'bg-green-100' : review.sentiment === 'negative' ? 'bg-red-100' : 'bg-gray-100'
            }`}>
            {review.sentiment === 'positive' ? <ThumbsUp size={14} className="text-green-600" /> :
                review.sentiment === 'negative' ? <ThumbsDown size={14} className="text-red-600" /> :
                    <MessageSquare size={14} className="text-gray-600" />}
        </div>
        <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">{review.project}</div>
            <div className="text-xs text-gray-500 mt-0.5">{review.date} - {review.note}</div>
        </div>
    </div>
);

const Vendors = ({ data = [], loading, addToast, onUpdateVendors, allProjects = [] }) => {
    // 狀態管理
    const [vendorsList, setVendorsList] = useState(data);
    const [activeVendor, setActiveVendor] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentVendor, setCurrentVendor] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingVendor, setDeletingVendor] = useState(null);

    // 搜尋與篩選
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('全部');
    const [statusFilter, setStatusFilter] = useState('全部');

    // 評價 Modal
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [newReview, setNewReview] = useState({ project: '', date: new Date().toISOString().split('T')[0], note: '', sentiment: 'neutral' });

    // 同步 data
    React.useEffect(() => { setVendorsList(data); }, [data]);

    // 計算統計
    const stats = useMemo(() => ({
        total: vendorsList.length,
        crews: vendorsList.filter(v => v.category === '工程工班').length,
        suppliers: vendorsList.filter(v => v.category === '建材供應').length,
        longTerm: vendorsList.filter(v => v.status === '長期合作').length,
    }), [vendorsList]);

    // 篩選後的廠商列表
    const filteredVendors = useMemo(() => {
        return vendorsList.filter(vendor => {
            const matchesSearch = searchTerm === '' ||
                vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vendor.tradeType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vendor.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === '全部' || vendor.category === categoryFilter;
            const matchesStatus = statusFilter === '全部' || vendor.status === statusFilter;
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [vendorsList, searchTerm, categoryFilter, statusFilter]);

    // 操作函數
    const handleOpenAdd = () => {
        setCurrentVendor({
            name: "", category: "工程工班", tradeType: "", contactPerson: "",
            phone: "", email: "", lineId: "", address: "", rating: "5", status: "合作中", tags: "", reviews: []
        });
        setIsModalOpen(true);
    };

    const handleSaveVendor = async () => {
        if (!currentVendor.name) return addToast("請輸入廠商名稱", 'error');

        setIsSaving(true);
        const tagsArray = typeof currentVendor.tags === 'string'
            ? currentVendor.tags.split(',').map(t => t.trim()).filter(t => t !== "")
            : currentVendor.tags || [];
        const vendorToSave = { ...currentVendor, tags: tagsArray, id: currentVendor.id || `v-${Date.now()}` };

        let driveResult = null;
        if (!currentVendor.id) {
            driveResult = await GoogleService.createDriveFolder(currentVendor.name);
            if (!driveResult.success) {
                setIsSaving(false);
                return addToast(`Drive 資料夾建立失敗: ${driveResult.error}`, 'error');
            }
            vendorToSave.driveFolder = driveResult.url;
            vendorToSave.createdAt = new Date().toISOString();
        }

        const newVendorsList = currentVendor.id
            ? vendorsList.map(v => v.id === vendorToSave.id ? vendorToSave : v)
            : [...vendorsList, vendorToSave];
        setVendorsList(newVendorsList);
        if (onUpdateVendors) onUpdateVendors(newVendorsList);

        const syncResult = await GoogleService.syncToSheet('vendors', newVendorsList);
        setIsSaving(false);

        if (!syncResult.success) {
            addToast(`Sheets 同步失敗: ${syncResult.error}`, 'error');
        } else if (currentVendor.id) {
            addToast("廠商資料已更新！", 'success');
        } else {
            addToast("新廠商已建立！", 'success', {
                action: driveResult?.url ? { label: '開啟 Drive', onClick: () => window.open(driveResult.url, '_blank') } : null
            });
        }

        setIsModalOpen(false);
    };

    // 開啟刪除確認 Modal
    const openDeleteModal = (vendor) => {
        setDeletingVendor(vendor);
        setIsDeleteModalOpen(true);
    };

    // 確認刪除廠商
    const confirmDeleteVendor = async () => {
        if (!deletingVendor) return;

        const updatedList = vendorsList.filter(v => v.id !== deletingVendor.id);
        setVendorsList(updatedList);
        if (onUpdateVendors) onUpdateVendors(updatedList);
        await GoogleService.syncToSheet('vendors', updatedList);
        addToast(`廠商「${deletingVendor.name}」已刪除！`, 'success');

        if (activeVendor?.id === deletingVendor.id) setActiveVendor(null);
        setIsDeleteModalOpen(false);
        setDeletingVendor(null);
    };

    const startEdit = () => {
        setCurrentVendor({ ...activeVendor, tags: activeVendor.tags?.join(', ') || '' });
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        setIsSaving(true);
        const tagsArray = typeof currentVendor.tags === 'string'
            ? currentVendor.tags.split(',').map(t => t.trim()).filter(t => t !== "")
            : currentVendor.tags || [];
        const updatedVendor = { ...currentVendor, tags: tagsArray };

        const newList = vendorsList.map(v => v.id === updatedVendor.id ? updatedVendor : v);
        setVendorsList(newList);
        if (onUpdateVendors) onUpdateVendors(newList);

        const syncResult = await GoogleService.syncToSheet('vendors', newList);
        setIsSaving(false);

        if (!syncResult.success) {
            addToast(`同步失敗: ${syncResult.error}`, 'error');
        } else {
            setActiveVendor(updatedVendor);
            setIsEditing(false);
            addToast("資料已更新", 'success');
        }
    };

    // 新增評價
    const handleAddReview = async () => {
        if (!newReview.note) return addToast("請輸入評價內容", "error");

        const updatedVendor = {
            ...activeVendor,
            reviews: [...(activeVendor.reviews || []), { ...newReview, id: Date.now() }]
        };

        const newList = vendorsList.map(v => v.id === updatedVendor.id ? updatedVendor : v);
        setVendorsList(newList);
        setActiveVendor(updatedVendor);
        if (onUpdateVendors) onUpdateVendors(newList);

        await GoogleService.syncToSheet('vendors', newList);
        setIsReviewModalOpen(false);
        setNewReview({ project: '', date: new Date().toISOString().split('T')[0], note: '', sentiment: 'neutral' });
        addToast("評價已新增", "success");
    };

    // 廠商詳情頁
    if (activeVendor) {
        const statusConfig = STATUS_CONFIG[activeVendor.status] || STATUS_CONFIG['合作中'];
        const categoryConfig = CATEGORY_CONFIG[activeVendor.category] || CATEGORY_CONFIG['其他'];
        const CategoryIcon = categoryConfig.icon;

        return (
            <div className="space-y-6 animate-fade-in">
                <button onClick={() => { setActiveVendor(null); setIsEditing(false); }} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
                    <ChevronLeft size={16} /> 返回列表
                </button>

                {/* 廠商標題 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${categoryConfig.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                                categoryConfig.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                    categoryConfig.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                                        'bg-gray-100 text-gray-600'
                                }`}>
                                <CategoryIcon size={32} />
                            </div>
                            <div>
                                {isEditing ? (
                                    <input
                                        value={currentVendor.name}
                                        onChange={e => setCurrentVendor({ ...currentVendor, name: e.target.value })}
                                        className="text-2xl font-bold text-gray-900 border-b border-gray-300 focus:outline-none bg-transparent"
                                    />
                                ) : (
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                                        {activeVendor.name}
                                        <span className={`text-sm px-3 py-1 rounded-full ${statusConfig.bg}`}>
                                            {activeVendor.status}
                                        </span>
                                    </h2>
                                )}
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <span className="text-sm text-gray-500">{activeVendor.category} - {activeVendor.tradeType}</span>
                                    <StarRating rating={activeVendor.rating} readonly />
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
                                    {activeVendor.driveFolder && (
                                        <a href={activeVendor.driveFolder} target="_blank" rel="noreferrer" className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-100 border border-blue-100">
                                            <Folder size={16} /> 雲端資料夾
                                        </a>
                                    )}
                                    <button onClick={startEdit} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                                        <Edit2 size={14} /> 編輯
                                    </button>
                                    <button onClick={() => openDeleteModal(activeVendor)} className="bg-white border border-red-200 text-red-500 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50 flex items-center gap-2">
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
                            <HardHat size={18} /> 廠商資料
                        </h3>
                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">類別</label>
                                        <select value={currentVendor.category} onChange={e => setCurrentVendor({ ...currentVendor, category: e.target.value })} className="w-full border rounded-lg px-3 py-2 bg-white">
                                            {Object.keys(CATEGORY_CONFIG).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <InputField label="工種/項目" value={currentVendor.tradeType} onChange={e => setCurrentVendor({ ...currentVendor, tradeType: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField label="聯絡人" value={currentVendor.contactPerson} onChange={e => setCurrentVendor({ ...currentVendor, contactPerson: e.target.value })} />
                                    <InputField label="電話" value={currentVendor.phone} onChange={e => setCurrentVendor({ ...currentVendor, phone: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField label="統一編號" value={currentVendor.taxId || ''} onChange={e => setCurrentVendor({ ...currentVendor, taxId: e.target.value })} placeholder="8位數統一編號" />
                                    <InputField label="銀行帳號" value={currentVendor.bankAccount || ''} onChange={e => setCurrentVendor({ ...currentVendor, bankAccount: e.target.value })} placeholder="例：812-1234-5678-901" />
                                </div>
                                <LocationField label="地址" value={currentVendor.address} onChange={e => setCurrentVendor({ ...currentVendor, address: e.target.value })} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">評分</label>
                                        <StarRating rating={currentVendor.rating} onChange={(val) => setCurrentVendor({ ...currentVendor, rating: val })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">狀態</label>
                                        <select value={currentVendor.status} onChange={e => setCurrentVendor({ ...currentVendor, status: e.target.value })} className="w-full border rounded-lg px-3 py-2 bg-white">
                                            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <InputField label="標籤 (逗號分隔)" value={currentVendor.tags} onChange={e => setCurrentVendor({ ...currentVendor, tags: e.target.value })} placeholder="例：配合度高, 手工細緻" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 block mb-1"><User size={14} className="inline mr-1" />聯絡人</span>
                                    <span className="text-gray-900">{activeVendor.contactPerson || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block mb-1"><Phone size={14} className="inline mr-1" />電話</span>
                                    <span className="text-gray-900">{activeVendor.phone || '-'}</span>
                                </div>
                                {activeVendor.address && (
                                    <div className="col-span-2">
                                        <span className="text-gray-500 block mb-1"><MapPin size={14} className="inline mr-1" />地址</span>
                                        <span className="text-gray-900">{activeVendor.address}</span>
                                    </div>
                                )}
                                {activeVendor.email && (
                                    <div>
                                        <span className="text-gray-500 block mb-1">Email</span>
                                        <span className="text-gray-900">{activeVendor.email}</span>
                                    </div>
                                )}
                                {activeVendor.lineId && (
                                    <div>
                                        <span className="text-gray-500 block mb-1">LINE ID</span>
                                        <span className="text-gray-900">{activeVendor.lineId}</span>
                                    </div>
                                )}
                                {activeVendor.taxId && (
                                    <div>
                                        <span className="text-gray-500 block mb-1">統一編號</span>
                                        <span className="text-gray-900 font-mono">{activeVendor.taxId}</span>
                                    </div>
                                )}
                                {activeVendor.bankAccount && (
                                    <div>
                                        <span className="text-gray-500 block mb-1">銀行帳號</span>
                                        <span className="text-gray-900 font-mono">{activeVendor.bankAccount}</span>
                                    </div>
                                )}
                                {activeVendor.tags?.length > 0 && (
                                    <div className="col-span-2">
                                        <span className="text-gray-500 block mb-1"><Tag size={14} className="inline mr-1" />標籤</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {activeVendor.tags.map((tag, idx) => (
                                                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* 合作評價 */}
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <MessageSquare size={18} /> 合作評價
                            </h3>
                            <button
                                onClick={() => setIsReviewModalOpen(true)}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                <Plus size={14} /> 新增
                            </button>
                        </div>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {(activeVendor.reviews || []).length > 0 ? (
                                activeVendor.reviews.slice().reverse().map((review, idx) => (
                                    <ReviewItem key={idx} review={review} />
                                ))
                            ) : (
                                <div className="text-sm text-gray-400 text-center py-8">
                                    尚無評價記錄
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* 服務專案 */}
                    <Card className="lg:col-span-3">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Briefcase size={18} /> 服務專案
                        </h3>
                        {(() => {
                            const relatedProjects = allProjects.filter(p =>
                                p.vendors?.some(v => v.name === activeVendor.name || v.id === activeVendor.id) ||
                                p.vendorIds?.includes(activeVendor.id)
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
                                    尚無服務專案記錄
                                </div>
                            );
                        })()}
                    </Card>
                </div>

                {/* 新增評價 Modal */}
                <Modal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    title="新增合作評價"
                    onConfirm={handleAddReview}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField label="專案名稱" value={newReview.project} onChange={e => setNewReview({ ...newReview, project: e.target.value })} placeholder="例：陳宅裝修案" />
                            <InputField label="日期" type="date" value={newReview.date} onChange={e => setNewReview({ ...newReview, date: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-2">評價傾向</label>
                            <div className="flex gap-2">
                                {[
                                    { value: 'positive', label: '正面', icon: ThumbsUp, color: 'green' },
                                    { value: 'neutral', label: '中立', icon: MessageSquare, color: 'gray' },
                                    { value: 'negative', label: '負面', icon: ThumbsDown, color: 'red' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setNewReview({ ...newReview, sentiment: opt.value })}
                                        className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${newReview.sentiment === opt.value
                                            ? opt.color === 'green' ? 'bg-green-100 text-green-700 border-2 border-green-300'
                                                : opt.color === 'red' ? 'bg-red-100 text-red-700 border-2 border-red-300'
                                                    : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
                                            : 'bg-gray-50 text-gray-500 border border-gray-200'
                                            }`}
                                    >
                                        <opt.icon size={16} />
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">評價內容</label>
                            <textarea
                                value={newReview.note}
                                onChange={e => setNewReview({ ...newReview, note: e.target.value })}
                                placeholder="記錄合作心得..."
                                className="w-full border rounded-lg px-3 py-2 min-h-[100px] resize-none"
                            />
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }

    // 廠商列表頁
    return (
        <div className="space-y-6 animate-fade-in">
            <SectionTitle title="廠商管理" />

            {loading ? <LoadingSkeleton /> : (
                <>
                    {/* 統計卡片 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <StatCard icon={HardHat} label="總廠商數" value={stats.total} color="gray" onClick={() => { setCategoryFilter('全部'); setStatusFilter('全部'); }} />
                        <StatCard icon={Wrench} label="工程工班" value={stats.crews} color="orange" onClick={() => setCategoryFilter('工程工班')} />
                        <StatCard icon={Building} label="建材供應" value={stats.suppliers} color="blue" onClick={() => setCategoryFilter('建材供應')} />
                        <StatCard icon={Star} label="長期合作" value={stats.longTerm} color="green" onClick={() => setStatusFilter('長期合作')} />
                    </div>

                    {/* 搜尋與篩選列 */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="搜尋廠商名稱、工種、聯絡人..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-blue-500 outline-none"
                        >
                            <option value="全部">全部類別</option>
                            {Object.keys(CATEGORY_CONFIG).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
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
                        {(searchTerm || categoryFilter !== '全部' || statusFilter !== '全部') && (
                            <button
                                onClick={() => { setSearchTerm(''); setCategoryFilter('全部'); setStatusFilter('全部'); }}
                                className="px-3 py-2.5 text-gray-500 hover:text-gray-700 flex items-center gap-1"
                            >
                                <X size={16} /> 清除
                            </button>
                        )}
                        <button
                            onClick={handleOpenAdd}
                            className="ml-auto bg-morandi-text-accent text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <Plus size={16} /> 新增廠商
                        </button>
                    </div>

                    {/* 廠商列表 */}
                    <div className="space-y-3">
                        {filteredVendors.length > 0 ? (
                            filteredVendors.map(vendor => (
                                <VendorRow
                                    key={vendor.id}
                                    vendor={vendor}
                                    onSelect={setActiveVendor}
                                    onDelete={() => openDeleteModal(vendor)}
                                />
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                {searchTerm || categoryFilter !== '全部' || statusFilter !== '全部' ? '無符合條件的廠商' : '尚無廠商資料'}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* 新增/編輯廠商 Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setIsSaving(false); }}
                title={currentVendor?.id ? "編輯廠商" : "新增廠商"}
                onConfirm={handleSaveVendor}
                confirmDisabled={isSaving}
                confirmText={isSaving ? '處理中...' : '確定'}
            >
                {currentVendor && (
                    <div className="space-y-4">
                        <InputField label="廠商名稱" value={currentVendor.name} onChange={e => setCurrentVendor({ ...currentVendor, name: e.target.value })} placeholder="必填" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">類別</label>
                                <select value={currentVendor.category} onChange={e => setCurrentVendor({ ...currentVendor, category: e.target.value })} className="w-full border rounded-lg px-3 py-2 bg-white">
                                    {Object.keys(CATEGORY_CONFIG).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <InputField label="工種/項目" value={currentVendor.tradeType} onChange={e => setCurrentVendor({ ...currentVendor, tradeType: e.target.value })} placeholder="例：木工、水電" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField label="聯絡人" value={currentVendor.contactPerson} onChange={e => setCurrentVendor({ ...currentVendor, contactPerson: e.target.value })} />
                            <InputField label="電話" value={currentVendor.phone} onChange={e => setCurrentVendor({ ...currentVendor, phone: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField label="Email" value={currentVendor.email || ''} onChange={e => setCurrentVendor({ ...currentVendor, email: e.target.value })} placeholder="例：vendor@email.com" />
                            <InputField label="LINE ID" value={currentVendor.lineId || ''} onChange={e => setCurrentVendor({ ...currentVendor, lineId: e.target.value })} placeholder="例：@lineid" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField label="統一編號" value={currentVendor.taxId || ''} onChange={e => setCurrentVendor({ ...currentVendor, taxId: e.target.value })} placeholder="8位數統一編號" />
                            <InputField label="銀行帳號" value={currentVendor.bankAccount || ''} onChange={e => setCurrentVendor({ ...currentVendor, bankAccount: e.target.value })} placeholder="例：812-1234-5678-901" />
                        </div>
                        <LocationField label="地址" value={currentVendor.address} onChange={e => setCurrentVendor({ ...currentVendor, address: e.target.value })} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">評分</label>
                                <StarRating rating={currentVendor.rating} onChange={(val) => setCurrentVendor({ ...currentVendor, rating: val })} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">狀態</label>
                                <select value={currentVendor.status} onChange={e => setCurrentVendor({ ...currentVendor, status: e.target.value })} className="w-full border rounded-lg px-3 py-2 bg-white">
                                    {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <InputField label="標籤 (逗號分隔)" value={currentVendor.tags} onChange={e => setCurrentVendor({ ...currentVendor, tags: e.target.value })} placeholder="例：配合度高, 手工細緻" />
                        <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg flex items-center gap-2">
                            <Cloud size={14} /> 系統將自動於 Google Drive 建立專屬資料夾
                        </div>
                    </div>
                )}
            </Modal>

            {/* 刪除確認 Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setDeletingVendor(null); }}
                title="確認刪除廠商"
                onConfirm={confirmDeleteVendor}
                confirmText="確定刪除"
            >
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 font-medium">⚠️ 此操作無法復原</p>
                    </div>
                    <p className="text-gray-700">
                        您確定要刪除廠商「<span className="font-bold">{deletingVendor?.name}</span>」嗎？
                    </p>
                    <p className="text-sm text-gray-500">
                        刪除後，該廠商的所有資料將從系統中移除。
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default Vendors;
