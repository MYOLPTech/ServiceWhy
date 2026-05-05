import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, CheckSquare, Pencil, Trash2, BookOpen, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import TaskGuidePanel from '../components/guides/TaskGuidePanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import FrameworkBadge from '../components/shared/FrameworkBadge';
import EmptyState from '../components/shared/EmptyState';
import TaskFormDialog from '../components/tasks/TaskFormDialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Tasks() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [frameworkFilter, setFrameworkFilter] = useState('all');
  const [sortBy, setSortBy] = useState('task_id');
  const [sortDir, setSortDir] = useState('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [guideTask, setGuideTask] = useState(null);

  const handleSort = (column) => {
    if (sortBy === column) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortDir('asc'); }
  };
  const location = useLocation();
  const obligationFilter = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const ids = params.get('ids');
    const label = params.get('from');
    return ids ? { ids: ids.split(','), label: label || 'Obligation' } : null;
  }, [location.search]);

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date'),
  });
  const tasks = allTasks.filter(t => !t.is_deleted);

  const { data: allControls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list(),
  });
  const controls = allControls.filter(c => !c.is_deleted);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setFormOpen(false); setEditing(null); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setFormOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.update(id, { is_deleted: true, deleted_date: new Date().toISOString() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setDeleteId(null); },
  });

  const handleSave = (form) => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const filtered = tasks.filter(t => {
    const matchesSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.task_id?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesFramework = frameworkFilter === 'all' || t.framework === frameworkFilter;
    const matchesObligation = !obligationFilter || obligationFilter.ids.includes(t.id) || obligationFilter.ids.includes(t.task_id);
    return matchesSearch && matchesStatus && matchesFramework && matchesObligation;
  }).sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const isOverdue = (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed';

  return (
    <div>
      {obligationFilter && (
        <div className="flex items-center justify-between mb-4 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
          <span>Filtered by obligation: <strong>{obligationFilter.label}</strong> — showing {filtered.length} linked task{filtered.length !== 1 ? 's' : ''}</span>
          <Link to="/tasks" className="flex items-center gap-1 text-green-700 hover:text-green-900 font-medium">
            <X className="w-3.5 h-3.5" /> Clear filter
          </Link>
        </div>
      )}
      <PageHeader
        title="Task Management"
        description="Track remediation, implementation, and audit preparation tasks"
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Task</Button>}
      />
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frameworks</SelectItem>
            <SelectItem value="SOC2">SOC 2</SelectItem>
            <SelectItem value="ASAE3150">ASAE 3150</SelectItem>
            <SelectItem value="ISO27001">ISO 27001</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={CheckSquare} title="No tasks found" description="Create tasks to track your compliance work" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-24 cursor-pointer hover:bg-muted/50" onClick={() => handleSort('task_id')}>ID {sortBy === 'task_id' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('title')}>Task {sortBy === 'title' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('type')}>Type {sortBy === 'type' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('framework')}>Framework {sortBy === 'framework' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('priority')}>Priority {sortBy === 'priority' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>Status {sortBy === 'status' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('assignee')}>Assignee {sortBy === 'assignee' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('due_date')}>Due Date {sortBy === 'due_date' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(task => (
                <TableRow key={task.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">{task.task_id || '—'}</TableCell>
                  <TableCell className="font-medium text-sm max-w-[250px] truncate">{task.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">{task.type?.replace('_', ' ') || '—'}</TableCell>
                  <TableCell><FrameworkBadge framework={task.framework} /></TableCell>
                  <TableCell><StatusBadge status={task.priority} /></TableCell>
                  <TableCell><StatusBadge status={task.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{task.assignee || '—'}</TableCell>
                  <TableCell>
                    {task.due_date ? (
                      <span className={cn("text-sm", isOverdue(task) && "text-red-600 font-medium")}> 
                        {format(new Date(task.due_date), 'MMM d, yyyy')}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Implementation guide" onClick={() => setGuideTask(task)}><BookOpen className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(task); setFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(task.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {guideTask && <TaskGuidePanel task={guideTask} onClose={() => setGuideTask(null)} />}
      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} task={editing} controls={controls} onSave={handleSave} saving={createMutation.isPending || updateMutation.isPending} />
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Task?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}