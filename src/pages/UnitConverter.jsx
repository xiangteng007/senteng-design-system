
import React, { useState, useEffect } from 'react';
import { Calculator, Copy, Check, RotateCcw, ArrowRightLeft, Info, Ruler, Box, Square, Grid3X3 } from 'lucide-react';
import { SectionTitle } from '../components/common/Indicators';

// 單位換算常數
const CONVERSIONS = {
    // 面積單位 (以平方公尺為基準)
    area: {
        sqMeter: { name: '平方公尺', symbol: 'm²', toBase: 1 },
        sqCm: { name: '平方公分', symbol: 'cm²', toBase: 0.0001 },
        sqFeet: { name: '平方英呎', symbol: 'ft²', toBase: 0.092903 },
        ping: { name: '坪', symbol: '坪', toBase: 3.30579 },
        cai: { name: '才', symbol: '才', toBase: 0.09 }, // 30cm x 30cm
        taiwan_jia: { name: '台灣甲', symbol: '甲', toBase: 9699.17 },
        hectare: { name: '公頃', symbol: 'ha', toBase: 10000 },
        are: { name: '公畝', symbol: 'a', toBase: 100 },
    },
    // 長度單位 (以公分為基準)
    length: {
        cm: { name: '公分', symbol: 'cm', toBase: 1 },
        meter: { name: '公尺', symbol: 'm', toBase: 100 },
        mm: { name: '公釐', symbol: 'mm', toBase: 0.1 },
        inch: { name: '英吋', symbol: 'in', toBase: 2.54 },
        feet: { name: '英呎', symbol: 'ft', toBase: 30.48 },
        taiwan_chi: { name: '台尺', symbol: '尺', toBase: 30.303 },
        taiwan_cun: { name: '台寸', symbol: '寸', toBase: 3.0303 },
    },
    // 體積單位 (以立方公分為基準)
    volume: {
        cubicCm: { name: '立方公分', symbol: 'cm³', toBase: 1 },
        cubicMeter: { name: '立方公尺', symbol: 'm³', toBase: 1000000 },
        liter: { name: '公升', symbol: 'L', toBase: 1000 },
        cubicFeet: { name: '立方英呎', symbol: 'ft³', toBase: 28316.8 },
        cubicInch: { name: '立方英吋', symbol: 'in³', toBase: 16.387 },
        taiwan_cai: { name: '材 (立方尺)', symbol: '材', toBase: 27826.5 }, // 約等於一立方台尺
    }
};

// 格式化數字
const formatNumber = (num, decimals = 6) => {
    if (!num || isNaN(num)) return '0';
    const n = parseFloat(num);
    if (n === 0) return '0';
    if (Math.abs(n) >= 1000) {
        return n.toLocaleString('zh-TW', { maximumFractionDigits: 4 });
    }
    if (Math.abs(n) < 0.0001) {
        return n.toExponential(4);
    }
    return n.toFixed(decimals).replace(/\.?0+$/, '');
};

