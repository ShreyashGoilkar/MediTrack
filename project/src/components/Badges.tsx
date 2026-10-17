import type { EquipmentStatus, MaintenancePriority, MaintenanceStatus } from '@/lib/types';

const equipmentStatusStyles: Record<EquipmentStatus, string> = {
  Operational: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'Due Soon': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Overdue: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  'Under Maintenance': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'Out of Service': 'bg-slate-200 text-slate-700 ring-slate-500/30',
};

const equipmentStatusDot: Record<EquipmentStatus, string> = {
  Operational: 'bg-emerald-500',
  'Due Soon': 'bg-amber-500',
  Overdue: 'bg-rose-500',
  'Under Maintenance': 'bg-blue-500',
  'Out of Service': 'bg-slate-500',
};

const maintenanceStatusStyles: Record<MaintenanceStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'In Progress': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Cancelled: 'bg-slate-100 text-slate-500 ring-slate-400/20',
};

const priorityStyles: Record<MaintenancePriority, string> = {
  Low: 'bg-slate-50 text-slate-600 ring-slate-400/20',
  Medium: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  High: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  Critical: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

export function StatusBadge({ status }: { status: EquipmentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${equipmentStatusStyles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${equipmentStatusDot[status]} ${status === 'Overdue' ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  );
}

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${maintenanceStatusStyles[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: MaintenancePriority }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${priorityStyles[priority]}`}>
      {priority}
    </span>
  );
}
