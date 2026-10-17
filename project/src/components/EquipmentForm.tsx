import { useState } from 'react';
import type { Equipment, EquipmentCategory } from '@/lib/types';
import { useApp } from '@/context/AppContext';

const categories: EquipmentCategory[] = [
  'Ventilator', 'Patient Monitor', 'Infusion Pump', 'ECG Machine', 'Defibrillator',
];

interface Props {
  initial?: Equipment;
  onSubmit: (data: Omit<Equipment, 'id'>) => void;
  onCancel: () => void;
}

type Errors = Partial<Record<keyof Omit<Equipment, 'id'>, string>>;

function validate(data: Omit<Equipment, 'id'>): Errors {
  const e: Errors = {};
  if (!data.name.trim()) e.name = 'Equipment name is required';
  if (!data.assetId.trim()) e.assetId = 'Asset ID is required';
  if (!data.department.trim()) e.department = 'Department is required';
  if (!data.location.trim()) e.location = 'Location is required';
  if (!data.manufacturer.trim()) e.manufacturer = 'Manufacturer is required';
  if (!data.model.trim()) e.model = 'Model is required';
  if (!data.purchaseDate) e.purchaseDate = 'Purchase date is required';
  if (!data.nextMaintenanceDue) e.nextMaintenanceDue = 'Next maintenance date is required';
  if (!data.assignedTechnician.trim()) e.assignedTechnician = 'Assigned technician is required';
  return e;
}

export function EquipmentForm({ initial, onSubmit, onCancel }: Props) {
  const { technicians, departments } = useApp();
  const [form, setForm] = useState<Omit<Equipment, 'id'>>({
    assetId: initial?.assetId ?? '',
    name: initial?.name ?? '',
    category: initial?.category ?? 'Ventilator',
    department: initial?.department ?? '',
    location: initial?.location ?? '',
    manufacturer: initial?.manufacturer ?? '',
    model: initial?.model ?? '',
    purchaseDate: initial?.purchaseDate ?? '',
    lastServiceDate: initial?.lastServiceDate ?? null,
    nextMaintenanceDue: initial?.nextMaintenanceDue ?? '',
    assignedTechnician: initial?.assignedTechnician ?? '',
    notes: initial?.notes ?? '',
  });
  const [errors, setErrors] = useState<Errors>({});

  const update = (key: keyof Omit<Equipment, 'id'>, value: string | null) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit(form);
  };

  const inputBase = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 transition';
  const okClass = 'border-slate-200 focus:border-teal-400 focus:ring-teal-500/10';
  const errClass = 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10';
  const cls = (field: keyof Errors) => `${inputBase} ${errors[field] ? errClass : okClass}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Equipment Name" error={errors.name} required>
          <input className={cls('name')} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Puritan Bennett 980" />
        </Field>
        <Field label="Asset ID" error={errors.assetId} required>
          <input className={cls('assetId')} value={form.assetId} onChange={(e) => update('assetId', e.target.value)} placeholder="e.g. HSP-VNT-1001" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Category" required>
          <select className={cls('category')} value={form.category} onChange={(e) => update('category', e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Assigned Technician" error={errors.assignedTechnician} required>
          <input
            className={cls('assignedTechnician')}
            value={form.assignedTechnician}
            onChange={(e) => update('assignedTechnician', e.target.value)}
            list="tech-list"
            placeholder="Select or type a name"
          />
          <datalist id="tech-list">
            {technicians.map((t) => <option key={t} value={t} />)}
          </datalist>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Department" error={errors.department} required>
          <input
            className={cls('department')}
            value={form.department}
            onChange={(e) => update('department', e.target.value)}
            list="dept-list"
            placeholder="Select or type a department"
          />
          <datalist id="dept-list">
            {departments.map((d) => <option key={d} value={d} />)}
          </datalist>
        </Field>
        <Field label="Location" error={errors.location} required>
          <input className={cls('location')} value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. ICU Room 3" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Manufacturer" error={errors.manufacturer} required>
          <input className={cls('manufacturer')} value={form.manufacturer} onChange={(e) => update('manufacturer', e.target.value)} placeholder="e.g. Medtronic" />
        </Field>
        <Field label="Model" error={errors.model} required>
          <input className={cls('model')} value={form.model} onChange={(e) => update('model', e.target.value)} placeholder="e.g. PB980" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Purchase Date" error={errors.purchaseDate} required>
          <input type="date" className={cls('purchaseDate')} value={form.purchaseDate} onChange={(e) => update('purchaseDate', e.target.value)} />
        </Field>
        <Field label="Last Service Date">
          <input type="date" className={cls('lastServiceDate')} value={form.lastServiceDate ?? ''} onChange={(e) => update('lastServiceDate', e.target.value || null)} />
        </Field>
        <Field label="Next Maintenance Due" error={errors.nextMaintenanceDue} required>
          <input type="date" className={cls('nextMaintenanceDue')} value={form.nextMaintenanceDue} onChange={(e) => update('nextMaintenanceDue', e.target.value)} />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          className={`${cls('notes')} min-h-20 resize-y`}
          value={form.notes ?? ''}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Optional notes about this equipment…"
          rows={2}
        />
      </Field>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 mt-4">
        <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 active:scale-95 transition-all">
          Cancel
        </button>
        <button type="submit" className="rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:from-teal-500 hover:to-cyan-500 active:scale-95 transition-all shadow-sm shadow-teal-500/20">
          {initial ? 'Save Changes' : 'Add Equipment'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, required, children }: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
