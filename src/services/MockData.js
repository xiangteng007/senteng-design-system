
export const MOCK_DB = {
    clients: [
        {
            id: "c-1",
            name: "林先生",
            status: "已簽約",
            source: "網路廣告",
            phone: "0912-345-678",
            email: "lin@example.com",
            lineId: "@linxr888",
            address: "台北市信義區...",
            budget: "300-500萬",
            driveFolder: "https://drive.google.com/drive/folders/mock-lin",
            customFields: [
                { label: "房屋類型", value: "電梯大樓" },
                { label: "風格偏好", value: "現代簡約" },
                { label: "家庭成員", value: "夫妻+1子" },
                { label: "備註", value: "喜歡大理石，主臥需有更衣室。" }
            ],
            lastContact: "2025-12-06"
        },
        {
            id: "c-2",
            name: "陳小姐",
            status: "提案/報價",
            source: "朋友介紹",
            phone: "0922-333-444",
            email: "chen@example.com",
            lineId: "chen_design",
            address: "台北市大安區...",
            budget: "200-300萬",
            driveFolder: "https://drive.google.com/drive/folders/mock-chen",
            customFields: [
                { label: "房屋類型", value: "電梯大樓" },
                { label: "風格偏好", value: "北歐風" },
                { label: "特殊需求", value: "有養兩隻貓，需貓跳台。" }
            ],
            lastContact: "2025-12-07"
        }
    ],

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
        accounts: [
            { id: "a-1", name: "公司營運帳戶", bank: "台灣銀行", number: "001-****-1234", balance: 450000, type: "營運", color: "#4F46E5" },
            { id: "a-2", name: "專案專用帳戶", bank: "國泰世華", number: "013-****-5678", balance: 280000, type: "專案", color: "#059669" },
            { id: "a-3", name: "零用金", bank: "現金", number: "-", balance: 35000, type: "現金", color: "#DC2626" },
            { id: "a-4", name: "材料採購帳戶", bank: "中國信託", number: "822-****-9012", balance: 125000, type: "採購", color: "#7C3AED" },
            { id: "a-5", name: "員工薪資帳戶", bank: "玉山銀行", number: "808-****-3456", balance: 520000, type: "薪資", color: "#F59E0B" }
        ],
        transactions: [
            // 公司營運帳戶 (a-1) 的交易
            { id: "t-1", accountId: "a-1", type: "收入", amount: 150000, date: "2025-12-01", desc: "客戶訂金 - 林公館", category: "專案收款", projectId: "p-1" },
            { id: "t-2", accountId: "a-1", type: "支出", amount: 25000, date: "2025-12-03", desc: "辦公室租金", category: "固定成本", projectId: null },
            { id: "t-3", accountId: "a-1", type: "支出", amount: 15000, date: "2025-12-05", desc: "水電瓦斯費", category: "固定成本", projectId: null },
            { id: "t-4", accountId: "a-1", type: "收入", amount: 200000, date: "2025-12-10", desc: "專案款項 - 南港辦公室", category: "專案收款", projectId: "p-3" },
            { id: "t-5", accountId: "a-1", type: "支出", amount: 8000, date: "2025-12-12", desc: "網路通訊費", category: "固定成本", projectId: null },

            // 專案專用帳戶 (a-2) 的交易
            { id: "t-6", accountId: "a-2", type: "收入", amount: 180000, date: "2025-12-02", desc: "專案尾款 - 大安公園", category: "專案收款", projectId: "p-2" },
            { id: "t-7", accountId: "a-2", type: "支出", amount: 45000, date: "2025-12-06", desc: "木工材料款", category: "材料費", projectId: "p-1" },
            { id: "t-8", accountId: "a-2", type: "支出", amount: 35000, date: "2025-12-08", desc: "油漆工程款", category: "工程款", projectId: "p-3" },
            { id: "t-9", accountId: "a-2", type: "收入", amount: 120000, date: "2025-12-11", desc: "客戶追加款 - 林公館", category: "專案收款", projectId: "p-1" },
            { id: "t-10", accountId: "a-2", type: "支出", amount: 28000, date: "2025-12-14", desc: "水電配線費用", category: "工程款", projectId: "p-1" },

            // 零用金 (a-3) 的交易
            { id: "t-11", accountId: "a-3", type: "支出", amount: 1200, date: "2025-12-04", desc: "員工餐費", category: "雜支", projectId: null },
            { id: "t-12", accountId: "a-3", type: "支出", amount: 800, date: "2025-12-07", desc: "辦公用品", category: "雜支", projectId: null },
            { id: "t-13", accountId: "a-3", type: "收入", amount: 5000, date: "2025-12-09", desc: "零用金補充", category: "內部轉帳", projectId: null },
            { id: "t-14", accountId: "a-3", type: "支出", amount: 2500, date: "2025-12-13", desc: "交通油資", category: "雜支", projectId: null },
            { id: "t-15", accountId: "a-3", type: "支出", amount: 3200, date: "2025-12-15", desc: "工地茶水", category: "雜支", projectId: "p-1" },

            // 材料採購帳戶 (a-4) 的交易
            { id: "t-16", accountId: "a-4", type: "支出", amount: 68000, date: "2025-12-01", desc: "Panasonic開關批量採購", category: "材料費", projectId: null },
            { id: "t-17", accountId: "a-4", type: "支出", amount: 42000, date: "2025-12-05", desc: "得利乳膠漆", category: "材料費", projectId: "p-3" },
            { id: "t-18", accountId: "a-4", type: "支出", amount: 55000, date: "2025-12-10", desc: "木工板材", category: "材料費", projectId: "p-1" },
            { id: "t-19", accountId: "a-4", type: "收入", amount: 15000, date: "2025-12-12", desc: "退貨退款", category: "其他", projectId: null },
            { id: "t-20", accountId: "a-4", type: "支出", amount: 38000, date: "2025-12-16", desc: "T5層板燈批購", category: "材料費", projectId: null },

            // 員工薪資帳戶 (a-5) 的交易
            { id: "t-21", accountId: "a-5", type: "收入", amount: 600000, date: "2025-12-01", desc: "薪資轉入", category: "內部轉帳", projectId: null },
            { id: "t-22", accountId: "a-5", type: "支出", amount: 80000, date: "2025-12-05", desc: "員工薪資 - Alex", category: "薪資", projectId: null },
            { id: "t-23", accountId: "a-5", type: "支出", amount: 75000, date: "2025-12-05", desc: "員工薪資 - Linda", category: "薪資", projectId: null },
            { id: "t-24", accountId: "a-5", type: "支出", amount: 65000, date: "2025-12-05", desc: "員工薪資 - Mike", category: "薪資", projectId: null },
            { id: "t-25", accountId: "a-5", type: "支出", amount: 55000, date: "2025-12-05", desc: "員工薪資 - Jenny", category: "薪資", projectId: null }
        ]
    },
    vendors: [
        { id: "v-1", name: "大師兄精緻木工坊", category: "工程工班", tradeType: "木工", contactPerson: "王大哥", phone: "0912-345-678", address: "新北市板橋區文化路一段...", status: "長期合作", rating: 4.9, lastProject: "信義區林公館", tags: ["配合度高", "手工細緻"] },
        { id: "v-2", name: "永亮專業水電", category: "工程工班", tradeType: "水電", contactPerson: "張師傅", phone: "0922-333-444", address: "新店區...", status: "合作中", rating: 4.5, lastProject: "南港軟體園區", tags: ["配線整齊"] },
        { id: "v-3", name: "佳佳油漆", category: "工程工班", tradeType: "油漆", contactPerson: "李老闆", phone: "0911-222-333", address: "台北市松山區...", status: "觀察中", rating: 3.8, lastProject: "內湖張公館", tags: ["價格便宜"] },
        { id: "v-4", name: "美居家飾", category: "建材供應", tradeType: "軟裝", contactPerson: "Amy", phone: "02-2345-6789", address: "台北市內湖區...", status: "長期合作", rating: 4.8, lastProject: "大安森林公園", tags: ["品項多"] },
        // 新增廠商以支援營建物料計算器
        { id: "v-5", name: "強固混凝土", category: "建材供應", tradeType: "混凝土", contactPerson: "陳經理", phone: "02-2600-8888", address: "林口工三區", status: "合作中", rating: 4.7, lastProject: "大安森林公園", tags: ["品質穩定"] },
        { id: "v-6", name: "高力專業泵浦", category: "工程工班", tradeType: "泵浦", contactPerson: "阿力", phone: "0955-666-777", address: "五股工業區", status: "長期合作", rating: 4.6, lastProject: "大安森林公園", tags: ["配合度高"] },
        { id: "v-7", name: "建宏建材行", category: "建材供應", tradeType: "水泥,磚,磁磚,砂", contactPerson: "王老闆", phone: "02-2700-1234", address: "台北市文山區", status: "長期合作", rating: 4.8, lastProject: "信義區林公館", tags: ["送貨快"] },
        { id: "v-8", name: "冠軍磁磚經銷", category: "建材供應", tradeType: "磁磚", contactPerson: "張小姐", phone: "02-8787-9999", address: "台北市內湖區", status: "合作中", rating: 4.9, lastProject: "南港辦公室", tags: ["樣式多"] }
    ],
    inventory: [
        { id: "i-1", name: "Panasonic 開關", spec: "PN-001", category: "電氣", quantity: 50, unit: "組", safeStock: 10, location: "A-01", status: "充足" },
        { id: "i-2", name: "得利乳膠漆 (白)", spec: "PT-W01", category: "油漆", quantity: 5, unit: "桶", safeStock: 10, location: "B-02", status: "庫存偏低" },
        { id: "i-3", name: "T5 層板燈", spec: "LGT-T5", category: "燈具", quantity: 100, unit: "支", safeStock: 20, location: "A-03", status: "充足" },
        { id: "i-4", name: "木芯板 4x8", spec: "WD-48", category: "木料", quantity: 25, unit: "片", safeStock: 10, location: "C-01", status: "充足" },
        { id: "i-5", name: "不鏽鋼門把", spec: "HW-SS01", category: "五金", quantity: 30, unit: "組", safeStock: 15, location: "D-02", status: "充足" },
        { id: "i-6", name: "得利乳膠漆 (灰)", spec: "PT-G01", category: "油漆", quantity: 0, unit: "桶", safeStock: 5, location: "B-02", status: "缺貨" },
        { id: "i-7", name: "LED 崁燈 6W", spec: "LGT-LED6", category: "燈具", quantity: 80, unit: "個", safeStock: 30, location: "A-04", status: "充足" },
        { id: "i-8", name: "電線 2.0mm", spec: "EL-20", category: "電氣", quantity: 500, unit: "米", safeStock: 100, location: "E-01", status: "充足" },
        { id: "i-9", name: "PVC 管 3/4", spec: "PL-34", category: "五金", quantity: 40, unit: "支", safeStock: 20, location: "D-03", status: "充足" },
        { id: "i-10", name: "夾板 18mm", spec: "WD-18", category: "木料", quantity: 8, unit: "片", safeStock: 15, location: "C-02", status: "庫存偏低" },
        { id: "i-11", name: "虹牌調合漆", spec: "PT-MX01", category: "油漆", quantity: 12, unit: "加侖", safeStock: 10, location: "B-03", status: "充足" },
        { id: "i-12", name: "插座面板", spec: "EL-SOC01", category: "電氣", quantity: 3, unit: "組", safeStock: 20, location: "A-02", status: "庫存偏低" }
    ],
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
