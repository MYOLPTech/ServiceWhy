import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { Upload } from 'lucide-react';
import LinkedRecords from '../shared/LinkedRecords';

function generateNextId(records, field, prefix) {
  const nums = records.map(r => parseInt((r[field] || '').replace(prefix + '-', ''), 10)).filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

const categories = [
  { value: 'information_security', label: 'Information Security' },
  { value: 'access_control', label: 'Access Control' },
  { value: 'data_protection', label: 'Data Protection' },
  { value: 'incident_response', label: 'Incident Response' },
  { value: 'business_continuity', label: 'Business Continuity' },
  { value: 'change_management', label: 'Change Management' },
  { value: 'vendor_management', label: 'Vendor Management' },
  { value: 'acceptable_use', label: 'Acceptable Use' },
  { value: 'hr_security', label: 'HR Security' },
  { value: 'physical_security', label: 'Physical Security' },
  { value: 'risk_management', label: 'Risk Management' },
  { value: 'cryptography', label: 'Cryptography' },
  { value: 'operations_security', label: 'Operations Security' },
  { value: 'communications_security', label: 'Communications Security' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'other', label: 'Other' },
];

const frameworkOptions = ['SOC2', 'ASAE3150', 'ISO27001', 'ISO27017', 'ISO27018'];

const emptyPolicy = {
  policy_id: '', title: '', description: '', category: 'information_security', version: '1.0',
  status: 'draft', owner: '', approver: '', file_url: '', policy_content: '',
  frameworks: [], review_date: '', approved_date: '',
  linked_control_ids: [], linked_risk_ids: [], linked_task_ids: [], linked_evidence_ids: [], linked_cmdb_ids: [], linked_vendor_ids: [], linked_obligation_ids: [], linked_incident_ids: []
};

export default function PolicyFormDialog({ open, onOpenChange, policy, onSave, saving }) {
  const [form, setForm] = useState(emptyPolicy);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('details');

  useEffect(() => {
    if (!open) return;
    setTab('details');
    if (policy) {
      setForm({ ...emptyPolicy, ...policy, frameworks: policy.frameworks || [] });
    } else {
      base44.entities.Policy.list().then(records => {
        setForm({ ...emptyPolicy, policy_id: generateNextId(records, 'policy_id', 'POL'), frameworks: [] });
      });
    }
  }, [policy, open]);

  const { data: controls = [] } = useQuery({ queryKey: ['controls'], queryFn: () => base44.entities.Control.list() });
  const { data: risks = [] } = useQuery({ queryKey: ['risks'], queryFn: () => base44.entities.Risk.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list() });
  const { data: evidence = [] } = useQuery({ queryKey: ['evidence'], queryFn: () => base44.entities.Evidence.list() });
  const { data: cmdb = [] } = useQuery({ queryKey: ['cmdb'], queryFn: () => base44.entities.CmdbItem.list() });
  const { data: vendors = [] } = useQuery({ queryKey: ['vendors'], queryFn: () => base44.entities.Vendor.list() });
  const { data: obligations = [] } = useQuery({ queryKey: ['obligations'], queryFn: () => base44.entities.Obligation.list() });
  const { data: incidents = [] } = useQuery({ queryKey: ['incidents'], queryFn: () => base44.entities.Incident.list() });

  const toggleFramework = (fw) => {
    setForm(f => ({
      ...f,
      frameworks: f.frameworks.includes(fw) ? f.frameworks.filter(x => x !== fw) : [...f.frameworks, fw]
    }));
  };

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
    setForm(f => ({ ...f, file_url }));
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col fixed top-8 left-[50%] translate-x-[-50%] translate-y-0">
        <DialogHeader>
          <DialogTitle>{policy ? 'Edit Policy' : 'Add Policy'}</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-4">
          {['details', 'content', 'links'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'content' ? 'Policy Document' : t === 'links' ? 'Linked Records' : 'Details'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'details' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Policy ID</Label>
                  <Input value={form.policy_id || ''} readOnly className="bg-muted text-muted-foreground cursor-not-allowed font-mono text-sm" />
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
                      {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Owner</Label><Input value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} /></div>
                <div><Label>Approver</Label><Input value={form.approver} onChange={e => setForm({...form, approver: e.target.value})} /></div>
              </div>
              <div>
                <Label>Applicable Frameworks</Label>
                <div className="flex gap-4 mt-2">
                  {frameworkOptions.map(fw => (
                    <label key={fw} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={form.frameworks.includes(fw)} onCheckedChange={() => toggleFramework(fw)} />
                      {fw === 'SOC2' ? 'SOC 2' : fw === 'ASAE3150' ? 'ASAE 3150' : fw === 'ISO27001' ? 'ISO 27001' : fw === 'ISO27017' ? 'ISO 27017' : 'ISO 27018'}
                    </label>
                  ))}
                </div>
              </div>
              <div><Label>Version</Label><Input value={form.version} onChange={e => setForm({...form, version: e.target.value})} /></div>
              <div>
                <Label>Upload Document</Label>
                {form.file_url ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mt-1">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm truncate flex-1">Document uploaded</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setForm({...form, file_url: ''})}>Remove</Button>
                  </div>
                ) : (
                  <Input type="file" onChange={handleFile} disabled={uploading} className="mt-1" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Review Date</Label><Input type="date" value={form.review_date} onChange={e => setForm({...form, review_date: e.target.value})} /></div>
                <div><Label>Approved Date</Label><Input type="date" value={form.approved_date} onChange={e => setForm({...form, approved_date: e.target.value})} /></div>
              </div>
            </>
          )}

          {tab === 'content' && (
            <div>
              <Label>Policy Document (HTML)</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">Enter the full policy document in HTML format. Use &lt;h1&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;table&gt; tags for formatting.</p>
              <Textarea
                value={form.policy_content}
                onChange={e => setForm({...form, policy_content: e.target.value})}
                rows={20}
                className="font-mono text-xs"
                placeholder="<h1>Policy Title</h1>&#10;<h2>1. Purpose</h2>&#10;<p>This policy...</p>"
              />
            </div>
          )}

          {tab === 'links' && (
            <div className="space-y-6 overflow-y-auto pr-2">
              <LinkedRecords label="Controls" items={controls} selected={form.linked_control_ids || []} onToggle={id => toggleLink('linked_control_ids', id)}
                renderLabel={c => `${c.control_id ? c.control_id + ' – ' : ''}${c.title}`} renderSub={c => c.framework} />
              <LinkedRecords label="Risks" items={risks} selected={form.linked_risk_ids || []} onToggle={id => toggleLink('linked_risk_ids', id)}
                renderLabel={r => `${r.risk_id ? r.risk_id + ' – ' : ''}${r.title}`} renderSub={r => r.category} />
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
              <LinkedRecords label="Incidents" items={incidents} selected={form.linked_incident_ids || []} onToggle={id => toggleLink('linked_incident_ids', id)}
                renderLabel={i => `${i.incident_id ? i.incident_id + ' – ' : ''}${i.title}`} renderSub={i => i.severity} />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || uploading}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}