import type { MaintenanceTask, Equipment } from '@/lib/types';
import { daysUntil } from '@/lib/utils';

export type PriorityReason =
  | 'overdue-task'
  | 'out-of-service'
  | 'critical-priority'
  | 'high-priority'
  | 'due-soon'
  | 'upcoming';

export interface PriorityItem {
  id: string;
  task: MaintenanceTask;
  equipment: Equipment | undefined;
  reason: PriorityReason;
  reasonLabel: string;
  reasonDetail: string;
  daysOverdue: number;
  rank: number;
}

const reasonLabels: Record<PriorityReason, string> = {
  'overdue-task': 'Overdue',
  'out-of-service': 'Out of Service',
  'critical-priority': 'Critical Repair',
  'high-priority': 'High Priority',
  'due-soon': 'Due Soon',
  'upcoming': 'Upcoming',
};

/**
 * Rule-based priority engine. Transparent, deterministic, explainable.
 * NOT AI — NOT predictive. Uses existing equipment and task records.
 *
 * Ranking rules (highest rank first):
 *   1. Out of Service equipment with active task  → rank 0
 *   2. Overdue critical-priority task             → rank 1
 *   3. Overdue high-priority task                 → rank 2
 *   4. Overdue task (any priority)                → rank 3
 *   5. Active critical-priority task (not overdue)→ rank 4
 *   6. Active high-priority task (not overdue)    → rank 5
 *   7. Due soon (≤7 days)                         → rank 6
 *   8. Upcoming (≤14 days)                        → rank 7
 *
 * Completed and cancelled tasks are NEVER included.
 */
export function computePriorityQueue(
  maintenance: MaintenanceTask[],
  equipment: Equipment[],
  oosFlags: string[]
): PriorityItem[] {
  const eqMap = new Map(equipment.map((e) => [e.id, e]));
  const oosSet = new Set(oosFlags);

  const items: PriorityItem[] = [];

  maintenance
    .filter((m) => m.status === 'Pending' || m.status === 'In Progress')
    .forEach((task) => {
      const eq = eqMap.get(task.equipmentId);
      const days = daysUntil(task.dueDate);
      const isOverdue = days < 0;
      const isOos = eq ? oosSet.has(eq.id) : false;

      let reason: PriorityReason | null = null;
      let rank = -1;

      if (isOos && isOverdue) {
        reason = 'out-of-service';
        rank = 0;
      } else if (isOverdue && task.priority === 'Critical') {
        reason = 'overdue-task';
        rank = 1;
      } else if (isOverdue && task.priority === 'High') {
        reason = 'overdue-task';
        rank = 2;
      } else if (isOverdue) {
        reason = 'overdue-task';
        rank = 3;
      } else if (task.priority === 'Critical') {
        reason = 'critical-priority';
        rank = 4;
      } else if (task.priority === 'High') {
        reason = 'high-priority';
        rank = 5;
      } else if (days >= 0 && days <= 7) {
        reason = 'due-soon';
        rank = 6;
      } else if (days > 7 && days <= 14) {
        reason = 'upcoming';
        rank = 7;
      }

      if (reason === null) return;

      const reasonDetail = buildReasonDetail(reason, days, task, isOos);

      items.push({
        id: task.id,
        task,
        equipment: eq,
        reason,
        reasonLabel: reasonLabels[reason],
        reasonDetail,
        daysOverdue: isOverdue ? Math.abs(days) : 0,
        rank,
      });
    });

  items.sort((a, b) => a.rank - b.rank);
  return items;
}

function buildReasonDetail(
  reason: PriorityReason,
  days: number,
  task: MaintenanceTask,
  isOos: boolean
): string {
  switch (reason) {
    case 'out-of-service':
      return `Equipment is Out of Service and task is ${Math.abs(days)} day(s) overdue. Must be repaired before return to service.`;
    case 'overdue-task':
      return `Task was due ${Math.abs(days)} day(s) ago (priority: ${task.priority}). Overdue tasks receive elevated attention.`;
    case 'critical-priority':
      return `Critical-priority repair. Due in ${days} day(s). Address before due date.`;
    case 'high-priority':
      return `High-priority task. Due in ${days} day(s). Schedule technician promptly.`;
    case 'due-soon':
      return `Preventive maintenance due in ${days} day(s). Schedule before due date to avoid overdue status.`;
    case 'upcoming':
      return `Maintenance scheduled in ${days} day(s). Plan technician availability.`;
    default:
      return '';
  }
}

export const reasonColors: Record<PriorityReason, { bg: string; text: string; ring: string; dot: string }> = {
  'out-of-service': { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-400/30', dot: 'bg-slate-500' },
  'overdue-task': { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-600/20', dot: 'bg-rose-500' },
  'critical-priority': { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-600/20', dot: 'bg-rose-500' },
  'high-priority': { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-600/20', dot: 'bg-orange-500' },
  'due-soon': { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-600/20', dot: 'bg-amber-500' },
  'upcoming': { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-600/20', dot: 'bg-sky-500' },
};
