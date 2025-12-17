
import React, { useState, useEffect } from 'react';
import { FileText, Calculator, Building2, User, Copy, RotateCcw, Check, AlertCircle, Info } from 'lucide-react';
import { SectionTitle } from '../components/common/Indicators';

// 數字轉中文大寫（正確處理萬、億單位）
const numberToChinese = (num) => {
    if (num === 0) return '零';

    const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
    const smallUnits = ['', '拾', '佰', '仟'];

    // 將數字分解為億、萬、個位數組
    const n = Math.floor(num);
    const yi = Math.floor(n / 100000000); // 億
    const wan = Math.floor((n % 100000000) / 10000); // 萬
    const ge = n % 10000; // 個位到仟位

    // 轉換四位數為中文
    const fourDigitToChinese = (n, addZeroPrefix = false) => {
        if (n === 0) return '';

        let result = '';
        const arr = [
            Math.floor(n / 1000),      // 仟位
            Math.floor((n % 1000) / 100), // 佰位
            Math.floor((n % 100) / 10),   // 拾位
            n % 10                        // 個位
        ];

        let hasValue = false;
        let needZero = addZeroPrefix && n < 1000;

        for (let i = 0; i < 4; i++) {
            if (arr[i] !== 0) {
                if (needZero) {
                    result += '零';
                    needZero = false;
                }
                result += digits[arr[i]] + smallUnits[3 - i];
                hasValue = true;
            } else if (hasValue) {
                needZero = true;
            }
        }

        return result;
    };

    let result = '';

    // 處理億
    if (yi > 0) {
        result += fourDigitToChinese(yi) + '億';
    }

    // 處理萬
    if (wan > 0) {
        result += fourDigitToChinese(wan, yi > 0) + '萬';
    } else if (yi > 0 && ge > 0) {
        // 億有值但萬沒有，個有值時需要補零
    }

    // 處理個位到仟位
    if (ge > 0) {
        const needZero = (yi > 0 || wan > 0) && ge < 1000;
        result += fourDigitToChinese(ge, needZero);
    }

    return result || '零';
};

// 格式化金額顯示
const formatCurrency = (num) => {
    if (!num) return '0';
    return Math.round(num).toLocaleString('zh-TW');
};

