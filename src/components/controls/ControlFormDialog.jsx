import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';

const emptyControl = {
  control_id: '', title: '', description: '', framework: 'SOC2', category: '',
  status: 'not_started', priority: 'medium', owner: '', implementation_notes: '',
  evidence_required: '', target_date: ''
};

function generateNextId(records, field, prefix) {
  const nums = records.map(r => parseInt((r[field] || '').replace(prefix + '-', ''), 10)).filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

export default function ControlFormDialog({ open, onOpenChange, control, onSave, saving }) {
  const [form, setForm] = useState(emptyControl);

  useEffect(() => {
    if (!open) return;
    if (control) {
      setForm({ ...emptyControl, ...control });
    } else {
      base44.entities.Control.list().then(records => {
        setForm({ ...emptyControl, control_id: generateNextId(records, 'control_id', 'CTL') });
      });
    }
  }, [control, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{control ? 'Edit Control' : 'Add Control'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Control ID</Label>
              <Input value={form.control_id} readOnly className="bg-muted text-muted-foreground cursor-not-allowed font-mono text-sm" />
            </div>
            <div>
              <Label>Framework *</Label>
              <Select value={form.framework} onValueChange={v => setForm({...form, framework: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOC2">SOC 2</SelectItem>
                  <SelectItem value="ASAE3150">ASAE 3150</SelectItem>
                  <SelectItem value="ISO27001">ISO 27001</SelectItem>
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
            <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Access Control" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="not_applicable">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label>Owner</Label>
              <Input value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} />
            </div>
          </div>
          <div>
            <Label>Implementation Notes</Label>
            <Textarea value={form.implementation_notes} onChange={e => setForm({...form, implementation_notes: e.target.value})} rows={2} />
          </div>
          <div>
            <Label>Evidence Required</Label>
            <Textarea value={form.evidence_required} onChange={e => setForm({...form, evidence_required: e.target.value})} rows={2} />
          </div>
          <div>
            <Label>Target Date</Label>
            <Input type="date" value={form.target_date} onChange={e => setForm({...form, target_date: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Control'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}