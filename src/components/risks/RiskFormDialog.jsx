import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import LinkedRecords from '../shared/LinkedRecords';

const emptyRisk = {
  risk_id: '', title: '', description: '', category: 'operational', likelihood: 3, impact: 3,
  risk_score: 9, treatment: 'mitigate', treatment_plan: '', status: 'open', owner: '',
  frameworks: ['SOC2', 'ASAE3150', 'ISO27001', 'ISO27017', 'ISO27018'],
  linked_control_ids: [], linked_policy_ids: [], linked_task_ids: [], linked_evidence_ids: [], linked_cmdb_ids: [], linked_vendor_ids: [], linked_obligation_ids: []
};

function generateNextId(records, field, prefix) {
  const nums = records.map(r => parseInt((r[field] || '').replace(prefix + '-', ''), 10)).filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

export default function RiskFormDialog({ open, onOpenChange, risk, onSave, saving }) {
  const [form, setForm] = useState(emptyRisk);
  const [tab, setTab] = useState('details');

  useEffect(() => {
    if (!open) return;
    setTab('details');
    if (risk) {
      setForm({ ...emptyRisk, ...risk });
    } else {
      base44.entities.Risk.list().then(records => {
        setForm({ ...emptyRisk, risk_id: generateNextId(records, 'risk_id', 'RSK') });
      });
    }
  }, [risk, open]);

  const { data: controls = [] } = useQuery({ queryKey: ['controls'], queryFn: () => base44.entities.Control.list() });
  const { data: policies = [] } = useQuery({ queryKey: ['policies'], queryFn: () => base44.entities.Policy.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list() });
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

  const updateScore = (field, val) => {
    const updated = { ...form, [field]: val };
    updated.risk_score = updated.likelihood * updated.impact;
    setForm(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, risk_score: form.likelihood * form.impact });
  };

  const scoreColor = form.risk_score >= 15 ? 'text-red-600' : form.risk_score >= 8 ? 'text-amber-600' : 'text-green-600';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col fixed top-8 left-[50%] translate-x-[-50%] translate-y-0">
        <DialogHeader>
          <DialogTitle>{risk ? 'Edit Risk' : 'Add Risk'}</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-4 w-fit">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="links">Linked Records</TabsTrigger>
          </TabsList>
        </Tabs>
        <form onSubmit={handleSubmit} className={tab === 'details' ? 'space-y-4' : 'hidden'}>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Risk ID</Label>
              <Input value={form.risk_id || ''} readOnly className="bg-muted text-muted-foreground cursor-not-allowed font-mono text-sm" />
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
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="organizational">Organizational</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="third_party">Third Party</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_treatment">In Treatment</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3 p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center justify-between">
              <Label>Likelihood: {form.likelihood}</Label>
              <Slider value={[form.likelihood]} onValueChange={([v]) => updateScore('likelihood', v)} min={1} max={5} step={1} className="w-40" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Impact: {form.impact}</Label>
              <Slider value={[form.impact]} onValueChange={([v]) => updateScore('impact', v)} min={1} max={5} step={1} className="w-40" />
            </div>
            <div className="text-center pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Risk Score: </span>
              <span className={`text-xl font-bold ${scoreColor}`}>{form.likelihood * form.impact}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Treatment</Label>
              <Select value={form.treatment} onValueChange={v => setForm({...form, treatment: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mitigate">Mitigate</SelectItem>
                  <SelectItem value="accept">Accept</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="avoid">Avoid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Owner</Label>
              <Input value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} />
            </div>
          </div>
          <div>
            <Label>Treatment Plan</Label>
            <Textarea value={form.treatment_plan} onChange={e => setForm({...form, treatment_plan: e.target.value})} rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Risk'}</Button>
          </div>
          </form>
          {tab === 'links' && (
          <div className="space-y-6 overflow-y-auto pr-2">
           <LinkedRecords label="Controls" items={controls} selected={form.linked_control_ids || []} onToggle={id => toggleLink('linked_control_ids', id)}
             renderLabel={c => `${c.control_id ? c.control_id + ' – ' : ''}${c.title}`} renderSub={c => c.framework} />
           <LinkedRecords label="Policies" items={policies} selected={form.linked_policy_ids || []} onToggle={id => toggleLink('linked_policy_ids', id)}
             renderLabel={p => `${p.policy_id ? p.policy_id + ' – ' : ''}${p.title}`} renderSub={p => p.status} />
           <LinkedRecords label="Tasks" items={tasks} selected={form.linked_task_ids || []} onToggle={id => toggleLink('linked_task_ids', id)}
             renderLabel={t => `${t.task_id ? t.task_id + ' – ' : ''}${t.title}`} renderSub={t => t.status} />
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
          <Button type="submit" form="risk-form" disabled={saving}>{saving ? 'Saving...' : 'Save Risk'}</Button>
          </div>
          </DialogContent>
          </Dialog>
          );
          }