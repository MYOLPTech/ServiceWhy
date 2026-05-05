import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { Upload } from 'lucide-react';

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
  { value: 'other', label: 'Other' },
];

const frameworkOptions = ['SOC2', 'ASAE3150', 'ISO27001'];

const emptyPolicy = {
  title: '', description: '', category: 'information_security', version: '1.0',
  status: 'draft', owner: '', approver: '', file_url: '', frameworks: [], review_date: '', approved_date: ''
};

export default function PolicyFormDialog({ open, onOpenChange, policy, onSave, saving }) {
  const [form, setForm] = useState(emptyPolicy);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm(policy ? { ...emptyPolicy, ...policy, frameworks: policy.frameworks || [] } : emptyPolicy);
  }, [policy, open]);

  const toggleFramework = (fw) => {
    setForm(f => ({
      ...f,
      frameworks: f.frameworks.includes(fw) ? f.frameworks.filter(x => x !== fw) : [...f.frameworks, fw]
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{policy ? 'Edit Policy' : 'Add Policy'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
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
            <div>
              <Label>Owner</Label>
              <Input value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} />
            </div>
            <div>
              <Label>Approver</Label>
              <Input value={form.approver} onChange={e => setForm({...form, approver: e.target.value})} />
            </div>
          </div>
          <div>
            <Label>Applicable Frameworks</Label>
            <div className="flex gap-4 mt-2">
              {frameworkOptions.map(fw => (
                <label key={fw} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.frameworks.includes(fw)} onCheckedChange={() => toggleFramework(fw)} />
                  {fw === 'SOC2' ? 'SOC 2' : fw === 'ASAE3150' ? 'ASAE 3150' : 'ISO 27001'}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Version</Label>
            <Input value={form.version} onChange={e => setForm({...form, version: e.target.value})} />
          </div>
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
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || uploading}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}