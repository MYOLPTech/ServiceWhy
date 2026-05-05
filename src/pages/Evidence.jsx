import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, FileCheck, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import SummaryStats from '../components/shared/SummaryStats';
import EvidenceFormDialog from '../components/evidence/EvidenceFormDialog';
import { format } from 'date-fns';

export default function Evidence() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [sortDir, setSortDir] = useState('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const handleSort = (column) => {
    if (sortBy === column) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortDir('asc'); }
  };

  const { data: allEvidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list('-created_date'),
  });
  const evidence = allEvidence.filter(e => !e.is_deleted);

  const { data: allControls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list(),
  });
  const controls = allControls.filter(c => !c.is_deleted);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Evidence.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['evidence'] }); setFormOpen(false); setEditing(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Evidence.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['evidence'] }); setFormOpen(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Evidence.update(id, { is_deleted: true, deleted_date: new Date().toISOString() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['evidence'] }); setDeleteId(null); },
  });

  const handleSave = (form) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const getControlName = (controlId) => {
    const c = controls.find(ctrl => ctrl.id === controlId);
    return c ? (c.control_id || c.title) : '—';
  };

  const generateEvidenceId = async () => {
    const existing = await base44.entities.Evidence.list();
    const ids = existing.map(e => parseInt(e.evidence_id?.split('-')[1] || 0)).filter(n => !isNaN(n));
    const nextNum = Math.max(...ids, 0) + 1;
    return `EVD-${String(nextNum).padStart(3, '0')}`;
  };

  const filtered = evidence.filter(e => {
    const matchesSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div>
      <PageHeader
        title="Evidence Management"
        description="Upload and manage compliance evidence and artifacts"
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Upload Evidence
          </Button>
        }
      />

      <SummaryStats stats={[
        { label: 'Total Evidence', value: evidence.length },
        { label: 'Pending Review', value: evidence.filter(e => e.status === 'pending_review').length, tone: 'amber' },
        { label: 'Expired / Rejected', value: evidence.filter(e => ['expired', 'rejected'].includes(e.status)).length, tone: 'red' },
        { label: 'Approved', value: evidence.filter(e => e.status === 'approved').length, tone: 'green' },
      ]} />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search evidence..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={FileCheck} title="No evidence found" description="Upload evidence to support your compliance controls" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('evidence_id')}>ID {sortBy === 'evidence_id' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('title')}>Title {sortBy === 'title' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>Status {sortBy === 'status' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('created_date')}>Uploaded {sortBy === 'created_date' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('expiry_date')}>Expiry {sortBy === 'expiry_date' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(e => (
                <TableRow key={e.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="text-sm font-mono text-primary">{e.evidence_id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{e.title}</p>
                      {e.file_name && <p className="text-[11px] text-muted-foreground">{e.file_name}</p>}
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={e.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(e.created_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.expiry_date ? format(new Date(e.expiry_date), 'MMM d, yyyy') : '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {e.file_url && (
                        <a href={e.file_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="w-3.5 h-3.5" /></Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(e); setFormOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(e.id)}>
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

      <EvidenceFormDialog open={formOpen} onOpenChange={setFormOpen} evidence={editing} controls={controls} onSave={handleSave} saving={createMutation.isPending || updateMutation.isPending} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Evidence?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}