import { useApp } from '@/context/AppContext';
import type { Page } from '@/lib/types';
import {
  LayoutDashboard,
  HeartPulse,
  Wrench,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { useState } from 'react';

const navItems: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'equipment', label: 'Equipment', icon: HeartPulse },
  { page: 'maintenance', label: 'Maintenance', icon: Wrench },
  { page: 'reports', label: 'Reports', icon: BarChart3 },
  { page: 'notifications', label: 'Notifications', icon: Bell },
  { page: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const { currentPage, setCurrentPage, notifications } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const goTo = (page: Page) => {
    setCurrentPage(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden animate-fade-in" onClick={onCloseMobile} />
      )}

      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen shrink-0 bg-slate-900 text-slate-300 transition-all duration-300 ease-out flex flex-col
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Gradient accent bar */}
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-teal-400 via-teal-500 to-cyan-600" />

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 shrink-0 shadow-lg shadow-teal-500/20">
            <Activity className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden animate-fade-in">
              <span className="text-base font-bold text-white whitespace-nowrap tracking-tight">MediTrack</span>
              <p className="text-xs text-slate-400 whitespace-nowrap">Equipment Maintenance</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {!collapsed && (
            <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Main</p>
          )}
          {navItems.slice(0, 3).map((item, idx) => (
            <NavButton key={item.page} item={item} active={currentPage === item.page} collapsed={collapsed} unreadCount={unreadCount} onClick={() => goTo(item.page)} index={idx} />
          ))}
          {!collapsed && (
            <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Insights</p>
          )}
          {collapsed && <div className="py-2" />}
          {navItems.slice(3).map((item, idx) => (
            <NavButton key={item.page} item={item} active={currentPage === item.page} collapsed={collapsed} unreadCount={unreadCount} onClick={() => goTo(item.page)} index={idx + 3} />
          ))}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden lg:flex items-center justify-center border-t border-slate-800 py-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4 transition-transform hover:translate-x-0.5" /> : <ChevronLeft className="h-4 w-4 transition-transform hover:-translate-x-0.5" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* Safety disclaimer */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">System Active</span>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-2.5">
              <p className="text-[10px] leading-relaxed text-slate-500">
                Administrative tracking only. Not a substitute for approved hospital inspection procedures.
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="px-4 py-3 border-t border-slate-800 flex justify-center">
            <div className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="System Active" />
          </div>
        )}
      </aside>
    </>
  );
}

function NavButton({ item, active, collapsed, unreadCount, onClick, index }: {
  item: { page: Page; label: string; icon: typeof LayoutDashboard };
  active: boolean;
  collapsed: boolean;
  unreadCount: number;
  onClick: () => void;
  index: number;
}) {
  const Icon = item.icon;
  const showBadge = item.page === 'notifications' && unreadCount > 0;
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40
        ${active
          ? 'bg-gradient-to-r from-teal-500/15 to-transparent text-teal-400 ring-1 ring-teal-500/20'
          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
        }
      `}
      title={collapsed ? item.label : undefined}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-teal-400" />
      )}
      <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`} />
      {!collapsed && <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>}
      {showBadge && !collapsed && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white bg-rose-500 animate-pulse-ring">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      {showBadge && collapsed && (
        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900" />
      )}
    </button>
  );
}