export const InvoiceHelper = ({ addToast }) => {
    // 發票類型：triple (三聯式) / double (二聯式)
    const [invoiceType, setInvoiceType] = useState('triple');

    // 稅率類型
    const [taxType, setTaxType] = useState('taxable'); // taxable, zeroRate, exempt

    // 輸入模式：含稅價 / 未稅價
    const [inputMode, setInputMode] = useState('withTax');

    // 金額
    const [amount, setAmount] = useState('');
    const [salesAmount, setSalesAmount] = useState(0); // 銷售額（未稅）
    const [taxAmount, setTaxAmount] = useState(0); // 營業稅額
    const [totalAmount, setTotalAmount] = useState(0); // 總計（含稅）

    // 買受人資訊
    const [buyerTaxId, setBuyerTaxId] = useState('');
    const [buyerName, setBuyerName] = useState('');

    // 品名
    const [itemName, setItemName] = useState('');

    // 日期
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

    // 複製狀態
    const [copied, setCopied] = useState('');

    // 計算稅額
    useEffect(() => {
        const num = parseFloat(amount) || 0;

        if (taxType === 'exempt' || taxType === 'zeroRate') {
            // 免稅或零稅率
            setSalesAmount(num);
            setTaxAmount(0);
            setTotalAmount(num);
        } else {
            // 應稅 5%
            if (inputMode === 'withTax') {
                // 輸入含稅價
                const sales = Math.round(num / 1.05);
                const tax = num - sales;
                setSalesAmount(sales);
                setTaxAmount(tax);
                setTotalAmount(num);
            } else {
                // 輸入未稅價
                const tax = Math.round(num * 0.05);
                const total = num + tax;
                setSalesAmount(num);
                setTaxAmount(tax);
                setTotalAmount(total);
            }
        }
    }, [amount, inputMode, taxType]);

    // 重設表單
    const handleReset = () => {
        setAmount('');
        setBuyerTaxId('');
        setBuyerName('');
        setItemName('');
        setInvoiceDate(new Date().toISOString().split('T')[0]);
        addToast?.('表單已重設', 'info');
    };

    // 複製到剪貼簿
    const handleCopy = (value, label) => {
        navigator.clipboard.writeText(value.toString());
        setCopied(label);
        setTimeout(() => setCopied(''), 2000);
        addToast?.(`已複製 ${label}`, 'success');
    };

    // 獲取稅率百分比
    const getTaxRate = () => {
        switch (taxType) {
            case 'zeroRate': return '0%';
            case 'exempt': return '免稅';
            default: return '5%';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <SectionTitle title="發票小幫手" />

            {/* 說明區 */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
                <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">手開發票輔助工具</p>
                    <p className="text-blue-600">輸入金額後，系統會自動計算稅額並顯示發票填寫示意圖，幫助您正確填寫手開發票。</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左側：輸入區 */}
                <div className="space-y-4">
                    {/* 發票類型選擇 */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3">發票類型</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setInvoiceType('triple')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${invoiceType === 'triple'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Building2 size={24} />
                                <span className="font-bold">三聯式發票</span>
                                <span className="text-xs text-gray-500">開給公司行號</span>
                            </button>
                            <button
                                onClick={() => setInvoiceType('double')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${invoiceType === 'double'
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <User size={24} />
                                <span className="font-bold">二聯式發票</span>
                                <span className="text-xs text-gray-500">開給個人消費者</span>
                            </button>
                        </div>
                    </div>

                    {/* 買受人資訊（三聯式才顯示） */}
                    {invoiceType === 'triple' && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-3">買受人資訊</label>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">統一編號</label>
                                    <input
                                        type="text"
                                        value={buyerTaxId}
                                        onChange={(e) => setBuyerTaxId(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                        placeholder="請輸入8位數統編"
                                        maxLength={8}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-mono text-lg tracking-widest"
                                    />
                                    {buyerTaxId && buyerTaxId.length !== 8 && (
                                        <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                                            <AlertCircle size={12} /> 統一編號應為8位數
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">公司抬頭</label>
                                    <input
                                        type="text"
                                        value={buyerName}
                                        onChange={(e) => setBuyerName(e.target.value)}
                                        placeholder="請輸入公司名稱"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 品名 */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3">品名</label>
                        <input
                            type="text"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder="例：室內設計服務費"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        />
                    </div>

                    {/* 稅率與金額 */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3">稅率類型</label>
                        <div className="flex gap-2 mb-4">
                            {[
                                { id: 'taxable', label: '應稅 5%', color: 'blue' },
                                { id: 'zeroRate', label: '零稅率', color: 'gray' },
                                { id: 'exempt', label: '免稅', color: 'gray' }
                            ].map(({ id, label, color }) => (
                                <button
                                    key={id}
                                    onClick={() => setTaxType(id)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${taxType === id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <label className="block text-sm font-medium text-gray-700 mb-3">輸入金額</label>
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={() => setInputMode('withTax')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${inputMode === 'withTax'
                                    ? 'bg-gray-800 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                含稅價
                            </button>
                            <button
                                onClick={() => setInputMode('withoutTax')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${inputMode === 'withoutTax'
                                    ? 'bg-gray-800 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                未稅價
                            </button>
                        </div>

                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">NT$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="w-full pl-14 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-2xl font-bold text-right"
                            />
                        </div>
                    </div>

                    {/* 計算結果 */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 text-white">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-400">計算結果</span>
                            <span className="text-xs bg-white/10 px-2 py-1 rounded">稅率: {getTaxRate()}</span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">銷售額（未稅）</span>
                                <button
                                    onClick={() => handleCopy(salesAmount, '銷售額')}
                                    className="flex items-center gap-2 hover:bg-white/10 px-3 py-1 rounded-lg transition-colors"
                                >
                                    <span className="text-xl font-bold">${formatCurrency(salesAmount)}</span>
                                    {copied === '銷售額' ? <Check size={16} className="text-green-400" /> : <Copy size={14} />}
                                </button>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">營業稅額</span>
                                <button
                                    onClick={() => handleCopy(taxAmount, '稅額')}
                                    className="flex items-center gap-2 hover:bg-white/10 px-3 py-1 rounded-lg transition-colors"
                                >
                                    <span className="text-xl font-bold">${formatCurrency(taxAmount)}</span>
                                    {copied === '稅額' ? <Check size={16} className="text-green-400" /> : <Copy size={14} />}
                                </button>
                            </div>
                            <div className="border-t border-white/20 pt-3 flex justify-between items-center">
                                <span className="text-white font-medium">總計（含稅）</span>
                                <button
                                    onClick={() => handleCopy(totalAmount, '總計')}
                                    className="flex items-center gap-2 hover:bg-white/10 px-3 py-1 rounded-lg transition-colors"
                                >
                                    <span className="text-2xl font-bold text-yellow-400">${formatCurrency(totalAmount)}</span>
                                    {copied === '總計' ? <Check size={16} className="text-green-400" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 操作按鈕 */}
                    <button
                        onClick={handleReset}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <RotateCcw size={18} />
                        重設表單
                    </button>
                </div>

                {/* 右側：發票預覽 */}
                <div className="space-y-4">
                    <div className={`rounded-2xl p-6 shadow-lg border-2 ${invoiceType === 'triple'
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-green-50 border-green-300'
                        }`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className={`text-lg font-bold ${invoiceType === 'triple' ? 'text-blue-800' : 'text-green-800'}`}>
                                    {invoiceType === 'triple' ? '三聯式統一發票' : '二聯式統一發票'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    {invoiceType === 'triple' ? '收執聯・交付買受人作為記帳憑證' : '收執聯・交付買受人'}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500">發票日期</div>
                                <input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    className="bg-transparent text-sm font-mono"
                                />
                            </div>
                        </div>

                        {/* 發票內容預覽 */}
                        <div className="bg-white rounded-xl p-4 space-y-4 font-mono text-sm">
                            {/* 買受人區 */}
                            {invoiceType === 'triple' && (
                                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-dashed border-gray-300">
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">統一編號</div>
                                        <div className="text-lg font-bold tracking-widest">
                                            {buyerTaxId || '________'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">買受人</div>
                                        <div className="font-bold truncate">
                                            {buyerName || '________________'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 品名區 */}
                            <div className="pb-3 border-b border-dashed border-gray-300">
                                <div className="text-xs text-gray-400 mb-1">品名</div>
                                <div className="font-medium">
                                    {itemName || '________________________'}
                                </div>
                            </div>

                            {/* 金額區 */}
                            <div className="space-y-2">
                                {invoiceType === 'triple' ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">銷售額（未稅）</span>
                                            <span className="font-bold">${formatCurrency(salesAmount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">
                                                營業稅額
                                                <span className="ml-2 text-xs">
                                                    {taxType === 'taxable' && '☑應稅'}
                                                    {taxType === 'zeroRate' && '☑零稅率'}
                                                    {taxType === 'exempt' && '☑免稅'}
                                                </span>
                                            </span>
                                            <span className="font-bold">${formatCurrency(taxAmount)}</span>
                                        </div>
                                    </>
                                ) : null}
                                <div className={`flex justify-between pt-2 ${invoiceType === 'triple' ? 'border-t border-gray-200' : ''}`}>
                                    <span className="font-medium">總計</span>
                                    <span className="font-bold text-lg">${formatCurrency(totalAmount)}</span>
                                </div>
                            </div>

                            {/* 中文大寫金額 */}
                            <div className="pt-3 border-t border-dashed border-gray-300">
                                <div className="text-xs text-gray-400 mb-1">總計（中文大寫）</div>
                                <div className="text-lg font-bold tracking-wide text-red-700">
                                    新台幣 {totalAmount > 0 ? numberToChinese(totalAmount) : '零'} 元整
                                </div>
                            </div>
                        </div>

                        {/* 發票章區 */}
                        <div className="mt-4 flex justify-end">
                            <div className="border-2 border-red-400 rounded-lg p-3 text-center bg-white/50">
                                <div className="text-xs text-red-500 mb-1">統一發票專用章</div>
                                <div className="text-red-600 font-bold">森騰室內設計</div>
                            </div>
                        </div>
                    </div>

                    {/* 填寫提示 */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                        <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                            <AlertCircle size={18} />
                            填寫注意事項
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            {invoiceType === 'triple' ? (
                                <>
                                    <li>• 三聯式發票開給有統編的公司行號</li>
                                    <li>• 買受人可用扣抵聯申報進項稅額扣抵</li>
                                    <li>• 金額需分開填寫未稅價與稅額</li>
                                    <li>• 三聯都需蓋統一發票專用章</li>
                                </>
                            ) : (
                                <>
                                    <li>• 二聯式發票開給個人消費者</li>
                                    <li>• 金額為含稅價，稅金已內含</li>
                                    <li>• 買受人欄位可不填或填姓名</li>
                                    <li>• 若填統編則不可對獎</li>
                                </>
                            )}
                            <li>• 總金額請用中文大寫填寫</li>
                            <li>• 發票依日期順序開立，不可跳開或倒開</li>
                        </ul>
                    </div>

                    {/* 快速參考 */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-3">中文大寫數字對照</h4>
                        <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center text-xs sm:text-sm">
                            {['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'].map((char, i) => (
                                <div key={i} className="bg-gray-50 rounded-lg py-2">
                                    <div className="text-gray-400 text-xs">{i}</div>
                                    <div className="font-bold text-lg">{char}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-sm">
                            {[['拾', '10'], ['佰', '100'], ['仟', '1000'], ['萬', '10000']].map(([char, num]) => (
                                <div key={num} className="bg-gray-50 rounded-lg py-2">
                                    <div className="text-gray-400 text-xs">{num}</div>
                                    <div className="font-bold text-lg">{char}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceHelper;