export const UnitConverter = ({ addToast }) => {
    // 轉換類型
    const [conversionType, setConversionType] = useState('area');

    // 輸入值與單位
    const [inputValue, setInputValue] = useState('');
    const [fromUnit, setFromUnit] = useState('sqMeter');
    const [toUnit, setToUnit] = useState('ping');

    // 計算結果
    const [results, setResults] = useState({});

    // 複製狀態
    const [copied, setCopied] = useState('');

    // 尺寸計算器狀態
    const [dimensions, setDimensions] = useState({
        length: '',
        width: '',
        height: '',
        lengthUnit: 'cm',
        widthUnit: 'cm',
        heightUnit: 'cm',
        quantity: 1
    });

    // 當輸入值或單位變更時計算所有結果
    useEffect(() => {
        if (!inputValue || isNaN(parseFloat(inputValue))) {
            setResults({});
            return;
        }

        const value = parseFloat(inputValue);
        const units = CONVERSIONS[conversionType];
        const fromFactor = units[fromUnit].toBase;

        // 轉換為基準單位
        const baseValue = value * fromFactor;

        // 計算所有單位的值
        const newResults = {};
        Object.entries(units).forEach(([key, unit]) => {
            newResults[key] = baseValue / unit.toBase;
        });

        setResults(newResults);
    }, [inputValue, fromUnit, conversionType]);

    // 計算尺寸面積/體積
    useEffect(() => {
        const { length, width, height, lengthUnit, widthUnit, heightUnit, quantity } = dimensions;

        if (!length || !width) return;

        const lengthUnits = CONVERSIONS.length;
        const lengthInCm = parseFloat(length) * lengthUnits[lengthUnit].toBase;
        const widthInCm = parseFloat(width) * lengthUnits[widthUnit].toBase;

        // 計算面積 (平方公分 -> 平方公尺)
        const areaSqCm = lengthInCm * widthInCm * (parseInt(quantity) || 1);
        const areaSqMeter = areaSqCm / 10000;

        // 如果有高度，計算體積
        if (height) {
            const heightInCm = parseFloat(height) * lengthUnits[heightUnit].toBase;
            const volumeCubicCm = lengthInCm * widthInCm * heightInCm * (parseInt(quantity) || 1);
            setInputValue((volumeCubicCm).toString());
            setConversionType('volume');
            setFromUnit('cubicCm');
        } else {
            setInputValue((areaSqMeter).toString());
            setConversionType('area');
            setFromUnit('sqMeter');
        }
    }, [dimensions]);

    // 交換單位
    const handleSwapUnits = () => {
        const temp = fromUnit;
        setFromUnit(toUnit);
        setToUnit(temp);
    };

    // 複製到剪貼簿
    const handleCopy = (value, label) => {
        navigator.clipboard.writeText(formatNumber(value));
        setCopied(label);
        setTimeout(() => setCopied(''), 2000);
        addToast?.(`已複製 ${label}`, 'success');
    };

    // 重設
    const handleReset = () => {
        setInputValue('');
        setDimensions({
            length: '',
            width: '',
            height: '',
            lengthUnit: 'cm',
            widthUnit: 'cm',
            heightUnit: 'cm',
            quantity: 1
        });
        setResults({});
        addToast?.('已重設', 'info');
    };

    // 切換類型時重設單位
    const handleTypeChange = (type) => {
        setConversionType(type);
        setInputValue('');
        setResults({});

        // 設定預設單位
        switch (type) {
            case 'area':
                setFromUnit('sqMeter');
                setToUnit('ping');
                break;
            case 'length':
                setFromUnit('cm');
                setToUnit('meter');
                break;
            case 'volume':
                setFromUnit('cubicCm');
                setToUnit('cubicMeter');
                break;
        }
    };

    const units = CONVERSIONS[conversionType];

    return (
        <div className="space-y-6 animate-fade-in">
            <SectionTitle title="單位換算器" />

            {/* 說明區 */}
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex gap-3">
                <Info size={20} className="text-purple-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-purple-800">
                    <p className="font-medium mb-1">室內設計常用單位換算</p>
                    <p className="text-purple-600">支援面積（坪、才、平方公尺）、長度（公分、台尺）、體積（材、立方公尺）等單位換算。</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左側：輸入區 */}
                <div className="space-y-4">
                    {/* 轉換類型選擇 */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3">換算類型</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => handleTypeChange('area')}
                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${conversionType === 'area'
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Square size={20} />
                                <span className="font-bold text-sm">面積</span>
                            </button>
                            <button
                                onClick={() => handleTypeChange('length')}
                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${conversionType === 'length'
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Ruler size={20} />
                                <span className="font-bold text-sm">長度</span>
                            </button>
                            <button
                                onClick={() => handleTypeChange('volume')}
                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${conversionType === 'volume'
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Box size={20} />
                                <span className="font-bold text-sm">體積</span>
                            </button>
                        </div>
                    </div>

                    {/* 尺寸輸入 */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            <Grid3X3 size={16} className="inline mr-1" />
                            尺寸計算（選填）
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">長度</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={dimensions.length}
                                        onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                                        placeholder="0"
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 outline-none text-sm"
                                    />
                                    <select
                                        value={dimensions.lengthUnit}
                                        onChange={(e) => setDimensions({ ...dimensions, lengthUnit: e.target.value })}
                                        className="px-2 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                                    >
                                        {Object.entries(CONVERSIONS.length).map(([key, unit]) => (
                                            <option key={key} value={key}>{unit.symbol}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">寬度</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={dimensions.width}
                                        onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                                        placeholder="0"
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 outline-none text-sm"
                                    />
                                    <select
                                        value={dimensions.widthUnit}
                                        onChange={(e) => setDimensions({ ...dimensions, widthUnit: e.target.value })}
                                        className="px-2 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                                    >
                                        {Object.entries(CONVERSIONS.length).map(([key, unit]) => (
                                            <option key={key} value={key}>{unit.symbol}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">高度（體積用）</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={dimensions.height}
                                        onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                                        placeholder="選填"
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 outline-none text-sm"
                                    />
                                    <select
                                        value={dimensions.heightUnit}
                                        onChange={(e) => setDimensions({ ...dimensions, heightUnit: e.target.value })}
                                        className="px-2 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                                    >
                                        {Object.entries(CONVERSIONS.length).map(([key, unit]) => (
                                            <option key={key} value={key}>{unit.symbol}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">數量</label>
                                <input
                                    type="number"
                                    value={dimensions.quantity}
                                    onChange={(e) => setDimensions({ ...dimensions, quantity: e.target.value })}
                                    min="1"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 outline-none text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 直接輸入數值 */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3">或直接輸入數值</label>
                        <div className="flex gap-3 items-center">
                            <div className="flex-1">
                                <input
                                    type="number"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="輸入數值"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-xl font-bold text-right"
                                />
                            </div>
                            <select
                                value={fromUnit}
                                onChange={(e) => setFromUnit(e.target.value)}
                                className="px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white font-medium"
                            >
                                {Object.entries(units).map(([key, unit]) => (
                                    <option key={key} value={key}>{unit.name} ({unit.symbol})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 操作按鈕 */}
                    <button
                        onClick={handleReset}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <RotateCcw size={18} />
                        重設
                    </button>
                </div>

                {/* 右側：結果區 */}
                <div className="space-y-4">
                    {/* 所有單位換算結果 */}
                    <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-5 text-white">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-purple-200 font-medium">換算結果</span>
                            <span className="text-xs bg-white/20 px-2 py-1 rounded">
                                {conversionType === 'area' ? '面積' : conversionType === 'length' ? '長度' : '體積'}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {Object.entries(units).map(([key, unit]) => (
                                <div key={key} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                                    <span className="text-purple-200">{unit.name}</span>
                                    <button
                                        onClick={() => handleCopy(results[key], unit.name)}
                                        className="flex items-center gap-2 hover:bg-white/10 px-3 py-1 rounded-lg transition-colors"
                                        disabled={!results[key]}
                                    >
                                        <span className={`font-bold ${key === fromUnit ? 'text-yellow-300 text-xl' : 'text-lg'}`}>
                                            {results[key] ? formatNumber(results[key]) : '-'}
                                            <span className="text-sm ml-1 opacity-70">{unit.symbol}</span>
                                        </span>
                                        {results[key] && (
                                            copied === unit.name
                                                ? <Check size={14} className="text-green-400" />
                                                : <Copy size={12} className="opacity-50" />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 常用換算對照表 */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-3">常用換算對照</h4>

                        <div className="space-y-3 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="font-medium text-gray-700 mb-2">📐 面積</div>
                                <div className="grid grid-cols-2 gap-2 text-gray-600">
                                    <div>1 坪 = 3.30579 m²</div>
                                    <div>1 坪 = 36 才</div>
                                    <div>1 才 = 0.09 m²</div>
                                    <div>1 甲 = 2934 坪</div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="font-medium text-gray-700 mb-2">📏 長度</div>
                                <div className="grid grid-cols-2 gap-2 text-gray-600">
                                    <div>1 台尺 = 30.303 cm</div>
                                    <div>1 台寸 = 3.0303 cm</div>
                                    <div>1 英呎 = 30.48 cm</div>
                                    <div>1 英吋 = 2.54 cm</div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="font-medium text-gray-700 mb-2">📦 體積</div>
                                <div className="grid grid-cols-2 gap-2 text-gray-600">
                                    <div>1 材 = 1 立方尺</div>
                                    <div>1 材 ≈ 0.0278 m³</div>
                                    <div>1 m³ = 1000 公升</div>
                                    <div>1 ft³ = 28.32 公升</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 才數計算說明 */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                        <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                            <Calculator size={18} />
                            才數計算說明
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• 1 才 = 30cm × 30cm = 900 cm²</li>
                            <li>• 常用於建材、玻璃、石材報價</li>
                            <li>• 計算方式：長(cm) × 寬(cm) ÷ 900 = 才數</li>
                            <li>• 1 坪 = 36 才</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnitConverter;
