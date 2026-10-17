import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import type { EquipmentStatus, Page } from '@/lib/types';
import { StatusBadge, PriorityBadge, MaintenanceStatusBadge } from '@/components/Badges';
import { DonutChart } from '@/components/Charts';
import { formatDate, daysUntil, formatDateTime } from '@/lib/utils';
import { computePriorityQueue, reasonColors, type PriorityItem } from '@/lib/priority';
import {
  HeartPulse, CheckCircle2, Wrench, AlertTriangle, CalendarClock,
  Activity, ArrowRight, Ban, Clock, TrendingUp, ShieldCheck,
  Zap, Flame, Siren, ChevronRight,
} from 'lucide-react';

const statusColors: Record<EquipmentStatus, string> = {
  Operational: '#10b981',
  'Due Soon': '#f59e0b',
  Overdue: '#f43f5e',
  'Under Maintenance': '#0ea5e9',
  'Out of Service': '#64748b',
};

interface Props {
  onReportFault: () => void;
}

export function DashboardPage({ onReportFault }: Props) {
  const { equipmentWithStatus, maintenance, setCurrentPage, oosFlags } = useApp();

  const stats = useMemo(() => {
    const total = equipmentWithStatus.length;
    const operational = equipmentWithStatus.filter((e) => e.status === 'Operational').length;
    const underMaintenance = equipmentWithStatus.filter((e) => e.status === 'Under Maintenance').length;
    const overdue = equipmentWithStatus.filter((e) => e.status === 'Overdue').length;
    const outOfService = equipmentWithStatus.filter((e) => e.status === 'Out of Service').length;
    const dueSoon = equipmentWithStatus.filter((e) => e.status === 'Due Soon').length;

    const activeTasks = maintenance.filter((m) => m.status === 'Pending' || m.status === 'In Progress');
    const overdueTasks = activeTasks.filter((m) => daysUntil(m.dueDate) < 0);

    const recentCompleted = maintenance
      .filter((m) => m.status === 'Completed')
      .sort((a, b) => (b.completedDate ?? '').localeCompare(a.completedDate ?? ''))
      .slice(0, 5);

    const statusDist = (['Operational', 'Due Soon', 'Overdue', 'Under Maintenance', 'Out of Service'] as EquipmentStatus[]).map((s) => ({
      label: s,
      value: equipmentWithStatus.filter((e) => e.status === s).length,
      color: statusColors[s],
    }));

    const operationalRate = total > 0 ? Math.round((operational / total) * 100) : 0;

    // Maintenance timeline: tasks sorted by due date, both upcoming and recently completed
    const timelineItems = maintenance
      .filter((m) => m.status !== 'Cancelled')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 8);

    return { total, operational, underMaintenance, overdue, outOfService, dueSoon, overdueTasks, recentCompleted, statusDist, operationalRate, timelineItems, activeTasks: activeTasks.length };
  }, [equipmentWithStatus, maintenance]);

  const priorityQueue = useMemo(
    () => computePriorityQueue(maintenance, equipmentWithStatus, oosFlags),
    [maintenance, equipmentWithStatus, oosFlags]
  );

  const eqMap = useMemo(() => new Map(equipmentWithStatus.map((e) => [e.id, e])), [equipmentWithStatus]);

  const goTo = (page: Page) => setCurrentPage(page);

  return (
    <div className="space-y-6">
      {/* Command Center Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-400 blur-3xl" />
          <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-cyan-500 blur-3xl" />
          <div className="absolute top-1/2 right-1/3 h-48 w-48 rounded-full bg-rose-500 blur-3xl" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Activity className="h-3.5 w-3.5 animate-pulse" />
              Operational Command Center
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Equipment Readiness Dashboard</h2>
            <div className="mt-2 flex items-center gap-4 flex-wrap">
              <p className="text-sm text-slate-400">
                <span className="text-white font-bold text-base">{stats.total}</span> devices tracked
              </p>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-slate-400"><span className="text-emerald-400 font-bold">{stats.operationalRate}%</span> operational</span>
              </div>
              {stats.overdueTasks.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span className="text-sm text-slate-400"><span className="text-rose-400 font-bold">{stats.overdueTasks.length}</span> overdue</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReportFault}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-rose-400 hover:to-red-500 transition-all active:scale-95 shadow-lg shadow-rose-500/20"
            >
              <Siren className="h-4 w-4" /> Report Fault
            </button>
            <button
              onClick={() => goTo('maintenance')}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 backdrop-blur-sm transition-all active:scale-95 ring-1 ring-white/10"
            >
              <Wrench className="h-4 w-4" /> Tasks
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard idx={0} label="Total Equipment" value={stats.total} sub="devices in system" icon={<HeartPulse className="h-5 w-5" />} color="teal" accent="from-teal-500 to-cyan-600" onClick={() => goTo('equipment')} />
        <StatCard idx={1} label="Operational" value={stats.operational} sub={`${stats.operationalRate}% readiness`} icon={<CheckCircle2 className="h-5 w-5" />} color="emerald" accent="from-emerald-500 to-green-600" onClick={() => goTo('equipment')} />
        <StatCard idx={2} label="Under Maintenance" value={stats.underMaintenance} sub={`${stats.activeTasks} active tasks`} icon={<Wrench className="h-5 w-5" />} color="sky" accent="from-sky-500 to-blue-600" onClick={() => goTo('maintenance')} />
        <StatCard idx={3} label="Needs Attention" value={priorityQueue.length} sub={`${stats.overdueTasks.length} overdue`} icon={<AlertTriangle className="h-5 w-5" />} color="rose" accent="from-rose-500 to-red-600" onClick={() => goTo('maintenance')} alert={priorityQueue.length > 0} />
      </div>

      {/* Needs Attention Now queue */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-rose-50/60 via-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20">
              <Flame className="h-5 w-5" />
              {priorityQueue.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {priorityQueue.length}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Needs Attention Now</h3>
              <p className="text-xs text-slate-500 mt-0.5">Rule-based priority queue — sorted by urgency, not AI</p>
            </div>
          </div>
          <button onClick={() => goTo('maintenance')} className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 group rounded-lg px-2 py-1.5 hover:bg-teal-50 transition-colors">
            All tasks <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {priorityQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-3">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold text-slate-700">All clear — no urgent items</p>
            <p className="text-xs text-slate-400 mt-1">All maintenance tasks are on schedule</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {priorityQueue.slice(0, 6).map((item, i) => (
              <PriorityRow key={item.id} item={item} index={i} onClick={() => goTo('maintenance')} />
            ))}
          </div>
        )}
      </div>

      {/* Readiness overview + status distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Readiness gauge */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Equipment Readiness</h3>
          </div>
          <DonutChart data={stats.statusDist} size={160} />
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Readiness rate</span>
              <span className={`font-bold ${stats.operationalRate >= 80 ? 'text-emerald-600' : stats.operationalRate >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                {stats.operationalRate}%
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${stats.operationalRate >= 80 ? 'bg-emerald-500' : stats.operationalRate >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${stats.operationalRate}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {stats.operational} of {stats.total} devices fully operational
            </p>
          </div>
        </div>

        {/* Critical alerts */}
        <div className={`rounded-2xl border p-5 shadow-sm transition-shadow ${stats.overdue > 0 || stats.outOfService > 0 ? 'border-rose-200 bg-gradient-to-b from-rose-50/40 to-white' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stats.overdue > 0 || stats.outOfService > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {stats.overdue > 0 || stats.outOfService > 0 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </div>
            <h3 className="text-sm font-bold text-slate-900">Critical Alerts</h3>
          </div>
          <div className="space-y-2">
            {stats.overdue === 0 && stats.outOfService === 0 && stats.overdueTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
                <p className="text-sm text-slate-500">All systems healthy</p>
              </div>
            ) : (
              <>
                {stats.outOfService > 0 && (
                  <AlertRow icon={<Ban className="h-4 w-4" />} color="rose" label="Out of Service" count={stats.outOfService} onClick={() => goTo('equipment')} />
                )}
                {stats.overdue > 0 && (
                  <AlertRow icon={<AlertTriangle className="h-4 w-4" />} color="rose" label="Equipment Overdue" count={stats.overdue} onClick={() => goTo('equipment')} />
                )}
                {stats.overdueTasks.length > 0 && (
                  <AlertRow icon={<Clock className="h-4 w-4" />} color="amber" label="Overdue Tasks" count={stats.overdueTasks.length} onClick={() => goTo('maintenance')} />
                )}
                {stats.dueSoon > 0 && (
                  <AlertRow icon={<CalendarClock className="h-4 w-4" />} color="amber" label="Due Soon" count={stats.dueSoon} onClick={() => goTo('equipment')} />
                )}
              </>
            )}
          </div>
        </div>

        {/* Maintenance timeline */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                <CalendarClock className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Maintenance Timeline</h3>
            </div>
            <button onClick={() => goTo('maintenance')} className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 group">
              View all <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          {stats.timelineItems.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No scheduled maintenance</p>
          ) : (
            <div className="relative space-y-3 pl-4">
              <div className="absolute left-1.5 top-1 bottom-1 w-px bg-slate-200" />
              {stats.timelineItems.slice(0, 6).map((m, i) => {
                const eq = eqMap.get(m.equipmentId);
                const days = daysUntil(m.dueDate);
                const isOverdue = days < 0 && m.status !== 'Completed' && m.status !== 'Cancelled';
                return (
                  <button
                    key={m.id}
                    onClick={() => goTo('maintenance')}
                    className="relative flex items-start gap-3 w-full text-left group animate-fade-up"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <span className={`absolute -left-4 top-1 h-3 w-3 rounded-full ring-2 ring-white ${
                      isOverdue ? 'bg-rose-500' : m.status === 'Completed' ? 'bg-emerald-500' : days <= 7 ? 'bg-amber-500' : 'bg-sky-500'
                    }`} />
                    <div className="flex-1 min-w-0 -mt-0.5">
                      <p className="text-xs font-medium text-slate-700 truncate group-hover:text-teal-700 transition-colors">{m.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{eq?.name ?? '—'} · {formatDate(m.dueDate)}</p>
                    </div>
                    <span className={`text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-md ${
                      isOverdue ? 'bg-rose-100 text-rose-600' : m.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : days <= 7 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isOverdue ? `${Math.abs(days)}d late` : days === 0 ? 'Today' : days > 0 ? `${days}d` : formatDate(m.completedDate)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity + out of service */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent completed */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Activity className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Recent Maintenance Activity</h3>
          </div>
          {stats.recentCompleted.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No completed maintenance yet</p>
          ) : (
            <div className="space-y-1.5">
              {stats.recentCompleted.map((m, i) => {
                const eq = eqMap.get(m.equipmentId);
                return (
                  <button key={m.id} onClick={() => goTo('maintenance')} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 transition-colors w-full text-left animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{m.title}</p>
                      <p className="text-xs text-slate-400 truncate">{eq?.name ?? 'Equipment'} · {m.assignedTechnician}</p>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0 bg-slate-50 px-2 py-0.5 rounded-md">{formatDate(m.completedDate)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Out of service + priority explanation */}
        <div className="space-y-4">
          {oosFlags.length > 0 && (
            <div className="rounded-2xl border border-slate-300 bg-gradient-to-r from-slate-100 to-slate-50 p-5 animate-fade-up">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                  <Ban className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">Out of Service ({oosFlags.length})</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Must not be used for patient care until inspected and returned to service.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {oosFlags.map((id) => {
                      const eq = equipmentWithStatus.find((e) => e.id === id);
                      if (!eq) return null;
                      return (
                        <button key={id} onClick={() => goTo('equipment')} className="hover:scale-105 transition-transform">
                          <StatusBadge status={eq.status} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Priority engine explanation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                <Zap className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">How Priority Works</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-500 mt-1 shrink-0" />
                <span>Out of Service equipment with overdue tasks rank highest</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                <span>Overdue tasks sorted by priority (Critical first)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500 mt-1 shrink-0" />
                <span>Active Critical/High tasks even if not yet overdue</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                <span>Due-soon tasks (within 7 days) flagged before they lapse</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-500 mt-1 shrink-0" />
                <span>Upcoming tasks (within 14 days) for planning</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Rule-based, deterministic ranking. Not AI. Does not predict failure or certify safety.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ idx, label, value, sub, icon, color, accent, onClick, alert }: {
  idx: number; label: string; value: number; sub: string; icon: React.ReactNode; color: 'teal' | 'emerald' | 'sky' | 'rose'; accent: string; onClick: () => void; alert?: boolean;
}) {
  const bgColors = {
    teal: 'bg-teal-50 text-teal-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-sky-50 text-sky-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border bg-white p-5 text-left hover:shadow-lg transition-all duration-300 active:scale-[0.98] animate-fade-up focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 ${alert ? 'border-rose-200 ring-1 ring-rose-100' : 'border-slate-200 hover:border-teal-200'}`}
      style={{ animationDelay: `${idx * 80}ms` }}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgColors[color]} group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-900 animate-count tabular-nums">{value}</p>
      <p className="text-sm text-slate-600 mt-1 font-semibold">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </button>
  );
}

function PriorityRow({ item, index, onClick }: { item: PriorityItem; index: number; onClick: () => void }) {
  const colors = reasonColors[item.reason];
  const isUrgent = item.rank <= 2;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors text-left group animate-fade-up focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 ${isUrgent ? 'border-l-[3px] border-l-rose-500' : 'border-l-[3px] border-l-transparent'}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Rank number */}
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
        isUrgent
          ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-sm shadow-rose-500/20'
          : 'bg-slate-100 text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-600'
      }`}>
        {index + 1}
      </span>

      {/* Equipment + task + reason detail */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
            {item.equipment?.name ?? 'Unknown equipment'}
          </p>
          <span className="font-mono text-[11px] text-slate-400 shrink-0">{item.equipment?.assetId ?? '—'}</span>
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{item.task.title}</p>
        {/* Reason detail — human-readable explanation */}
        <div className="mt-1.5 flex items-start gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset shrink-0 ${colors.bg} ${colors.text} ${colors.ring}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${colors.dot} ${item.reason === 'overdue-task' || item.reason === 'out-of-service' ? 'animate-pulse' : ''}`} />
            {item.reasonLabel}
          </span>
          <span className="text-[11px] leading-tight text-slate-400 truncate">{item.reasonDetail}</span>
        </div>
      </div>

      {/* Due date + tech */}
      <div className="hidden sm:flex flex-col items-end shrink-0">
        <span className={`text-xs font-bold ${item.daysOverdue > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
          {item.daysOverdue > 0 ? `${item.daysOverdue}d overdue` : formatDate(item.task.dueDate)}
        </span>
        <span className="text-[11px] text-slate-400 mt-0.5">{item.task.assignedTechnician}</span>
        <div className="mt-1.5"><PriorityBadge priority={item.task.priority} /></div>
      </div>

      {/* Mobile: priority badge inline */}
      <div className="sm:hidden flex flex-col items-end shrink-0 gap-1">
        <PriorityBadge priority={item.task.priority} />
        {item.daysOverdue > 0 && <span className="text-[10px] font-bold text-rose-600">{item.daysOverdue}d late</span>}
      </div>

      <ChevronRight className="hidden sm:block h-4 w-4 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
}

function AlertRow({ icon, color, label, count, onClick }: {
  icon: React.ReactNode; color: 'rose' | 'amber'; label: string; count: number; onClick: () => void;
}) {
  const colors = { rose: 'bg-rose-100 text-rose-600', amber: 'bg-amber-100 text-amber-600' };
  const textColors = { rose: 'text-rose-600', amber: 'text-amber-600' };
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl p-2.5 hover:bg-white transition-colors text-left group">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors[color]}`}>{icon}</span>
      <span className="flex-1 text-sm text-slate-700">{label}</span>
      <span className={`text-xl font-bold ${textColors[color]} group-hover:scale-110 transition-transform`}>{count}</span>
    </button>
  );
}
