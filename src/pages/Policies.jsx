import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, FileText, Pencil, Trash2, ExternalLink, Eye } from 'lucide-react';
import PolicyContentViewer from '../components/policies/PolicyContentViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import FrameworkBadge from '../components/shared/FrameworkBadge';
import EmptyState from '../components/shared/EmptyState';
import PolicyFormDialog from '../components/policies/PolicyFormDialog';
import { format } from 'date-fns';

export default function Policies() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewingPolicy, setViewingPolicy] = useState(null);

  const { data: policies = [] } = useQuery({
    queryKey: ['policies'],
    queryFn: () => base44.entities.Policy.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Policy.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['policies'] }); setFormOpen(false); setEditing(null); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Policy.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['policies'] }); setFormOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Policy.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['policies'] }); setDeleteId(null); },
  });

  const handleSave = (form) => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const filtered = policies.filter(p => {
    const matchesSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="Policies & Procedures"
        description="Manage your compliance documentation"
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Policy</Button>}
      />
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search policies..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No policies found" description="Create policies to document your compliance procedures" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Frameworks</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Review Date</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.policy_id || '—'}</TableCell>
                  <TableCell className="font-medium text-sm">{p.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">{p.category?.replace(/_/g, ' ') || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">{(p.frameworks || []).map(fw => <FrameworkBadge key={fw} framework={fw} />)}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.version || '—'}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.owner || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.review_date ? format(new Date(p.review_date), 'MMM d, yyyy') : '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="View policy document" onClick={() => setViewingPolicy(p)}><Eye className="w-3.5 h-3.5" /></Button>
                      {p.file_url && <a href={p.file_url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="w-3.5 h-3.5" /></Button></a>}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <PolicyFormDialog open={formOpen} onOpenChange={setFormOpen} policy={editing} onSave={handleSave} saving={createMutation.isPending || updateMutation.isPending} />
      {viewingPolicy && <PolicyContentViewer policy={viewingPolicy} onClose={() => setViewingPolicy(null)} />}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Policy?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}