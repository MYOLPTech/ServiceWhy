import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

function generateNextId(records, field, prefix) {
  const nums = records.map(r => parseInt((r[field] || '').replace(prefix + '-', ''), 10)).filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DEFAULT = {
  asset_id: '', name: '', type: 'server', category: 'infrastructure', status: 'active',
  criticality: 'medium', environment: 'production', owner: '', location: '', vendor: '',
  version: '', ip_address: '', os: '', description: '', data_classification: 'internal',
  last_reviewed: '', decommission_date: '', notes: '',
  linked_control_ids: [], linked_risk_ids: [], linked_task_ids: [], linked_evidence_ids: [], linked_vendor_ids: [], linked_policy_ids: [], linked_obligation_ids: [], linked_incident_ids: []
};

export default function CmdbFormDialog({ open, onOpenChange, item, onSave, saving }) {
  const [form, setForm] = useState(DEFAULT);

  useEffect(() => {
    if (!open) return;
    if (item) {
      setForm({ ...DEFAULT, ...item });
    } else {
      base44.entities.CmdbItem.list().then(records => {
        setForm({ ...DEFAULT, asset_id: generateNextId(records, 'asset_id', 'ASSET') });
      });
    }
  }, [open, item]);

  const { data: controls = [] } = useQuery({ queryKey: ['controls'], queryFn: () => base44.entities.Control.list() });
  const { data: risks = [] } = useQuery({ queryKey: ['risks'], queryFn: () => base44.entities.Risk.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list() });
  const { data: evidence = [] } = useQuery({ queryKey: ['evidence'], queryFn: () => base44.entities.Evidence.list() });
  const { data: vendors = [] } = useQuery({ queryKey: ['vendors'], queryFn: () => base44.entities.Vendor.list() });
  const { data: policies = [] } = useQuery({ queryKey: ['policies'], queryFn: () => base44.entities.Policy.list() });
  const { data: obligations = [] } = useQuery({ queryKey: ['obligations'], queryFn: () => base44.entities.Obligation.list() });
  const { data: incidents = [] } = useQuery({ queryKey: ['incidents'], queryFn: () => base44.entities.Incident.list() });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleLink = (field, id) => {
    setForm(f => ({
      ...f,
      [field]: f[field]?.includes(id) ? f[field].filter(x => x !== id) : [...(f[field] || []), id]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col fixed top-8 left-[50%] translate-x-[-50%] translate-y-0">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit CMDB Item' : 'New CMDB Item'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Asset Details</TabsTrigger>
              <TabsTrigger value="links">Linked Records</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Asset ID</Label>
                  <Input value={form.asset_id} readOnly className="bg-muted text-muted-foreground cursor-not-allowed font-mono text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input placeholder="e.g. Production API Server" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => set('type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['server','workstation','network_device','cloud_service','application','database','storage','endpoint','saas_tool','virtual_machine','container','api','other'].map(t => (
                        <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => set('category', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['infrastructure','software','cloud','network','endpoint','data','other'].map(c => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Environment</Label>
                  <Select value={form.environment} onValueChange={v => set('environment', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['production','staging','development','dr','shared'].map(e => (
                        <SelectItem key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => set('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['active','inactive','decommissioned','under_review','pending_approval'].map(s => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Criticality</Label>
                  <Select value={form.criticality} onValueChange={v => set('criticality', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['critical','high','medium','low'].map(c => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Data Classification</Label>
                  <Select value={form.data_classification} onValueChange={v => set('data_classification', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['public','internal','confidential','restricted'].map(c => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Owner</Label>
                  <Input placeholder="Team or person" value={form.owner} onChange={e => set('owner', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input placeholder="AWS ap-southeast-2 / Office Rack A" value={form.location} onChange={e => set('location', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Vendor</Label>
                  <Input placeholder="e.g. AWS, Microsoft" value={form.vendor} onChange={e => set('vendor', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Version</Label>
                  <Input placeholder="e.g. 22.04 LTS" value={form.version} onChange={e => set('version', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>OS</Label>
                  <Input placeholder="e.g. Ubuntu 22.04" value={form.os} onChange={e => set('os', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>IP Address / Hostname</Label>
                  <Input placeholder="10.0.1.5 or api.example.com" value={form.ip_address} onChange={e => set('ip_address', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Reviewed</Label>
                  <Input type="date" value={form.last_reviewed} onChange={e => set('last_reviewed', e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={3} placeholder="Purpose and role of this asset..." value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} placeholder="Additional configuration notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
            </TabsContent>

            <TabsContent value="links" className="space-y-6">
              <LinkSection label="Controls" items={controls} selected={form.linked_control_ids} onToggle={id => toggleLink('linked_control_ids', id)}
                renderLabel={c => `${c.control_id ? c.control_id + ' – ' : ''}${c.title}`} renderSub={c => c.framework} />
              <LinkSection label="Risks" items={risks} selected={form.linked_risk_ids} onToggle={id => toggleLink('linked_risk_ids', id)}
                renderLabel={r => `${r.risk_id ? r.risk_id + ' – ' : ''}${r.title}`} renderSub={r => r.category} />
              <LinkSection label="Tasks" items={tasks} selected={form.linked_task_ids} onToggle={id => toggleLink('linked_task_ids', id)}
                renderLabel={t => `${t.task_id ? t.task_id + ' – ' : ''}${t.title}`} renderSub={t => t.status} />
              <LinkSection label="Evidence" items={evidence} selected={form.linked_evidence_ids} onToggle={id => toggleLink('linked_evidence_ids', id)}
                renderLabel={e => e.title} renderSub={e => e.status} />
              <LinkSection label="Vendors" items={vendors} selected={form.linked_vendor_ids} onToggle={id => toggleLink('linked_vendor_ids', id)}
                renderLabel={v => `${v.vendor_id ? v.vendor_id + ' – ' : ''}${v.name}`} renderSub={v => v.category?.replace(/_/g, ' ')} />
              <LinkSection label="Policies" items={policies} selected={form.linked_policy_ids || []} onToggle={id => toggleLink('linked_policy_ids', id)}
                renderLabel={p => `${p.policy_id ? p.policy_id + ' – ' : ''}${p.title}`} renderSub={p => p.status} />
              <LinkSection label="Obligations" items={obligations} selected={form.linked_obligation_ids || []} onToggle={id => toggleLink('linked_obligation_ids', id)}
                renderLabel={o => `${o.obligation_id ? o.obligation_id + ' – ' : ''}${o.title}`} renderSub={o => o.framework} />
              <LinkSection label="Incidents" items={incidents} selected={form.linked_incident_ids || []} onToggle={id => toggleLink('linked_incident_ids', id)}
                renderLabel={i => `${i.incident_id ? i.incident_id + ' – ' : ''}${i.title}`} renderSub={i => i.severity} />
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={saving || !form.name}>
            {saving ? 'Saving…' : item ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LinkSection({ label, items, selected, onToggle, renderLabel, renderSub }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">{label} <span className="text-muted-foreground font-normal">({selected.length} linked)</span></h4>
      <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
        {items.length === 0 && <p className="text-xs text-muted-foreground p-3">No {label.toLowerCase()} found</p>}
        {items.map(item => (
          <label key={item.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40 cursor-pointer">
            <Checkbox checked={selected.includes(item.id)} onCheckedChange={() => onToggle(item.id)} />
            <span className="flex-1 text-sm">{renderLabel(item)}</span>
            {renderSub && <span className="text-xs text-muted-foreground capitalize">{renderSub(item)?.replace(/_/g, ' ')}</span>}
          </label>
        ))}
      </div>
    </div>
  );
}