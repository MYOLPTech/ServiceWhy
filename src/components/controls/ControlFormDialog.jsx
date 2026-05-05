import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';

const emptyControl = {
  control_id: '', title: '', description: '', framework: 'SOC2', category: '',
  status: 'not_started', priority: 'medium', owner: '', implementation_notes: '',
  evidence_required: '', target_date: '', implementation_type: 'manual',
  implementation_overview: '', implementation_steps: [], automation_details: '',
  manual_procedures: '', best_practices: [], common_pitfalls: [], 
  tools_and_systems: [], testing_and_validation: '', frequency: ''
};

function generateNextId(records, field, prefix) {
  const nums = records.map(r => parseInt((r[field] || '').replace(prefix + '-', ''), 10)).filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

export default function ControlFormDialog({ open, onOpenChange, control, onSave, saving }) {
  const [form, setForm] = useState(emptyControl);
  const [tab, setTab] = useState('basic');

  useEffect(() => {
    if (!open) return;
    if (control) {
      setForm({ ...emptyControl, ...control });
    } else {
      base44.entities.Control.list().then(records => {
        setForm({ ...emptyControl, control_id: generateNextId(records, 'control_id', 'CTL') });
      });
    }
    setTab('basic');
  }, [control, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const addStep = () => {
    const steps = form.implementation_steps || [];
    setForm({...form, implementation_steps: [...steps, {step_number: steps.length + 1, title: '', description: '', responsible_role: ''}]});
  };

  const removeStep = (idx) => {
    const steps = form.implementation_steps || [];
    setForm({...form, implementation_steps: steps.filter((_, i) => i !== idx)});
  };

  const updateStep = (idx, field, value) => {
    const steps = form.implementation_steps || [];
    steps[idx] = {...steps[idx], [field]: value};
    setForm({...form, implementation_steps: [...steps]});
  };

  const addItem = (field) => {
    const items = form[field] || [];
    setForm({...form, [field]: [...items, '']});
  };

  const removeItem = (field, idx) => {
    const items = form[field] || [];
    setForm({...form, [field]: items.filter((_, i) => i !== idx)});
  };

  const updateItem = (field, idx, value) => {
    const items = form[field] || [];
    items[idx] = value;
    setForm({...form, [field]: [...items]});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
           <DialogTitle>{control ? 'Edit Control' : 'Add Control'}</DialogTitle>
         </DialogHeader>

         {/* Tabs */}
         <div className="flex gap-1 border-b border-border">
          {['basic', 'implementation', 'details'].map(t => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`px-3 py-2 text-xs font-semibold rounded-t border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {t === 'basic' && 'Basic'}{t === 'implementation' && 'Implementation'}{t === 'details' && 'Details'}
            </button>
          ))}
         </div>

         <form onSubmit={handleSubmit} className="space-y-4">
           {tab === 'basic' && (
             <>
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
                 <Label>Target Date</Label>
                 <Input type="date" value={form.target_date} onChange={e => setForm({...form, target_date: e.target.value})} />
               </div>
             </>
           )}

           {tab === 'implementation' && (
             <>
               <div>
                 <Label>Implementation Type *</Label>
                 <Select value={form.implementation_type || 'manual'} onValueChange={v => setForm({...form, implementation_type: v})}>
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="manual">Manual</SelectItem>
                     <SelectItem value="automated">Automated</SelectItem>
                     <SelectItem value="hybrid">Hybrid</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label>Implementation Overview</Label>
                 <Textarea value={form.implementation_overview || ''} onChange={e => setForm({...form, implementation_overview: e.target.value})} rows={3} placeholder="High-level overview of how to implement this control" />
               </div>
               <div>
                 <Label>Frequency</Label>
                 <Input value={form.frequency || ''} onChange={e => setForm({...form, frequency: e.target.value})} placeholder="e.g. daily, weekly, monthly, annually" />
               </div>
               {(form.implementation_type === 'automated' || form.implementation_type === 'hybrid') && (
                 <div>
                   <Label>Automation Details</Label>
                   <Textarea value={form.automation_details || ''} onChange={e => setForm({...form, automation_details: e.target.value})} rows={3} placeholder="Tools, scripts, systems used for automation" />
                 </div>
               )}
               {(form.implementation_type === 'manual' || form.implementation_type === 'hybrid') && (
                 <div>
                   <Label>Manual Procedures</Label>
                   <Textarea value={form.manual_procedures || ''} onChange={e => setForm({...form, manual_procedures: e.target.value})} rows={3} placeholder="Detailed procedures and workflows" />
                 </div>
               )}
             </>
           )}

           {tab === 'details' && (
             <>
               <div>
                 <Label>Testing & Validation</Label>
                 <Textarea value={form.testing_and_validation || ''} onChange={e => setForm({...form, testing_and_validation: e.target.value})} rows={2} placeholder="How to test and validate the control" />
               </div>

               <div>
                 <div className="flex items-center justify-between mb-2">
                   <Label>Implementation Steps</Label>
                   <Button type="button" variant="outline" size="sm" onClick={addStep}>+ Add Step</Button>
                 </div>
                 <div className="space-y-2">
                   {(form.implementation_steps || []).map((step, i) => (
                     <div key={i} className="border border-border/60 rounded-lg p-3 space-y-2">
                       <div className="flex items-center justify-between">
                         <span className="text-xs font-semibold text-muted-foreground">Step {i + 1}</span>
                         <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeStep(i)}><X className="w-3 h-3" /></Button>
                       </div>
                       <Input placeholder="Step title" value={step.title} onChange={e => updateStep(i, 'title', e.target.value)} />
                       <Textarea placeholder="Step description" value={step.description} onChange={e => updateStep(i, 'description', e.target.value)} rows={2} />
                       <Input placeholder="Responsible role" value={step.responsible_role} onChange={e => updateStep(i, 'responsible_role', e.target.value)} />
                     </div>
                   ))}
                 </div>
               </div>

               <div>
                 <div className="flex items-center justify-between mb-2">
                   <Label>Best Practices</Label>
                   <Button type="button" variant="outline" size="sm" onClick={() => addItem('best_practices')}>+ Add</Button>
                 </div>
                 <div className="space-y-2">
                   {(form.best_practices || []).map((item, i) => (
                     <div key={i} className="flex gap-2">
                       <Input value={item} onChange={e => updateItem('best_practices', i, e.target.value)} placeholder="Best practice" />
                       <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeItem('best_practices', i)}><X className="w-4 h-4" /></Button>
                     </div>
                   ))}
                 </div>
               </div>

               <div>
                 <div className="flex items-center justify-between mb-2">
                   <Label>Common Pitfalls</Label>
                   <Button type="button" variant="outline" size="sm" onClick={() => addItem('common_pitfalls')}>+ Add</Button>
                 </div>
                 <div className="space-y-2">
                   {(form.common_pitfalls || []).map((item, i) => (
                     <div key={i} className="flex gap-2">
                       <Input value={item} onChange={e => updateItem('common_pitfalls', i, e.target.value)} placeholder="Pitfall to avoid" />
                       <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeItem('common_pitfalls', i)}><X className="w-4 h-4" /></Button>
                     </div>
                   ))}
                 </div>
               </div>

               <div>
                 <div className="flex items-center justify-between mb-2">
                   <Label>Recommended Tools & Systems</Label>
                   <Button type="button" variant="outline" size="sm" onClick={() => addItem('tools_and_systems')}>+ Add</Button>
                 </div>
                 <div className="space-y-2">
                   {(form.tools_and_systems || []).map((item, i) => (
                     <div key={i} className="flex gap-2">
                       <Input value={item} onChange={e => updateItem('tools_and_systems', i, e.target.value)} placeholder="Tool or system" />
                       <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeItem('tools_and_systems', i)}><X className="w-4 h-4" /></Button>
                     </div>
                   ))}
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
             </>
           )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Control'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}