
import React, { useState } from 'react';
import {
    Calculator, Building2, Layers, Grid3X3, Paintbrush, BarChart3,
    Info, RotateCcw, Settings2, ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';
import { SectionTitle } from '../components/common/Indicators';

// ============================================
// 計算公式與常數定義
// ============================================

// 預設損耗率 (%)
const DEFAULT_WASTAGE = {
    concrete: 3,
    rebar: 5,
    formwork: 10,
    cement: 10,
    sand: 10,
    brick: 5,
    tile: 5,
    grout: 15,
    adhesive: 10,
    paint: 10,
    putty: 10,
};

// 紅磚用量對照表 (塊/m²)
const BRICK_PER_SQM = {
    '12': { label: '12牆 (12cm)', count: 64 },
    '18': { label: '18牆 (18cm)', count: 96 },
    '24': { label: '24牆 (24cm)', count: 128 },
    '37': { label: '37牆 (37cm)', count: 192 },
};

// 磁磚尺寸選項
const TILE_SIZES = [
    { label: '30×30 cm', l: 30, w: 30 },
    { label: '30×60 cm', l: 30, w: 60 },
    { label: '45×45 cm', l: 45, w: 45 },
    { label: '60×60 cm', l: 60, w: 60 },
    { label: '60×120 cm', l: 60, w: 120 },
    { label: '80×80 cm', l: 80, w: 80 },
    { label: '自訂', l: 0, w: 0 },
];

// 建築類型概估指標
const BUILDING_TYPES = [
    { label: '多層砌體住宅', rebar: 30, concrete: 0.315 },
    { label: '多層框架結構', rebar: 40, concrete: 0.34 },
    { label: '小高層 (11-12F)', rebar: 51, concrete: 0.35 },
    { label: '高層 (17-18F)', rebar: 57, concrete: 0.36 },
    { label: '高層 (30F)', rebar: 70, concrete: 0.445 },
    { label: '別墅', rebar: 40, concrete: 0.33 },
];

// 鋼筋規格表
const REBAR_SPECS = [
    { label: 'D10 (9.53mm)', d: 9.53, weight: 0.56 },
    { label: 'D13 (12.7mm)', d: 12.7, weight: 0.99 },
    { label: 'D16 (15.9mm)', d: 15.9, weight: 1.56 },
    { label: 'D19 (19.1mm)', d: 19.1, weight: 2.25 },
    { label: 'D22 (22.2mm)', d: 22.2, weight: 3.04 },
    { label: 'D25 (25.4mm)', d: 25.4, weight: 3.98 },
    { label: 'D29 (28.7mm)', d: 28.7, weight: 5.08 },
    { label: 'D32 (32.2mm)', d: 32.2, weight: 6.39 },
];

// ============================================
// 工具函數
// ============================================

const formatNumber = (num, decimals = 2) => {
    if (isNaN(num) || num === null) return '-';
    return Number(num).toLocaleString('zh-TW', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    });
};

const applyWastage = (value, wastagePercent) => {
    return value * (1 + wastagePercent / 100);
};

// ============================================
// 子組件
// ============================================

// 輸入欄位組件
const InputField = ({ label, value, onChange, unit, placeholder, type = 'number', min = 0, step = 'any' }) => (
    <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">{label}</label>
        <div className="relative">
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                min={min}
                step={step}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
            {unit && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>
            )}
        </div>
    </div>
);

// 下拉選單組件
const SelectField = ({ label, value, onChange, options }) => (
    <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-white"
        >
            {options.map((opt, i) => (
                <option key={i} value={typeof opt === 'object' ? opt.value : opt}>
                    {typeof opt === 'object' ? opt.label : opt}
                </option>
            ))}
        </select>
    </div>
);

