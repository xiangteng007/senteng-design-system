
import React, { useState, useEffect } from 'react';
import { MainLayout } from './layout/MainLayout';
import { MOCK_DB } from './services/MockData';
import { ToastContainer } from './components/common/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import UserManagement from './pages/UserManagement';

// Pages
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Projects from './pages/Projects';
import Clients from './pages/Clients';
import Vendors from './pages/Vendors';
import Finance from './pages/Finance';
import Inventory from './pages/Inventory';
import { MaterialGallery } from './pages/MaterialGallery';
import { InvoiceHelper } from './pages/InvoiceHelper';
import { CostEstimator } from './pages/CostEstimator';
import { MaterialCalculator } from './pages/MaterialCalculator';

// Loading Screen Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-2xl font-bold text-white">S</span>
        </div>
        <div className="absolute -inset-2 border-4 border-gray-300 border-t-gray-600 rounded-3xl animate-spin" />
      </div>
      <p className="text-gray-500 text-sm font-medium">載入中...</p>
    </div>
  </div>
);

// Main App Content (wrapped by AuthProvider)
const AppContent = () => {
  const { isAuthenticated, loading: authLoading, canAccessPage, role } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(MOCK_DB);
  const [toasts, setToasts] = useState([]);

  // Specific Page State used across components (lifted up for persistence)
  const [activeProject, setActiveProject] = useState(null);

  const addToast = (message, type = 'info', options = {}) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, action: options.action }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));


  useEffect(() => {
    // Simulate initial fetch
    setLoading(true);
    setTimeout(() => { setData(MOCK_DB); setLoading(false); }, 800);
  }, []);

  const handleUpdate = (key, newData) => {
    setData(prev => ({ ...prev, [key]: newData }));
  };

  const handleAddGlobalTx = (newTx) => {
    const tx = { ...newTx, id: `t-${Date.now()}` };
    const updatedTx = [tx, ...data.finance.transactions];
    setData(prev => ({
      ...prev,
      finance: { ...prev.finance, transactions: updatedTx }
    }));
    addToast("記帳成功！(已同步至財務中心)", 'success');
  };

  // Handle tab change with permission check
  const handleTabChange = (tab) => {
    if (tab === 'user-management' && role === 'super_admin') {
      setActiveTab(tab);
      setActiveProject(null);
      return;
    }

    if (canAccessPage(tab)) {
      setActiveTab(tab);
      setActiveProject(null);
    } else {
      addToast('您沒有權限訪問此頁面', 'warning');
    }
  };

  const renderContent = () => {
    // Check permission before rendering
    if (activeTab !== 'user-management' && !canAccessPage(activeTab)) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p className="text-lg font-medium">您沒有權限訪問此頁面</p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回儀表板
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard events={data.calendar} finance={data.finance} projects={data.projects} clients={data.clients} />;
      case 'schedule': return <Schedule data={data.calendar} addToast={addToast} />;
      case 'projects':
        return <Projects
          data={data.projects}
          loading={loading}
          addToast={addToast}
          activeProject={activeProject}
          setActiveProject={setActiveProject}
          onSelectProject={setActiveProject}
          onUpdateProject={(p) => {
            const exists = data.projects.find(proj => proj.id === p.id);
            if (exists) {
              // Update existing project
              handleUpdate('projects', data.projects.map(proj => proj.id === p.id ? p : proj));
            } else {
              // Add new project
              handleUpdate('projects', [...data.projects, p]);
            }
          }}
          onDeleteProject={(projectId) => {
            // Remove project from data array
            handleUpdate('projects', data.projects.filter(proj => proj.id !== projectId));
          }}
          allTransactions={data.finance.transactions}
          onAddGlobalTx={handleAddGlobalTx}
          accounts={data.finance.accounts}
        />;
      case 'finance': return <Finance
        data={data.finance}
        loading={loading}
        addToast={addToast}
        onAddTx={handleAddGlobalTx}
        onUpdateAccounts={(accs) => handleUpdate('finance', { ...data.finance, accounts: accs })}
        onUpdateLoans={(loans) => handleUpdate('finance', { ...data.finance, loans: loans })}
        allProjects={data.projects}
      />;
      case 'clients': return <Clients data={data.clients} loading={loading} addToast={addToast} onUpdateClients={(d) => handleUpdate('clients', d)} allProjects={data.projects} />;
      case 'vendors': return <Vendors data={data.vendors} loading={loading} addToast={addToast} allProjects={data.projects} />;
      case 'inventory': return <Inventory data={data.inventory} loading={loading} addToast={addToast} />;
      case 'materials': return <MaterialGallery addToast={addToast} />;
      case 'invoice': return <InvoiceHelper addToast={addToast} />;
      case 'unit': return <MaterialCalculator addToast={addToast} vendors={data.vendors} />;
      case 'cost': return <CostEstimator addToast={addToast} />;
      case 'calc': return <MaterialCalculator addToast={addToast} vendors={data.vendors} />;
      case 'user-management':
        return role === 'super_admin'
          ? <UserManagement addToast={addToast} />
          : <Dashboard events={data.calendar} />;
      default: return <Dashboard events={data.calendar} />;
    }
  };

  // Show loading screen while checking auth
  if (authLoading) {
    return <LoadingScreen />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <MainLayout activeTab={activeTab} setActiveTab={handleTabChange}>
      {renderContent()}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </MainLayout>
  );
};

// Root App Component with AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
