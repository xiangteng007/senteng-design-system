
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

  createDriveFolder: async (folderName) => {
    console.log(`📁 Creating Drive folder: ${folderName}`);

    try {
      const result = await callGASWithJSONP('create_drive_folder', {
        folderName
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
  }
};
