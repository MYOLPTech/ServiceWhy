import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { base44 } from '@/api/base44Client';

const emptyRisk = {
  risk_id: '', title: '', description: '', category: 'operational', likelihood: 3, impact: 3,
  risk_score: 9, treatment: 'mitigate', treatment_plan: '', status: 'open', owner: '',
  frameworks: []
};

function generateNextId(records, field, prefix) {
  const nums = records.map(r => parseInt((r[field] || '').replace(prefix + '-', ''), 10)).filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

export default function RiskFormDialog({ open, onOpenChange, risk, onSave, saving }) {
  const [form, setForm] = useState(emptyRisk);

  useEffect(() => {
    if (!open) return;
    if (risk) {
      setForm({ ...emptyRisk, ...risk });
    } else {
      base44.entities.Risk.list().then(records => {
        setForm({ ...emptyRisk, risk_id: generateNextId(records, 'risk_id', 'RSK') });
      });
    }
  }, [risk, open]);

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
        <form onSubmit={handleSubmit} className="space-y-4">
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
      </DialogContent>
    </Dialog>
  );
}