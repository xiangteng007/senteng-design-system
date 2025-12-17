
import React, { useState } from 'react';
import { Wallet, ChevronDown, ChevronUp, Plus, GripVertical } from 'lucide-react';
import { TrendChart } from './TrendChart'; // Helper needed

const AccountCard = ({ account, onEdit, onViewDetails, onDragStart, onDragOver, onDragEnd }) => {
    const [expanded, setExpanded] = useState(false);

    // Dynamic border color based on bank/custom
    const borderColor = expanded ? "border-morandi-blue-300" : "border-gray-100";

    return (
        <div
            draggable
            onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}
            className={`bg-white rounded-2xl border ${borderColor} shadow-sm transition-all duration-300 mb-3 overflow-hidden cursor-default`}
        >
            <div
                onClick={() => setExpanded(!expanded)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50"
            >
                <div className="flex items-center gap-3">
                    <div className="text-gray-300 cursor-grab active:cursor-grabbing p-1" onMouseDown={e => e.stopPropagation()}>
                        <GripVertical size={16} />
                    </div>
                    <div>
                        <div className="font-bold text-gray-800">{account.name}</div>
                        {/* Show last tx summary if collapsed? For now show simple info */}
                        {!expanded && <div className="text-xs text-gray-400">最新收支: -</div>}
                    </div>
                </div>
                <div className="text-right">
                    <div className={`font-bold font-mono ${account.balance < 0 ? 'text-red-500' : 'text-gray-800'}`}>
                        ${account.balance.toLocaleString()}
                    </div>
                    <div className="flex justify-end mt-1 text-gray-400">
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="px-4 pb-4 bg-gray-50/30 border-t border-gray-100 animate-slide-up">
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3 pt-3">
                        <div>
                            <span className="block text-xs text-gray-500 mb-1">銀行機構</span>
                            <div className="font-medium">{account.bank}</div>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500 mb-1">帳號</span>
                            <div className="font-mono text-gray-600 tracking-wide">{account.number}</div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(account); }} className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:border-morandi-blue-300 text-gray-600 transition-colors">
                            編輯帳戶
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onViewDetails(account); }} className="px-3 py-1.5 text-xs bg-morandi-text-accent text-white rounded-lg hover:bg-gray-800 transition-colors">
                            查看明細
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const WidgetFinanceAccounts = ({ data, size, onEdit, onViewDetails, ...dragProps }) => {
    const accounts = data || [];
    const total = accounts.reduce((acc, c) => acc + c.balance, 0);

    if (size === 'S') return (
        <div className="h-full flex flex-col justify-between p-2">
            <Wallet size={24} className="text-morandi-blue-500" />
            <div>
                <div className="text-2xl font-bold text-gray-800">${total.toLocaleString()}</div>
                <div className="text-xs text-gray-500">總資產</div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto pr-1">
                {accounts.map((acc, index) => (
                    <AccountCard
                        key={acc.id}
                        account={acc}
                        onEdit={onEdit}
                        onViewDetails={onViewDetails}
                        onDragStart={(e) => dragProps.onDragStartAccount(e, index)}
                        onDragOver={(e) => dragProps.onDragOverAccount(e, index)}
                        onDragEnd={dragProps.onDragEndAccount}
                    />
                ))}
            </div>
        </div>
    );
};

// ... Transaction and Trend Implementation
export const WidgetFinanceTrend = ({ size, type = 'month' }) => {
    // Enhanced Trend Logic
    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-700 text-sm">收支趨勢</span>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                    {['週', '月', '年'].map(t => (
                        <span key={t} className={`text-[10px] px-2 py-0.5 rounded cursor-pointer ${type === t ? 'bg-white shadow-sm font-bold' : 'text-gray-500'}`}>{t}</span>
                    ))}
                </div>
            </div>
            <div className="flex-1 relative">
                <TrendChart />
            </div>
        </div>
    )
}

export const WidgetFinanceTransactions = ({ data, size, onAddTx }) => {
    // ... Reuse similar logic from react.txt but styled
    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-gray-700 text-xs">近期紀錄</h4>
                <button onClick={onAddTx} className="p-1 hover:bg-gray-100 rounded text-morandi-blue-600"><Plus size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
                {data.map(t => (
                    <div key={t.id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div>
                            <div className="font-medium text-gray-800">{t.desc}</div>
                            <div className="text-[10px] text-gray-400">{t.date}</div>
                        </div>
                        <div className={`font-mono font-bold ${t.type === '收入' ? 'text-morandi-green-600' : 'text-red-500'}`}>
                            {t.type === '收入' ? '+' : '-'} {t.amount}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
