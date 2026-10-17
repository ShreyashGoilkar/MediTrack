import type { Equipment, EquipmentStatus } from '@/lib/types';

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date(todayISO() + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function uid(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Compute the effective status of an equipment based on nextMaintenanceDue and whether it's under maintenance. */
export function computeEquipmentStatus(
  eq: Equipment,
  underMaintenance: boolean
): EquipmentStatus {
  if (underMaintenance) return 'Under Maintenance';
  const days = daysUntil(eq.nextMaintenanceDue);
  if (days < 0) return 'Overdue';
  if (days <= 14) return 'Due Soon';
  return 'Operational';
}

/** True when an equipment is explicitly out of service (stored separately so it persists). */
export const OUT_OF_SERVICE_FLAG_KEY = 'meditrack-oos-flags';
