import React from 'react';
import { Maximize2, Minimize2, GripHorizontal } from 'lucide-react';

export const WidgetWrapper = ({ widget, onResize, onDragStart, onDragEnter, onDragEnd, children }) => {
    const { id, size, title } = widget;

    const getGridSpan = (s) => {
        switch (s) {
            case 'S': return 'col-span-1 row-span-1';
            case 'M': return 'col-span-1 md:col-span-2 row-span-1';
            case 'L': return 'col-span-1 md:col-span-2 lg:col-span-4 row-span-2';
            default: return 'col-span-1';
        }
    };

    const nextSize = (current) => {
        if (current === 'S') return 'M';
        if (current === 'M') return 'L';
        return 'S';
    };

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnter={onDragEnter}
            onDragEnd={onDragEnd}
            className={`
                group relative bg-white rounded-2xl 
                shadow-card hover:shadow-card-hover
                border border-gray-100/80
                transition-all duration-300 ease-smooth
                hover:-translate-y-0.5
                ${getGridSpan(size)} 
                flex flex-col overflow-hidden animate-fade-in
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-transparent">
                <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors">
                    <GripHorizontal size={14} strokeWidth={2} />
                    <h3 className="font-semibold text-gray-700 text-sm select-none">{title}</h3>
                </div>
                <button
                    onClick={() => onResize(id, nextSize(size))}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                    title={size === 'L' ? '縮小' : '放大'}
                >
                    {size === 'L' ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-hidden flex flex-col relative">
                {children}
            </div>
        </div>
    );
};
