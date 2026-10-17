export type EquipmentStatus =
  | 'Operational'
  | 'Due Soon'
  | 'Overdue'
  | 'Under Maintenance'
  | 'Out of Service';

export type EquipmentCategory =
  | 'Ventilator'
  | 'Patient Monitor'
  | 'Infusion Pump'
  | 'ECG Machine'
  | 'Defibrillator';

export interface Equipment {
  id: string;
  assetId: string;
  name: string;
  category: EquipmentCategory;
  department: string;
  location: string;
  manufacturer: string;
  model: string;
  purchaseDate: string; // ISO yyyy-mm-dd
  lastServiceDate: string | null;
  nextMaintenanceDue: string; // ISO yyyy-mm-dd
  assignedTechnician: string;
  notes?: string;
}

export type MaintenanceType = 'Preventive' | 'Corrective';
export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type MaintenanceStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  equipmentId: string; // references Equipment.id
  type: MaintenanceType;
  priority: MaintenancePriority;
  assignedTechnician: string;
  dueDate: string; // ISO yyyy-mm-dd
  status: MaintenanceStatus;
  completedDate: string | null;
  notes: string;
  createdAt: string; // ISO datetime
}

export type Page = 'dashboard' | 'equipment' | 'maintenance' | 'reports' | 'notifications' | 'settings';

export interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'danger';
  page: Page;
  targetId?: string;
  read: boolean;
  createdAt: string;
}
