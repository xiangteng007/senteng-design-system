
import React from 'react';
import { Trash2, Plus } from 'lucide-react';

export const InputField = ({ label, type = "text", placeholder, value, onChange, options, children }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-1.5 ml-1">{label}</label>
        {type === "select" ? (
            <select value={value} onChange={onChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morandi-blue-500 bg-white">
                {children || (
                    <>
                        <option value="" disabled>請選擇</option>
                        {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </>
                )}
            </select>
        ) : type === "textarea" ? (
            <textarea value={value} onChange={onChange} placeholder={placeholder} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morandi-blue-500 min-h-[100px] resize-none" />
        ) : (
            <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morandi-blue-500" />
        )}
    </div>
);

export const DynamicFieldEditor = ({ fields, onChange }) => {
    const handleFieldChange = (idx, key, value) => { const newFields = [...fields]; newFields[idx][key] = value; onChange(newFields); };
    const addField = () => onChange([...fields, { label: "", value: "" }]);
    const removeField = (idx) => onChange(fields.filter((_, i) => i !== idx));

    return (
        <div className="space-y-3">
            {fields.map((field, idx) => (
                <div key={idx} className="flex gap-2 items-center animate-fade-in">
                    <input type="text" placeholder="欄位名稱" value={field.label} onChange={(e) => handleFieldChange(idx, 'label', e.target.value)} className="w-1/3 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-morandi-blue-500" />
                    <input type="text" placeholder="內容" value={field.value} onChange={(e) => handleFieldChange(idx, 'value', e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morandi-blue-500" />
                    <button onClick={() => removeField(idx)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                </div>
            ))}
            <button onClick={addField} className="text-sm text-morandi-blue-600 hover:text-morandi-blue-700 flex items-center gap-1 mt-2 font-medium bg-morandi-blue-100/50 px-3 py-1.5 rounded-lg transition-colors">
                <Plus size={14} /> 新增自訂欄位
            </button>
        </div>
    );
};
