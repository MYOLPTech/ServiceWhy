import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Upload } from 'lucide-react';

const emptyEvidence = {
  evidence_id: '', title: '', description: '', control_id: '', framework: '', file_url: '', file_name: '',
  status: 'pending_review', review_notes: '', expiry_date: ''
};

export default function EvidenceFormDialog({ open, onOpenChange, evidence, controls, onSave, saving }) {
  const [form, setForm] = useState(emptyEvidence);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (evidence) {
      setForm({ ...emptyEvidence, ...evidence });
    } else {
      setForm(emptyEvidence);
    }
  }, [evidence, open]);

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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col fixed top-8 left-[50%] translate-x-[-50%] translate-y-0">
        <DialogHeader>
          <DialogTitle>{evidence ? 'Edit Evidence' : 'Upload Evidence'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Evidence ID</Label>
              <Input value={form.evidence_id} onChange={e => setForm({...form, evidence_id: e.target.value})} placeholder="Auto-generated" disabled />
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
            <Label>Linked Control</Label>
            <Select value={form.control_id} onValueChange={v => {
              const ctrl = controls.find(c => c.id === v);
              setForm({...form, control_id: v, framework: ctrl?.framework || form.framework});
            }}>
              <SelectTrigger><SelectValue placeholder="Select control" /></SelectTrigger>
              <SelectContent>
                {controls.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.control_id || c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || uploading}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}