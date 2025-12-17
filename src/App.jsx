
import React, { useState, useEffect } from 'react';
import { MainLayout } from './layout/MainLayout';
import { MOCK_DB } from './services/MockData';
import { ToastContainer } from './components/common/Toast';

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
import { UnitConverter } from './pages/UnitConverter';
import { CostEstimator } from './pages/CostEstimator';
import { MaterialCalculator } from './pages/MaterialCalculator';

const App = () => {
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

  const renderContent = () => {
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
          allTransactions={data.finance.transactions}
          onAddGlobalTx={handleAddGlobalTx}
          accounts={data.finance.accounts}
        />;
      case 'finance': return <Finance data={data.finance} loading={loading} addToast={addToast} onAddTx={handleAddGlobalTx} onUpdateAccounts={(accs) => handleUpdate('finance', { ...data.finance, accounts: accs })} />;
      case 'clients': return <Clients data={data.clients} loading={loading} addToast={addToast} onUpdateClients={(d) => handleUpdate('clients', d)} />;
      case 'vendors': return <Vendors data={data.vendors} loading={loading} addToast={addToast} />;
      case 'inventory': return <Inventory data={data.inventory} loading={loading} addToast={addToast} />;
      case 'materials': return <MaterialGallery addToast={addToast} />;
      case 'invoice': return <InvoiceHelper addToast={addToast} />;
      case 'unit': return <UnitConverter addToast={addToast} />;
      case 'cost': return <CostEstimator addToast={addToast} />;
      case 'calc': return <MaterialCalculator addToast={addToast} />;
      default: return <Dashboard events={data.calendar} />;
    }
  };

  return (
    <MainLayout activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setActiveProject(null); }}>
      {renderContent()}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </MainLayout>
  );
};

export default App;