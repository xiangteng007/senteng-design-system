
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Building2 } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { InputField } from '../components/common/InputField';
import { LocationField } from '../components/common/LocationField';
import { SectionTitle } from '../components/common/Indicators';
import { GoogleService } from '../services/GoogleService';

// 台灣節慶假日 2024-2026
const TAIWAN_HOLIDAYS = {
    // 2024
    '2024-01-01': '元旦',
    '2024-02-08': '除夕',
    '2024-02-09': '春節',
    '2024-02-10': '初二',
    '2024-02-11': '初三',
    '2024-02-12': '初四',
    '2024-02-13': '初五',
    '2024-02-14': '初六',
    '2024-02-28': '和平紀念日',
    '2024-04-04': '兒童節',
    '2024-04-05': '清明節',
    '2024-05-01': '勞動節',
    '2024-06-10': '端午節',
    '2024-09-17': '中秋節',
    '2024-10-10': '國慶日',
    '2024-12-25': '行憲紀念日',
    // 2025
    '2025-01-01': '元旦',
    '2025-01-28': '除夕',
    '2025-01-29': '春節',
    '2025-01-30': '初二',
    '2025-01-31': '初三',
    '2025-02-01': '初四',
    '2025-02-28': '和平紀念日',
    '2025-04-03': '兒童節（彈性）',
    '2025-04-04': '兒童節/清明節',
    '2025-04-05': '清明節（彈性）',
    '2025-05-01': '勞動節',
    '2025-05-31': '端午節',
    '2025-10-06': '中秋節',
    '2025-10-10': '國慶日',
    '2025-12-25': '行憲紀念日',
    // 2026
    '2026-01-01': '元旦',
    '2026-02-16': '除夕',
    '2026-02-17': '春節',
    '2026-02-18': '初二',
    '2026-02-19': '初三',
    '2026-02-20': '初四',
    '2026-02-28': '和平紀念日',
    '2026-04-04': '兒童節',
    '2026-04-05': '清明節',
    '2026-05-01': '勞動節',
    '2026-06-19': '端午節',
    '2026-09-25': '中秋節',
    '2026-10-10': '國慶日',
    '2026-12-25': '行憲紀念日',
};

