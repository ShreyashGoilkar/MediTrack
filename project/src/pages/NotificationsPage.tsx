import { useApp } from '@/context/AppContext';
import { EmptyState } from '@/components/ConfirmDialog';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Bell, CheckCheck, Trash2, AlertTriangle, Info, AlertCircle, ArrowRight } from 'lucide-react';

export function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead, clearNotifications, setCurrentPage } = useApp();

  const unread = notifications.filter((n) => !n.read);

  return (
    <div className="space-y-5">
      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{unread.length}</span> unread of {notifications.length} total
        </p>
        <div className="flex items-center gap-2">
          {unread.length > 0 && (
            <button onClick={markAllNotificationsRead} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearNotifications} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Trash2 className="h-4 w-4" /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState icon={<Bell className="h-7 w-7" />} title="No notifications" message="You're all caught up. Notifications for overdue and upcoming maintenance will appear here." />
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = n.type === 'danger' ? AlertCircle : n.type === 'warning' ? AlertTriangle : Info;
            const color = n.type === 'danger' ? 'text-rose-600 bg-rose-50' : n.type === 'warning' ? 'text-amber-600 bg-amber-50' : 'text-sky-600 bg-sky-50';
            return (
              <div key={n.id} className={`flex items-start gap-3 rounded-xl border bg-white p-4 transition-colors ${!n.read ? 'border-teal-200 bg-teal-50/20' : 'border-slate-200'}`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.read && (
                    <button onClick={() => markNotificationRead(n.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Mark as read">
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentPage(n.page)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-600"
                    title="Go to related page"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info note */}
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
          <p className="text-xs text-sky-800 leading-relaxed">
            Notifications are generated automatically based on your equipment and maintenance data. Overdue items appear in red, upcoming items within 7 days appear in amber, and out-of-service equipment is flagged immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
