
export const MOCK_DB = {
    clients: [],

    projects: [
        {
            id: "p-1", code: "P-23001", name: "信義區林公館", type: "翻修", status: "施工中", progress: 65, dueDate: "2025-03-15", clientName: "林先生", budget: 350, location: "台北市信義區松智路1號",
            milestones: [{ date: "2025-12-15", name: "木工退場" }, { date: "2025-12-20", name: "油漆進場" }],
            records: [
                { id: "r-1", date: "2025-12-01", type: "工程", content: "水電配管完成，試壓正常。", photos: ["配管.jpg"], author: "Alex" },
                { id: "r-2", date: "2025-12-05", type: "會議", content: "業主確認磁磚樣式，選定馬可貝里 R60。", photos: [], author: "Alex" }
            ],
            files: [
                { id: "f-1", name: "平面配置圖_v3.pdf", type: "pdf", url: "#", size: "2.4MB", date: "2025-11-20" },
                { id: "f-2", name: "工程合約書.pdf", type: "pdf", url: "#", size: "1.1MB", date: "2025-11-15" }
            ],
            vendors: [
                { vendorId: "v-1", name: "大師兄精緻木工坊", role: "木工施作", joinDate: "2025-11-20", status: "進行中" },
                { vendorId: "v-2", name: "永亮專業水電", role: "水電配線", joinDate: "2025-11-18", status: "已完成" }
            ],
            inventory: [
                { id: "inv-1", itemId: "i-1", itemName: "Panasonic 開關", type: "出", quantity: 10, date: "2025-12-01", operator: "Alex", note: "主臥室配電箱" },
                { id: "inv-2", itemId: "i-3", itemName: "T5 層板燈", type: "出", quantity: 5, date: "2025-12-05", operator: "Alex", note: "客廳天花板" }
            ]
        },
        {
            id: "p-2", code: "P-24002", name: "大安森林公園景觀", type: "新建", status: "設計中", progress: 30, dueDate: "2025-06-20", clientName: "大安區公所", budget: 980, location: "台北市大安區新生南路二段1號",
            milestones: [{ date: "2025-12-18", name: "第二次提案會議" }],
            records: [],
            files: [],
            vendors: [],
            inventory: []
        },
        {
            id: "p-3", code: "P-24003", name: "南港軟體園區辦公室", type: "商空", status: "完工驗收", progress: 95, dueDate: "2025-02-28", clientName: "科技股份公司", budget: 1280, location: "台北市南港區園區街3號",
            milestones: [],
            records: [],
            files: [],
            vendors: [
                { vendorId: "v-3", name: "佳佳油漆", role: "油漆粉刷", joinDate: "2025-01-10", status: "已完成" },
                { vendorId: "v-4", name: "美居家飾", role: "軟裝佈置", joinDate: "2025-02-01", status: "已完成" }
            ],
            inventory: [
                { id: "inv-3", itemId: "i-2", itemName: "得利乳膠漆 (白)", type: "出", quantity: 8, date: "2025-01-15", operator: "李師傅", note: "全室油漆" }
            ]
        },
        {
            id: "p-4", code: "P-24004", name: "內湖張公館", type: "翻修", status: "設計中", progress: 15, dueDate: "2025-08-10", clientName: "張先生", budget: 420, location: "台北市內湖區成功路四段",
            milestones: [{ date: "2025-12-12", name: "現場丈量" }],
            records: [],
            files: [],
            vendors: [],
            inventory: []
        }
    ],
    finance: {
        accounts: [],
        transactions: [],
        loans: []
    },
    vendors: [],
    inventory: [],
    calendar: [
        // 過去的行程
        { id: "evt-1", title: "信義林公館-木工進場", date: "2025-12-07", time: "10:00", type: "construction", location: "台北市信義區松智路1號", description: "確認木作施工細節" },
        { id: "evt-2", title: "陳小姐-平面圖提案會議", date: "2025-12-07", time: "14:00", type: "meeting", location: "公司會議室", description: "第一次提案簡報" },
        { id: "evt-3", title: "內湖張公館-丈量", date: "2025-12-12", time: "16:30", type: "meeting", location: "台北市內湖區", description: "現場丈量與討論" },

        // 即將到來的行程（用於測試通知）
        { id: "evt-4", title: "🔔 客戶會議 - 王小姐", date: "2025-12-17", time: "20:30", type: "meeting", location: "台北市大安區復興南路一段", description: "討論廚房設計方案" },
        { id: "evt-5", title: "🔔 材料驗收", date: "2025-12-17", time: "21:00", type: "construction", location: "新北市板橋區文化路", description: "木工材料到貨檢查" },
        { id: "evt-6", title: "🔔 設計提案", date: "2025-12-18", time: "10:00", type: "meeting", location: "台北101", description: "第二次設計方案簡報" },
        { id: "evt-7", title: "🔔 工地巡檢", date: "2025-12-18", time: "14:30", type: "construction", location: "台北市信義區信義路五段", description: "每週例行巡檢" },
        { id: "evt-8", title: "業主驗收", date: "2025-12-20", time: "15:00", type: "meeting", location: "新北市新店區", description: "完工驗收" }
    ]
};
