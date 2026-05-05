import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

function generateNextId(records) {
  const nums = records.map(r => parseInt((r.vendor_id || '').replace('VND-', ''), 10)).filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `VND-${String(next).padStart(3, '0')}`;
}

const DEFAULT = {
  vendor_id: '', name: '', description: '', category: 'software', status: 'active',
  criticality: 'medium', risk_level: 'medium', risk_score: 50, risk_assessment: '', mitigation_strategy: '',
  primary_contact: '', contact_email: '', contact_phone: '', website: '',
  data_access_level: 'public_only', contract_status: 'draft', contract_start_date: '', contract_end_date: '',
  sla_coverage: '', due_diligence_status: 'pending', due_diligence_date: '', last_audit_date: '', next_audit_date: '',
  certifications: [], applicable_frameworks: [], compliance_status: 'under_review', owner: '', notes: '',
  linked_control_ids: [], linked_risk_ids: [], linked_task_ids: []
};

export default function VendorFormDialog({ open, onOpenChange, vendor, onSave, saving }) {
  const [form, setForm] = useState(DEFAULT);
  const [tab, setTab] = useState('details');

  useEffect(() => {
    if (!open) return;
    setTab('details');
    if (vendor) {
      setForm({ ...DEFAULT, ...vendor, certifications: vendor.certifications || [], applicable_frameworks: vendor.applicable_frameworks || [] });
    } else {
      base44.entities.Vendor.list().then(records => {
        setForm({ ...DEFAULT, vendor_id: generateNextId(records), certifications: [], applicable_frameworks: [] });
      });
    }
  }, [vendor, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addCertification = () => {
    setForm(f => ({
      ...f,
      certifications: [...(f.certifications || []), { name: 'SOC2 Type II', status: 'required', issue_date: '', expiry_date: '', certificate_url: '' }]
    }));
  };

  const updateCert = (idx, k, v) => {
    const updated = [...form.certifications];
    updated[idx] = { ...updated[idx], [k]: v };
    setForm(f => ({ ...f, certifications: updated }));
  };

  const removeCert = (idx) => {
    setForm(f => ({ ...f, certifications: f.certifications.filter((_, i) => i !== idx) }));
  };

  const toggleFramework = (fw) => {
    setForm(f => ({
      ...f,
      applicable_frameworks: f.applicable_frameworks.includes(fw) ? f.applicable_frameworks.filter(x => x !== fw) : [...f.applicable_frameworks, fw]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{vendor ? 'Edit Vendor' : 'New Vendor'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="details">Vendor Details</TabsTrigger>
              <TabsTrigger value="risk">Risk & Compliance</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="contracts">Contract & SLA</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Vendor ID</Label>
                  <Input value={form.vendor_id} readOnly className="bg-muted text-muted-foreground cursor-not-allowed font-mono text-sm" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Name *</Label>
                  <Input placeholder="e.g. Acme Cloud Services" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={2} placeholder="Description of services provided..." value={form.description} onChange={e => set('description', e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => set('category', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['cloud_services','security','infrastructure','software','consulting','hardware','managed_services','audit_firms','telecommunications','other'].map(c => (
                        <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => set('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['active','inactive','under_review','pending_approval','offboarding'].map(s => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Data Access Level</Label>
                  <Select value={form.data_access_level} onValueChange={v => set('data_access_level', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['none','public_only','internal','confidential','restricted'].map(d => (
                        <SelectItem key={d} value={d}>{d.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Primary Contact</Label>
                  <Input placeholder="Name" value={form.primary_contact} onChange={e => set('primary_contact', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Email</Label>
                  <Input type="email" placeholder="contact@vendor.com" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Contact Phone</Label>
                  <Input placeholder="+1 (555) 123-4567" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input placeholder="https://vendor.com" value={form.website} onChange={e => set('website', e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Owner</Label>
                <Input placeholder="Responsible person" value={form.owner} onChange={e => set('owner', e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} placeholder="Additional notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
            </TabsContent>

            <TabsContent value="risk" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
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
                  <Label>Risk Level</Label>
                  <Select value={form.risk_level} onValueChange={v => set('risk_level', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['critical','high','medium','low'].map(r => (
                        <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Risk Score (0-100)</Label>
                  <Input type="number" min="0" max="100" value={form.risk_score} onChange={e => set('risk_score', parseInt(e.target.value) || 0)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Risk Assessment</Label>
                <Textarea rows={3} placeholder="Document identified risks..." value={form.risk_assessment} onChange={e => set('risk_assessment', e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Mitigation Strategy</Label>
                <Textarea rows={3} placeholder="Plan to mitigate risks..." value={form.mitigation_strategy} onChange={e => set('mitigation_strategy', e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Due Diligence Status</Label>
                  <Select value={form.due_diligence_status} onValueChange={v => set('due_diligence_status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['pending','in_progress','approved','rejected','under_review'].map(d => (
                        <SelectItem key={d} value={d}>{d.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Due Diligence Date</Label>
                  <Input type="date" value={form.due_diligence_date} onChange={e => set('due_diligence_date', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Compliance Status</Label>
                  <Select value={form.compliance_status} onValueChange={v => set('compliance_status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['compliant','non_compliant','under_review','na'].map(c => (
                        <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="certifications" className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Required Certifications</h4>
                  <Button size="sm" onClick={addCertification}>+ Add Certification</Button>
                </div>

                {form.certifications?.map((cert, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-3 relative">
                    <button onClick={() => removeCert(idx)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-3 pr-6">
                      <Select value={cert.name || 'SOC2 Type II'} onValueChange={v => updateCert(idx, 'name', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['SOC2 Type I','SOC2 Type II','ISO27001','ISO27002','ISO9001','ASAE3150','GDPR','HIPAA','PCI-DSS','other'].map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={cert.status || 'required'} onValueChange={v => updateCert(idx, 'status', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['not_required','required','planned','in_progress','certified','expired'].map(s => (
                            <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Issue Date</Label>
                        <Input type="date" value={cert.issue_date || ''} onChange={e => updateCert(idx, 'issue_date', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Expiry Date</Label>
                        <Input type="date" value={cert.expiry_date || ''} onChange={e => updateCert(idx, 'expiry_date', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Certificate URL</Label>
                      <Input placeholder="https://..." value={cert.certificate_url || ''} onChange={e => updateCert(idx, 'certificate_url', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-semibold">Applicable Frameworks</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['SOC2','ISO27001','ASAE3150','GDPR','HIPAA'].map(fw => (
                    <label key={fw} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={form.applicable_frameworks.includes(fw)} onCheckedChange={() => toggleFramework(fw)} />
                      <span className="text-sm">{fw}</span>
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contracts" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Contract Status</Label>
                  <Select value={form.contract_status} onValueChange={v => set('contract_status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['draft','signed','active','expired','terminated'].map(s => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Contract Start Date</Label>
                  <Input type="date" value={form.contract_start_date} onChange={e => set('contract_start_date', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Contract End Date</Label>
                  <Input type="date" value={form.contract_end_date} onChange={e => set('contract_end_date', e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>SLA Coverage & Terms</Label>
                <Textarea rows={3} placeholder="Define SLA uptime guarantees, response times, etc..." value={form.sla_coverage} onChange={e => set('sla_coverage', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Last Audit Date</Label>
                  <Input type="date" value={form.last_audit_date} onChange={e => set('last_audit_date', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Next Audit Date</Label>
                  <Input type="date" value={form.next_audit_date} onChange={e => set('next_audit_date', e.target.value)} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={saving || !form.name}>
            {saving ? 'Saving…' : vendor ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}