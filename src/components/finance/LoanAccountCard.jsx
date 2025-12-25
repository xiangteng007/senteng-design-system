
import React, { useState } from 'react';
import { Building2, Percent, Calendar, TrendingDown, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

/**
 * 貸款帳戶卡片元件
 * 顯示貸款資訊、還款進度和下次還款提醒
 */

export const LoanAccountCard = ({ loan, onEdit, onViewDetails, onRecordPayment }) => {
    const [expanded, setExpanded] = useState(false);

    // 計算還款進度百分比
    const progressPercent = loan.totalTerms > 0 ? (loan.paidTerms / loan.totalTerms) * 100 : 0;

    // 計算下次還款日期
    const getNextPaymentDate = () => {
        const today = new Date();
        const paymentDay = loan.paymentDay || 15;

        let nextDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
        if (nextDate <= today) {
            nextDate = new Date(today.getFullYear(), today.getMonth() + 1, paymentDay);
        }

        return nextDate;
    };

    const nextPaymentDate = getNextPaymentDate();
    const daysUntilPayment = Math.ceil((nextPaymentDate - new Date()) / (1000 * 60 * 60 * 24));

    // 狀態顏色
    const statusColors = {
        active: 'bg-blue-100 text-blue-700',
        completed: 'bg-green-100 text-green-700',
        overdue: 'bg-red-100 text-red-700'
    };

    const borderColor = expanded ? "border-blue-300" : "border-gray-100";

    return (
        <div className={`bg-white rounded-2xl border ${borderColor} shadow-sm transition-all duration-300 mb-3 overflow-hidden`}>
            {/* 主要資訊區 */}
            <div
                onClick={() => setExpanded(!expanded)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-gray-800">{loan.bankName}</div>
                        <div className="text-xs text-gray-500">
                            {loan.paymentType === 'equalPayment' ? '等額本息' : '等額本金'} · {loan.totalTerms} 期
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="font-bold text-gray-800 font-mono">
                        ${loan.remainingPrincipal?.toLocaleString() || loan.principalAmount?.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">剩餘本金</div>
                    <div className="flex justify-end mt-1 text-gray-400">
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>
            </div>

            {/* 還款進度條 */}
            <div className="px-4 pb-2">
                <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <span className="text-xs text-gray-500 font-mono w-16 text-right">
                        {loan.paidTerms}/{loan.totalTerms}
                    </span>
                </div>

                {/* 下次還款提醒 */}
                {loan.status === 'active' && daysUntilPayment <= 7 && (
                    <div className={`flex items-center gap-2 text-xs mt-2 p-2 rounded-lg ${daysUntilPayment <= 3 ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                        <AlertCircle size={14} />
                        <span>
                            下次還款：{nextPaymentDate.toLocaleDateString('zh-TW')}（{daysUntilPayment} 天後）
                            <span className="font-bold ml-2">${loan.monthlyPayment?.toLocaleString()}</span>
                        </span>
                    </div>
                )}
            </div>

            {/* 展開詳細資料 */}
            {expanded && (
                <div className="px-4 pb-4 bg-gray-50/50 border-t border-gray-100 animate-slide-up">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm py-3">
                        <div>
                            <span className="block text-xs text-gray-500 mb-1">貸款金額</span>
                            <div className="font-bold font-mono">${loan.principalAmount?.toLocaleString()}</div>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500 mb-1">年利率</span>
                            <div className="font-bold text-blue-600 flex items-center gap-1">
                                <Percent size={12} />
                                {loan.interestRate}%
                            </div>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500 mb-1">每月還款</span>
                            <div className="font-bold font-mono text-green-600">${loan.monthlyPayment?.toLocaleString()}</div>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500 mb-1">還款日</span>
                            <div className="font-bold flex items-center gap-1">
                                <Calendar size={12} />
                                每月 {loan.paymentDay} 日
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                            <span className="block text-xs text-gray-500 mb-1">起始日期</span>
                            <div className="text-gray-700">{loan.startDate}</div>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500 mb-1">狀態</span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[loan.status] || statusColors.active}`}>
                                {loan.status === 'active' ? '還款中' : loan.status === 'completed' ? '已結清' : '逾期'}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        {onRecordPayment && loan.status === 'active' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onRecordPayment(loan); }}
                                className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                                記錄還款
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(loan); }}
                            className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:border-blue-300 text-gray-600 transition-colors"
                        >
                            編輯
                        </button>
                        {onViewDetails && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onViewDetails(loan); }}
                                className="px-3 py-1.5 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                還款明細
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoanAccountCard;
