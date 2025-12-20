import React from 'react';

const variantStyles = {
    default: `
        bg-white border border-gray-100/80
        shadow-card hover:shadow-card-hover
    `,
    elevated: `
        bg-white border border-gray-50
        shadow-elevated hover:shadow-xl
    `,
    glass: `
        glass-card border border-white/60
        hover:border-white/80
    `,
    subtle: `
        bg-gray-50/50 border border-gray-100/50
        hover:bg-white hover:border-gray-100
    `
};

export const Card = ({
    children,
    className = "",
    noPadding = false,
    onClick,
    variant = "default"
}) => (
    <div
        onClick={onClick}
        className={`
            rounded-2xl transition-all duration-300 ease-smooth
            ${variantStyles[variant] || variantStyles.default}
            ${noPadding ? '' : 'p-5 lg:p-6'} 
            ${className} 
            ${onClick ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]' : 'hover:-translate-y-0.5'}
        `}
    >
        {children}
    </div>
);
