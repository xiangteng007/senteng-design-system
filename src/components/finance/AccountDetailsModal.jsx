import React, { useState, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, Filter, Download } from 'lucide-react';

export const AccountDetailsModal = ({ isOpen, onClose, account, allTransactions }) => {
    const [filterType, setFilterType] = useState('all'); // all, 收入, 支出
    const [filterMonth, setFilterMonth] = useState('all');

    if (!isOpen || !account) return null;

    // Filter transactions for this account
    const accountTransactions = allTransactions.filter(tx => tx.accountId === account.id);

    // Apply filters
    const filteredTransactions = useMemo(() => {
        let filtered = [...accountTransactions];

        if (filterType !== 'all') {
            filtered = filtered.filter(tx => tx.type === filterType);
        }

        if (filterMonth !== 'all') {
            filtered = filtered.filter(tx => tx.date.startsWith(filterMonth));
        }

        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [accountTransactions, filterType, filterMonth]);

    // Calculate statistics
    const stats = useMemo(() => {
        const income = accountTransactions
            .filter(tx => tx.type === '收入')
            .reduce((sum, tx) => sum + tx.amount, 0);
        const expense = accountTransactions
            .filter(tx => tx.type === '支出')
            .reduce((sum, tx) => sum + tx.amount, 0);
        const net = income - expense;

        return { income, expense, net, count: accountTransactions.length };
    }, [accountTransactions]);

    // Get unique months from transactions
    const availableMonths = useMemo(() => {
        const months = new Set(accountTransactions.map(tx => tx.date.substring(0, 7)));
        return Array.from(months).sort().reverse();
    }, [accountTransactions]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-slide-up">
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-gray-100">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">{account.name}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{account.bank}</span>
                            <span>•</span>
                            <span className="font-mono">{account.number}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-gray-500 mb-1">當前餘額</div>
                        <div className="text-2xl font-bold text-gray-800">${account.balance.toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <TrendingUp size={12} className="text-green-500" />
                            總收入
                        </div>
                        <div className="text-2xl font-bold text-green-600">${stats.income.toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <TrendingDown size={12} className="text-red-500" />
                            總支出
                        </div>
                        <div className="text-2xl font-bold text-red-600">${stats.expense.toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-gray-500 mb-1">淨額</div>
                        <div className={`text-2xl font-bold ${stats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${Math.abs(stats.net).toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">篩選：</span>
                    </div>

                    {/* Type Filter */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterType === 'all'
                                    ? 'bg-morandi-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            全部
                        </button>
                        <button
                            onClick={() => setFilterType('收入')}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterType === '收入'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            收入
                        </button>
                        <button
                            onClick={() => setFilterType('支出')}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterType === '支出'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            支出
                        </button>
                    </div>

                    {/* Month Filter */}
                    <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="px-3 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-blue-500"
                    >
                        <option value="all">所有月份</option>
                        {availableMonths.map(month => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                    </select>

                    <div className="flex-1" />

                    <div className="text-xs text-gray-500">
                        共 {filteredTransactions.length} 筆交易
                    </div>
                </div>

                {/* Transaction List */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                            <p>無交易記錄</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTransactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-morandi-blue-200 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === '收入' ? 'bg-green-50' : 'bg-red-50'
                                            }`}>
                                            {tx.type === '收入' ? (
                                                <TrendingUp size={20} className="text-green-600" />
                                            ) : (
                                                <TrendingDown size={20} className="text-red-600" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-800">{tx.desc}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                                <span>{tx.date}</span>
                                                {tx.category && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="px-2 py-0.5 bg-gray-100 rounded">{tx.category}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-lg font-bold font-mono ${tx.type === '收入' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {tx.type === '收入' ? '+' : '-'} ${tx.amount.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2">
                        <Download size={16} />
                        匯出明細
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors"
                    >
                        關閉
                    </button>
                </div>
            </div>
        </div>
    );
};
