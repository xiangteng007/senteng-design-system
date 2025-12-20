import React from 'react';
import { Loader2 } from 'lucide-react';

const variantStyles = {
    primary: `
        bg-gradient-to-r from-gray-800 to-gray-700 text-white
        hover:from-gray-700 hover:to-gray-600
        shadow-soft hover:shadow-lg
        active:scale-[0.98]
    `,
    secondary: `
        bg-white border border-gray-200 text-gray-700
        hover:bg-gray-50 hover:border-gray-300
        shadow-sm hover:shadow
        active:scale-[0.98]
    `,
    accent: `
        bg-gradient-to-r from-indigo-600 to-violet-600 text-white
        hover:from-indigo-500 hover:to-violet-500
        shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300
        active:scale-[0.98]
    `,
    success: `
        bg-gradient-to-r from-emerald-600 to-teal-600 text-white
        hover:from-emerald-500 hover:to-teal-500
        shadow-lg shadow-emerald-200 hover:shadow-xl
        active:scale-[0.98]
    `,
    danger: `
        bg-gradient-to-r from-red-600 to-rose-600 text-white
        hover:from-red-500 hover:to-rose-500
        shadow-lg shadow-red-200 hover:shadow-xl
        active:scale-[0.98]
    `,
    ghost: `
        bg-transparent text-gray-600
        hover:bg-gray-100 hover:text-gray-800
        active:scale-[0.98]
    `
};

export const LoadingButton = ({
    children,
    loading = false,
    disabled = false,
    onClick,
    className = '',
    variant = 'primary',
    type = 'button',
    size = 'default',
    ...props
}) => {
    const sizeStyles = {
        sm: 'px-3 py-1.5 text-xs rounded-lg',
        default: 'px-4 py-2.5 text-sm rounded-xl',
        lg: 'px-6 py-3 text-base rounded-xl'
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`
                font-medium transition-all duration-200 
                flex items-center justify-center gap-2 
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                hover:-translate-y-0.5 disabled:hover:translate-y-0
                ${sizeStyles[size]}
                ${variantStyles[variant]}
                ${className}
            `}
            {...props}
        >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {children}
        </button>
    );
};
