import type { Equipment, MaintenanceTask, AppNotification } from '@/lib/types';
import { sampleEquipment, sampleMaintenance } from '@/lib/sampleData';

const KEYS = {
  equipment: 'meditrack-equipment',
  maintenance: 'meditrack-maintenance',
  notifications: 'meditrack-notifications',
  oosFlags: 'meditrack-oos-flags',
  initialized: 'meditrack-initialized',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / unavailable — ignore */
  }
}

export const storage = {
  // Equipment
  getEquipment: (): Equipment[] => read<Equipment[]>(KEYS.equipment, []),
  setEquipment: (items: Equipment[]) => write(KEYS.equipment, items),

  // Maintenance
  getMaintenance: (): MaintenanceTask[] => read<MaintenanceTask[]>(KEYS.maintenance, []),
  setMaintenance: (items: MaintenanceTask[]) => write(KEYS.maintenance, items),

  // Notifications
  getNotifications: (): AppNotification[] => read<AppNotification[]>(KEYS.notifications, []),
  setNotifications: (items: AppNotification[]) => write(KEYS.notifications, items),

  // Out-of-service flags (set of equipment ids)
  getOosFlags: (): string[] => read<string[]>(KEYS.oosFlags, []),
  setOosFlags: (ids: string[]) => write(KEYS.oosFlags, ids),

  // Initialization
  isInitialized: (): boolean => read<boolean>(KEYS.initialized, false),
  setInitialized: (v: boolean) => write(KEYS.initialized, v),

  // Reset to demo data
  resetToSampleData: (): { equipment: Equipment[]; maintenance: MaintenanceTask[] } => {
    write(KEYS.equipment, sampleEquipment);
    write(KEYS.maintenance, sampleMaintenance);
    write(KEYS.notifications, []);
    write(KEYS.oosFlags, []);
    write(KEYS.initialized, true);
    return { equipment: sampleEquipment, maintenance: sampleMaintenance };
  },

  clearAll: (): void => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
