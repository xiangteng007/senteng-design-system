
import { MOCK_DB } from './MockData';

// GAS deployment URL
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxUrPvBxCavNiXkhVkK-Afqrfkx4N64NEFQFGzXCFUK5h5Qq_5JZlZT7ptrBiTTPvqMfg/exec";

// JSONP 調用函數（繞過 CORS）
const callGASWithJSONP = (action, data = {}) => {
  return new Promise((resolve, reject) => {
    const callbackName = `gas_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 構建 URL 參數
    const params = new URLSearchParams({
      action,
      data: JSON.stringify(data),
      callback: callbackName
    });

    // 創建 script 標籤
    const script = document.createElement('script');
    script.src = `${GAS_API_URL}?${params.toString()}`;
    script.async = true;

    // 設定超時（30秒）
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Request timeout'));
    }, 30000);

    // 定義全域回調函數
    window[callbackName] = (response) => {
      clearTimeout(timeout);
      cleanup();

      // 檢查回應狀態
      if (response.status === 'success') {
        resolve({ success: true, data: response });
      } else {
        resolve({ success: false, error: response.error || response.message || 'Unknown error' });
      }
    };

    // 清理函數
    const cleanup = () => {
      delete window[callbackName];
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    // 錯誤處理
    script.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error('Script load failed'));
    };

    // 添加到 DOM
    document.head.appendChild(script);
  });
};

export const GoogleService = {
  login: () => new Promise(resolve => setTimeout(() => resolve({ name: "Admin", email: "admin@senteng.co", photo: "A" }), 1500)),

  // Still using Mock Data for read operations
  fetchSheetData: async (sheetName) => {
    return new Promise(resolve => {
      setTimeout(() => { if (MOCK_DB[sheetName]) resolve(MOCK_DB[sheetName]); }, 800);
    });
  },

  fetchCalendarEvents: () => new Promise(resolve => { setTimeout(() => resolve(MOCK_DB.calendar), 1000); }),

  addToCalendar: async (event) => {
    console.log(`📅 Adding calendar event: ${event.title}`);

    try {
      const result = await callGASWithJSONP('add_calendar_event', {
        title: event.title,
        startTime: event.date + 'T' + event.time,
        endTime: event.date + 'T' + event.time,
        description: event.description || '',
        location: event.location || ''
      });

      if (result.success) {
        console.log("✅ Calendar event created successfully");
      } else {
        console.error("❌ Calendar event creation failed:", result.error);
      }

      return result;
    } catch (error) {
      console.error('GAS API Error:', error);
      return { success: false, error: error.message };
    }
  },

  updateCalendarEvent: async (eventId, updates) => {
    console.log(`📅 Updating calendar event: ${eventId}`);

    try {
      const result = await callGASWithJSONP('update_calendar_event', {
        eventId,
        ...updates
      });

      if (result.success) {
        console.log("✅ Calendar event updated successfully");
      } else {
        console.error("❌ Calendar event update failed:", result.error);
      }

      return result;
    } catch (error) {
      console.error('GAS API Error:', error);
      return { success: false, error: error.message };
    }
  },

  deleteCalendarEvent: async (eventId) => {
    console.log(`📅 Deleting calendar event: ${eventId}`);

    try {
      const result = await callGASWithJSONP('delete_calendar_event', {
        eventId
      });

      if (result.success) {
        console.log("✅ Calendar event deleted successfully");
      } else {
        console.error("❌ Calendar event deletion failed:", result.error);
      }

      return result;
    } catch (error) {
      console.error('GAS API Error:', error);
      return { success: false, error: error.message };
    }
  },

  syncToSheet: async (sheetName, data) => {
    console.log(`📊 Syncing to Sheet [${sheetName}]:`, data.length, 'records');

    try {
      const result = await callGASWithJSONP('sync_to_sheet', {
        sheetName,
        records: data
      });

      if (result.success) {
        console.log(`✅ Synced to Sheet [${sheetName}]`);
      } else {
        console.error(`❌ Sheet sync failed [${sheetName}]:`, result.error);
      }

      return result;
    } catch (error) {
      console.error('GAS API Error:', error);
      return { success: false, error: error.message };
    }
  },

  uploadToDrive: async (file, folderName, folderUrl) => {
    console.log(`📤 Uploading file: ${file.name} to folder: ${folderName}`);

    try {
      // Extract folder ID from URL if provided
      let folderId = null;
      if (folderUrl) {
        const match = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
        folderId = match ? match[1] : null;
      }

      const result = await callGASWithJSONP('upload_to_drive', {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        folderId: folderId,
        // Note: Actual file content upload would require different handling
        // For now, we're creating a placeholder entry
      });

      if (result.success) {
        const fileUrl = result.data?.fileUrl || `https://drive.google.com/file/d/${result.data?.fileId || 'unknown'}/view`;
        console.log(`✅ File uploaded: ${fileUrl}`);
        return { success: true, url: fileUrl, fileId: result.data?.fileId };
      } else {
        console.error(`❌ File upload failed:`, result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('GAS API Error:', error);
      return { success: false, error: error.message };
    }
  },

  // 獲取或創建「專案管理」根資料夾
  getOrCreateProjectRoot: async () => {
    console.log(`📁 Getting or creating '專案管理' root folder...`);

    try {
      const result = await callGASWithJSONP('get_or_create_project_root', {
        folderName: '專案管理'
      });

      if (result.success) {
        const folderUrl = result.data?.folderUrl || `https://drive.google.com/drive/folders/${result.data?.folderId || 'unknown'}`;
        console.log(`✅ Project root folder ready: ${folderUrl}`);
        return { success: true, url: folderUrl, folderId: result.data?.folderId };
      } else {
        console.error(`❌ Project root folder failed:`, result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('GAS API Error:', error);
      return { success: false, error: error.message };
    }
  },

  // 在「專案管理」資料夾下建立專案資料夾
  createDriveFolder: async (folderName, parentFolderId = null) => {
    console.log(`📁 Creating Drive folder: ${folderName}${parentFolderId ? ' (in parent)' : ''}`);

    try {
      const result = await callGASWithJSONP('create_drive_folder', {
        folderName,
        parentFolderId // 如果有指定父資料夾ID
      });

      if (result.success) {
        const folderUrl = result.data?.folderUrl || `https://drive.google.com/drive/folders/${result.data?.folderId || 'unknown'}`;
        console.log(`✅ Drive folder created: ${folderUrl}`);
        return { success: true, url: folderUrl, folderId: result.data?.folderId };
      } else {
        console.error(`❌ Drive folder creation failed:`, result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('GAS API Error:', error);
      return { success: false, error: error.message };
    }
  },

  // 列出指定資料夾內的子資料夾（用於關聯現有資料夾）
  listDriveFolders: async (parentFolderId = null) => {
    console.log(`📂 Listing Drive folders...`);

    try {
      const result = await callGASWithJSONP('list_drive_folders', {
        parentFolderId
      });

      if (result.success) {
        console.log(`✅ Found ${result.data?.folders?.length || 0} folders`);
        return { success: true, folders: result.data?.folders || [] };
      } else {
        console.error(`❌ List folders failed:`, result.error);
        return { success: false, error: result.error, folders: [] };
      }
    } catch (error) {
      console.error('GAS API Error:', error);
      return { success: false, error: error.message, folders: [] };
    }
  },

  // 建立「營建物料成本快速估算指標與公式」資料夾及 Sheets
  createCostEstimatorFolder: async () => {
    console.log(`📁 Creating Cost Estimator folder and database...`);

    try {
      const result = await callGASWithJSONP('create_cost_estimator_folder', {
        folderName: '營建物料成本快速估算指標與公式'
      });

      if (result.success) {
        const folderUrl = result.data?.folderUrl || `https://drive.google.com/drive/folders/${result.data?.folderId || 'unknown'}`;
        console.log(`✅ Cost Estimator folder created: ${folderUrl}`);
        return {
          success: true,
          url: folderUrl,
          folderId: result.data?.folderId,
          sheetId: result.data?.sheetId,
          sheetUrl: result.data?.sheetUrl
        };
      } else {
        console.error(`❌ Cost Estimator folder creation failed:`, result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('GAS API Error:', error);
      return { success: false, error: error.message };
    }
  },

  // 從 Drive 讀取物料價格資料
  getMaterialPrices: async () => {
    console.log(`📊 Fetching material prices from Drive...`);

    try {
      const result = await callGASWithJSONP('get_material_prices', {});

      if (result.success) {
        console.log(`✅ Material prices loaded`);
        return { success: true, data: result.data };
      } else {
        console.error(`❌ Failed to load material prices:`, result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('GAS API Error:', error);
      return { success: false, error: error.message };
    }
  },

  // 更新物料價格
  updateMaterialPrice: async (category, material) => {
    console.log(`📝 Updating material price: ${material.name}...`);

    try {
      const result = await callGASWithJSONP('update_material_price', {
        category,
        material
      });

      if (result.success) {
        console.log(`✅ Material price updated`);
        return { success: true };
      } else {
        console.error(`❌ Failed to update material price:`, result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('GAS API Error:', error);
      return { success: false, error: error.message };
    }
  },

  // 匯出估算清單到 Google Sheet
  exportEstimateToSheet: async (estimateName, items, totalCost) => {
    console.log(`📊 Exporting estimate to Sheet: ${estimateName}...`);

    try {
      const result = await callGASWithJSONP('export_estimate_to_sheet', {
        estimateName,
        items: items.map(item => ({
          category: item.category || '未分類',
          name: item.name,
          spec: item.spec,
          unit: item.unit,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
          note: item.note || ''
        })),
        totalCost,
        createdAt: new Date().toISOString()
      });

      if (result.success) {
        const sheetUrl = result.data?.sheetUrl || '';
        console.log(`✅ Estimate exported to Sheet: ${sheetUrl}`);
        return {
          success: true,
          sheetUrl,
          sheetId: result.data?.sheetId,
          folderUrl: result.data?.folderUrl
        };
      } else {
        console.error(`❌ Failed to export estimate:`, result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('GAS API Error:', error);
      return { success: false, error: error.message };
    }
  },

  // 初始化庫存 Sheet（建立資料夾和分頁）
  initInventorySheet: async () => {
    console.log(`📦 Initializing Inventory Sheet...`);

    try {
      const result = await callGASWithJSONP('init_inventory_sheet', {});

      if (result.success) {
        console.log(`✅ Inventory Sheet initialized`);
        return {
          success: true,
          folderId: result.data?.folderId,
          folderUrl: result.data?.folderUrl,
          sheetId: result.data?.sheetId,
          sheetUrl: result.data?.sheetUrl
        };
      } else {
        console.error(`❌ Failed to initialize Inventory Sheet:`, result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('GAS API Error:', error);
      return { success: false, error: error.message };
    }
  },

  // 同步庫存資料到 Sheet
  syncInventoryToSheet: async (sheetId, items) => {
    console.log(`📦 Syncing ${items.length} items to Inventory Sheet...`);

    try {
      const result = await callGASWithJSONP('sync_inventory_to_sheet', {
        sheetId,
        items: JSON.stringify(items.map(item => ({
          name: item.name,
          spec: item.spec || '',
          quantity: item.quantity,
          unit: item.unit,
          safeStock: item.safeStock,
          location: item.location || '',
          status: item.status,
          mainCategory: item.mainCategory || '',
          category: item.category || '其他'
        })))
      });

      if (result.success) {
        console.log(`✅ Inventory synced to Sheet`);
        return {
          success: true,
          sheetUrl: result.data?.sheetUrl,
          updatedAt: result.data?.updatedAt
        };
      } else {
        console.error(`❌ Failed to sync inventory:`, result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('GAS API Error:', error);
      return { success: false, error: error.message };
    }
  }
};
