import { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { ToastContainer } from '@/components/Toast';
import { FaultReportModal } from '@/components/FaultReportModal';
import { DashboardPage } from '@/pages/DashboardPage';
import { EquipmentPage } from '@/pages/EquipmentPage';
import { MaintenancePage } from '@/pages/MaintenancePage';
import { ReportsPage } from '@/pages/ReportsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { SettingsPage } from '@/pages/SettingsPage';

function AppContent() {
  const { currentPage } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [faultModalOpen, setFaultModalOpen] = useState(false);

  const showSearch = currentPage === 'equipment' || currentPage === 'maintenance';

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage onReportFault={() => setFaultModalOpen(true)} />;
      case 'equipment': return <EquipmentPage externalSearch={search} onReportFault={() => setFaultModalOpen(true)} />;
      case 'maintenance': return <MaintenancePage externalSearch={search} />;
      case 'reports': return <ReportsPage />;
      case 'notifications': return <NotificationsPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage onReportFault={() => setFaultModalOpen(true)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          onMenuClick={() => setMobileSidebarOpen(true)}
          search={search}
          onSearchChange={setSearch}
          showSearch={showSearch}
          onReportFault={() => setFaultModalOpen(true)}
        />

        <main key={currentPage} className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-up">
          {renderPage()}
        </main>
      </div>

      <FaultReportModal open={faultModalOpen} onClose={() => setFaultModalOpen(false)} />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
