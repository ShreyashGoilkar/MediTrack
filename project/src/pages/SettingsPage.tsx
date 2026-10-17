import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RotateCcw, Database, Info, ShieldAlert, HeartPulse, Wrench, Bell } from 'lucide-react';

export function SettingsPage() {
  const { equipment, maintenance, notifications, resetDemoData } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Data overview */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-4 w-4 text-teal-500" />
          <h3 className="text-sm font-semibold text-slate-900">Data Overview</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <DataStat label="Equipment" value={equipment.length} icon={<HeartPulse className="h-4 w-4 text-teal-500" />} />
          <DataStat label="Maintenance Tasks" value={maintenance.length} icon={<Wrench className="h-4 w-4 text-sky-500" />} />
          <DataStat label="Notifications" value={notifications.length} icon={<Bell className="h-4 w-4 text-amber-500" />} />
        </div>
        <p className="mt-4 text-xs text-slate-400">
          All data is stored locally in your browser using localStorage. It persists across page refreshes but is specific to this browser and device.
        </p>
      </div>

      {/* Reset demo data */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <RotateCcw className="h-4 w-4 text-teal-500" />
          <h3 className="text-sm font-semibold text-slate-900">Reset Demo Data</h3>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          This will replace all current equipment and maintenance records with the original sample data. Any equipment or tasks you've added will be lost. The sample records are clearly labeled as demo data and are not actual hospital records.
        </p>
        <button
          onClick={() => setConfirmReset(true)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="h-4 w-4" /> Reset to Sample Data
        </button>
      </div>

      {/* About */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-teal-500" />
          <h3 className="text-sm font-semibold text-slate-900">About MediTrack</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          MediTrack is a biomedical equipment maintenance tracker designed for hospital biomedical engineering departments. It helps manage equipment inventory, schedule preventive and corrective maintenance, and track service history — all from a single dashboard.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Version 1.0.0</span>
          <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">MVP — Competition Build</span>
        </div>
      </div>

      {/* Safety disclaimer */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900">Important Safety Notice</h3>
            <p className="text-sm text-amber-800 mt-1 leading-relaxed">
              MediTrack tracks administrative maintenance records only. It does not control medical devices, certify equipment as clinically safe, or automatically authorize equipment for patient use. Maintenance status displayed in this application is a tracking indicator, not a substitute for approved hospital inspection procedures. All equipment must be verified through your hospital's official biomedical engineering and clinical safety protocols.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset Demo Data"
        message="This will replace ALL current equipment, maintenance tasks, and notifications with the original sample data. Your changes will be lost. Continue?"
        confirmLabel="Reset Data"
        danger
        onConfirm={() => { resetDemoData(); setConfirmReset(false); }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

function DataStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
