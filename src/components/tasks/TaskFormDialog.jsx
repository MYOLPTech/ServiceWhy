import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import LinkedRecords from '../shared/LinkedRecords';

const emptyTask = {
  task_id: '', title: '', description: '', type: 'implementation', status: 'todo',
  priority: 'medium', assignee: '', framework: 'All', linked_control_id: '', due_date: '',
  linked_control_ids: [], linked_risk_ids: [], linked_policy_ids: [], linked_evidence_ids: [], linked_cmdb_ids: [], linked_vendor_ids: [], linked_obligation_ids: []
};

function generateNextId(records, field, prefix) {
  const nums = records.map(r => parseInt((r[field] || '').replace(prefix + '-', ''), 10)).filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

export default function TaskFormDialog({ open, onOpenChange, task, controls, onSave, saving }) {
  const [form, setForm] = useState(emptyTask);
  const [tab, setTab] = useState('details');

  useEffect(() => {
    if (!open) return;
    setTab('details');
    if (task) {
      setForm({ ...emptyTask, ...task });
    } else {
      base44.entities.Task.list().then(records => {
        setForm({ ...emptyTask, task_id: generateNextId(records, 'task_id', 'TSK') });
      });
    }
  }, [task, open]);

  const { data: allControls = [] } = useQuery({ queryKey: ['controls'], queryFn: () => base44.entities.Control.list() });
  const { data: risks = [] } = useQuery({ queryKey: ['risks'], queryFn: () => base44.entities.Risk.list() });
  const { data: policies = [] } = useQuery({ queryKey: ['policies'], queryFn: () => base44.entities.Policy.list() });
  const { data: evidence = [] } = useQuery({ queryKey: ['evidence'], queryFn: () => base44.entities.Evidence.list() });
  const { data: cmdb = [] } = useQuery({ queryKey: ['cmdb'], queryFn: () => base44.entities.CmdbItem.list() });
  const { data: vendors = [] } = useQuery({ queryKey: ['vendors'], queryFn: () => base44.entities.Vendor.list() });
  const { data: obligations = [] } = useQuery({ queryKey: ['obligations'], queryFn: () => base44.entities.Obligation.list() });

  const toggleLink = (field, id) => {
    setForm(f => ({
      ...f,
      [field]: f[field]?.includes(id) ? f[field].filter(x => x !== id) : [...(f[field] || []), id]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col fixed top-8 left-[50%] translate-x-[-50%] translate-y-0">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Add Task'}</DialogTitle>
        </DialogHeader>
        <TabsList className="mb-4 w-fit">
          <TabsTrigger value="details" onClick={() => setTab('details')}>Details</TabsTrigger>
          <TabsTrigger value="links" onClick={() => setTab('links')}>Linked Records</TabsTrigger>
        </TabsList>
        <form onSubmit={handleSubmit} className={tab === 'details' ? 'space-y-4' : 'hidden'}>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Task ID</Label>
              <Input value={form.task_id || ''} readOnly className="bg-muted text-muted-foreground cursor-not-allowed font-mono text-sm" />
            </div>
            <div className="col-span-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remediation">Remediation</SelectItem>
                  <SelectItem value="implementation">Implementation</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="audit_prep">Audit Prep</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm({...form, priority: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Framework</Label>
              <Select value={form.framework} onValueChange={v => setForm({...form, framework: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="SOC2">SOC 2</SelectItem>
                  <SelectItem value="ASAE3150">ASAE 3150</SelectItem>
                  <SelectItem value="ISO27001">ISO 27001</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assignee</Label>
              <Input value={form.assignee} onChange={e => setForm({...form, assignee: e.target.value})} />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Task'}</Button>
          </div>
          </form>
          {tab === 'links' && (
          <div className="space-y-6 overflow-y-auto pr-2">
           <LinkedRecords label="Controls" items={allControls} selected={form.linked_control_ids || []} onToggle={id => toggleLink('linked_control_ids', id)}
             renderLabel={c => `${c.control_id ? c.control_id + ' – ' : ''}${c.title}`} renderSub={c => c.framework} />
           <LinkedRecords label="Risks" items={risks} selected={form.linked_risk_ids || []} onToggle={id => toggleLink('linked_risk_ids', id)}
             renderLabel={r => `${r.risk_id ? r.risk_id + ' – ' : ''}${r.title}`} renderSub={r => r.category} />
           <LinkedRecords label="Policies" items={policies} selected={form.linked_policy_ids || []} onToggle={id => toggleLink('linked_policy_ids', id)}
             renderLabel={p => `${p.policy_id ? p.policy_id + ' – ' : ''}${p.title}`} renderSub={p => p.status} />
           <LinkedRecords label="Evidence" items={evidence} selected={form.linked_evidence_ids || []} onToggle={id => toggleLink('linked_evidence_ids', id)}
             renderLabel={e => e.title} renderSub={e => e.status} />
           <LinkedRecords label="CMDB Items" items={cmdb} selected={form.linked_cmdb_ids || []} onToggle={id => toggleLink('linked_cmdb_ids', id)}
             renderLabel={c => `${c.asset_id ? c.asset_id + ' – ' : ''}${c.name}`} renderSub={c => c.type} />
           <LinkedRecords label="Vendors" items={vendors} selected={form.linked_vendor_ids || []} onToggle={id => toggleLink('linked_vendor_ids', id)}
             renderLabel={v => `${v.vendor_id ? v.vendor_id + ' – ' : ''}${v.name}`} renderSub={v => v.category} />
           <LinkedRecords label="Obligations" items={obligations} selected={form.linked_obligation_ids || []} onToggle={id => toggleLink('linked_obligation_ids', id)}
             renderLabel={o => `${o.obligation_id ? o.obligation_id + ' – ' : ''}${o.title}`} renderSub={o => o.framework} />
          </div>
          )}
          <div className="flex justify-end gap-3 pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="task-form" disabled={saving}>{saving ? 'Saving...' : 'Save Task'}</Button>
          </div>
          </DialogContent>
          </Dialog>
          );
          }