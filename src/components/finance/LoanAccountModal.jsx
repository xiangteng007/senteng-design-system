
import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { InputField } from '../common/InputField';
import { LoanCalculator, calculateEqualPayment, calculateEqualPrincipal } from './LoanCalculator';
import { Building2, Percent, Calendar, Calculator } from 'lucide-react';

/**
 * 貸款帳戶新增/編輯 Modal
 */

const COMMON_TERMS = [12, 24, 36, 60, 84, 120, 180, 240, 360];
const PAYMENT_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export const LoanAccountModal = ({ isOpen, onClose, onConfirm, editingLoan = null }) => {
    const [formData, setFormData] = useState({
        bankName: '',
        principalAmount: '',
        interestRate: '',
        totalTerms: 240,
        paidTerms: 0,
        startDate: new Date().toISOString().split('T')[0],
        paymentDay: 15,
        paymentType: 'equalPayment',
        status: 'active'
    });

    // 初始化編輯資料
    useEffect(() => {
        if (editingLoan) {
            setFormData({
                ...editingLoan,
                principalAmount: editingLoan.principalAmount?.toString() || '',
                interestRate: editingLoan.interestRate?.toString() || ''
            });
        } else {
            setFormData({
                bankName: '',
                principalAmount: '',
                interestRate: '',
                totalTerms: 240,
                paidTerms: 0,
                startDate: new Date().toISOString().split('T')[0],
                paymentDay: 15,
                paymentType: 'equalPayment',
                status: 'active'
            });
        }
    }, [editingLoan, isOpen]);

    // 即時試算
    const calculation = useMemo(() => {
        const principal = parseFloat(formData.principalAmount) || 0;
        const rate = parseFloat(formData.interestRate) || 0;
        const terms = parseInt(formData.totalTerms) || 0;

        if (formData.paymentType === 'equalPayment') {
            return calculateEqualPayment(principal, rate, terms);
        } else {
            return calculateEqualPrincipal(principal, rate, terms);
        }
    }, [formData.principalAmount, formData.interestRate, formData.totalTerms, formData.paymentType]);

    const handleSubmit = () => {
        // 驗證必填欄位
        if (!formData.bankName || !formData.principalAmount || !formData.interestRate) {
            return;
        }

        const principal = parseFloat(formData.principalAmount);
        const rate = parseFloat(formData.interestRate);

        // 計算剩餘本金
        let remainingPrincipal = principal;
        if (formData.paidTerms > 0 && calculation.schedule) {
            const paidIndex = Math.min(formData.paidTerms, calculation.schedule.length) - 1;
            if (paidIndex >= 0) {
                remainingPrincipal = calculation.schedule[paidIndex]?.remainingPrincipal || principal;
            }
        }

        const loanData = {
            ...formData,
            id: editingLoan?.id || `loan-${Date.now()}`,
            principalAmount: principal,
            interestRate: rate,
            monthlyPayment: formData.paymentType === 'equalPayment'
                ? calculation.monthlyPayment
                : calculation.firstPayment,
            remainingPrincipal,
            totalInterest: calculation.totalInterest
        };

        onConfirm(loanData);
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingLoan ? "編輯貸款帳戶" : "新增貸款帳戶"}
            onConfirm={handleSubmit}
            confirmText={editingLoan ? "儲存變更" : "新增貸款"}
            size="lg"
        >
            <div className="space-y-4">
                {/* 銀行名稱 */}
                <InputField
                    label="貸款銀行"
                    value={formData.bankName}
                    onChange={e => updateField('bankName', e.target.value)}
                    placeholder="例：台灣銀行房屋貸款"
                    icon={<Building2 size={16} />}
                />

                {/* 貸款金額與利率 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                        label="貸款金額 (本金)"
                        type="number"
                        value={formData.principalAmount}
                        onChange={e => updateField('principalAmount', e.target.value)}
                        placeholder="例：5000000"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            年利率 (%)
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="0.1"
                                max="15"
                                step="0.1"
                                value={formData.interestRate || 2.5}
                                onChange={e => updateField('interestRate', e.target.value)}
                                className="flex-1 accent-blue-600"
                            />
                            <input
                                type="number"
                                step="0.1"
                                value={formData.interestRate}
                                onChange={e => updateField('interestRate', e.target.value)}
                                className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-center text-sm"
                                placeholder="2.5"
                            />
                            <Percent size={14} className="text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* 期數與還款日 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InputField
                        label="還款期數 (月)"
                        type="select"
                        value={formData.totalTerms}
                        onChange={e => updateField('totalTerms', parseInt(e.target.value))}
                    >
                        {COMMON_TERMS.map(term => (
                            <option key={term} value={term}>
                                {term} 期 ({Math.floor(term / 12)} 年 {term % 12 ? `${term % 12} 月` : ''})
                            </option>
                        ))}
                        <option value="custom">自訂期數</option>
                    </InputField>

                    <InputField
                        label="每月還款日"
                        type="select"
                        value={formData.paymentDay}
                        onChange={e => updateField('paymentDay', parseInt(e.target.value))}
                    >
                        {PAYMENT_DAYS.map(day => (
                            <option key={day} value={day}>每月 {day} 日</option>
                        ))}
                    </InputField>

                    <InputField
                        label="起始日期"
                        type="date"
                        value={formData.startDate}
                        onChange={e => updateField('startDate', e.target.value)}
                    />
                </div>

                {/* 還款方式 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">還款方式</label>
                    <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => updateField('paymentType', 'equalPayment')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${formData.paymentType === 'equalPayment'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            等額本息
                            <div className="text-xs text-gray-400 mt-0.5">每月固定金額</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => updateField('paymentType', 'equalPrincipal')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${formData.paymentType === 'equalPrincipal'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            等額本金
                            <div className="text-xs text-gray-400 mt-0.5">每月遞減金額</div>
                        </button>
                    </div>
                </div>

                {/* 已還期數（編輯時顯示） */}
                {editingLoan && (
                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="已還期數"
                            type="number"
                            min="0"
                            max={formData.totalTerms}
                            value={formData.paidTerms}
                            onChange={e => updateField('paidTerms', parseInt(e.target.value) || 0)}
                        />
                        <InputField
                            label="狀態"
                            type="select"
                            value={formData.status}
                            onChange={e => updateField('status', e.target.value)}
                        >
                            <option value="active">還款中</option>
                            <option value="completed">已結清</option>
                        </InputField>
                    </div>
                )}

                {/* 即時試算結果 */}
                {formData.principalAmount && formData.interestRate && (
                    <LoanCalculator
                        principal={parseFloat(formData.principalAmount) || 0}
                        rate={parseFloat(formData.interestRate) || 0}
                        terms={formData.totalTerms}
                        paymentType={formData.paymentType}
                        showSchedule={true}
                        compact={false}
                    />
                )}
            </div>
        </Modal>
    );
};

export default LoanAccountModal;
