
import React, { useState, useRef, useEffect } from 'react';
import { WidgetWrapper } from '../components/common/WidgetWrapper';
import { WidgetFinanceAccounts, WidgetFinanceTrend, WidgetFinanceTransactions } from '../components/widgets/FinanceWidgets';
import { AccountDetailsModal } from '../components/finance/AccountDetailsModal';
import { Modal } from '../components/common/Modal';
import { InputField } from '../components/common/InputField';
import { SectionTitle } from '../components/common/Indicators';
import { Plus } from 'lucide-react';

const Finance = ({ data, loading, addToast, onAddTx, onUpdateAccounts }) => {
    const [accounts, setAccounts] = useState(data.accounts || []);
    const accountsRef = useRef(accounts);

    // Sync accounts when data.accounts changes (from API/Sheet)
    useEffect(() => {
        setAccounts(data.accounts || []);
    }, [data.accounts]);

    // Keep ref in sync with state for drag-drop
    useEffect(() => {
        accountsRef.current = accounts;
    }, [accounts]);
    const [widgets, setWidgets] = useState([
        { id: 'wf-acc', type: 'finance-acc', title: '資金帳戶', size: 'L' },
        { id: 'wf-trend', type: 'finance-trend', title: '收支趨勢', size: 'M' },
        { id: 'wf-tx', type: 'finance-tx', title: '收支明細', size: 'L' }
    ]);

    // Transaction Modal State
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [newTx, setNewTx] = useState({ type: "支出", amount: "", date: "", desc: "", accountId: "" });

    // Account Modal State
    const [isAccModalOpen, setIsAccModalOpen] = useState(false);
    const [editingAcc, setEditingAcc] = useState(null);
    const [newAcc, setNewAcc] = useState({ name: "", bank: "", number: "", balance: 0 });

    // Delete Account State
    const [isDeleteAccModalOpen, setIsDeleteAccModalOpen] = useState(false);
    const [deletingAcc, setDeletingAcc] = useState(null);

    // Account Details State
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);

    // Drag Refs
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleResize = (id, size) => setWidgets(prev => prev.map(w => w.id === id ? { ...w, size } : w));

    // Widget Drag Sorting
    const handleDragStart = (e, idx) => { dragItem.current = idx; };
    const handleDragEnter = (e, idx) => {
        dragOverItem.current = idx;
        const copy = [...widgets]; const dragContent = copy[dragItem.current];
        copy.splice(dragItem.current, 1); copy.splice(dragOverItem.current, 0, dragContent);
        dragItem.current = idx; setWidgets(copy);
    };
    const handleDragEnd = () => { dragItem.current = null; dragOverItem.current = null; };

    // Account Drag Sorting
    const handleDragStartAccount = (e, idx) => { dragItem.current = idx; };
    const handleDragOverAccount = (e, idx) => {
        e.preventDefault();
        dragOverItem.current = idx;
        const copy = [...accounts]; const item = copy[dragItem.current];
        copy.splice(dragItem.current, 1); copy.splice(dragOverItem.current, 0, item);
        dragItem.current = idx;
        setAccounts(copy);
    };
    const handleDragEndAccount = () => {
        dragItem.current = null; dragOverItem.current = null;
        onUpdateAccounts(accounts);
        // GoogleService.syncToSheet('accounts', accounts); // TODO: Implement sync
    };

    // Account CRUD
    const openAddAcc = () => { setEditingAcc(null); setNewAcc({ name: "", bank: "", number: "", balance: 0 }); setIsAccModalOpen(true); };
    const openEditAcc = (acc) => { setEditingAcc(acc); setNewAcc(acc); setIsAccModalOpen(true); };

    const handleSaveAccount = async () => {
        const updatedAccounts = editingAcc
            ? accounts.map(a => a.id === editingAcc.id ? { ...editingAcc, ...newAcc } : a)
            : [...accounts, { ...newAcc, id: `a-${Date.now()}` }];

        setAccounts(updatedAccounts);
        onUpdateAccounts(updatedAccounts); // Update App State
        // await GoogleService.syncToSheet('accounts', updatedAccounts); // TODO: Implement sync

        addToast(editingAcc ? "帳戶更新成功！" : "新帳戶建立成功！", 'success');
        setIsAccModalOpen(false);
        setEditingAcc(null);
    };

    // Delete Account Handler
    const handleDeleteAccount = (acc) => {
        setDeletingAcc(acc);
        setIsDeleteAccModalOpen(true);
    };

    const confirmDeleteAccount = () => {
        const updatedAccounts = accounts.filter(a => a.id !== deletingAcc.id);
        setAccounts(updatedAccounts);
        onUpdateAccounts(updatedAccounts);
        addToast(`帳戶「${deletingAcc.name}」已刪除`, 'success');
        setIsDeleteAccModalOpen(false);
        setDeletingAcc(null);
    };

    // Account Details Handler
    const handleViewDetails = (acc) => {
        setSelectedAccount(acc);
        setIsDetailsModalOpen(true);
    };

    const handleConfirmTx = async () => {
        // Validation
        if (!newTx.accountId || !newTx.amount || parseFloat(newTx.amount) <= 0) {
            addToast('請填寫完整資料並確認金額大於0', 'error');
            return;
        }

        const txWithNumber = { ...newTx, amount: parseFloat(newTx.amount) };
        onAddTx(txWithNumber); // Handles App State update and Toast inside App.jsx
        setIsTxModalOpen(false);
        setNewTx({ type: "支出", amount: "", date: "", desc: "", accountId: "" });
        // await GoogleService.syncToSheet('transactions', txWithNumber); // TODO: Implement sync
    };

    const renderWidget = (w) => {
        switch (w.type) {
            case 'finance-acc':
                return (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-end mb-2">
                            <button onClick={openAddAcc} className="text-xs text-morandi-blue-600 hover:underline flex items-center gap-1"><Plus size={12} /> 新增帳戶</button>
                        </div>
                        <WidgetFinanceAccounts
                            data={accounts}
                            size={w.size}
                            onEdit={openEditAcc}
                            onDelete={handleDeleteAccount}
                            onViewDetails={handleViewDetails}
                            onDragStartAccount={handleDragStartAccount}
                            onDragOverAccount={handleDragOverAccount}
                            onDragEndAccount={handleDragEndAccount}
                        />
                    </div>
                );
            case 'finance-trend': return <WidgetFinanceTrend size={w.size} />;
            case 'finance-tx': return <WidgetFinanceTransactions data={data.transactions} size={w.size} onAddTx={() => setIsTxModalOpen(true)} />;
            default: return null;
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <SectionTitle title="財務管理" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-auto">
                {widgets.map((w, i) => (
                    <WidgetWrapper key={w.id} widget={w} onResize={handleResize} onDragStart={(e) => handleDragStart(e, i)} onDragEnter={(e) => handleDragEnter(e, i)} onDragEnd={handleDragEnd}>
                        {renderWidget(w)}
                    </WidgetWrapper>
                ))}
            </div>

            {/* Transaction Modal */}
            <Modal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} title="新增收支紀錄" onConfirm={handleConfirmTx}>
                <div className="flex gap-4 mb-6 bg-gray-50 p-1 rounded-xl">
                    <button onClick={() => setNewTx({ ...newTx, type: '收入' })} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${newTx.type === '收入' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}>收入</button>
                    <button onClick={() => setNewTx({ ...newTx, type: '支出' })} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${newTx.type === '支出' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}>支出</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="金額" type="number" value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: e.target.value })} placeholder="請輸入金額" />
                    <InputField label="日期" type="date" value={newTx.date} onChange={e => setNewTx({ ...newTx, date: e.target.value })} />
                </div>
                <InputField label="摘要" value={newTx.desc} onChange={e => setNewTx({ ...newTx, desc: e.target.value })} placeholder="例：油漆補料" />
                <InputField label="帳戶" type="select" value={newTx.accountId} onChange={e => setNewTx({ ...newTx, accountId: e.target.value })}>
                    <option value="" disabled>請選擇帳戶</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                </InputField>
            </Modal>

            {/* Account Modal */}
            <Modal isOpen={isAccModalOpen} onClose={() => setIsAccModalOpen(false)} title={editingAcc ? "編輯帳戶" : "新增帳戶"} onConfirm={handleSaveAccount}>
                <InputField label="帳戶名稱" value={newAcc.name} onChange={e => setNewAcc({ ...newAcc, name: e.target.value })} placeholder="例：公司零用金" />
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="銀行/機構" value={newAcc.bank} onChange={e => setNewAcc({ ...newAcc, bank: e.target.value })} />
                    <InputField label="帳號 (選填)" value={newAcc.number} onChange={e => setNewAcc({ ...newAcc, number: e.target.value })} />
                </div>
                <InputField label="初始餘額" type="number" value={newAcc.balance} onChange={e => setNewAcc({ ...newAcc, balance: Number(e.target.value) })} />
            </Modal>

            {/* Delete Account Modal */}
            <Modal
                isOpen={isDeleteAccModalOpen}
                onClose={() => setIsDeleteAccModalOpen(false)}
                title="確認刪除帳戶"
                onConfirm={confirmDeleteAccount}
                confirmText="確定刪除"
            >
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                        <p className="text-red-800 font-medium">⚠️ 警告：此操作無法復原</p>
                    </div>
                    <p className="text-gray-700">
                        您確定要刪除帳戶「<span className="font-bold">{deletingAcc?.name}</span>」嗎？
                    </p>
                    <p className="text-sm text-gray-500">
                        刪除後，該帳戶的所有交易記錄仍會保留，但帳戶資訊將無法恢復。
                    </p>
                </div>
            </Modal>

            {/* Account Details Modal */}
            <AccountDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                account={selectedAccount}
                allTransactions={data.transactions || []}
            />
        </div>
    );
};
export default Finance;
