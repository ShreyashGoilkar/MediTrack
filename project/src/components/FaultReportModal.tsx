import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/Modal';
import type { MaintenancePriority } from '@/lib/types';
import { todayISO, formatDate } from '@/lib/utils';
import { AlertTriangle, Search, MapPin, Calendar } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function FaultReportModal({ open, onClose }: Props) {
  const { equipment, addMaintenance, technicians, equipmentWithStatus } = useApp();

  const [search, setSearch] = useState('');
  const [selectedEqId, setSelectedEqId] = useState('');
  const [faultDescription, setFaultDescription] = useState('');
  const [urgency, setUrgency] = useState<MaintenancePriority>('High');
  const [location, setLocation] = useState('');
  const [reportDate, setReportDate] = useState(todayISO());
  const [assignedTech, setAssignedTech] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredEquipment = useMemo(() => {
    if (!search) return equipmentWithStatus.slice(0, 8);
    const q = search.toLowerCase();
    return equipmentWithStatus
      .filter((e) => `${e.name} ${e.assetId} ${e.department} ${e.location}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [equipmentWithStatus, search]);

  const selectedEq = equipment.find((e) => e.id === selectedEqId);

  const update = (key: string, value: string) => {
    if (key === 'selectedEqId') setSelectedEqId(value);
    else if (key === 'faultDescription') setFaultDescription(value);
    else if (key === 'urgency') setUrgency(value as MaintenancePriority);
    else if (key === 'location') setLocation(value);
    else if (key === 'reportDate') setReportDate(value);
    else if (key === 'assignedTech') setAssignedTech(value);
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!selectedEqId) errs.selectedEqId = 'Select the equipment with the fault';
    if (!faultDescription.trim()) errs.faultDescription = 'Describe the fault';
    if (!reportDate) errs.reportDate = 'Date is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const eq = equipment.find((x) => x.id === selectedEqId);
    const loc = location.trim() || eq?.location || '';
    const tech = assignedTech.trim() || eq?.assignedTechnician || 'Unassigned';

    addMaintenance({
      title: `Fault Report: ${eq?.name ?? 'Equipment'}`,
      description: faultDescription.trim(),
      equipmentId: selectedEqId,
      type: 'Corrective',
      priority: urgency,
      assignedTechnician: tech,
      dueDate: reportDate,
      status: 'Pending',
      notes: `Fault reported on ${reportDate} at location: ${loc}. Urgency: ${urgency}.`,
    });

    // Reset
    setSearch(''); setSelectedEqId(''); setFaultDescription('');
    setUrgency('High'); setLocation(''); setReportDate(todayISO());
    setAssignedTech(''); setErrors({});
    onClose();
  };

  const inputClass = (field: string) =>
    `w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
      errors[field] ? 'border-rose-300 focus:ring-rose-500/10' : 'border-slate-200 focus:border-teal-400 focus:ring-teal-500/10'
    }`;

  const urgencyOptions: { value: MaintenancePriority; label: string; color: string }[] = [
    { value: 'Critical', label: 'Critical — Patient safety risk', color: 'border-rose-400 bg-rose-50 text-rose-700' },
    { value: 'High', label: 'High — Equipment unusable', color: 'border-orange-400 bg-orange-50 text-orange-700' },
    { value: 'Medium', label: 'Medium — Degraded performance', color: 'border-amber-400 bg-amber-50 text-amber-700' },
    { value: 'Low', label: 'Low — Minor issue, usable', color: 'border-sky-400 bg-sky-50 text-sky-700' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report Equipment Fault"
      subtitle="File a corrective maintenance request for a malfunctioning device"
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 active:scale-95 transition-all">
            Cancel
          </button>
          <button type="submit" form="fault-report-form" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 py-2 text-sm font-semibold text-white hover:from-rose-500 hover:to-red-500 active:scale-95 transition-all shadow-sm shadow-rose-500/20">
            <AlertTriangle className="h-4 w-4" /> Submit Fault Report
          </button>
        </>
      }
    >
      <form id="fault-report-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Equipment selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Faulty Equipment <span className="text-rose-500">*</span>
          </label>
          {selectedEq ? (
            <div className="flex items-center justify-between rounded-xl border-2 border-teal-300 bg-teal-50/50 px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{selectedEq.name}</p>
                <p className="text-xs text-slate-500 font-mono">{selectedEq.assetId} · {selectedEq.department} · {selectedEq.location}</p>
              </div>
              <button type="button" onClick={() => { setSelectedEqId(''); setSearch(''); }} className="text-xs font-medium text-teal-600 hover:text-teal-700 shrink-0 ml-3">
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, asset ID, or department…"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                />
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {filteredEquipment.length === 0 ? (
                  <p className="text-sm text-slate-400 py-3 text-center">No equipment found</p>
                ) : (
                  filteredEquipment.map((eq) => (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => { setSelectedEqId(eq.id); setSearch(''); setLocation(eq.location); setAssignedTech(eq.assignedTechnician); }}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-left hover:border-teal-300 hover:bg-teal-50/30 transition-all"
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-slate-700 truncate block">{eq.name}</span>
                        <span className="text-xs text-slate-400 font-mono">{eq.assetId}</span>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0 ml-2">{eq.department}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
          {errors.selectedEqId && <p className="mt-1.5 text-xs text-rose-600">{errors.selectedEqId}</p>}
        </div>

        {/* Fault description */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Fault Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={faultDescription}
            onChange={(e) => update('faultDescription', e.target.value)}
            rows={3}
            placeholder="Describe what happened, error messages, symptoms, when it was noticed…"
            className={`${inputClass('faultDescription')} resize-y`}
          />
          {errors.faultDescription && <p className="mt-1.5 text-xs text-rose-600">{errors.faultDescription}</p>}
        </div>

        {/* Urgency selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">Urgency Level</label>
          <div className="grid grid-cols-2 gap-2">
            {urgencyOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update('urgency', opt.value)}
                className={`rounded-xl border-2 px-3 py-2.5 text-left text-xs font-medium transition-all ${
                  urgency === opt.value ? opt.color : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location, date, technician */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              <MapPin className="h-3 w-3 inline mr-1" /> Location
            </label>
            <input
              value={location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="Auto-filled"
              className={inputClass('location')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              <Calendar className="h-3 w-3 inline mr-1" /> Report Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => update('reportDate', e.target.value)}
              className={inputClass('reportDate')}
            />
            {errors.reportDate && <p className="mt-1.5 text-xs text-rose-600">{errors.reportDate}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Assign Technician</label>
            <input
              value={assignedTech}
              onChange={(e) => update('assignedTech', e.target.value)}
              list="fault-tech-list"
              placeholder="Auto-assigned"
              className={inputClass('assignedTech')}
            />
            <datalist id="fault-tech-list">
              {technicians.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
        </div>

        {/* Info note */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs text-amber-800 leading-relaxed">
            Submitting this report creates a corrective maintenance task with status "Pending". The equipment's assigned technician will be notified. This does NOT take the equipment out of service — do that separately if the device is unsafe.
          </p>
        </div>
      </form>
    </Modal>
  );
}
