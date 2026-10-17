import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import type { MaintenanceTask, MaintenanceType, MaintenancePriority, MaintenanceStatus } from '@/lib/types';
import { MaintenanceStatusBadge, PriorityBadge } from '@/components/Badges';
import { Modal } from '@/components/Modal';
import { ConfirmDialog, EmptyState } from '@/components/ConfirmDialog';
import { formatDate, daysUntil, todayISO } from '@/lib/utils';
import {
  Plus, Search, Filter, Wrench, Eye, Pencil, Trash2,
  CheckCircle2, XCircle, Clock, AlertTriangle, X, ArrowUpDown,
} from 'lucide-react';

type SortKey = 'dueDate' | 'priority' | 'status' | 'title';
type Tab = 'all' | 'active' | 'completed';

export function MaintenancePage({ externalSearch }: { externalSearch: string }) {
  const { maintenance, equipment, addMaintenance, updateMaintenance, completeMaintenance, cancelMaintenance, deleteMaintenance, technicians, departments } = useApp();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<MaintenanceType | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<MaintenancePriority | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'All'>('All');
  const [tab, setTab] = useState<Tab>('active');
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<MaintenanceTask | null>(null);
  const [viewItem, setViewItem] = useState<MaintenanceTask | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceTask | null>(null);
  const [completeTarget, setCompleteTarget] = useState<MaintenanceTask | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');

  const eqMap = useMemo(() => new Map(equipment.map((e) => [e.id, e])), [equipment]);
  const effectiveSearch = (externalSearch || search).toLowerCase();

  const priorityRank: Record<MaintenancePriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const statusRank: Record<MaintenanceStatus, number> = { 'In Progress': 0, Pending: 1, Completed: 2, Cancelled: 3 };

  const filtered = useMemo(() => {
    let list = maintenance.filter((m) => {
      if (tab === 'active' && (m.status === 'Completed' || m.status === 'Cancelled')) return false;
      if (tab === 'completed' && m.status !== 'Completed' && m.status !== 'Cancelled') return false;
      if (typeFilter !== 'All' && m.type !== typeFilter) return false;
      if (priorityFilter !== 'All' && m.priority !== priorityFilter) return false;
      if (statusFilter !== 'All' && m.status !== statusFilter) return false;
      if (effectiveSearch) {
        const eq = eqMap.get(m.equipmentId);
        const hay = `${m.title} ${m.description} ${m.assignedTechnician} ${eq?.name ?? ''} ${eq?.assetId ?? ''}`.toLowerCase();
        if (!hay.includes(effectiveSearch)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'dueDate') cmp = a.dueDate.localeCompare(b.dueDate);
      else if (sortKey === 'priority') cmp = priorityRank[a.priority] - priorityRank[b.priority];
      else if (sortKey === 'status') cmp = statusRank[a.status] - statusRank[b.status];
      else if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [maintenance, tab, typeFilter, priorityFilter, statusFilter, effectiveSearch, sortKey, sortDir, eqMap]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const hasActiveFilters = typeFilter !== 'All' || priorityFilter !== 'All' || statusFilter !== 'All';
  const clearFilters = () => { setTypeFilter('All'); setPriorityFilter('All'); setStatusFilter('All'); };

  const counts = useMemo(() => ({
    all: maintenance.length,
    active: maintenance.filter((m) => m.status !== 'Completed' && m.status !== 'Cancelled').length,
    completed: maintenance.filter((m) => m.status === 'Completed' || m.status === 'Cancelled').length,
  }), [maintenance]);

  const handleComplete = () => {
    if (completeTarget) {
      completeMaintenance(completeTarget.id, completeNotes);
      setCompleteTarget(null);
      setCompleteNotes('');
    }
  };

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <TabBtn active={tab === 'active'} onClick={() => setTab('active')} count={counts.active}>Active</TabBtn>
        <TabBtn active={tab === 'completed'} onClick={() => setTab('completed')} count={counts.completed}>Completed</TabBtn>
        <TabBtn active={tab === 'all'} onClick={() => setTab('all')} count={counts.all}>All</TabBtn>
      </div>

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…"
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/10" />
          </div>
          <button onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${showFilters || hasActiveFilters ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            <Filter className="h-4 w-4" /><span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] text-white">!</span>}
          </button>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors shadow-sm whitespace-nowrap">
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as MaintenanceType | 'All')} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-400 focus:outline-none">
                <option value="All">All Types</option><option value="Preventive">Preventive</option><option value="Corrective">Corrective</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as MaintenancePriority | 'All')} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-400 focus:outline-none">
                <option value="All">All Priorities</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as MaintenanceStatus | 'All')} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-400 focus:outline-none">
                <option value="All">All Statuses</option><option>Pending</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
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

      <p className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-700">{filtered.length}</span> task(s)</p>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState icon={<Wrench className="h-7 w-7" />} title="No maintenance tasks" message={hasActiveFilters || effectiveSearch ? "Try adjusting your search or filters." : "Create a maintenance task to get started."}
            action={!hasActiveFilters && !effectiveSearch ? <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"><Plus className="h-4 w-4" /> New Task</button> : undefined} />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const eq = eqMap.get(m.equipmentId);
            const days = daysUntil(m.dueDate);
            const isOverdue = days < 0 && m.status !== 'Completed' && m.status !== 'Cancelled';
            const isHighPriority = m.priority === 'High' || m.priority === 'Critical';
            const isActive = m.status === 'Pending' || m.status === 'In Progress';

            return (
              <div key={m.id} className={`rounded-xl border bg-white p-4 transition-shadow hover:shadow-md ${isOverdue ? 'border-rose-200' : isHighPriority && isActive ? 'border-orange-200' : 'border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${m.type === 'Corrective' ? 'bg-orange-50 text-orange-600' : 'bg-teal-50 text-teal-600'}`}>
                    {m.type === 'Corrective' ? <Wrench className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{m.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {eq ? `${eq.name} · ${eq.assetId}` : 'Equipment removed'} · {m.assignedTechnician}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <PriorityBadge priority={m.priority} />
                        <MaintenanceStatusBadge status={m.status} />
                      </div>
                    </div>
                    {m.description && <p className="mt-2 text-sm text-slate-600 line-clamp-2">{m.description}</p>}
                    <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Due: <span className={`font-medium ${isOverdue ? 'text-rose-600' : ''}`}>{formatDate(m.dueDate)}</span></span>
                        {isOverdue && <span className="flex items-center gap-1 text-rose-600 font-medium"><AlertTriangle className="h-3 w-3" /> {Math.abs(days)}d overdue</span>}
                        {m.status === 'Completed' && m.completedDate && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> {formatDate(m.completedDate)}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <IconBtn title="View" onClick={() => setViewItem(m)}><Eye className="h-4 w-4" /></IconBtn>
                        {isActive && <IconBtn title="Edit" onClick={() => setEditItem(m)}><Pencil className="h-4 w-4" /></IconBtn>}
                        {isActive && <IconBtn title="Complete" onClick={() => { setCompleteTarget(m); setCompleteNotes(m.notes); }}><CheckCircle2 className="h-4 w-4" /></IconBtn>}
                        {isActive && <IconBtn title="Cancel" onClick={() => cancelMaintenance(m.id)}><XCircle className="h-4 w-4" /></IconBtn>}
                        <IconBtn title="Delete" danger onClick={() => setDeleteTarget(m)}><Trash2 className="h-4 w-4" /></IconBtn>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Maintenance Task" subtitle="Schedule preventive or corrective maintenance" size="lg">
        <MaintenanceForm
          equipment={equipment} technicians={technicians} departments={departments}
          onSubmit={(data) => { addMaintenance(data); setAddOpen(false); }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Maintenance Task" subtitle={editItem?.title} size="lg">
        {editItem && (
          <MaintenanceForm
            initial={editItem} equipment={equipment} technicians={technicians} departments={departments}
            onSubmit={(data) => { updateMaintenance(editItem.id, data); setEditItem(null); }}
            onCancel={() => setEditItem(null)}
          />
        )}
      </Modal>

      {/* View modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={viewItem?.title ?? ''} subtitle={viewItem ? `${viewItem.type} · ${viewItem.priority} priority` : ''} size="md"
        footer={viewItem && (viewItem.status === 'Pending' || viewItem.status === 'In Progress') ? (
          <>
            <button onClick={() => { const t = viewItem; setViewItem(null); setCompleteTarget(t); setCompleteNotes(t.notes); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Complete</button>
            <button onClick={() => setViewItem(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Close</button>
          </>
        ) : <button onClick={() => setViewItem(null)} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Close</button>}
      >
        {viewItem && <MaintenanceDetail task={viewItem} equipment={equipment} />}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog open={!!deleteTarget} title="Delete Task" message={`Delete "${deleteTarget?.title}"? This cannot be undone.`} confirmLabel="Delete" danger
        onConfirm={() => { if (deleteTarget) deleteMaintenance(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)} />

      {/* Complete modal */}
      <Modal open={!!completeTarget} onClose={() => setCompleteTarget(null)} title="Complete Maintenance Task" subtitle={completeTarget?.title} size="sm"
        footer={
          <>
            <button onClick={() => setCompleteTarget(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
            <button onClick={handleComplete} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Mark Complete</button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Completing this task will update the equipment's last service date and automatically calculate the next maintenance due date.</p>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Completion Notes</label>
            <textarea value={completeNotes} onChange={(e) => setCompleteNotes(e.target.value)} rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
              placeholder="What was done? Any findings?" />
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---- Maintenance form ----
interface FormProps {
  initial?: MaintenanceTask;
  equipment: { id: string; name: string; assetId: string }[];
  technicians: string[];
  departments: string[];
  onSubmit: (data: Omit<MaintenanceTask, 'id' | 'createdAt' | 'completedDate'>) => void;
  onCancel: () => void;
}

function MaintenanceForm({ initial, equipment, technicians, onSubmit, onCancel }: FormProps) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    equipmentId: initial?.equipmentId ?? equipment[0]?.id ?? '',
    type: initial?.type ?? 'Preventive' as MaintenanceType,
    priority: initial?.priority ?? 'Medium' as MaintenancePriority,
    assignedTechnician: initial?.assignedTechnician ?? '',
    dueDate: initial?.dueDate ?? todayISO(),
    status: initial?.status ?? 'Pending' as MaintenanceStatus,
    notes: initial?.notes ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string, value: string) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: '' })); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.equipmentId) errs.equipmentId = 'Equipment is required';
    if (!form.assignedTechnician.trim()) errs.assignedTechnician = 'Technician is required';
    if (!form.dueDate) errs.dueDate = 'Due date is required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({ ...form, title: form.title.trim(), description: form.description.trim(), assignedTechnician: form.assignedTechnician.trim(), notes: form.notes.trim() });
  };

  const inputClass = (field: string) => `w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 transition ${errors[field] ? 'border-rose-300 focus:ring-rose-500/10' : 'border-slate-200 focus:border-teal-400 focus:ring-teal-500/10'}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Task Title *</label>
        <input className={inputClass('title')} value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Quarterly preventive service" />
        {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
        <textarea className={inputClass('description')} value={form.description} onChange={(e) => update('description', e.target.value)} rows={2} placeholder="What needs to be done?" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Equipment *</label>
          <select className={inputClass('equipmentId')} value={form.equipmentId} onChange={(e) => update('equipmentId', e.target.value)}>
            {equipment.length === 0 && <option value="">No equipment available</option>}
            {equipment.map((eq) => <option key={eq.id} value={eq.id}>{eq.name} — {eq.assetId}</option>)}
          </select>
          {errors.equipmentId && <p className="mt-1 text-xs text-rose-600">{errors.equipmentId}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Assigned Technician *</label>
          <input className={inputClass('assignedTechnician')} value={form.assignedTechnician} onChange={(e) => update('assignedTechnician', e.target.value)} list="mt-tech-list" placeholder="Select or type" />
          <datalist id="mt-tech-list">{technicians.map((t) => <option key={t} value={t} />)}</datalist>
          {errors.assignedTechnician && <p className="mt-1 text-xs text-rose-600">{errors.assignedTechnician}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type</label>
          <select className={inputClass('type')} value={form.type} onChange={(e) => update('type', e.target.value)}>
            <option value="Preventive">Preventive</option><option value="Corrective">Corrective</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
          <select className={inputClass('priority')} value={form.priority} onChange={(e) => update('priority', e.target.value)}>
            <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
          <select className={inputClass('status')} value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option>Pending</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Due Date *</label>
        <input type="date" className={inputClass('dueDate')} value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} />
        {errors.dueDate && <p className="mt-1 text-xs text-rose-600">{errors.dueDate}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes</label>
        <textarea className={inputClass('notes')} value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} placeholder="Additional notes…" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
        <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 shadow-sm">{initial ? 'Save Changes' : 'Create Task'}</button>
      </div>
    </form>
  );
}

function MaintenanceDetail({ task, equipment }: { task: MaintenanceTask; equipment: { id: string; name: string; assetId: string }[] }) {
  const eq = equipment.find((e) => e.id === task.equipmentId);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <PriorityBadge priority={task.priority} />
        <MaintenanceStatusBadge status={task.status} />
        <span className="text-sm text-slate-500">{task.type}</span>
      </div>
      {task.description && <p className="text-sm text-slate-600">{task.description}</p>}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <Detail label="Equipment" value={eq ? `${eq.name} (${eq.assetId})` : 'Removed'} />
        <Detail label="Technician" value={task.assignedTechnician} />
        <Detail label="Due Date" value={formatDate(task.dueDate)} />
        <Detail label="Completed" value={task.completedDate ? formatDate(task.completedDate) : '—'} />
      </div>
      {task.notes && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 mb-1">Notes</h4>
          <p className="text-sm text-slate-600 rounded-lg bg-slate-50 p-3">{task.notes}</p>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, count, children }: { active: boolean; onClick: () => void; count: number; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${active ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
      {children}
      <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${active ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
    </button>
  );
}

function Th({ children, onClick, active, dir }: { children: React.ReactNode; onClick: () => void; active: boolean; dir: 'asc' | 'desc' }) {
  return null; // unused — keeping for consistency
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title}
      className={`rounded-lg p-1.5 transition-colors ${danger ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
      {children}
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-slate-400">{label}</dt><dd className="mt-0.5 font-medium text-slate-700">{value}</dd></div>;
}
