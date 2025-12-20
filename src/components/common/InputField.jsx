
import React from 'react';
import { Trash2, Plus } from 'lucide-react';

const inputBaseStyles = `
    w-full px-4 py-2.5 
    bg-white border border-gray-200 
    rounded-xl text-sm text-gray-800
    placeholder:text-gray-400
    focus:outline-none focus:ring-2 focus:ring-gray-800/10 focus:border-gray-300
    transition-all duration-200
    hover:border-gray-300
`;

export const InputField = ({ label, type = "text", placeholder, value, onChange, options, children, disabled = false }) => (
    <div className="mb-4">
        {label && (
            <label className="block text-sm font-medium text-gray-600 mb-1.5 ml-0.5">
                {label}
            </label>
        )}
        {type === "select" ? (
            <select
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`${inputBaseStyles} ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            >
                {children || (
                    <>
                        <option value="" disabled>請選擇</option>
                        {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </>
                )}
            </select>
        ) : type === "textarea" ? (
            <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className={`${inputBaseStyles} min-h-[100px] resize-none ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            />
        ) : (
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className={`${inputBaseStyles} ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            />
        )}
    </div>
);

export const DynamicFieldEditor = ({ fields, onChange }) => {
    const handleFieldChange = (idx, key, value) => {
        const newFields = [...fields];
        newFields[idx][key] = value;
        onChange(newFields);
    };
    const addField = () => onChange([...fields, { label: "", value: "" }]);
    const removeField = (idx) => onChange(fields.filter((_, i) => i !== idx));

    return (
        <div className="space-y-3">
            {fields.map((field, idx) => (
                <div key={idx} className="flex gap-2 items-center animate-fade-in">
                    <input
                        type="text"
                        placeholder="欄位名稱"
                        value={field.label}
                        onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                        className="w-1/3 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-800/10 focus:border-gray-300 transition-all"
                    />
                    <input
                        type="text"
                        placeholder="內容"
                        value={field.value}
                        onChange={(e) => handleFieldChange(idx, 'value', e.target.value)}
                        className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-800/10 focus:border-gray-300 transition-all"
                    />
                    <button
                        onClick={() => removeField(idx)}
                        className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
            <button
                onClick={addField}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1.5 mt-2 font-medium bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-all"
            >
                <Plus size={14} /> 新增自訂欄位
            </button>
        </div>
    );
};