// 損耗率控制組件
const WastageControl = ({ wastage, setWastage, defaultValue, useCustom, setUseCustom }) => (
    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
        <span className="text-xs text-gray-500">損耗率:</span>
        <button
            onClick={() => setUseCustom(false)}
            className={`px-2 py-1 text-xs rounded ${!useCustom ? 'bg-orange-500 text-white' : 'bg-white border'}`}
        >
            預設 {defaultValue}%
        </button>
        <button
            onClick={() => setUseCustom(true)}
            className={`px-2 py-1 text-xs rounded ${useCustom ? 'bg-orange-500 text-white' : 'bg-white border'}`}
        >
            自訂
        </button>
        {useCustom && (
            <input
                type="number"
                value={wastage}
                onChange={(e) => setWastage(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 border rounded text-xs text-center"
                min="0"
                max="100"
            />
        )}
        {useCustom && <span className="text-xs text-gray-500">%</span>}
    </div>
);

// 結果顯示組件
const ResultDisplay = ({ label, value, unit, wastageValue, showWastage = true }) => {
    const [copied, setCopied] = useState(false);

    const copyValue = () => {
        navigator.clipboard.writeText(wastageValue || value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <div className="text-xs opacity-80 mb-1">{label}</div>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">{formatNumber(value)}</span>
                <span className="text-sm opacity-80 mb-1">{unit}</span>
                <button onClick={copyValue} className="ml-auto p-1 hover:bg-white/20 rounded">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
            </div>
            {showWastage && wastageValue && wastageValue !== value && (
                <div className="mt-2 pt-2 border-t border-white/30 text-sm">
                    含損耗: <span className="font-bold">{formatNumber(wastageValue)}</span> {unit}
                </div>
            )}
        </div>
    );
};

// ============================================
// 工項計算器組件
// ============================================

// 1️⃣ 結構工程計算器
const StructureCalculator = () => {
    const [calcType, setCalcType] = useState('concrete');

    // 混凝土計算
    const [concreteL, setConcreteL] = useState('');
    const [concreteW, setConcreteW] = useState('');
    const [concreteH, setConcreteH] = useState('');
    const [concreteWastage, setConcreteWastage] = useState(DEFAULT_WASTAGE.concrete);
    const [concreteCustomWastage, setConcreteCustomWastage] = useState(false);

    // 鋼筋計算
    const [rebarSpec, setRebarSpec] = useState(0);
    const [rebarLength, setRebarLength] = useState('');
    const [rebarCount, setRebarCount] = useState('');
    const [rebarWastage, setRebarWastage] = useState(DEFAULT_WASTAGE.rebar);
    const [rebarCustomWastage, setRebarCustomWastage] = useState(false);

    // 模板計算
    const [formworkArea, setFormworkArea] = useState('');
    const [formworkRatio, setFormworkRatio] = useState('2.2');
    const [formworkWastage, setFormworkWastage] = useState(DEFAULT_WASTAGE.formwork);
    const [formworkCustomWastage, setFormworkCustomWastage] = useState(false);

    // 計算結果
    const concreteVolume = (parseFloat(concreteL) || 0) * (parseFloat(concreteW) || 0) * (parseFloat(concreteH) || 0);
    const concreteWithWastage = applyWastage(concreteVolume, concreteCustomWastage ? concreteWastage : DEFAULT_WASTAGE.concrete);

    const selectedRebar = REBAR_SPECS[rebarSpec];
    const rebarWeight = selectedRebar.weight * (parseFloat(rebarLength) || 0) * (parseFloat(rebarCount) || 0);
    const rebarWithWastage = applyWastage(rebarWeight, rebarCustomWastage ? rebarWastage : DEFAULT_WASTAGE.rebar);

    const formworkResult = (parseFloat(formworkArea) || 0) * parseFloat(formworkRatio);
    const formworkWithWastage = applyWastage(formworkResult, formworkCustomWastage ? formworkWastage : DEFAULT_WASTAGE.formwork);

    return (
        <div className="space-y-4">
            {/* 子項目選擇 */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { id: 'concrete', label: '混凝土用量' },
                    { id: 'rebar', label: '鋼筋重量' },
                    { id: 'formwork', label: '模板面積' },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setCalcType(item.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${calcType === item.id
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* 混凝土計算 */}
            {calcType === 'concrete' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info size={16} />
                        公式: 體積(m³) = 長 × 寬 × 高
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <InputField label="長度" value={concreteL} onChange={setConcreteL} unit="m" placeholder="0" />
                        <InputField label="寬度" value={concreteW} onChange={setConcreteW} unit="m" placeholder="0" />
                        <InputField label="高度/厚度" value={concreteH} onChange={setConcreteH} unit="m" placeholder="0" />
                    </div>
                    <WastageControl
                        wastage={concreteWastage}
                        setWastage={setConcreteWastage}
                        defaultValue={DEFAULT_WASTAGE.concrete}
                        useCustom={concreteCustomWastage}
                        setUseCustom={setConcreteCustomWastage}
                    />
                    <ResultDisplay
                        label="混凝土用量"
                        value={concreteVolume}
                        unit="m³"
                        wastageValue={concreteWithWastage}
                    />
                </div>
            )}

            {/* 鋼筋計算 */}
            {calcType === 'rebar' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info size={16} />
                        公式: 重量(kg) = 0.00617 × d² × 長度 或 單位重量 × 長度 × 數量
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <SelectField
                            label="鋼筋規格"
                            value={rebarSpec}
                            onChange={(v) => setRebarSpec(parseInt(v))}
                            options={REBAR_SPECS.map((r, i) => ({ value: i, label: `${r.label} (${r.weight}kg/m)` }))}
                        />
                        <InputField label="單根長度" value={rebarLength} onChange={setRebarLength} unit="m" placeholder="0" />
                        <InputField label="數量" value={rebarCount} onChange={setRebarCount} unit="支" placeholder="0" />
                    </div>
                    <WastageControl
                        wastage={rebarWastage}
                        setWastage={setRebarWastage}
                        defaultValue={DEFAULT_WASTAGE.rebar}
                        useCustom={rebarCustomWastage}
                        setUseCustom={setRebarCustomWastage}
                    />
                    <ResultDisplay
                        label="鋼筋重量"
                        value={rebarWeight}
                        unit="kg"
                        wastageValue={rebarWithWastage}
                    />
                </div>
            )}

            {/* 模板計算 */}
            {calcType === 'formwork' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info size={16} />
                        公式: 模板面積 = 建築面積 × 係數 (1.3~2.2)
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="建築面積" value={formworkArea} onChange={setFormworkArea} unit="m²" placeholder="0" />
                        <SelectField
                            label="模板係數"
                            value={formworkRatio}
                            onChange={setFormworkRatio}
                            options={[
                                { value: '1.3', label: '1.3 (少柱少現澆板)' },
                                { value: '1.8', label: '1.8 (一般結構)' },
                                { value: '2.2', label: '2.2 (標準多層住宅)' },
                            ]}
                        />
                    </div>
                    <WastageControl
                        wastage={formworkWastage}
                        setWastage={setFormworkWastage}
                        defaultValue={DEFAULT_WASTAGE.formwork}
                        useCustom={formworkCustomWastage}
                        setUseCustom={setFormworkCustomWastage}
                    />
                    <ResultDisplay
                        label="模板面積"
                        value={formworkResult}
                        unit="m²"
                        wastageValue={formworkWithWastage}
                    />
                </div>
            )}
        </div>
    );
};

// 2️⃣ 泥作工程計算器
const MasonryCalculator = () => {
    const [calcType, setCalcType] = useState('mortar');

    // 砂漿計算
    const [mortarArea, setMortarArea] = useState('');
    const [mortarThickness, setMortarThickness] = useState('2.5');
    const [mortarWastage, setMortarWastage] = useState(DEFAULT_WASTAGE.cement);
    const [mortarCustomWastage, setMortarCustomWastage] = useState(false);

    // 紅磚計算
    const [brickArea, setBrickArea] = useState('');
    const [brickWall, setBrickWall] = useState('24');
    const [brickWastage, setBrickWastage] = useState(DEFAULT_WASTAGE.brick);
    const [brickCustomWastage, setBrickCustomWastage] = useState(false);

    // 快速估算
    const [quickArea, setQuickArea] = useState('');

    // 計算結果 - 砂漿 (2.5cm: 水泥10.6kg/m², 砂42.8kg/m²)
    const thicknessRatio = parseFloat(mortarThickness) / 2.5;
    const cementAmount = (parseFloat(mortarArea) || 0) * 10.6 * thicknessRatio;
    const sandAmount = (parseFloat(mortarArea) || 0) * 42.8 * thicknessRatio;
    const cementWithWastage = applyWastage(cementAmount, mortarCustomWastage ? mortarWastage : DEFAULT_WASTAGE.cement);
    const sandWithWastage = applyWastage(sandAmount, mortarCustomWastage ? mortarWastage : DEFAULT_WASTAGE.sand);

    // 紅磚計算
    const brickCount = (parseFloat(brickArea) || 0) * (BRICK_PER_SQM[brickWall]?.count || 128);
    const brickWithWastage = applyWastage(brickCount, brickCustomWastage ? brickWastage : DEFAULT_WASTAGE.brick);

    // 快速估算
    const quickCement = (parseFloat(quickArea) || 0) * 0.4;
    const quickSand = (parseFloat(quickArea) || 0) * 0.05;

    return (
        <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
                {[
                    { id: 'mortar', label: '打底砂漿' },
                    { id: 'brick', label: '紅磚用量' },
                    { id: 'quick', label: '快速估算' },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setCalcType(item.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${calcType === item.id ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {calcType === 'mortar' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info size={16} />
                        配比 1:3 | 基準: 2.5cm厚 → 水泥 10.6kg/m², 砂 42.8kg/m²
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="施作面積" value={mortarArea} onChange={setMortarArea} unit="m²" placeholder="0" />
                        <SelectField
                            label="打底厚度"
                            value={mortarThickness}
                            onChange={setMortarThickness}
                            options={[
                                { value: '1.5', label: '1.5 cm (牆面)' },
                                { value: '2.0', label: '2.0 cm' },
                                { value: '2.5', label: '2.5 cm (標準)' },
                                { value: '3.0', label: '3.0 cm (地坪)' },
                                { value: '4.0', label: '4.0 cm (地坪加厚)' },
                            ]}
                        />
                    </div>
                    <WastageControl
                        wastage={mortarWastage}
                        setWastage={setMortarWastage}
                        defaultValue={DEFAULT_WASTAGE.cement}
                        useCustom={mortarCustomWastage}
                        setUseCustom={setMortarCustomWastage}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <ResultDisplay label="水泥用量" value={cementAmount} unit="kg" wastageValue={cementWithWastage} />
                        <ResultDisplay label="砂用量" value={sandAmount} unit="kg" wastageValue={sandWithWastage} />
                    </div>
                </div>
            )}

            {calcType === 'brick' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info size={16} />
                        12牆=64塊/m², 18牆=96塊/m², 24牆=128塊/m², 37牆=192塊/m²
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="牆面面積" value={brickArea} onChange={setBrickArea} unit="m²" placeholder="0" />
                        <SelectField
                            label="牆厚"
                            value={brickWall}
                            onChange={setBrickWall}
                            options={Object.entries(BRICK_PER_SQM).map(([k, v]) => ({ value: k, label: v.label }))}
                        />
                    </div>
                    <WastageControl
                        wastage={brickWastage}
                        setWastage={setBrickWastage}
                        defaultValue={DEFAULT_WASTAGE.brick}
                        useCustom={brickCustomWastage}
                        setUseCustom={setBrickCustomWastage}
                    />
                    <ResultDisplay label="紅磚數量" value={brickCount} unit="塊" wastageValue={brickWithWastage} />
                </div>
            )}

            {calcType === 'quick' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info size={16} />
                        裝修口訣: 水泥=面積×0.4, 砂=面積×0.05
                    </div>
                    <InputField label="建築面積" value={quickArea} onChange={setQuickArea} unit="m²" placeholder="0" />
                    <div className="grid grid-cols-2 gap-3">
                        <ResultDisplay label="水泥概估" value={quickCement} unit="包" showWastage={false} />
                        <ResultDisplay label="砂概估" value={quickSand} unit="m³" showWastage={false} />
                    </div>
                </div>
            )}
        </div>
    );
};

// 3️⃣ 磁磚工程計算器
const TileCalculator = () => {
    const [calcType, setCalcType] = useState('tiles');

    // 磁磚片數
    const [tileArea, setTileArea] = useState('');
    const [tileUnit, setTileUnit] = useState('ping');
    const [tileSize, setTileSize] = useState(3); // 60x60 default
    const [customTileL, setCustomTileL] = useState('');
    const [customTileW, setCustomTileW] = useState('');
    const [tileWastage, setTileWastage] = useState(DEFAULT_WASTAGE.tile);
    const [tileCustomWastage, setTileCustomWastage] = useState(false);

    // 填縫劑
    const [groutArea, setGroutArea] = useState('');
    const [groutTileL, setGroutTileL] = useState('60');
    const [groutTileW, setGroutTileW] = useState('60');
    const [groutWidth, setGroutWidth] = useState('3');
    const [groutDepth, setGroutDepth] = useState('5');
    const [groutWastage, setGroutWastage] = useState(DEFAULT_WASTAGE.grout);
    const [groutCustomWastage, setGroutCustomWastage] = useState(false);

    // 黏著劑
    const [adhesiveArea, setAdhesiveArea] = useState('');
    const [adhesiveTrowel, setAdhesiveTrowel] = useState('4');
    const [adhesiveWastage, setAdhesiveWastage] = useState(DEFAULT_WASTAGE.adhesive);
    const [adhesiveCustomWastage, setAdhesiveCustomWastage] = useState(false);

    // 計算磁磚片數
    const selectedTile = TILE_SIZES[tileSize];
    const tileL = selectedTile.l || parseFloat(customTileL) || 1;
    const tileW = selectedTile.w || parseFloat(customTileW) || 1;
    const areaSqm = tileUnit === 'ping' ? (parseFloat(tileArea) || 0) * 3.30579 : (parseFloat(tileArea) || 0);
    const tilesPerSqm = 10000 / (tileL * tileW);
    const tileCount = areaSqm * tilesPerSqm;
    const tileCountPerPing = 32400 / (tileL * tileW);
    const tileWithWastage = applyWastage(tileCount, tileCustomWastage ? tileWastage : DEFAULT_WASTAGE.tile);

    // 計算填縫劑 U = (L+W)/(L*W) * D * C * ρ (mm單位)
    const L = parseFloat(groutTileL) * 10 || 600; // mm
    const W = parseFloat(groutTileW) * 10 || 600;
    const D = parseFloat(groutWidth) || 3;
    const C = parseFloat(groutDepth) || 5;
    const groutPerSqm = ((L + W) / (L * W)) * D * C * 1.7;
    const groutAmount = (parseFloat(groutArea) || 0) * groutPerSqm;
    const groutWithWastage = applyWastage(groutAmount, groutCustomWastage ? groutWastage : DEFAULT_WASTAGE.grout);

    // 計算黏著劑
    const adhesivePerSqm = parseFloat(adhesiveTrowel) === 4 ? 2.5 : parseFloat(adhesiveTrowel) === 6 ? 6.25 : 4;
    const adhesiveAmount = (parseFloat(adhesiveArea) || 0) * adhesivePerSqm;
    const adhesiveWithWastage = applyWastage(adhesiveAmount, adhesiveCustomWastage ? adhesiveWastage : DEFAULT_WASTAGE.adhesive);

    return (
        <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
                {[
                    { id: 'tiles', label: '磁磚片數' },
                    { id: 'grout', label: '填縫劑' },
                    { id: 'adhesive', label: '黏著劑' },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setCalcType(item.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${calcType === item.id ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {calcType === 'tiles' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info size={16} />
                        公式: 每坪片數 = 32400 ÷ (長cm × 寬cm)
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <InputField label="施作面積" value={tileArea} onChange={setTileArea} unit={tileUnit === 'ping' ? '坪' : 'm²'} placeholder="0" />
                        <SelectField
                            label="面積單位"
                            value={tileUnit}
                            onChange={setTileUnit}
                            options={[{ value: 'ping', label: '坪' }, { value: 'sqm', label: '平方公尺' }]}
                        />
                        <SelectField
                            label="磁磚尺寸"
                            value={tileSize}
                            onChange={(v) => setTileSize(parseInt(v))}
                            options={TILE_SIZES.map((t, i) => ({ value: i, label: t.label }))}
                        />
                    </div>
                    {tileSize === TILE_SIZES.length - 1 && (
                        <div className="grid grid-cols-2 gap-3">
                            <InputField label="自訂長" value={customTileL} onChange={setCustomTileL} unit="cm" placeholder="60" />
                            <InputField label="自訂寬" value={customTileW} onChange={setCustomTileW} unit="cm" placeholder="60" />
                        </div>
                    )}
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        此尺寸每坪約 <strong>{formatNumber(tileCountPerPing, 1)}</strong> 片
                    </div>
                    <WastageControl
                        wastage={tileWastage}
                        setWastage={setTileWastage}
                        defaultValue={DEFAULT_WASTAGE.tile}
                        useCustom={tileCustomWastage}
                        setUseCustom={setTileCustomWastage}
                    />
                    <ResultDisplay label="磁磚片數" value={tileCount} unit="片" wastageValue={tileWithWastage} />
                </div>
            )}

            {calcType === 'grout' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info size={16} />
                        公式: U = (L+W)/(L×W) × 縫寬 × 縫深 × 1.7
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="施作面積" value={groutArea} onChange={setGroutArea} unit="m²" placeholder="0" />
                        <div className="grid grid-cols-2 gap-2">
                            <InputField label="磚長" value={groutTileL} onChange={setGroutTileL} unit="cm" />
                            <InputField label="磚寬" value={groutTileW} onChange={setGroutTileW} unit="cm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="縫寬" value={groutWidth} onChange={setGroutWidth} unit="mm" />
                        <InputField label="縫深(磚厚)" value={groutDepth} onChange={setGroutDepth} unit="mm" />
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        此規格每平方公尺約 <strong>{formatNumber(groutPerSqm, 2)}</strong> kg
                    </div>
                    <WastageControl
                        wastage={groutWastage}
                        setWastage={setGroutWastage}
                        defaultValue={DEFAULT_WASTAGE.grout}
                        useCustom={groutCustomWastage}
                        setUseCustom={setGroutCustomWastage}
                    />
                    <ResultDisplay label="填縫劑用量" value={groutAmount} unit="kg" wastageValue={groutWithWastage} />
                </div>
            )}

            {calcType === 'adhesive' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info size={16} />
                        4mm鏝刀 ≈ 2.5kg/m², 6mm鏝刀 ≈ 6.25kg/m²
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="施作面積" value={adhesiveArea} onChange={setAdhesiveArea} unit="m²" placeholder="0" />
                        <SelectField
                            label="鏝刀規格"
                            value={adhesiveTrowel}
                            onChange={setAdhesiveTrowel}
                            options={[
                                { value: '4', label: '4mm (一般外牆磚)' },
                                { value: '6', label: '6mm (大型磁磚/石英磚)' },
                            ]}
                        />
                    </div>
                    <WastageControl
                        wastage={adhesiveWastage}
                        setWastage={setAdhesiveWastage}
                        defaultValue={DEFAULT_WASTAGE.adhesive}
                        useCustom={adhesiveCustomWastage}
                        setUseCustom={setAdhesiveCustomWastage}
                    />
                    <ResultDisplay label="黏著劑用量" value={adhesiveAmount} unit="kg" wastageValue={adhesiveWithWastage} />
                </div>
            )}
        </div>
    );
};

// 4️⃣ 裝修工程計算器  
const FinishCalculator = () => {
    const [calcType, setCalcType] = useState('paint');

    // 油漆計算
    const [paintArea, setPaintArea] = useState('');
    const [paintUnit, setPaintUnit] = useState('sqm');
    const [paintWastage, setPaintWastage] = useState(DEFAULT_WASTAGE.paint);
    const [paintCustomWastage, setPaintCustomWastage] = useState(false);

    // 批土計算
    const [puttyArea, setPuttyArea] = useState('');
    const [puttyWastage, setPuttyWastage] = useState(DEFAULT_WASTAGE.putty);
    const [puttyCustomWastage, setPuttyCustomWastage] = useState(false);

    // 塗刷面積估算
    const [buildingArea, setBuildingArea] = useState('');

    // 計算油漆
    const paintAreaSqm = paintUnit === 'ping' ? (parseFloat(paintArea) || 0) * 3.30579 : (parseFloat(paintArea) || 0);
    const paintGallons = paintAreaSqm / 3.30579 * 0.5; // 每坪0.5加侖
    const paintWithWastage = applyWastage(paintGallons, paintCustomWastage ? paintWastage : DEFAULT_WASTAGE.paint);

    // 計算批土
    const puttyAmount = (parseFloat(puttyArea) || 0) * 0.35;
    const puttyWithWastage = applyWastage(puttyAmount, puttyCustomWastage ? puttyWastage : DEFAULT_WASTAGE.putty);

    // 塗刷面積估算 (建築面積×3)
    const estimatedPaintArea = (parseFloat(buildingArea) || 0) * 3;

    return (
        <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
                {[
                    { id: 'paint', label: '油漆用量' },
                    { id: 'putty', label: '批土用量' },
                    { id: 'estimate', label: '面積估算' },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setCalcType(item.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${calcType === item.id ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {calcType === 'paint' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info size={16} />
                        公式: 用量(加侖) ≈ 面積(坪) × 0.5
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="塗刷面積" value={paintArea} onChange={setPaintArea} unit={paintUnit === 'ping' ? '坪' : 'm²'} placeholder="0" />
                        <SelectField
                            label="單位"
                            value={paintUnit}
                            onChange={setPaintUnit}
                            options={[{ value: 'sqm', label: '平方公尺' }, { value: 'ping', label: '坪' }]}
                        />
                    </div>
                    <WastageControl
                        wastage={paintWastage}
                        setWastage={setPaintWastage}
                        defaultValue={DEFAULT_WASTAGE.paint}
                        useCustom={paintCustomWastage}
                        setUseCustom={setPaintCustomWastage}
                    />
                    <ResultDisplay label="油漆用量" value={paintGallons} unit="加侖" wastageValue={paintWithWastage} />
                </div>
            )}

            {calcType === 'putty' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info size={16} />
                        公式: 批土用量 = 建築面積 × 0.35
                    </div>
                    <InputField label="建築面積" value={puttyArea} onChange={setPuttyArea} unit="m²" placeholder="0" />
                    <WastageControl
                        wastage={puttyWastage}
                        setWastage={setPuttyWastage}
                        defaultValue={DEFAULT_WASTAGE.putty}
                        useCustom={puttyCustomWastage}
                        setUseCustom={setPuttyCustomWastage}
                    />
                    <ResultDisplay label="批土用量" value={puttyAmount} unit="kg" wastageValue={puttyWithWastage} />
                </div>
            )}

            {calcType === 'estimate' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info size={16} />
                        室內抹灰/塗刷面積 ≈ 建築面積 × 3 ~ 3.8
                    </div>
                    <InputField label="建築面積" value={buildingArea} onChange={setBuildingArea} unit="m²" placeholder="0" />
                    <ResultDisplay label="預估塗刷面積" value={estimatedPaintArea} unit="m²" showWastage={false} />
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        地磚面積 ≈ 建築面積 × 0.7 = <strong>{formatNumber((parseFloat(buildingArea) || 0) * 0.7)}</strong> m²
                    </div>
                </div>
            )}
        </div>
    );
};

// 5️⃣ 建築概估計算器
const BuildingEstimator = () => {
    const [buildingType, setBuildingType] = useState(1);
    const [floorArea, setFloorArea] = useState('');

    const selected = BUILDING_TYPES[buildingType];
    const totalRebar = (parseFloat(floorArea) || 0) * selected.rebar;
    const totalConcrete = (parseFloat(floorArea) || 0) * selected.concrete;
    const totalFormwork = (parseFloat(floorArea) || 0) * 2.2;

    return (
        <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                    <Info size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-800">
                        <p className="font-medium">建築概估說明</p>
                        <p className="text-orange-600 mt-1">依據建築類型與樓地板面積，快速估算整棟建築的主要結構材料用量。數據來源為抗震7度區規則結構設計經驗值。</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <SelectField
                        label="建築類型"
                        value={buildingType}
                        onChange={(v) => setBuildingType(parseInt(v))}
                        options={BUILDING_TYPES.map((t, i) => ({ value: i, label: t.label }))}
                    />
                    <InputField label="總樓地板面積" value={floorArea} onChange={setFloorArea} unit="m²" placeholder="0" />
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <span>鋼筋指標:</span>
                        <span className="font-medium">{selected.rebar} kg/m²</span>
                        <span>混凝土指標:</span>
                        <span className="font-medium">{selected.concrete} m³/m²</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <ResultDisplay label="鋼筋總量" value={totalRebar} unit="kg" showWastage={false} />
                    <ResultDisplay label="混凝土總量" value={totalConcrete} unit="m³" showWastage={false} />
                    <ResultDisplay label="模板總量" value={totalFormwork} unit="m²" showWastage={false} />
                </div>

                <div className="text-xs text-gray-500">
                    鋼筋約 <strong>{formatNumber(totalRebar / 1000, 1)}</strong> 噸 |
                    混凝土約 <strong>{formatNumber(totalConcrete)}</strong> 立方公尺
                </div>
            </div>

            {/* 參考表格 */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
                <h4 className="font-medium text-gray-700 mb-3">建築類型參考指標</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2 px-2">建築類型</th>
                                <th className="text-right py-2 px-2">鋼筋 (kg/m²)</th>
                                <th className="text-right py-2 px-2">混凝土 (m³/m²)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {BUILDING_TYPES.map((t, i) => (
                                <tr key={i} className={`border-b ${i === buildingType ? 'bg-orange-50' : ''}`}>
                                    <td className="py-2 px-2">{t.label}</td>
                                    <td className="text-right py-2 px-2">{t.rebar}</td>
                                    <td className="text-right py-2 px-2">{t.concrete}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ============================================
// 主組件
// ============================================

export const MaterialCalculator = ({ addToast }) => {
    const [activeTab, setActiveTab] = useState('structure');

    const tabs = [
        { id: 'structure', icon: Building2, label: '結構工程' },
        { id: 'masonry', icon: Layers, label: '泥作工程' },
        { id: 'tile', icon: Grid3X3, label: '磁磚工程' },
        { id: 'finish', icon: Paintbrush, label: '裝修工程' },
        { id: 'estimate', icon: BarChart3, label: '建築概估' },
    ];

    const renderCalculator = () => {
        switch (activeTab) {
            case 'structure': return <StructureCalculator />;
            case 'masonry': return <MasonryCalculator />;
            case 'tile': return <TileCalculator />;
            case 'finish': return <FinishCalculator />;
            case 'estimate': return <BuildingEstimator />;
            default: return <StructureCalculator />;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <SectionTitle title="營建物料快速換算" />

            {/* 工項選擇 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl whitespace-nowrap transition-all ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                            >
                                <Icon size={18} />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 計算器區域 */}
            <div className="bg-gray-50 rounded-2xl p-5">
                {renderCalculator()}
            </div>

            {/* 公式說明 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Calculator size={18} />
                    常用換算公式
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium text-gray-700">🧱 鋼筋重量</div>
                        <div className="text-gray-500 mt-1">每米重 = 0.00617 × d²</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium text-gray-700">🧱 紅磚數量</div>
                        <div className="text-gray-500 mt-1">24牆 = 128塊/m²</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium text-gray-700">🔲 磁磚片數</div>
                        <div className="text-gray-500 mt-1">每坪 = 32400 ÷ (長×寬)</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium text-gray-700">🧱 打底砂漿</div>
                        <div className="text-gray-500 mt-1">2.5cm: 水泥10.6kg/m²</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium text-gray-700">🎨 油漆用量</div>
                        <div className="text-gray-500 mt-1">每坪 ≈ 0.5 加侖</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium text-gray-700">📐 模板估算</div>
                        <div className="text-gray-500 mt-1">模板 ≈ 建築面積 × 2.2</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaterialCalculator;
