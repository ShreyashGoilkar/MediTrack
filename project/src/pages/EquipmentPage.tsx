import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import type { Equipment, EquipmentCategory, EquipmentStatus } from '@/lib/types';
import { StatusBadge } from '@/components/Badges';
import { Modal } from '@/components/Modal';
import { ConfirmDialog, EmptyState } from '@/components/ConfirmDialog';
import { EquipmentForm } from '@/components/EquipmentForm';
import { formatDate, daysUntil } from '@/lib/utils';
import {
  Plus, Search, Filter, Eye, Pencil, Trash2, HeartPulse,
  ArrowUpDown, X, Ban, RotateCcw, Wrench, AlertTriangle,
} from 'lucide-react';

type SortKey = 'name' | 'assetId' | 'department' | 'nextMaintenanceDue' | 'status';

export function EquipmentPage({ externalSearch, onReportFault }: { externalSearch: string; onReportFault: () => void }) {
  const { equipmentWithStatus, addEquipment, updateEquipment, deleteEquipment, setOutOfService, oosFlags, departments, maintenance, addMaintenance, technicians } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<EquipmentCategory | 'All'>('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'All'>('All');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  const [viewItem, setViewItem] = useState<Equipment | null>(null);
  const [editItem, setEditItem] = useState<Equipment | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null);
  const [scheduleFor, setScheduleFor] = useState<Equipment | null>(null);

  // Merge external search from top bar
  const effectiveSearch = (externalSearch || search).toLowerCase();

  const filtered = useMemo(() => {
    let list = equipmentWithStatus.filter((eq) => {
      if (categoryFilter !== 'All' && eq.category !== categoryFilter) return false;
      if (deptFilter !== 'All' && eq.department !== deptFilter) return false;
      if (statusFilter !== 'All' && eq.status !== statusFilter) return false;
      if (effectiveSearch) {
        const hay = `${eq.name} ${eq.assetId} ${eq.manufacturer} ${eq.model} ${eq.department} ${eq.location} ${eq.assignedTechnician}`.toLowerCase();
        if (!hay.includes(effectiveSearch)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'assetId') cmp = a.assetId.localeCompare(b.assetId);
      else if (sortKey === 'department') cmp = a.department.localeCompare(b.department);
      else if (sortKey === 'nextMaintenanceDue') cmp = a.nextMaintenanceDue.localeCompare(b.nextMaintenanceDue);
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [equipmentWithStatus, categoryFilter, deptFilter, statusFilter, effectiveSearch, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const hasActiveFilters = categoryFilter !== 'All' || deptFilter !== 'All' || statusFilter !== 'All';
  const clearFilters = () => {
    setCategoryFilter('All'); setDeptFilter('All'); setStatusFilter('All');
  };

  const categories: (EquipmentCategory | 'All')[] = ['All', 'Ventilator', 'Patient Monitor', 'Infusion Pump', 'ECG Machine', 'Defibrillator'];
  const statuses: (EquipmentStatus | 'All')[] = ['All', 'Operational', 'Due Soon', 'Overdue', 'Under Maintenance', 'Out of Service'];

  // Maintenance history for the view modal
  const viewItemHistory = useMemo(() => {
    if (!viewItem) return [];
    return maintenance
      .filter((m) => m.equipmentId === viewItem.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [viewItem, maintenance]);

  return (
    <div className="space-y-5">
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment…"
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] text-white">!</span>}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReportFault}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2 text-sm font-semibold text-white hover:from-rose-500 hover:to-red-500 active:scale-95 transition-all shadow-sm shadow-rose-500/20 whitespace-nowrap"
          >
            <AlertTriangle className="h-4 w-4" />
            Report Fault
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:from-teal-500 hover:to-cyan-500 active:scale-95 transition-all shadow-sm shadow-teal-500/20 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Add Equipment
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as EquipmentCategory | 'All')} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-400 focus:outline-none">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Department</label>
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-400 focus:outline-none">
                <option value="All">All Departments</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | 'All')} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-400 focus:outline-none">
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-3 flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700">
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {equipmentWithStatus.length} equipment
      </p>

      {/* Table (desktop) */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EmptyState
            icon={<HeartPulse className="h-7 w-7" />}
            title="No equipment found"
            message={hasActiveFilters || effectiveSearch ? "Try adjusting your search or filters." : "Add your first piece of equipment to get started."}
            action={!hasActiveFilters && !effectiveSearch ? (
              <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 active:scale-95 transition-all shadow-sm shadow-teal-500/20">
                <Plus className="h-4 w-4" /> Add Equipment
              </button>
            ) : undefined}
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <Th onClick={() => toggleSort('name')} active={sortKey === 'name'} dir={sortDir}>Equipment</Th>
                  <Th onClick={() => toggleSort('assetId')} active={sortKey === 'assetId'} dir={sortDir}>Asset ID</Th>
                  <Th onClick={() => toggleSort('department')} active={sortKey === 'department'} dir={sortDir}>Department</Th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Technician</th>
                  <Th onClick={() => toggleSort('nextMaintenanceDue')} active={sortKey === 'nextMaintenanceDue'} dir={sortDir}>Next Due</Th>
                  <Th onClick={() => toggleSort('status')} active={sortKey === 'status'} dir={sortDir}>Status</Th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((eq, i) => (
                  <tr key={eq.id} className="hover:bg-teal-50/30 transition-colors group animate-fade-up" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                    <td className="px-4 py-3">
                      <button onClick={() => setViewItem(eq)} className="text-left group/name">
                        <span className="font-medium text-slate-900 group-hover/name:text-teal-600 transition-colors">{eq.name}</span>
                        <span className="block text-xs text-slate-400">{eq.manufacturer} {eq.model}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{eq.assetId}</td>
                    <td className="px-4 py-3 text-slate-600">{eq.department}</td>
                    <td className="px-4 py-3 text-slate-600">{eq.assignedTechnician}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(eq.nextMaintenanceDue)}
                      <DueHint date={eq.nextMaintenanceDue} />
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={eq.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn title="View" onClick={() => setViewItem(eq)}><Eye className="h-4 w-4" /></IconBtn>
                        <IconBtn title="Edit" onClick={() => setEditItem(eq)}><Pencil className="h-4 w-4" /></IconBtn>
                        <IconBtn title="Schedule maintenance" onClick={() => setScheduleFor(eq)}><Wrench className="h-4 w-4" /></IconBtn>
                        <IconBtn title="Delete" danger onClick={() => setDeleteTarget(eq)}><Trash2 className="h-4 w-4" /></IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map((eq, i) => (
              <div key={eq.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow animate-fade-up" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{eq.name}</h3>
                    <p className="text-xs text-slate-400">{eq.manufacturer} {eq.model}</p>
                  </div>
                  <StatusBadge status={eq.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-400">Asset:</span> <span className="font-mono text-slate-600">{eq.assetId}</span></div>
                  <div><span className="text-slate-400">Dept:</span> <span className="text-slate-600">{eq.department}</span></div>
                  <div><span className="text-slate-400">Tech:</span> <span className="text-slate-600">{eq.assignedTechnician}</span></div>
                  <div><span className="text-slate-400">Next:</span> <span className="text-slate-600">{formatDate(eq.nextMaintenanceDue)}</span></div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => setViewItem(eq)} className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">View</button>
                  <button onClick={() => setEditItem(eq)} className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Edit</button>
                  <button onClick={() => setScheduleFor(eq)} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"><Wrench className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteTarget(eq)} className="rounded-lg border border-slate-200 p-1.5 text-rose-500 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Equipment" subtitle="Register a new biomedical asset" size="lg">
        <EquipmentForm
          onSubmit={(data) => { addEquipment(data); setAddOpen(false); }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Equipment" subtitle={editItem?.assetId} size="lg">
        {editItem && (
          <EquipmentForm
            initial={editItem}
            onSubmit={(data) => { updateEquipment(editItem.id, data); setEditItem(null); }}
            onCancel={() => setEditItem(null)}
          />
        )}
      </Modal>

      {/* View modal */}
      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.name ?? ''}
        subtitle={viewItem?.assetId}
        size="lg"
        footer={
          viewItem && (
            <>
              <button onClick={() => { const e = viewItem; setViewItem(null); setEditItem(e); }} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 active:scale-95 transition-all">
                Edit
              </button>
              <button onClick={() => setViewItem(null)} className="rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:from-teal-500 hover:to-cyan-500 active:scale-95 transition-all shadow-sm shadow-teal-500/20">
                Close
              </button>
            </>
          )
        }
      >
        {viewItem && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={equipmentWithStatus.find((e) => e.id === viewItem.id)?.status ?? 'Operational'} />
              <span className="text-sm text-slate-500">{viewItem.category}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <Detail label="Manufacturer" value={viewItem.manufacturer} />
              <Detail label="Model" value={viewItem.model} />
              <Detail label="Department" value={viewItem.department} />
              <Detail label="Location" value={viewItem.location} />
              <Detail label="Technician" value={viewItem.assignedTechnician} />
              <Detail label="Purchase Date" value={formatDate(viewItem.purchaseDate)} />
              <Detail label="Last Service" value={formatDate(viewItem.lastServiceDate)} />
              <Detail label="Next Due" value={formatDate(viewItem.nextMaintenanceDue)} />
            </div>
            {viewItem.notes && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 mb-1">Notes</h4>
                <p className="text-sm text-slate-600 rounded-lg bg-slate-50 p-3">{viewItem.notes}</p>
              </div>
            )}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 mb-2">Maintenance History</h4>
              {viewItemHistory.length === 0 ? (
                <p className="text-sm text-slate-400">No maintenance tasks recorded.</p>
              ) : (
                <div className="space-y-2">
                  {viewItemHistory.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">{m.title}</span>
                        <span className="ml-2 text-xs text-slate-400">{m.type} · {m.priority}</span>
                      </div>
                      <span className="text-xs text-slate-500">{formatDate(m.dueDate)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              {oosFlags.includes(viewItem.id) ? (
                <button onClick={() => setOutOfService(viewItem.id, false)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  <RotateCcw className="h-4 w-4" /> Return to service
                </button>
              ) : (
                <button onClick={() => setOutOfService(viewItem.id, true)} className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50">
                  <Ban className="h-4 w-4" /> Mark Out of Service
                </button>
              )}
              <button
                onClick={() => { const e = viewItem; setViewItem(null); setScheduleFor(e); }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Wrench className="h-4 w-4" /> Schedule maintenance
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Equipment"
        message={`Are you sure you want to delete "${deleteTarget?.name}" (${deleteTarget?.assetId})? All related maintenance tasks will also be removed.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => { if (deleteTarget) deleteEquipment(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Schedule maintenance quick modal */}
      <ScheduleMaintenanceModal
        equipment={scheduleFor}
        onClose={() => setScheduleFor(null)}
        onSubmit={(data) => { addMaintenance(data); setScheduleFor(null); }}
        technicians={technicians}
      />
    </div>
  );
}

function Th({ children, onClick, active, dir }: { children: React.ReactNode; onClick: () => void; active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <th className="px-4 py-3 text-left font-semibold text-slate-600">
      <button onClick={onClick} className={`flex items-center gap-1 hover:text-slate-900 transition-colors ${active ? 'text-teal-600' : ''}`}>
        {children}
        <ArrowUpDown className={`h-3 w-3 transition-transform duration-200 ${active ? 'opacity-100' : 'opacity-30'} ${active && dir === 'desc' ? 'rotate-180' : ''}`} />
      </button>
    </th>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-lg p-1.5 transition-all active:scale-90 ${danger ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-600' : 'text-slate-400 hover:bg-teal-50 hover:text-teal-600 opacity-0 group-hover:opacity-100'} ${!danger ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
    >
      {children}
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-700">{value}</dd>
    </div>
  );
}

function DueHint({ date }: { date: string }) {
  const days = daysUntil(date);
  if (days < 0) return <span className="block text-xs text-rose-600">{Math.abs(days)}d overdue</span>;
  if (days <= 14) return <span className="block text-xs text-amber-600">in {days}d</span>;
  return null;
}

// Quick schedule maintenance modal
function ScheduleMaintenanceModal({ equipment, onClose, onSubmit, technicians }: {
  equipment: Equipment | null;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; equipmentId: string; type: 'Preventive' | 'Corrective'; priority: 'Low' | 'Medium' | 'High' | 'Critical'; assignedTechnician: string; dueDate: string; status: 'Pending'; notes: string }) => void;
  technicians: string[];
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'Preventive' | 'Corrective'>('Preventive');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [tech, setTech] = useState(equipment?.assignedTechnician ?? '');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Reset when equipment changes
  useMemo(() => {
    if (equipment) {
      setTitle('');
      setDescription('');
      setType('Preventive');
      setPriority('Medium');
      setTech(equipment.assignedTechnician);
      setDueDate(equipment.nextMaintenanceDue);
      setNotes('');
      setError('');
    }
  }, [equipment]);

  if (!equipment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    if (!dueDate) { setError('Due date is required'); return; }
    if (!tech.trim()) { setError('Assigned technician is required'); return; }
    onSubmit({ title: title.trim(), description: description.trim(), equipmentId: equipment.id, type, priority, assignedTechnician: tech.trim(), dueDate, status: 'Pending', notes: notes.trim() });
  };

  return (
    <Modal open={!!equipment} onClose={onClose} title="Schedule Maintenance" subtitle={`${equipment.name} · ${equipment.assetId}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Task Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Quarterly preventive service"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/10" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/10" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as 'Preventive' | 'Corrective')} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none">
              <option value="Preventive">Preventive</option>
              <option value="Corrective">Corrective</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High' | 'Critical')} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none">
              <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Technician *</label>
            <input value={tech} onChange={(e) => setTech(e.target.value)} list="tech-list-2" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none" />
            <datalist id="tech-list-2">{technicians.map((t) => <option key={t} value={t} />)}</datalist>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Due Date *</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none" />
          </div>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
          <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 shadow-sm">Create Task</button>
        </div>
      </form>
    </Modal>
  );
}
