import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, AlertOctagon, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import IncidentFormDialog from '../components/incidents/IncidentFormDialog';
import { format } from 'date-fns';

const SEVERITY_STYLES = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-slate-100 text-slate-700 border-slate-200',
};

const STATUS_STYLES = {
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  investigating: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  contained: 'bg-purple-100 text-purple-700 border-purple-200',
  remediated: 'bg-teal-100 text-teal-700 border-teal-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function Incidents() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: allIncidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-detected_date'),
  });
  const incidents = allIncidents.filter(i => !i.is_deleted);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Incident.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incidents'] }); setFormOpen(false); setEditing(null); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incidents'] }); setFormOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Incident.update(id, { is_deleted: true, deleted_date: new Date().toISOString() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incidents'] }); setDeleteId(null); },
  });

  const handleSave = (form) => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const filtered = incidents.filter(i => {
    const matchesSearch = !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.incident_id?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const counts = {
    open: incidents.filter(i => !['resolved', 'closed'].includes(i.status)).length,
    critical: incidents.filter(i => i.severity === 'critical' && !['resolved', 'closed'].includes(i.status)).length,
    resolved: incidents.filter(i => ['resolved', 'closed'].includes(i.status)).length,
  };

  return (
    <div>
      <PageHeader
        title="Incident Register"
        description="Track and manage security and compliance incidents — link to risks, controls, policies and more."
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2"><Plus className="w-4 h-4" /> Report Incident</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
          <div className="text-2xl font-bold">{incidents.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Incidents</div>
        </div>
        <div className="bg-blue-50 rounded-xl border border-border/50 p-4 shadow-sm">
          <div className="text-2xl font-bold text-blue-700">{counts.open}</div>
          <div className="text-xs text-muted-foreground mt-1">Open</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-border/50 p-4 shadow-sm">
          <div className="text-2xl font-bold text-red-700">{counts.critical}</div>
          <div className="text-xs text-muted-foreground mt-1">Critical (Open)</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-border/50 p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-700">{counts.resolved}</div>
          <div className="text-xs text-muted-foreground mt-1">Resolved / Closed</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search incidents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="contained">Contained</SelectItem>
            <SelectItem value="remediated">Remediated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={AlertOctagon} title="No incidents found" description="Report incidents to track investigation, remediation, and lessons learned." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Detected</TableHead>
                <TableHead>Linked</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(i => {
                const linkedTotal = (i.linked_risk_ids?.length || 0) + (i.linked_control_ids?.length || 0)
                  + (i.linked_policy_ids?.length || 0) + (i.linked_task_ids?.length || 0)
                  + (i.linked_obligation_ids?.length || 0) + (i.linked_evidence_ids?.length || 0)
                  + (i.linked_cmdb_ids?.length || 0) + (i.linked_vendor_ids?.length || 0);
                return (
                  <TableRow key={i.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">{i.incident_id || '—'}</TableCell>
                    <TableCell className="font-medium text-sm max-w-[280px] truncate">{i.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground capitalize">{i.category?.replace(/_/g, ' ') || '—'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${SEVERITY_STYLES[i.severity] || ''}`}>{i.severity}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${STATUS_STYLES[i.status] || ''}`}>{i.status?.replace(/_/g, ' ')}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{i.owner || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{i.detected_date ? format(new Date(i.detected_date), 'MMM d, yyyy') : '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{linkedTotal > 0 ? `${linkedTotal} record${linkedTotal !== 1 ? 's' : ''}` : '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(i); setFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(i.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <IncidentFormDialog open={formOpen} onOpenChange={setFormOpen} incident={editing} onSave={handleSave} saving={createMutation.isPending || updateMutation.isPending} />
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Incident?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}