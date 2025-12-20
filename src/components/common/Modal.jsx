
import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    onConfirm,
    confirmText = "確認",
    confirmDisabled = false,
    size = "default" // default, wide, narrow
}) => {
    if (!isOpen) return null;

    const sizeClasses = {
        narrow: "max-w-md",
        default: "max-w-lg",
        wide: "max-w-2xl"
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className={`
                bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full ${sizeClasses[size] || sizeClasses.default} 
                my-auto overflow-hidden animate-slide-up 
                border border-gray-100
                max-h-[95vh] flex flex-col
            `}>
                {/* Header */}
                <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-gray-50/50 to-transparent">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100/80 hover:bg-gray-200/80 rounded-full p-1.5"
                    >
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
                    {children}
                </div>

                {/* Footer */}
                <div className="px-5 sm:px-6 py-4 bg-gray-50/80 flex justify-end gap-3 border-t border-gray-100/50 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200/80 transition-all duration-200 font-medium"
                    >
                        取消
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={confirmDisabled}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                            bg-gradient-to-r from-gray-800 to-gray-700 text-white 
                            hover:from-gray-700 hover:to-gray-600
                            shadow-soft hover:shadow-lg hover:-translate-y-0.5
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-soft
                            active:translate-y-0"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
