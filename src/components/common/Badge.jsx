import React from 'react';

const colorStyles = {
    gray: "bg-gray-100 text-gray-600 border-gray-200/50",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    purple: "bg-violet-50 text-violet-600 border-violet-100",
    red: "bg-red-50 text-red-600 border-red-100",
    yellow: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    pink: "bg-pink-50 text-pink-600 border-pink-100",
    teal: "bg-teal-50 text-teal-600 border-teal-100",
    // Solid variants
    'solid-gray': "bg-gray-700 text-white border-transparent",
    'solid-green': "bg-emerald-500 text-white border-transparent",
    'solid-blue': "bg-blue-500 text-white border-transparent",
    'solid-red': "bg-red-500 text-white border-transparent",
};

const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    default: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
};

export const Badge = ({
    children,
    color = "gray",
    className = "",
    size = "default",
    dot = false
}) => {
    return (
        <span className={`
            inline-flex items-center gap-1.5
            rounded-full font-medium border
            transition-colors duration-200
            ${colorStyles[color] || colorStyles.gray} 
            ${sizeStyles[size] || sizeStyles.default}
            ${className}
        `}>
            {dot && (
                <span className={`
                    w-1.5 h-1.5 rounded-full 
                    ${color.includes('solid') ? 'bg-white/80' : 'bg-current opacity-70'}
                `} />
            )}
            {children}
        </span>
    );
};
