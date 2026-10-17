import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  Equipment,
  MaintenanceTask,
  AppNotification,
  Page,
} from '@/lib/types';
import { storage } from '@/lib/storage';
import { sampleEquipment, sampleMaintenance, sampleTechnicians, sampleDepartments } from '@/lib/sampleData';
import { computeEquipmentStatus, daysUntil, uid, todayISO } from '@/lib/utils';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  // navigation
  currentPage: Page;
  setCurrentPage: (p: Page) => void;

  // data
  equipment: Equipment[];
  maintenance: MaintenanceTask[];
  notifications: AppNotification[];
  oosFlags: string[];

  // technicians & departments (derived but stable)
  technicians: string[];
  departments: string[];

  // derived equipment with effective status
  equipmentWithStatus: (Equipment & { status: ReturnType<typeof computeEquipmentStatus> })[];

  // toast
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;

  // equipment CRUD
  addEquipment: (eq: Omit<Equipment, 'id'>) => void;
  updateEquipment: (id: string, patch: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;
  setOutOfService: (id: string, value: boolean) => void;

  // maintenance CRUD
  addMaintenance: (task: Omit<MaintenanceTask, 'id' | 'createdAt' | 'completedDate'>) => void;
  updateMaintenance: (id: string, patch: Partial<MaintenanceTask>) => void;
  completeMaintenance: (id: string, notes: string) => void;
  cancelMaintenance: (id: string) => void;
  deleteMaintenance: (id: string) => void;

  // notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  regenerateNotifications: () => void;

  // demo
  resetDemoData: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize from storage once
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceTask[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [oosFlags, setOosFlags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!storage.isInitialized()) {
      storage.resetToSampleData();
    }
    setEquipment(storage.getEquipment());
    setMaintenance(storage.getMaintenance());
    setNotifications(storage.getNotifications());
    setOosFlags(storage.getOosFlags());
    setReady(true);
  }, []);

  // Persist on change
  useEffect(() => { if (ready) storage.setEquipment(equipment); }, [equipment, ready]);
  useEffect(() => { if (ready) storage.setMaintenance(maintenance); }, [maintenance, ready]);
  useEffect(() => { if (ready) storage.setNotifications(notifications); }, [notifications, ready]);
  useEffect(() => { if (ready) storage.setOosFlags(oosFlags); }, [oosFlags, ready]);

  // Regenerate notifications whenever equipment/maintenance changes
  useEffect(() => {
    if (!ready) return;
    setNotifications((prev) => {
      const keep = prev.filter((n) => n.type === 'info'); // preserve manually-generated info toasts
      const generated = generateNotifications(equipment, maintenance, oosFlags);
      // Mark generated as read if a previous identical notification was read
      const prevReadKeys = new Set(prev.filter((n) => n.read).map((n) => n.message));
      generated.forEach((g) => {
        if (prevReadKeys.has(g.message)) g.read = true;
      });
      return [...generated, ...keep].sort((a, b) => a.createdAt < b.createdAt ? 1 : -1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipment, maintenance, oosFlags, ready]);

  // ---- Toasts ----
  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = uid('t-');
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };
  const dismissToast = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  // ---- Equipment ----
  const equipmentWithStatus = useMemo(() => {
    const inProgressTasks = new Set(
      maintenance
        .filter((m) => m.status === 'Pending' || m.status === 'In Progress')
        .map((m) => m.equipmentId)
    );
    return equipment.map((eq) => {
      const oos = oosFlags.includes(eq.id);
      let status = computeEquipmentStatus(eq, inProgressTasks.has(eq.id));
      if (oos) status = 'Out of Service';
      return { ...eq, status };
    });
  }, [equipment, maintenance, oosFlags]);

  const addEquipment: AppState['addEquipment'] = (eq) => {
    const newEq: Equipment = { ...eq, id: uid('eq-') };
    setEquipment((list) => [newEq, ...list]);
    showToast('Equipment added successfully.');
  };
  const updateEquipment: AppState['updateEquipment'] = (id, patch) => {
    setEquipment((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    showToast('Equipment updated.');
  };
  const deleteEquipment: AppState['deleteEquipment'] = (id) => {
    setEquipment((list) => list.filter((e) => e.id !== id));
    setMaintenance((list) => list.filter((m) => m.equipmentId !== id));
    setOosFlags((list) => list.filter((x) => x !== id));
    showToast('Equipment and related tasks deleted.', 'info');
  };
  const setOutOfService: AppState['setOutOfService'] = (id, value) => {
    setOosFlags((list) => (value ? [...new Set([...list, id])] : list.filter((x) => x !== id)));
    showToast(value ? 'Equipment marked Out of Service.' : 'Equipment returned to service.', 'info');
  };

  // ---- Maintenance ----
  const addMaintenance: AppState['addMaintenance'] = (task) => {
    const newTask: MaintenanceTask = {
      ...task,
      id: uid('mt-'),
      completedDate: null,
      createdAt: new Date().toISOString(),
    };
    setMaintenance((list) => [newTask, ...list]);
    showToast('Maintenance task created.');
  };
  const updateMaintenance: AppState['updateMaintenance'] = (id, patch) => {
    setMaintenance((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    showToast('Maintenance task updated.');
  };
  const completeMaintenance: AppState['completeMaintenance'] = (id, notes) => {
    const today = todayISO();
    setMaintenance((list) =>
      list.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, status: 'Completed' as const, completedDate: today, notes };
        return updated;
      })
    );
    // Update equipment's lastServiceDate and nextMaintenanceDue (6 months ahead for preventive, 12 months for corrective)
    const task = maintenance.find((m) => m.id === id);
    if (task) {
      const next = new Date();
      next.setDate(next.getDate() + (task.type === 'Preventive' ? 180 : 365));
      setEquipment((list) =>
        list.map((e) =>
          e.id === task.equipmentId
            ? { ...e, lastServiceDate: today, nextMaintenanceDue: next.toISOString().split('T')[0] }
            : e
        )
      );
    }
    showToast('Maintenance task completed. Equipment service dates updated.');
  };
  const cancelMaintenance: AppState['cancelMaintenance'] = (id) => {
    setMaintenance((list) => list.map((m) => (m.id === id ? { ...m, status: 'Cancelled' as const } : m)));
    showToast('Maintenance task cancelled.', 'info');
  };
  const deleteMaintenance: AppState['deleteMaintenance'] = (id) => {
    setMaintenance((list) => list.filter((m) => m.id !== id));
    showToast('Maintenance task deleted.', 'info');
  };

  // ---- Notifications ----
  const markNotificationRead: AppState['markNotificationRead'] = (id) => {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };
  const markAllNotificationsRead: AppState['markAllNotificationsRead'] = () => {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read.', 'info');
  };
  const clearNotifications: AppState['clearNotifications'] = () => {
    setNotifications([]);
    showToast('Notifications cleared.', 'info');
  };
  const regenerateNotifications: AppState['regenerateNotifications'] = () => {
    setNotifications(generateNotifications(equipment, maintenance, oosFlags));
  };

  // ---- Demo ----
  const resetDemoData: AppState['resetDemoData'] = () => {
    const { equipment: eq, maintenance: mt } = storage.resetToSampleData();
    setEquipment(eq);
    setMaintenance(mt);
    setNotifications([]);
    setOosFlags([]);
    showToast('Demo data has been reset.', 'info');
  };

  // Stable lists
  const technicians = useMemo(() => {
    const set = new Set<string>(sampleTechnicians);
    equipment.forEach((e) => set.add(e.assignedTechnician));
    maintenance.forEach((m) => set.add(m.assignedTechnician));
    return Array.from(set).sort();
  }, [equipment, maintenance]);

  const departments = useMemo(() => {
    const set = new Set<string>(sampleDepartments);
    equipment.forEach((e) => set.add(e.department));
    return Array.from(set).sort();
  }, [equipment]);

  const value: AppState = {
    currentPage,
    setCurrentPage,
    equipment,
    maintenance,
    notifications,
    oosFlags,
    equipmentWithStatus,
    toasts,
    showToast,
    dismissToast,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    setOutOfService,
    addMaintenance,
    updateMaintenance,
    completeMaintenance,
    cancelMaintenance,
    deleteMaintenance,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    regenerateNotifications,
    resetDemoData,
    technicians,
    departments,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ---- helpers ----
function generateNotifications(
  equipment: Equipment[],
  maintenance: MaintenanceTask[],
  oosFlags: string[]
): AppNotification[] {
  const now = Date.now();
  const out: AppNotification[] = [];

  // Out of service equipment
  oosFlags.forEach((id) => {
    const eq = equipment.find((e) => e.id === id);
    if (eq) {
      out.push({
        id: uid('n-'),
        message: `${eq.name} (${eq.assetId}) is marked Out of Service.`,
        type: 'danger',
        page: 'equipment',
        targetId: eq.id,
        read: false,
        createdAt: new Date(now).toISOString(),
      });
    }
  });

  // Overdue / due-soon maintenance
  maintenance
    .filter((m) => m.status === 'Pending' || m.status === 'In Progress')
    .forEach((m) => {
      const eq = equipment.find((e) => e.id === m.equipmentId);
      const days = daysUntil(m.dueDate);
      if (days < 0) {
        out.push({
          id: uid('n-'),
          message: `Overdue: "${m.title}" for ${eq?.name ?? 'equipment'} was due ${Math.abs(days)} day(s) ago.`,
          type: 'danger',
          page: 'maintenance',
          targetId: m.id,
          read: false,
          createdAt: new Date(now + 1).toISOString(),
        });
      } else if (days <= 7) {
        out.push({
          id: uid('n-'),
          message: `Upcoming: "${m.title}" for ${eq?.name ?? 'equipment'} is due in ${days} day(s).`,
          type: 'warning',
          page: 'maintenance',
          targetId: m.id,
          read: false,
          createdAt: new Date(now + 2).toISOString(),
        });
      }
    });

  // Equipment overdue (nextMaintenanceDue in past, no active task)
  const activeTaskEq = new Set(maintenance.filter((m) => m.status === 'Pending' || m.status === 'In Progress').map((m) => m.equipmentId));
  equipment.forEach((eq) => {
    if (oosFlags.includes(eq.id) || activeTaskEq.has(eq.id)) return;
    const days = daysUntil(eq.nextMaintenanceDue);
    if (days < 0) {
      out.push({
        id: uid('n-'),
        message: `${eq.name} (${eq.assetId}) maintenance is ${Math.abs(days)} day(s) overdue.`,
        type: 'warning',
        page: 'equipment',
        targetId: eq.id,
        read: false,
        createdAt: new Date(now + 3).toISOString(),
      });
    }
  });

  return out;
}
