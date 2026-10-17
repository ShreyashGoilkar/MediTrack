import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import type { EquipmentStatus } from '@/lib/types';
import { BarChart } from '@/components/Charts';
import { StatusBadge, MaintenanceStatusBadge } from '@/components/Badges';
import { downloadCSV } from '@/lib/csv';
import { Download, FileText, BarChart3, HeartPulse, Wrench } from 'lucide-react';

export function ReportsPage() {
  const { equipmentWithStatus, maintenance, departments } = useApp();

  const data = useMemo(() => {
    // Equipment by status
    const statusCounts = (['Operational', 'Due Soon', 'Overdue', 'Under Maintenance', 'Out of Service'] as EquipmentStatus[]).map((s) => ({
      label: s,
      value: equipmentWithStatus.filter((e) => e.status === s).length,
      color: s === 'Operational' ? 'bg-emerald-500' : s === 'Due Soon' ? 'bg-amber-500' : s === 'Overdue' ? 'bg-rose-500' : s === 'Under Maintenance' ? 'bg-sky-500' : 'bg-slate-400',
    }));

    // Maintenance completed vs pending
    const completed = maintenance.filter((m) => m.status === 'Completed').length;
    const pending = maintenance.filter((m) => m.status === 'Pending').length;
    const inProgress = maintenance.filter((m) => m.status === 'In Progress').length;
    const cancelled = maintenance.filter((m) => m.status === 'Cancelled').length;
    const maintenanceStatusData = [
      { label: 'Completed', value: completed, color: 'bg-emerald-500' },
      { label: 'Pending', value: pending, color: 'bg-amber-500' },
      { label: 'In Progress', value: inProgress, color: 'bg-sky-500' },
      { label: 'Cancelled', value: cancelled, color: 'bg-slate-300' },
    ];

    // Overdue maintenance
    const overdueTasks = maintenance.filter((m) => {
      const due = new Date(m.dueDate + 'T00:00:00');
      const today = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00');
      return due < today && (m.status === 'Pending' || m.status === 'In Progress');
    });

    // By department
    const byDept = departments.map((d) => ({
      label: d,
      value: maintenance.filter((m) => {
        const eq = equipmentWithStatus.find((e) => e.id === m.equipmentId);
        return eq?.department === d;
      }).length,
      color: 'bg-teal-500',
    })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);

    return { statusCounts, maintenanceStatusData, overdueTasks, byDept, completed, pending, inProgress };
  }, [equipmentWithStatus, maintenance, departments]);

  const eqMap = useMemo(() => new Map(equipmentWithStatus.map((e) => [e.id, e])), [equipmentWithStatus]);

  const exportEquipment = () => {
    const rows = equipmentWithStatus.map((e) => ({
      AssetID: e.assetId, Name: e.name, Category: e.category, Department: e.department,
      Location: e.location, Manufacturer: e.manufacturer, Model: e.model,
      PurchaseDate: e.purchaseDate, LastServiceDate: e.lastServiceDate ?? '',
      NextMaintenanceDue: e.nextMaintenanceDue, AssignedTechnician: e.assignedTechnician,
      Status: e.status, Notes: e.notes ?? '',
    }));
    downloadCSV('equipment-export.csv', rows);
  };

  const exportMaintenance = () => {
    const rows = maintenance.map((m) => {
      const eq = eqMap.get(m.equipmentId);
      return {
        ID: m.id, Title: m.title, Equipment: eq?.name ?? '', AssetID: eq?.assetId ?? '',
        Type: m.type, Priority: m.priority, AssignedTechnician: m.assignedTechnician,
        DueDate: m.dueDate, Status: m.status, CompletedDate: m.completedDate ?? '',
        Description: m.description, Notes: m.notes,
      };
    });
    downloadCSV('maintenance-export.csv', rows);
  };

  return (
    <div className="space-y-6">
      {/* Export buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ExportCard title="Equipment Records" description="Export all equipment with status, location, and service dates" onClick={exportEquipment} icon={<HeartPulse className="h-5 w-5" />} />
        <ExportCard title="Maintenance Tasks" description="Export all maintenance tasks with equipment and status" onClick={exportMaintenance} icon={<Wrench className="h-5 w-5" />} />
      </div>

      {/* Equipment by status */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-teal-500" />
          <h3 className="text-sm font-semibold text-slate-900">Equipment by Status</h3>
        </div>
        <BarChart data={data.statusCounts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Maintenance completed vs pending */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-teal-500" />
            <h3 className="text-sm font-semibold text-slate-900">Maintenance: Completed vs Pending</h3>
          </div>
          <BarChart data={data.maintenanceStatusData} />
        </div>

        {/* Activity by department */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-teal-500" />
            <h3 className="text-sm font-semibold text-slate-900">Maintenance Activity by Department</h3>
          </div>
          {data.byDept.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No maintenance activity yet.</p>
          ) : (
            <BarChart data={data.byDept} />
          )}
        </div>
      </div>

      {/* Overdue maintenance table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Overdue Maintenance ({data.overdueTasks.length})</h3>
        {data.overdueTasks.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">No overdue tasks. Everything is on schedule.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Task</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Equipment</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Technician</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Due</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.overdueTasks.map((m) => {
                  const eq = eqMap.get(m.equipmentId);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-700">{m.title}</td>
                      <td className="px-3 py-2 text-slate-600">{eq?.name ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-600">{m.assignedTechnician}</td>
                      <td className="px-3 py-2 text-rose-600 font-medium">{m.dueDate}</td>
                      <td className="px-3 py-2"><MaintenanceStatusBadge status={m.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Safety notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Disclaimer:</strong> MediTrack is an administrative tracking tool only. Maintenance status shown here is a tracking indicator and does not certify equipment as clinically safe or authorize it for patient use. All equipment must follow approved hospital inspection and biomedical engineering procedures before clinical use.
        </p>
      </div>
    </div>
  );
}

function ExportCard({ title, description, onClick, icon }: { title: string; description: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-teal-200 hover:shadow-md transition-all group">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-0.5">{description}</p>
      </div>
      <Download className="h-5 w-5 text-slate-300 group-hover:text-teal-500 transition-colors shrink-0" />
    </button>
  );
}
