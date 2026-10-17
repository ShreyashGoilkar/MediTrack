import { useApp } from '@/context/AppContext';
import type { Page } from '@/lib/types';
import { Search, Bell, Menu, CheckCheck, AlertTriangle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const pageTitles: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Command Center', subtitle: 'Real-time equipment and maintenance overview' },
  equipment: { title: 'Equipment Inventory', subtitle: 'Manage all biomedical equipment assets' },
  maintenance: { title: 'Maintenance', subtitle: 'Schedule and track maintenance tasks' },
  reports: { title: 'Reports', subtitle: 'Analytics and exportable summaries' },
  notifications: { title: 'Notifications', subtitle: 'Alerts for overdue and upcoming maintenance' },
  settings: { title: 'Settings', subtitle: 'Application preferences and demo data' },
};

export function TopBar({
  onMenuClick,
  search,
  onSearchChange,
  showSearch,
  onReportFault,
}: {
  onMenuClick: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  showSearch: boolean;
  onReportFault: () => void;
}) {
  const { currentPage, notifications, setCurrentPage, markAllNotificationsRead } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read);
  const info = pageTitles[currentPage];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl border-b border-slate-200/80">
      <div className="flex items-center gap-3 h-16 px-4 sm:px-6">
        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 active:scale-95 transition-all"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 key={info.title} className="text-lg font-bold text-slate-900 truncate animate-fade-in">{info.title}</h1>
          <p className="text-xs text-slate-500 truncate hidden sm:block">{info.subtitle}</p>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="relative hidden md:block w-56 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/10 transition-all"
            />
          </div>
        )}

        {/* Report Fault button */}
        <button
          onClick={onReportFault}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-3 sm:px-4 py-2 text-sm font-semibold text-white hover:from-rose-500 hover:to-red-500 active:scale-95 transition-all shadow-sm shadow-rose-500/20 whitespace-nowrap"
        >
          <AlertTriangle className="h-4 w-4" />
          <span className="hidden sm:inline">Report Fault</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className={`relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 active:scale-95 transition-all ${unread.length > 0 ? 'hover:text-rose-600' : ''}`}
            aria-label="Notifications"
          >
            <Bell className={`h-5 w-5 transition-transform ${notifOpen ? 'scale-110' : ''}`} />
            {unread.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white animate-pulse-ring" style={{ height: '1.125rem', minWidth: '1.125rem' }}>
                {unread.length > 99 ? '99+' : unread.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 overflow-hidden animate-scale-in origin-top-right">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-900">Notifications</span>
                  {unread.length > 0 && <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">{unread.length} new</span>}
                </div>
                {unread.length > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead()}
                    className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications</p>
                ) : (
                  notifications.slice(0, 8).map((n, i) => (
                    <button
                      key={n.id}
                      onClick={() => { setCurrentPage(n.page); setNotifOpen(false); }}
                      className={`flex gap-3 w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 animate-fade-up ${!n.read ? 'bg-teal-50/40' : ''}`}
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white ${
                        n.type === 'danger' ? 'bg-rose-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
                      }`} />
                      <span className="text-sm text-slate-600 leading-snug">{n.message}</span>
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => { setCurrentPage('notifications'); setNotifOpen(false); }}
                className="block w-full px-4 py-2.5 text-center text-sm font-medium text-teal-600 hover:bg-teal-50 transition-colors border-t border-slate-100"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
