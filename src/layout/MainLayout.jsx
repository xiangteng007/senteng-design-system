
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Briefcase, Users, Wallet, HardHat, Package, Bell, LayoutDashboard, Image as ImageIcon, Menu, X, FileText, Ruler, Calculator, Building2, GripVertical, RotateCcw, LogOut, Settings, ChevronDown } from 'lucide-react';
import { NotificationPanel } from '../components/common/NotificationPanel';
import { GoogleService } from '../services/GoogleService';
import { useAuth } from '../context/AuthContext';

// DnD Kit imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 預設選單順序
const DEFAULT_MENU_ITEMS = [
    { id: 'dashboard', icon: LayoutDashboard, label: '儀表板' },
    { id: 'schedule', icon: CalendarIcon, label: '行程管理' },
    { id: 'projects', icon: Briefcase, label: '專案管理' },
    { id: 'clients', icon: Users, label: '客戶管理' },
    { id: 'finance', icon: Wallet, label: '財務管理' },
    { id: 'vendors', icon: HardHat, label: '廠商管理' },
    { id: 'inventory', icon: Package, label: '庫存管理' },
    { id: 'materials', icon: ImageIcon, label: '材質圖庫' },
    { id: 'invoice', icon: FileText, label: '發票小幫手' },
    { id: 'unit', icon: Ruler, label: '單位換算' },
    { id: 'cost', icon: Calculator, label: '成本估算' },
    { id: 'calc', icon: Building2, label: '物料換算' },
];

// localStorage key
const MENU_ORDER_KEY = 'senteng_menu_order';

