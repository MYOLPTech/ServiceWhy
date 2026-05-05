import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';

const emptyTask = {
  task_id: '', title: '', description: '', type: 'implementation', status: 'todo',
  priority: 'medium', assignee: '', framework: 'All', linked_control_id: '', due_date: ''
};

function generateNextId(records, field, prefix) {
  const nums = records.map(r => parseInt((r[field] || '').replace(prefix + '-', ''), 10)).filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

export default function TaskFormDialog({ open, onOpenChange, task, controls, onSave, saving }) {
  const [form, setForm] = useState(emptyTask);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({ ...emptyTask, ...task });
    } else {
      base44.entities.Task.list().then(records => {
        setForm({ ...emptyTask, task_id: generateNextId(records, 'task_id', 'TSK') });
      });
    }
  }, [task, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Add Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Task ID</Label>
              <Input value={form.task_id || ''} readOnly className="bg-muted text-muted-foreground cursor-not-allowed font-mono text-sm" />
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
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remediation">Remediation</SelectItem>
                  <SelectItem value="implementation">Implementation</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="audit_prep">Audit Prep</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Framework</Label>
              <Select value={form.framework} onValueChange={v => setForm({...form, framework: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="SOC2">SOC 2</SelectItem>
                  <SelectItem value="ASAE3150">ASAE 3150</SelectItem>
                  <SelectItem value="ISO27001">ISO 27001</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assignee</Label>
              <Input value={form.assignee} onChange={e => setForm({...form, assignee: e.target.value})} />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
            </div>
          </div>
          <div>
            <Label>Linked Control</Label>
            <Select value={form.linked_control_id} onValueChange={v => setForm({...form, linked_control_id: v})}>
              <SelectTrigger><SelectValue placeholder="Select control (optional)" /></SelectTrigger>
              <SelectContent>
                {(controls || []).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.control_id || c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Task'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}