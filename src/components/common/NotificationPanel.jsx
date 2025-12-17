import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, ExternalLink } from 'lucide-react';
import { GoogleService } from '../../services/GoogleService';

export const NotificationPanel = ({ isOpen, onClose }) => {
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUpcomingEvents();
        }
    }, [isOpen]);

    const fetchUpcomingEvents = async () => {
        setLoading(true);
        try {
            const events = await GoogleService.fetchCalendarEvents();

            // 過濾出未來24小時內的行程
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            const upcoming = events.filter(event => {
                const eventDate = new Date(`${event.date}T${event.time}`);
                return eventDate >= now && eventDate <= tomorrow;
            }).sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA - dateB;
            });

            setUpcomingEvents(upcoming);
        } catch (error) {
            console.error('Failed to fetch calendar events:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTimeUntil = (event) => {
        const now = new Date();
        const eventDate = new Date(`${event.date}T${event.time}`);
        const diff = eventDate - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}小時${minutes}分鐘後`;
        }
        return `${minutes}分鐘後`;
    };

    const openInGoogleCalendar = () => {
        window.open('https://calendar.google.com', '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="absolute top-20 right-8 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-fade-in">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-morandi-text-accent" />
                    <h3 className="font-bold text-gray-800">即將到來的行程</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <X size={18} className="text-gray-400" />
                </button>
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">
                        <div className="animate-spin w-8 h-8 border-2 border-morandi-text-accent border-t-transparent rounded-full mx-auto mb-2"></div>
                        載入中...
                    </div>
                ) : upcomingEvents.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <Calendar size={48} className="mx-auto mb-2 opacity-30" />
                        <p>接下來24小時內沒有行程</p>
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {upcomingEvents.map(event => (
                            <div
                                key={event.id}
                                className="p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-bold text-gray-800 flex-1">{event.title}</h4>
                                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                        {getTimeUntil(event)}
                                    </span>
                                </div>

                                <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-gray-400" />
                                        <span>{event.date} {event.time}</span>
                                    </div>

                                    {event.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="text-gray-400" />
                                            <span className="truncate">{event.location}</span>
                                        </div>
                                    )}

                                    {event.description && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                            {event.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={openInGoogleCalendar}
                    className="w-full py-2 bg-morandi-text-accent hover:bg-gray-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <ExternalLink size={16} />
                    在 Google Calendar 中查看全部
                </button>
            </div>
        </div>
    );
};