// 可排序的側邊欄項目 - 優化樣式
const SortableSidebarItem = ({ id, icon: Icon, label, active, onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.9 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                flex items-center gap-0.5 rounded-xl transition-all duration-200 relative
                ${isDragging ? 'shadow-elevated bg-white scale-[1.02]' : ''}
                ${active ? '' : 'hover:bg-gray-50/80'}
            `}
        >
            {/* 拖曳把手 */}
            <button
                {...attributes}
                {...listeners}
                className="p-2 text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none transition-colors"
                title="拖曳排序"
            >
                <GripVertical size={14} />
            </button>

            {/* 選單項目 */}
            <button
                onClick={() => onClick(id)}
                className={`
                    flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative
                    ${active
                        ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-soft'
                        : 'text-gray-600 hover:text-gray-800'
                    }
                `}
            >
                {/* Active indicator bar */}
                {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/30 rounded-full" />
                )}
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
                <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </button>
        </div>
    );
};

export const MainLayout = ({ activeTab, setActiveTab, children }) => {
    const { user, role, allowedPages, signOut } = useAuth();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [hasUpcomingEvents, setHasUpcomingEvents] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [menuItems, setMenuItems] = useState(DEFAULT_MENU_ITEMS);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // Filter menu items based on user permissions
    const visibleMenuItems = useMemo(() => {
        let items = menuItems.filter(item => allowedPages?.includes(item.id));

        // Add user management for super_admin
        if (role === 'super_admin') {
            const hasUserMgmt = items.find(i => i.id === 'user-management');
            if (!hasUserMgmt) {
                items = [...items, { id: 'user-management', icon: Settings, label: '使用者管理' }];
            }
        }

        return items;
    }, [menuItems, allowedPages, role]);

    // 從 localStorage 讀取選單順序
    useEffect(() => {
        const savedOrder = localStorage.getItem(MENU_ORDER_KEY);
        if (savedOrder) {
            try {
                const orderIds = JSON.parse(savedOrder);
                // 根據儲存的順序重新排列選單
                const reorderedItems = orderIds
                    .map(id => DEFAULT_MENU_ITEMS.find(item => item.id === id))
                    .filter(Boolean);

                // 補上任何新增的選單項目（如果有的話）
                DEFAULT_MENU_ITEMS.forEach(item => {
                    if (!reorderedItems.find(i => i.id === item.id)) {
                        reorderedItems.push(item);
                    }
                });

                setMenuItems(reorderedItems);
            } catch (e) {
                console.error('Failed to parse menu order:', e);
            }
        }
    }, []);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 需要移動 5px 才開始拖曳
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 處理拖曳結束
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setMenuItems((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // 儲存新順序到 localStorage
                const orderIds = newItems.map(item => item.id);
                localStorage.setItem(MENU_ORDER_KEY, JSON.stringify(orderIds));

                return newItems;
            });
        }
    };

    // 重設為預設順序
    const resetMenuOrder = () => {
        setMenuItems(DEFAULT_MENU_ITEMS);
        localStorage.removeItem(MENU_ORDER_KEY);
    };

    // 檢查是否有即將到來的行程
    useEffect(() => {
        const checkUpcomingEvents = async () => {
            try {
                const events = await GoogleService.fetchCalendarEvents();
                const now = new Date();
                const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

                const upcoming = events.some(event => {
                    const eventDate = new Date(`${event.date}T${event.time}`);
                    return eventDate >= now && eventDate <= in24Hours;
                });

                setHasUpcomingEvents(upcoming);
            } catch (error) {
                console.error('Failed to check upcoming events:', error);
            }
        };

        checkUpcomingEvents();
        // 每5分鐘檢查一次
        const interval = setInterval(checkUpcomingEvents, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Close mobile menu when clicking outside or changing tab
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [activeTab]);

    // 檢查順序是否被修改過
    const isOrderCustomized = JSON.stringify(menuItems.map(i => i.id)) !==
        JSON.stringify(DEFAULT_MENU_ITEMS.map(i => i.id));

    return (
        <div className="flex h-screen bg-morandi-base font-sans text-gray-900 overflow-hidden">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - Premium Glass Design */}
            <aside className={`
                w-72 glass-card-elevated border-r border-gray-100/50 flex flex-col z-50
                fixed lg:relative h-full
                transform transition-all duration-300 ease-smooth
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Close button for mobile */}
                <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="lg:hidden absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <X size={22} />
                </button>

                {/* Logo Section - Enhanced */}
                <div className="p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-600 rounded-xl blur-sm opacity-50 group-hover:opacity-70 transition-opacity" />
                            <div className="relative w-11 h-11 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                                S
                            </div>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800 tracking-tight">SENTENG</h1>
                            <p className="text-[10px] text-gray-400 font-medium tracking-widest">DESIGN SYSTEM</p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-4 mb-3 divider-gradient" />

                {/* 可排序選單 */}
                <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={visibleMenuItems.map(item => item.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {visibleMenuItems.map(item => (
                                <SortableSidebarItem
                                    key={item.id}
                                    {...item}
                                    active={activeTab === item.id}
                                    onClick={setActiveTab}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </nav>

                {/* 重設順序按鈕 + 版本號 - Enhanced */}
                <div className="p-4 pt-2 border-t border-gray-100/50 mt-auto">
                    {isOrderCustomized && (
                        <button
                            onClick={resetMenuOrder}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 mb-3"
                        >
                            <RotateCcw size={12} />
                            重設選單順序
                        </button>
                    )}
                    <div className="flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[11px] text-gray-400 font-medium">v3.2.0 Premium</span>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Header - Enhanced with subtle background */}
                <header className="h-16 lg:h-18 flex items-center justify-between px-4 lg:px-8 bg-gradient-to-r from-transparent via-white/30 to-transparent">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden p-2.5 text-gray-600 hover:text-gray-800 rounded-xl hover:bg-white/50 transition-all"
                    >
                        <Menu size={22} />
                    </button>

                    <div className="flex-1 lg:flex-none">
                        {/* Breadcrumb or Title handled by page usually */}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notification Button - Enhanced */}
                        <button
                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                            className="relative p-2.5 text-gray-500 hover:text-gray-700 bg-white/80 hover:bg-white rounded-xl shadow-soft hover:shadow-card transition-all duration-200"
                        >
                            <Bell size={18} strokeWidth={1.8} />
                            {hasUpcomingEvents && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-sm" />
                            )}
                        </button>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/50 transition-all"
                            >
                                {user?.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName}
                                        className="w-9 h-9 lg:w-10 lg:h-10 rounded-full border-2 border-white shadow-soft object-cover"
                                    />
                                ) : (
                                    <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full border-2 border-white shadow-soft flex items-center justify-center">
                                        <span className="font-semibold text-gray-600 text-sm lg:text-base">
                                            {user?.displayName?.[0] || 'U'}
                                        </span>
                                    </div>
                                )}
                                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* User Dropdown */}
                            {isUserMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-800">{user?.displayName}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                                                role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {role === 'super_admin' ? '最高管理員' : role === 'admin' ? '管理員' : '一般使用者'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsUserMenuOpen(false);
                                                signOut();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut size={16} />
                                            登出
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <NotificationPanel
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                />

                {/* Content Area - Enhanced padding and scrolling */}
                <div className="flex-1 overflow-auto p-4 lg:p-8 pt-2 scroll-smooth">
                    <div className="max-w-7xl mx-auto h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};
