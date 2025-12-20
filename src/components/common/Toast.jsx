
import React from 'react';
import { CheckCircle2, AlertCircle, Info, X, ExternalLink } from 'lucide-react';

const toastStyles = {
    success: {
        icon: CheckCircle2,
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        borderColor: "border-l-emerald-500"
    },
    error: {
        icon: AlertCircle,
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        borderColor: "border-l-red-500"
    },
    info: {
        icon: Info,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        borderColor: "border-l-blue-500"
    },
    warning: {
        icon: AlertCircle,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        borderColor: "border-l-amber-500"
    }
};

export const ToastContainer = ({ toasts, removeToast }) => (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 max-w-sm">
        {toasts.map(toast => {
            const style = toastStyles[toast.type] || toastStyles.info;
            const IconComponent = style.icon;

            return (
                <div
                    key={toast.id}
                    className={`
                        bg-white/95 backdrop-blur-lg 
                        border border-gray-100 border-l-4 ${style.borderColor}
                        px-4 py-3.5 rounded-xl shadow-elevated
                        flex items-start gap-3 animate-slide-up 
                        min-w-[300px] transition-all hover:shadow-xl
                    `}
                >
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${style.iconBg} ${style.iconColor}`}>
                        <IconComponent size={16} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                        <div className="text-sm font-medium text-gray-800 break-words leading-snug">
                            {toast.message}
                        </div>
                        {toast.action && (
                            <button
                                onClick={() => {
                                    toast.action.onClick();
                                    removeToast(toast.id);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2 flex items-center gap-1 hover:underline transition-colors"
                            >
                                {toast.action.label}
                                <ExternalLink size={11} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="text-gray-300 hover:text-gray-500 p-1 rounded-lg hover:bg-gray-100 flex-shrink-0 transition-all"
                    >
                        <X size={14} />
                    </button>
                </div>
            );
        })}
    </div>
);
