import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Filter, Pencil, Trash2, Shield, BookOpen, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ControlGuidePanel from '../components/guides/ControlGuidePanel';
import ControlDetailReport from '../components/controls/ControlDetailReport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import FrameworkBadge from '../components/shared/FrameworkBadge';
import EmptyState from '../components/shared/EmptyState';
import ControlFormDialog from '../components/controls/ControlFormDialog';

export default function Controls() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingControl, setEditingControl] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [guideControl, setGuideControl] = useState(null);
  const [detailControl, setDetailControl] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const location = useLocation();
  const obligationFilter = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const ids = params.get('ids');
    const label = params.get('from');
    return ids ? { ids: ids.split(','), label: label || 'Obligation' } : null;
  }, [location.search]);

  const { data: allControls = [], isLoading } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list('-created_date'),
  });
  const controls = allControls.filter(c => !c.is_deleted);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Control.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['controls'] }); setFormOpen(false); setEditingControl(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Control.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['controls'] }); setFormOpen(false); setEditingControl(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Control.update(id, { is_deleted: true, deleted_date: new Date().toISOString() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['controls'] }); setDeleteId(null); },
  });

  const handleSave = (form) => {
    if (editingControl) {
      updateMutation.mutate({ id: editingControl.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = controls.filter(c => {
    const matchesSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.control_id?.toLowerCase().includes(search.toLowerCase());
    const matchesFramework = frameworkFilter === 'all' || c.framework === frameworkFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesObligation = !obligationFilter || obligationFilter.ids.includes(c.id) || obligationFilter.ids.includes(c.control_id);
    return matchesSearch && matchesFramework && matchesStatus && matchesObligation;
  });

  return (
    <div>
      {obligationFilter && (
        <div className="flex items-center justify-between mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <span>Filtered by obligation: <strong>{obligationFilter.label}</strong> — showing {filtered.length} linked control{filtered.length !== 1 ? 's' : ''}</span>
          <Link to="/controls" className="flex items-center gap-1 text-blue-700 hover:text-blue-900 font-medium">
            <X className="w-3.5 h-3.5" /> Clear filter
          </Link>
        </div>
      )}
      <PageHeader
        title="Controls Library"
        description="Manage compliance controls across all frameworks"
        actions={
          <Button onClick={() => { setEditingControl(null); setFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Control
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search controls..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
          <SelectTrigger className="w-40"><Filter className="w-3 h-3 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frameworks</SelectItem>
            <SelectItem value="SOC2">SOC 2</SelectItem>
            <SelectItem value="ASAE3150">ASAE 3150</SelectItem>
            <SelectItem value="ISO27001">ISO 27001</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="implemented">Implemented</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {filtered.length === 0 && !isLoading ? (
          <EmptyState
            icon={Shield}
            title="No controls found"
            description="Add your first control to start tracking compliance"
            action={<Button variant="outline" onClick={() => { setEditingControl(null); setFormOpen(true); }}>Add Control</Button>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Framework</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(control => (
                <TableRow key={control.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">{control.control_id || '—'}</TableCell>
                  <TableCell className="font-medium text-sm">{control.title}</TableCell>
                  <TableCell><FrameworkBadge framework={control.framework} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{control.category || '—'}</TableCell>
                  <TableCell><StatusBadge status={control.status} /></TableCell>
                  <TableCell><StatusBadge status={control.priority} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{control.owner || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-accent" title="View full report" onClick={() => { setDetailControl(control); setDetailOpen(true); }}><Shield className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Implementation guide" onClick={() => setGuideControl(control)}><BookOpen className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingControl(control); setFormOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(control.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {guideControl && <ControlGuidePanel control={guideControl} onClose={() => setGuideControl(null)} />}
      <ControlDetailReport control={detailControl} open={detailOpen} onOpenChange={setDetailOpen} />
      <ControlFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        control={editingControl}
        onSave={handleSave}
        saving={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Control?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}