const Schedule = ({ data = [], loans = [], addToast, onUpdateCalendar }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "10:00", type: "meeting", description: "", location: "" });
    const [isSaving, setIsSaving] = useState(false);
    const [showHolidays, setShowHolidays] = useState(true);
    const [showLoanReminders, setShowLoanReminders] = useState(true);
    const [localEvents, setLocalEvents] = useState(data);

    // 生成貸款還款提醒事件
    const loanPaymentEvents = useMemo(() => {
        if (!showLoanReminders || !loans.length) return [];

        const events = [];
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        loans.forEach(loan => {
            if (loan.status !== 'active') return;

            const paymentDay = loan.paymentDay || 15;
            // 確保日期在月份範圍內
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const actualDay = Math.min(paymentDay, daysInMonth);

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;

            events.push({
                id: `loan-${loan.id}-${dateStr}`,
                title: `🏦 ${loan.bankName} 還款`,
                date: dateStr,
                time: '09:00',
                type: 'loan',
                description: `每月還款 $${loan.monthlyPayment?.toLocaleString() || 0}`,
                location: loan.bankName,
                loanId: loan.id,
                amount: loan.monthlyPayment
            });
        });

        return events;
    }, [loans, currentDate, showLoanReminders]);

    // 合併一般事件和貸款還款事件
    const allEvents = useMemo(() => {
        return [...localEvents, ...loanPaymentEvents];
    }, [localEvents, loanPaymentEvents]);

    const getDaysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = Array(firstDay).fill(null).concat([...Array(daysInMonth).keys()].map(i => i + 1));

    // 檢查是否為假日
    const getHoliday = (dateStr) => {
        return TAIWAN_HOLIDAYS[dateStr] || null;
    };

    // 檢查是否為週末
    const isWeekend = (dateStr) => {
        const date = new Date(dateStr);
        const day = date.getDay();
        return day === 0 || day === 6;
    };

    const handleAddEvent = async () => {
        if (!newEvent.title || !newEvent.date) {
            return addToast("請填寫標題和日期", 'error');
        }

        setIsSaving(true);

        // 創建本地事件物件
        const eventToAdd = {
            id: `evt-${Date.now()}`,
            ...newEvent
        };

        // 嘗試同步到 Google Calendar
        const result = await GoogleService.addToCalendar(newEvent);
        setIsSaving(false);

        // 無論 GAS 成功與否，都新增到本地
        const updatedEvents = [...localEvents, eventToAdd];
        setLocalEvents(updatedEvents);
        if (onUpdateCalendar) onUpdateCalendar(updatedEvents);

        if (result.success) {
            addToast(`✅ 行程「${newEvent.title}」已同步至 Google Calendar`, 'success');
        } else {
            addToast(`⚠️ 行程已新增（本地），但 Google 同步失敗: ${result.error}`, 'warning');
        }

        setNewEvent({ title: "", date: "", time: "10:00", type: "meeting", description: "", location: "" });
        setIsAddModalOpen(false);
    };

    // 跳轉到今天
    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <SectionTitle title="行程管理" />

            {/* 頂部控制列 */}
            <div className="flex flex-wrap items-center gap-3">
                {/* 月份導航 */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-lg font-bold text-gray-800 w-32 text-center select-none">
                        {currentDate.getFullYear()} 年 {currentDate.getMonth() + 1} 月
                    </span>
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* 今天按鈕 */}
                <button
                    onClick={goToToday}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
                >
                    今天
                </button>

                {/* 假日顯示開關 */}
                <button
                    onClick={() => setShowHolidays(!showHolidays)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${showHolidays
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    <CalendarDays size={16} />
                    台灣假日
                </button>

                {/* 貸款還款提醒開關 */}
                {loans.length > 0 && (
                    <button
                        onClick={() => setShowLoanReminders(!showLoanReminders)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${showLoanReminders
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <Building2 size={16} />
                        貸款提醒
                    </button>
                )}

                {/* 新增行程 */}
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="ml-auto bg-morandi-text-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
                >
                    <Plus size={16} />
                    新增行程
                </button>
            </div>

            {/* 日曆 */}
            <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                {/* 星期標題 */}
                <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                    {['日', '一', '二', '三', '四', '五', '六'].map((d, idx) => (
                        <div
                            key={d}
                            className={`py-4 text-center text-sm font-bold ${idx === 0 || idx === 6 ? 'text-red-400' : 'text-gray-400'
                                }`}
                        >
                            {d}
                        </div>
                    ))}
                </div>

                {/* 日期格子 */}
                <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                    {days.map((day, idx) => {
                        const dateStr = day ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                        const events = allEvents.filter(e => e.date === dateStr);
                        const holiday = showHolidays && day ? getHoliday(dateStr) : null;
                        const weekend = day ? isWeekend(dateStr) : false;
                        const isToday = dateStr === todayStr;
                        const hasLoanEvent = events.some(e => e.type === 'loan');

                        return (
                            <div
                                key={idx}
                                className={`border-b border-r border-gray-50 p-2 min-h-[100px] transition-colors ${!day ? 'bg-gray-50/20' : 'hover:bg-gray-50'
                                    } ${isToday ? 'bg-blue-50/50' : ''}`}
                            >
                                {day && (
                                    <>
                                        {/* 日期數字 */}
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1 ${isToday
                                            ? 'bg-blue-500 text-white font-bold shadow-md'
                                            : hasLoanEvent
                                                ? 'bg-indigo-500 text-white font-bold shadow-md'
                                                : events.length > 0
                                                    ? 'bg-morandi-text-accent text-white font-bold shadow-md'
                                                    : holiday || weekend
                                                        ? 'text-red-500 font-medium'
                                                        : 'text-gray-500'
                                            }`}>
                                            {day}
                                        </div>

                                        {/* 假日名稱 */}
                                        {holiday && (
                                            <div className="text-[10px] text-red-500 font-medium truncate mb-1">
                                                {holiday}
                                            </div>
                                        )}

                                        {/* 行程 */}
                                        <div className="space-y-1">
                                            {events.map(evt => (
                                                <div
                                                    key={evt.id}
                                                    className={`text-[10px] px-2 py-1 rounded-lg border truncate cursor-pointer ${evt.type === 'loan'
                                                        ? 'bg-indigo-100/50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                                        : 'bg-morandi-blue-100/50 text-morandi-blue-600 border-morandi-blue-100 hover:bg-morandi-blue-100'
                                                        }`}
                                                >
                                                    {evt.type === 'loan' ? `🏦 $${evt.amount?.toLocaleString() || ''} ` : `${evt.time} `}{evt.title}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 新增行程 Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); setIsSaving(false); }}
                title="新增行程"
                onConfirm={handleAddEvent}
                confirmDisabled={isSaving}
                confirmText={isSaving ? '處理中...' : '確定'}
            >
                <InputField
                    label="標題"
                    value={newEvent.title}
                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="例：客戶會議"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                        label="日期"
                        type="date"
                        value={newEvent.date}
                        onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                    />
                    <InputField
                        label="時間"
                        type="time"
                        value={newEvent.time}
                        onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                </div>
                <LocationField
                    label="地點"
                    value={newEvent.location}
                    onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="例：台北市信義區松智路1號"
                />
                <InputField
                    label="描述"
                    value={newEvent.description}
                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="備註..."
                />
            </Modal>
        </div>
    );
};

export default Schedule;
