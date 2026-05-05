import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { Upload } from 'lucide-react';
import LinkedRecords from '../shared/LinkedRecords';

const emptyEvidence = {
  evidence_id: '', title: '', description: '', control_id: '', framework: '', file_url: '', file_name: '',
  status: 'pending_review', review_notes: '', expiry_date: '',
  linked_control_ids: [], linked_risk_ids: [], linked_policy_ids: [], linked_task_ids: [], linked_cmdb_ids: [], linked_vendor_ids: [], linked_obligation_ids: [], linked_incident_ids: []
};

export default function EvidenceFormDialog({ open, onOpenChange, evidence, controls, onSave, saving }) {
  const [form, setForm] = useState(emptyEvidence);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (evidence) {
      setForm({ ...emptyEvidence, ...evidence });
    } else {
      base44.entities.Evidence.list().then(records => {
        const nums = records.map(r => parseInt((r.evidence_id || '').replace('EVD-', ''), 10)).filter(n => !isNaN(n));
        const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
        setForm({ ...emptyEvidence, evidence_id: `EVD-${String(next).padStart(3, '0')}` });
      });
    }
  }, [evidence, open]);

  const { data: allControls = [] } = useQuery({ queryKey: ['controls'], queryFn: () => base44.entities.Control.list() });
  const { data: risks = [] } = useQuery({ queryKey: ['risks'], queryFn: () => base44.entities.Risk.list() });
  const { data: policies = [] } = useQuery({ queryKey: ['policies'], queryFn: () => base44.entities.Policy.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list() });
  const { data: cmdb = [] } = useQuery({ queryKey: ['cmdb'], queryFn: () => base44.entities.CmdbItem.list() });
  const { data: vendors = [] } = useQuery({ queryKey: ['vendors'], queryFn: () => base44.entities.Vendor.list() });
  const { data: obligations = [] } = useQuery({ queryKey: ['obligations'], queryFn: () => base44.entities.Obligation.list() });
  const { data: incidents = [] } = useQuery({ queryKey: ['incidents'], queryFn: () => base44.entities.Incident.list() });

  const toggleLink = (field, id) => {
    setForm(f => ({
      ...f,
      [field]: f[field]?.includes(id) ? f[field].filter(x => x !== id) : [...(f[field] || []), id]
    }));
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url, file_name: file.name }));
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col fixed top-8 left-[50%] translate-x-[-50%] translate-y-0">
        <DialogHeader>
          <DialogTitle>{evidence ? 'Edit Evidence' : 'Upload Evidence'}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="details" className="flex-1 flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="links">Linked Records</TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-y-auto pr-2">
            <TabsContent value="details" className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Evidence ID</Label>
              <Input value={form.evidence_id || ''} readOnly className="bg-muted text-muted-foreground cursor-not-allowed font-mono text-sm" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
          </div>

          <div>
            <Label>Upload File</Label>
            <div className="mt-1">
              {form.file_url ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm truncate flex-1">{form.file_name || 'Uploaded file'}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm({...form, file_url: '', file_name: ''})}>Remove</Button>
                </div>
              ) : (
                <Input type="file" onChange={handleFile} disabled={uploading} />
              )}
              {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
            </div>
          </div>
          <div>
            <Label>Expiry Date</Label>
            <Input type="date" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} />
          </div>
          <div>
            <Label>Review Notes</Label>
            <Textarea value={form.review_notes} onChange={e => setForm({...form, review_notes: e.target.value})} rows={2} />
          </div>
          </form>
          </TabsContent>
          <TabsContent value="links" className="space-y-6">
            <LinkedRecords label="Controls" items={allControls} selected={form.linked_control_ids || []} onToggle={id => toggleLink('linked_control_ids', id)}
              renderLabel={c => `${c.control_id ? c.control_id + ' – ' : ''}${c.title}`} renderSub={c => c.framework} />
            <LinkedRecords label="Risks" items={risks} selected={form.linked_risk_ids || []} onToggle={id => toggleLink('linked_risk_ids', id)}
              renderLabel={r => `${r.risk_id ? r.risk_id + ' – ' : ''}${r.title}`} renderSub={r => r.category} />
            <LinkedRecords label="Policies" items={policies} selected={form.linked_policy_ids || []} onToggle={id => toggleLink('linked_policy_ids', id)}
              renderLabel={p => `${p.policy_id ? p.policy_id + ' – ' : ''}${p.title}`} renderSub={p => p.status} />
            <LinkedRecords label="Tasks" items={tasks} selected={form.linked_task_ids || []} onToggle={id => toggleLink('linked_task_ids', id)}
              renderLabel={t => `${t.task_id ? t.task_id + ' – ' : ''}${t.title}`} renderSub={t => t.status} />
            <LinkedRecords label="CMDB Items" items={cmdb} selected={form.linked_cmdb_ids || []} onToggle={id => toggleLink('linked_cmdb_ids', id)}
              renderLabel={c => `${c.asset_id ? c.asset_id + ' – ' : ''}${c.name}`} renderSub={c => c.type} />
            <LinkedRecords label="Vendors" items={vendors} selected={form.linked_vendor_ids || []} onToggle={id => toggleLink('linked_vendor_ids', id)}
              renderLabel={v => `${v.vendor_id ? v.vendor_id + ' – ' : ''}${v.name}`} renderSub={v => v.category} />
            <LinkedRecords label="Obligations" items={obligations} selected={form.linked_obligation_ids || []} onToggle={id => toggleLink('linked_obligation_ids', id)}
              renderLabel={o => `${o.obligation_id ? o.obligation_id + ' – ' : ''}${o.title}`} renderSub={o => o.framework} />
            <LinkedRecords label="Incidents" items={incidents} selected={form.linked_incident_ids || []} onToggle={id => toggleLink('linked_incident_ids', id)}
              renderLabel={i => `${i.incident_id ? i.incident_id + ' – ' : ''}${i.title}`} renderSub={i => i.severity} />
          </TabsContent>
          </div>
          </Tabs>
          <div className="flex justify-end gap-3 pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={saving || uploading} onClick={handleSubmit}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
          </DialogContent>
          </Dialog>
          );
          }