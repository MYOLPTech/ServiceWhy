import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import LinkedRecords from '../shared/LinkedRecords';

const emptyIncident = {
  incident_id: '', title: '', description: '',
  category: 'other', severity: 'medium', status: 'new', priority: 'p3', impact: 'medium',
  detection_source: 'monitoring_alert', detected_date: '', occurred_date: '', resolved_date: '',
  reported_by: '', owner: '', assigned_team: '',
  affected_systems: '', affected_users_count: '', data_affected: 'none',
  regulatory_notification_required: false, regulatory_notification_status: 'not_required',
  root_cause: '', remediation_actions: '', lessons_learned: '',
  frameworks: [],
  linked_control_ids: [], linked_risk_ids: [], linked_policy_ids: [], linked_task_ids: [],
  linked_evidence_ids: [], linked_cmdb_ids: [], linked_vendor_ids: [], linked_obligation_ids: []
};

const frameworkOptions = ['SOC2', 'ASAE3150', 'ISO27001', 'ISO27017', 'ISO27018'];

function generateNextId(records, field, prefix) {
  const nums = records.map(r => parseInt((r[field] || '').replace(prefix + '-', ''), 10)).filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

export default function IncidentFormDialog({ open, onOpenChange, incident, onSave, saving }) {
  const [form, setForm] = useState(emptyIncident);
  const [tab, setTab] = useState('details');

  useEffect(() => {
    if (!open) return;
    setTab('details');
    if (incident) {
      setForm({ ...emptyIncident, ...incident, frameworks: incident.frameworks || [] });
    } else {
      base44.entities.Incident.list().then(records => {
        setForm({ ...emptyIncident, incident_id: generateNextId(records, 'incident_id', 'INC'), detected_date: new Date().toISOString().slice(0, 16) });
      });
    }
  }, [incident, open]);

  const { data: controls = [] } = useQuery({ queryKey: ['controls'], queryFn: () => base44.entities.Control.list() });
  const { data: risks = [] } = useQuery({ queryKey: ['risks'], queryFn: () => base44.entities.Risk.list() });
  const { data: policies = [] } = useQuery({ queryKey: ['policies'], queryFn: () => base44.entities.Policy.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list() });
  const { data: evidence = [] } = useQuery({ queryKey: ['evidence'], queryFn: () => base44.entities.Evidence.list() });
  const { data: cmdb = [] } = useQuery({ queryKey: ['cmdb'], queryFn: () => base44.entities.CmdbItem.list() });
  const { data: vendors = [] } = useQuery({ queryKey: ['vendors'], queryFn: () => base44.entities.Vendor.list() });
  const { data: obligations = [] } = useQuery({ queryKey: ['obligations'], queryFn: () => base44.entities.Obligation.list() });

  const toggleFramework = (fw) => {
    setForm(f => ({ ...f, frameworks: f.frameworks.includes(fw) ? f.frameworks.filter(x => x !== fw) : [...f.frameworks, fw] }));
  };

  const toggleLink = (field, id) => {
    setForm(f => ({ ...f, [field]: f[field]?.includes(id) ? f[field].filter(x => x !== id) : [...(f[field] || []), id] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (payload.affected_users_count === '') delete payload.affected_users_count;
    else payload.affected_users_count = Number(payload.affected_users_count);
    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col fixed top-8 left-[50%] translate-x-[-50%] translate-y-0">
        <DialogHeader>
          <DialogTitle>{incident ? 'Edit Incident' : 'Report Incident'}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 border-b border-border mb-4">
          {['details', 'response', 'links'].map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {t === 'links' ? 'Linked Records' : t === 'response' ? 'Response & Analysis' : 'Details'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
          {tab === 'details' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Incident ID</Label>
                  <Input value={form.incident_id || ''} readOnly className="bg-muted text-muted-foreground cursor-not-allowed font-mono text-sm" />
                </div>
                <div className="col-span-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="security_breach">Security Breach</SelectItem>
                      <SelectItem value="data_loss">Data Loss</SelectItem>
                      <SelectItem value="service_outage">Service Outage</SelectItem>
                      <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                      <SelectItem value="malware">Malware</SelectItem>
                      <SelectItem value="phishing">Phishing</SelectItem>
                      <SelectItem value="insider_threat">Insider Threat</SelectItem>
                      <SelectItem value="ddos">DDoS</SelectItem>
                      <SelectItem value="configuration_error">Configuration Error</SelectItem>
                      <SelectItem value="third_party">Third Party</SelectItem>
                      <SelectItem value="physical_security">Physical Security</SelectItem>
                      <SelectItem value="compliance_violation">Compliance Violation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Severity *</Label>
                  <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="p1">P1 — Critical</SelectItem>
                      <SelectItem value="p2">P2 — High</SelectItem>
                      <SelectItem value="p3">P3 — Medium</SelectItem>
                      <SelectItem value="p4">P4 — Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Status *</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="contained">Contained</SelectItem>
                      <SelectItem value="remediated">Remediated</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Impact</Label>
                  <Select value={form.impact} onValueChange={v => setForm({ ...form, impact: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Detection Source</Label>
                  <Select value={form.detection_source} onValueChange={v => setForm({ ...form, detection_source: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monitoring_alert">Monitoring Alert</SelectItem>
                      <SelectItem value="user_report">User Report</SelectItem>
                      <SelectItem value="security_team">Security Team</SelectItem>
                      <SelectItem value="third_party">Third Party</SelectItem>
                      <SelectItem value="audit">Audit</SelectItem>
                      <SelectItem value="automated_scan">Automated Scan</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Detected Date</Label>
                  <Input type="datetime-local" value={form.detected_date?.slice(0, 16) || ''} onChange={e => setForm({ ...form, detected_date: e.target.value })} />
                </div>
                <div>
                  <Label>Occurred Date</Label>
                  <Input type="datetime-local" value={form.occurred_date?.slice(0, 16) || ''} onChange={e => setForm({ ...form, occurred_date: e.target.value })} />
                </div>
                <div>
                  <Label>Resolved Date</Label>
                  <Input type="datetime-local" value={form.resolved_date?.slice(0, 16) || ''} onChange={e => setForm({ ...form, resolved_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Reported By</Label>
                  <Input value={form.reported_by} onChange={e => setForm({ ...form, reported_by: e.target.value })} />
                </div>
                <div>
                  <Label>Owner</Label>
                  <Input value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
                </div>
                <div>
                  <Label>Assigned Team</Label>
                  <Input value={form.assigned_team} onChange={e => setForm({ ...form, assigned_team: e.target.value })} placeholder="e.g. SOC, IT Ops" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label>Affected Systems</Label>
                  <Input value={form.affected_systems} onChange={e => setForm({ ...form, affected_systems: e.target.value })} placeholder="e.g. Production API, Customer DB" />
                </div>
                <div>
                  <Label>Affected Users (count)</Label>
                  <Input type="number" min="0" value={form.affected_users_count} onChange={e => setForm({ ...form, affected_users_count: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data Affected</Label>
                  <Select value={form.data_affected} onValueChange={v => setForm({ ...form, data_affected: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="confidential">Confidential</SelectItem>
                      <SelectItem value="restricted">Restricted</SelectItem>
                      <SelectItem value="personal_data">Personal Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Regulatory Notification</Label>
                  <Select value={form.regulatory_notification_status} onValueChange={v => setForm({ ...form, regulatory_notification_status: v, regulatory_notification_required: v !== 'not_required' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_required">Not Required</SelectItem>
                      <SelectItem value="pending">Required — Pending</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Applicable Frameworks</Label>
                <div className="flex gap-4 mt-2 flex-wrap">
                  {frameworkOptions.map(fw => (
                    <label key={fw} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={form.frameworks.includes(fw)} onCheckedChange={() => toggleFramework(fw)} />
                      {fw === 'SOC2' ? 'SOC 2' : fw === 'ASAE3150' ? 'ASAE 3150' : fw === 'ISO27001' ? 'ISO 27001' : fw === 'ISO27017' ? 'ISO 27017' : 'ISO 27018'}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'response' && (
            <>
              <div>
                <Label>Root Cause</Label>
                <Textarea value={form.root_cause} onChange={e => setForm({ ...form, root_cause: e.target.value })} rows={4} placeholder="Root cause analysis findings" />
              </div>
              <div>
                <Label>Remediation Actions</Label>
                <Textarea value={form.remediation_actions} onChange={e => setForm({ ...form, remediation_actions: e.target.value })} rows={4} placeholder="Actions taken to contain and remediate" />
              </div>
              <div>
                <Label>Lessons Learned</Label>
                <Textarea value={form.lessons_learned} onChange={e => setForm({ ...form, lessons_learned: e.target.value })} rows={4} placeholder="Key takeaways and improvements" />
              </div>
            </>
          )}

          {tab === 'links' && (
            <div className="space-y-6">
              <LinkedRecords label="Risks" items={risks} selected={form.linked_risk_ids || []} onToggle={id => toggleLink('linked_risk_ids', id)}
                renderLabel={r => `${r.risk_id ? r.risk_id + ' – ' : ''}${r.title}`} renderSub={r => r.category} />
              <LinkedRecords label="Controls" items={controls} selected={form.linked_control_ids || []} onToggle={id => toggleLink('linked_control_ids', id)}
                renderLabel={c => `${c.control_id ? c.control_id + ' – ' : ''}${c.title}`} renderSub={c => c.framework} />
              <LinkedRecords label="Policies" items={policies} selected={form.linked_policy_ids || []} onToggle={id => toggleLink('linked_policy_ids', id)}
                renderLabel={p => `${p.policy_id ? p.policy_id + ' – ' : ''}${p.title}`} renderSub={p => p.status} />
              <LinkedRecords label="Obligations" items={obligations} selected={form.linked_obligation_ids || []} onToggle={id => toggleLink('linked_obligation_ids', id)}
                renderLabel={o => `${o.obligation_id ? o.obligation_id + ' – ' : ''}${o.title}`} renderSub={o => o.framework} />
              <LinkedRecords label="Tasks" items={tasks} selected={form.linked_task_ids || []} onToggle={id => toggleLink('linked_task_ids', id)}
                renderLabel={t => `${t.task_id ? t.task_id + ' – ' : ''}${t.title}`} renderSub={t => t.status} />
              <LinkedRecords label="Vendors" items={vendors} selected={form.linked_vendor_ids || []} onToggle={id => toggleLink('linked_vendor_ids', id)}
                renderLabel={v => `${v.vendor_id ? v.vendor_id + ' – ' : ''}${v.name}`} renderSub={v => v.category} />
              <LinkedRecords label="Evidence" items={evidence} selected={form.linked_evidence_ids || []} onToggle={id => toggleLink('linked_evidence_ids', id)}
                renderLabel={e => e.title} renderSub={e => e.status} />
              <LinkedRecords label="CMDB Items" items={cmdb} selected={form.linked_cmdb_ids || []} onToggle={id => toggleLink('linked_cmdb_ids', id)}
                renderLabel={c => `${c.asset_id ? c.asset_id + ' – ' : ''}${c.name}`} renderSub={c => c.type} />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Incident'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}