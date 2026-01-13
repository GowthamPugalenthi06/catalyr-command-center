import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { AgentHierarchy } from '@/components/dashboard/AgentHierarchy';
import { TasksView } from '@/components/dashboard/TasksView';
import { LeadsTable } from '@/components/dashboard/LeadsTable';
import { ScheduleView } from '@/components/dashboard/ScheduleView';
import { ChatInterface } from '@/components/dashboard/ChatInterface';
import { AnalyticsView } from '@/components/dashboard/AnalyticsView';
import { SettingsView } from '@/components/dashboard/SettingsView';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'agents':
        return <AgentHierarchy />;
      case 'tasks':
        return <TasksView />;
      case 'leads':
        return <LeadsTable />;
      case 'schedule':
        return <ScheduleView />;
      case 'chat':
        return <ChatInterface />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="ml-64 transition-all duration-300">
        <Header />
        <div className="p-6">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
