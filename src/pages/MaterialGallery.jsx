
import React, { useState } from 'react';
import { Plus, Image as ImageIcon, ExternalLink, Globe, FolderPlus, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { InputField } from '../components/common/InputField';
import { SectionTitle } from '../components/common/Indicators';
import { GoogleService } from '../services/GoogleService';

export const MaterialGallery = ({ addToast }) => {
    const [categories, setCategories] = useState([
        {
            id: 1, name: "大理石", driveFolder: null, materials: [
                { id: 101, title: "義大利白大理石", type: "image", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400", source: "Unsplash" },
            ]
        },
        {
            id: 2, name: "木紋", driveFolder: null, materials: [
                { id: 201, title: "日本檜木", type: "link", url: "https://example.com", source: "Official Site" }
            ]
        }
    ]);

    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [newCategory, setNewCategory] = useState("");
    const [newItem, setNewItem] = useState({ title: "", type: "image", url: "", source: "", description: "", externalLink: "" });
    const [isSaving, setIsSaving] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isEditMaterialOpen, setIsEditMaterialOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [deletingItem, setDeletingItem] = useState({ type: null, categoryId: null, materialId: null });
    const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // 獲取或建立「建材資料」根資料夾
    const getMaterialGalleryRoot = async () => {
        try {
            const result = await GoogleService.getOrCreateProjectRoot();
            if (!result.success) return null;

            // 在根資料夾下建立「建材資料」
            const galleryResult = await GoogleService.createDriveFolder('建材資料', result.folderId);
            return galleryResult.success ? galleryResult : null;
        } catch (e) {
            console.error('Failed to get material gallery root:', e);
            return null;
        }
    };

    // 新增類別（在Drive建立對應子資料夾）
    const handleAddCategory = async () => {
        if (!newCategory.trim()) {
            addToast?.("請輸入類別名稱", 'error');
            return;
        }

        setIsSaving(true);

        // 在Drive建立類別資料夾
        const galleryRoot = await getMaterialGalleryRoot();
        let driveFolderUrl = null;

        if (galleryRoot) {
            const categoryFolder = await GoogleService.createDriveFolder(newCategory, galleryRoot.folderId);
            if (categoryFolder.success) {
                driveFolderUrl = categoryFolder.url;
            }
        }

        const category = {
            id: Date.now(),
            name: newCategory,
            driveFolder: driveFolderUrl,
            materials: []
        };

        setCategories([...categories, category]);
        setNewCategory("");
        setIsAddCategoryOpen(false);
        setIsSaving(false);

        addToast?.(`類別「${newCategory}」已建立${driveFolderUrl ? '，Drive資料夾已同步' : ''}`, 'success');
    };

    // 新增材質到類別
    const handleAddMaterial = async () => {
        if (!newItem.title || !newItem.url) {
            addToast?.("請填寫名稱和連結", 'error');
            return;
        }

        const material = { ...newItem, id: Date.now() };

        setCategories(categories.map(cat =>
            cat.id === selectedCategory
                ? { ...cat, materials: [...cat.materials, material] }
                : cat
        ));

        setNewItem({ title: "", type: "image", url: "", source: "", description: "", externalLink: "" });
        setIsAddMaterialOpen(false);
        addToast?.(`材質「${newItem.title}」已新增`, 'success');
    };

    // 查看材質詳情
    const handleViewMaterial = (material) => {
        setSelectedMaterial(material);
        setIsDetailModalOpen(true);
    };

    // 開啟新增材質彈窗
    const openAddMaterial = (categoryId) => {
        setSelectedCategory(categoryId);
        setIsAddMaterialOpen(true);
    };

    // 開啟編輯材質彈窗
    const openEditMaterial = (material, categoryId) => {
        setEditingMaterial({ ...material, categoryId });
        setIsEditMaterialOpen(true);
    };

    // 儲存編輯的材質
    const handleSaveEditMaterial = () => {
        if (!editingMaterial?.title || !editingMaterial?.url) {
            addToast?.('請填寫名稱和連結', 'error');
            return;
        }

        setCategories(categories.map(cat =>
            cat.id === editingMaterial.categoryId
                ? {
                    ...cat,
                    materials: cat.materials.map(m =>
                        m.id === editingMaterial.id ? editingMaterial : m
                    )
                }
                : cat
        ));

        setIsEditMaterialOpen(false);
        setEditingMaterial(null);
        addToast?.(`建材「${editingMaterial.title}」已更新`, 'success');
    };

    // 開啟編輯類別彈窗
    const openEditCategory = (category) => {
        setEditingCategory({ ...category });
        setIsEditCategoryOpen(true);
    };

    // 儲存編輯的類別
    const handleSaveEditCategory = () => {
        if (!editingCategory?.name?.trim()) {
            addToast?.('請輸入類別名稱', 'error');
            return;
        }

        setCategories(categories.map(cat =>
            cat.id === editingCategory.id ? { ...cat, name: editingCategory.name } : cat
        ));

        setIsEditCategoryOpen(false);
        setEditingCategory(null);
        addToast?.(`類別已更新`, 'success');
    };

    // 開啟刪除確認
    const openDeleteConfirm = (type, categoryId, materialId = null) => {
        setDeletingItem({ type, categoryId, materialId });
        setIsDeleteConfirmOpen(true);
    };

    // 確認刪除
    const confirmDelete = () => {
        if (deletingItem.type === 'category') {
            setCategories(categories.filter(cat => cat.id !== deletingItem.categoryId));
            addToast?.('類別已刪除', 'success');
        } else if (deletingItem.type === 'material') {
            setCategories(categories.map(cat =>
                cat.id === deletingItem.categoryId
                    ? { ...cat, materials: cat.materials.filter(m => m.id !== deletingItem.materialId) }
                    : cat
            ));
            addToast?.('建材已刪除', 'success');
        }
        setIsDeleteConfirmOpen(false);
        setDeletingItem({ type: null, categoryId: null, materialId: null });
    };

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                <SectionTitle title="建材資料" />
                <button
                    onClick={() => setIsAddCategoryOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-morandi-text-accent text-white rounded-xl hover:bg-gray-800 transition-colors text-sm"
                >
                    <FolderPlus size={16} />
                    <span>新增類別</span>
                </button>
            </div>

            {/* 類別區塊 */}
            {categories.map(category => (
                <div key={category.id} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                        <h3 className="font-bold text-lg text-morandi-text-primary">{category.name}</h3>
                        <div className="flex items-center gap-2">
                            {category.driveFolder && (
                                <a href={category.driveFolder} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                    <ExternalLink size={12} /> Drive
                                </a>
                            )}
                            <button
                                onClick={() => openEditCategory(category)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="編輯類別"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => openDeleteConfirm('category', category.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="刪除類別"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                        {/* 新增按鈕 */}
                        <button
                            onClick={() => openAddMaterial(category.id)}
                            className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-morandi-blue-400 hover:text-morandi-blue-500 transition-colors bg-gray-50/50"
                        >
                            <Plus size={20} />
                            <span className="text-xs font-medium mt-1">新增材質</span>
                        </button>

                        {/* 材質項目 */}
                        {category.materials.map(m => (
                            <div
                                key={m.id}
                                className="group relative aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white hover:shadow-lg transition-all cursor-pointer"
                                onClick={() => handleViewMaterial(m)}
                            >
                                {m.type === 'image' ? (
                                    <img src={m.url} alt={m.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                                        <Globe size={28} opacity={0.3} />
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 sm:p-3">
                                    <div className="text-white font-bold text-xs sm:text-sm truncate">{m.title}</div>
                                    {m.description && <div className="text-white/80 text-[10px] truncate">{m.description}</div>}
                                    <div className="text-white/60 text-[10px] truncate">{m.source}</div>
                                    <div className="flex gap-1 mt-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEditMaterial(m, category.id); }}
                                            className="p-1 bg-white/20 hover:bg-white/40 rounded text-white"
                                            title="編輯"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openDeleteConfirm('material', category.id, m.id); }}
                                            className="p-1 bg-white/20 hover:bg-red-500/80 rounded text-white"
                                            title="刪除"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                        {m.externalLink && (
                                            <a
                                                href={m.externalLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1 bg-white/20 hover:bg-white/40 rounded text-white"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* 空狀態 */}
            {categories.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
                    <FolderPlus size={48} className="mx-auto mb-3 opacity-50" />
                    <p>尚無材質類別，點擊上方按鈕新增</p>
                </div>
            )}

            {/* 新增類別 Modal */}
            <Modal
                isOpen={isAddCategoryOpen}
                onClose={() => setIsAddCategoryOpen(false)}
                title="新增材質類別"
                onConfirm={handleAddCategory}
                confirmDisabled={isSaving}
                confirmText={isSaving ? '建立中...' : '建立'}
            >
                <div className="space-y-4">
                    <InputField
                        label="類別名稱"
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        placeholder="例：大理石、木紋、磁磚..."
                    />
                    <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                        📁 系統將自動在 Drive「建材資料」資料夾下建立對應的類別資料夾
                    </p>
                </div>
            </Modal>

            {/* 新增材質 Modal */}
            <Modal
                isOpen={isAddMaterialOpen}
                onClose={() => setIsAddMaterialOpen(false)}
                title="新增材質"
                onConfirm={handleAddMaterial}
            >
                <div className="space-y-4">
                    <InputField
                        label="名稱"
                        value={newItem.title}
                        onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                        placeholder="材質名稱"
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">類型</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setNewItem({ ...newItem, type: 'image' })}
                                className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${newItem.type === 'image' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                            >
                                圖片 URL
                            </button>
                            <button
                                onClick={() => setNewItem({ ...newItem, type: 'link' })}
                                className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${newItem.type === 'link' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                            >
                                網站連結
                            </button>
                        </div>
                    </div>

                    <InputField
                        label="連結/URL"
                        value={newItem.url}
                        onChange={e => setNewItem({ ...newItem, url: e.target.value })}
                        placeholder="https://..."
                    />

                    <InputField
                        label="來源備註"
                        value={newItem.source}
                        onChange={e => setNewItem({ ...newItem, source: e.target.value })}
                        placeholder="選填，如：Unsplash、官網"
                    />

                    <InputField
                        label="文字說明"
                        type="textarea"
                        value={newItem.description}
                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                        placeholder="選填，材質特性、用途說明等"
                    />

                    <InputField
                        label="外部網站連結"
                        value={newItem.externalLink}
                        onChange={e => setNewItem({ ...newItem, externalLink: e.target.value })}
                        placeholder="選填，如廠商官網、購買連結等"
                    />
                </div>
            </Modal>

            {/* 材質詳情 Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={selectedMaterial?.title || '材質詳情'}
                onConfirm={() => setIsDetailModalOpen(false)}
                confirmText="關閉"
            >
                {selectedMaterial && (
                    <div className="space-y-4">
                        {/* 圖片預覽 */}
                        {selectedMaterial.type === 'image' && (
                            <div className="rounded-xl overflow-hidden">
                                <img
                                    src={selectedMaterial.url}
                                    alt={selectedMaterial.title}
                                    className="w-full h-48 object-cover"
                                />
                            </div>
                        )}

                        {/* 基本資訊 */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">來源</div>
                                <div className="font-medium text-sm">{selectedMaterial.source || '-'}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">類型</div>
                                <div className="font-medium text-sm">{selectedMaterial.type === 'image' ? '圖片' : '連結'}</div>
                            </div>
                        </div>

                        {/* 文字說明 */}
                        {selectedMaterial.description && (
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500 mb-1">文字說明</div>
                                <div className="text-sm text-gray-700 whitespace-pre-wrap">{selectedMaterial.description}</div>
                            </div>
                        )}

                        {/* 連結區 */}
                        <div className="space-y-2">
                            {selectedMaterial.url && (
                                <a
                                    href={selectedMaterial.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg p-3"
                                >
                                    <Globe size={16} />
                                    <span className="truncate flex-1">{selectedMaterial.type === 'image' ? '開啟原圖' : '開啟連結'}</span>
                                    <ExternalLink size={14} />
                                </a>
                            )}
                            {selectedMaterial.externalLink && (
                                <a
                                    href={selectedMaterial.externalLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-green-600 hover:text-green-800 bg-green-50 rounded-lg p-3"
                                >
                                    <ExternalLink size={16} />
                                    <span className="truncate flex-1">外部網站連結</span>
                                    <ExternalLink size={14} />
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* 編輯類別 Modal */}
            <Modal
                isOpen={isEditCategoryOpen}
                onClose={() => { setIsEditCategoryOpen(false); setEditingCategory(null); }}
                title="編輯類別"
                onConfirm={handleSaveEditCategory}
                confirmText="儲存"
            >
                <div className="space-y-4">
                    <InputField
                        label="類別名稱"
                        value={editingCategory?.name || ''}
                        onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        placeholder="輸入類別名稱"
                    />
                </div>
            </Modal>

            {/* 編輯建材 Modal */}
            <Modal
                isOpen={isEditMaterialOpen}
                onClose={() => { setIsEditMaterialOpen(false); setEditingMaterial(null); }}
                title="編輯建材"
                onConfirm={handleSaveEditMaterial}
                confirmText="儲存"
            >
                {editingMaterial && (
                    <div className="space-y-4">
                        <InputField
                            label="名稱"
                            value={editingMaterial.title}
                            onChange={e => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
                            placeholder="建材名稱"
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">類型</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingMaterial({ ...editingMaterial, type: 'image' })}
                                    className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${editingMaterial.type === 'image' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                                >
                                    圖片 URL
                                </button>
                                <button
                                    onClick={() => setEditingMaterial({ ...editingMaterial, type: 'link' })}
                                    className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${editingMaterial.type === 'link' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                                >
                                    網站連結
                                </button>
                            </div>
                        </div>

                        <InputField
                            label="連結/URL"
                            value={editingMaterial.url}
                            onChange={e => setEditingMaterial({ ...editingMaterial, url: e.target.value })}
                            placeholder="https://..."
                        />

                        <InputField
                            label="來源備註"
                            value={editingMaterial.source || ''}
                            onChange={e => setEditingMaterial({ ...editingMaterial, source: e.target.value })}
                            placeholder="選填，如：官網、廠商"
                        />

                        <InputField
                            label="文字說明"
                            type="textarea"
                            value={editingMaterial.description || ''}
                            onChange={e => setEditingMaterial({ ...editingMaterial, description: e.target.value })}
                            placeholder="選填，建材特性、用途說明等"
                        />

                        <InputField
                            label="外部網站連結"
                            value={editingMaterial.externalLink || ''}
                            onChange={e => setEditingMaterial({ ...editingMaterial, externalLink: e.target.value })}
                            placeholder="選填，如廠商官網、購買連結等"
                        />
                    </div>
                )}
            </Modal>

            {/* 刪除確認 Modal */}
            <Modal
                isOpen={isDeleteConfirmOpen}
                onClose={() => { setIsDeleteConfirmOpen(false); setDeletingItem({ type: null, categoryId: null, materialId: null }); }}
                title="確認刪除"
                onConfirm={confirmDelete}
                confirmText="確認刪除"
            >
                <div className="text-center py-4">
                    <Trash2 size={48} className="mx-auto text-red-400 mb-4" />
                    <p className="text-gray-700">
                        {deletingItem.type === 'category'
                            ? '確定要刪除此類別嗎？類別下的所有建材也會一併刪除。'
                            : '確定要刪除此建材嗎？'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">此操作無法復原</p>
                </div>
            </Modal>
        </div>
    )
}
