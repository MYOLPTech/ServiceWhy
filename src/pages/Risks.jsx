import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import RiskFormDialog from '../components/risks/RiskFormDialog';
import { cn } from '@/lib/utils';

function RiskScoreBadge({ score }) {
  const color = score >= 15 ? 'bg-red-100 text-red-700 border-red-200' : score >= 8 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200';
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border", color)}>{score}</span>;
}

export default function Risks() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: risks = [] } = useQuery({
    queryKey: ['risks'],
    queryFn: () => base44.entities.Risk.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Risk.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['risks'] }); setFormOpen(false); setEditing(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Risk.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['risks'] }); setFormOpen(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Risk.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['risks'] }); setDeleteId(null); },
  });

  const handleSave = (form) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = risks.filter(r => {
    const matchesSearch = !search || r.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="Risk Register"
        description="Identify, assess, and manage compliance risks"
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Risk
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search risks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_treatment">In Treatment</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No risks found" description="Add risks to start managing your risk register" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Risk</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Likelihood</TableHead>
                <TableHead className="text-center">Impact</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead>Treatment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(risk => (
                <TableRow key={risk.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium text-sm max-w-[200px] truncate">{risk.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">{risk.category?.replace('_', ' ') || '—'}</TableCell>
                  <TableCell className="text-center text-sm">{risk.likelihood}</TableCell>
                  <TableCell className="text-center text-sm">{risk.impact}</TableCell>
                  <TableCell className="text-center"><RiskScoreBadge score={risk.risk_score || risk.likelihood * risk.impact} /></TableCell>
                  <TableCell className="text-sm capitalize">{risk.treatment}</TableCell>
                  <TableCell><StatusBadge status={risk.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{risk.owner || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(risk); setFormOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(risk.id)}>
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

      <RiskFormDialog open={formOpen} onOpenChange={setFormOpen} risk={editing} onSave={handleSave} saving={createMutation.isPending || updateMutation.isPending} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Risk?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}