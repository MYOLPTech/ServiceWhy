import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Filter, Pencil, Trash2, Server, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import CmdbFormDialog from '../components/cmdb/CmdbFormDialog';

const CRITICALITY_STYLES = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  decommissioned: 'bg-red-100 text-red-600 border-red-200',
  under_review: 'bg-blue-100 text-blue-700 border-blue-200',
  pending_approval: 'bg-purple-100 text-purple-700 border-purple-200',
};

const ENV_STYLES = {
  production: 'bg-red-50 text-red-600 border-red-100',
  staging: 'bg-amber-50 text-amber-700 border-amber-100',
  development: 'bg-blue-50 text-blue-600 border-blue-100',
  dr: 'bg-purple-50 text-purple-600 border-purple-100',
  shared: 'bg-gray-50 text-gray-600 border-gray-100',
};

export default function Cmdb() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [critFilter, setCritFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const handleSort = (column) => {
    if (sortBy === column) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortDir('asc'); }
  };

  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ['cmdb'],
    queryFn: () => base44.entities.CmdbItem.list('-created_date'),
  });
  const items = allItems;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CmdbItem.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cmdb'] }); setFormOpen(false); setEditingItem(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CmdbItem.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cmdb'] }); setFormOpen(false); setEditingItem(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CmdbItem.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cmdb'] }); setDeleteId(null); },
  });

  const handleSave = (form) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = useMemo(() => items.filter(item => {
    const matchesSearch = !search || item.name?.toLowerCase().includes(search.toLowerCase()) || item.asset_id?.toLowerCase().includes(search.toLowerCase()) || item.vendor?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCrit = critFilter === 'all' || item.criticality === critFilter;
    return matchesSearch && matchesType && matchesStatus && matchesCrit;
  }).sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  }), [items, search, typeFilter, statusFilter, critFilter, sortBy, sortDir]);

  const linkCount = (item) => {
    return (item.linked_control_ids?.length || 0) + (item.linked_risk_ids?.length || 0) + (item.linked_task_ids?.length || 0) + (item.linked_evidence_ids?.length || 0);
  };

  return (
    <div>
      <PageHeader
        title="CMDB"
        description="Configuration Management Database — track assets and link them to controls, risks, tasks and evidence"
        actions={
          <Button onClick={() => { setEditingItem(null); setFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Asset
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Assets', value: items.length, color: 'text-foreground' },
          { label: 'Active', value: items.filter(i => i.status === 'active').length, color: 'text-emerald-600' },
          { label: 'Critical', value: items.filter(i => i.criticality === 'critical').length, color: 'text-red-600' },
          { label: 'Under Review', value: items.filter(i => i.status === 'under_review').length, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44"><Filter className="w-3 h-3 mr-2" /><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {['server','workstation','network_device','cloud_service','application','database','storage','endpoint','saas_tool','virtual_machine','container','api','other'].map(t => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {['active','inactive','decommissioned','under_review','pending_approval'].map(s => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={critFilter} onValueChange={setCritFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Criticality" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Criticality</SelectItem>
            {['critical','high','medium','low'].map(c => (
              <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || typeFilter !== 'all' || statusFilter !== 'all' || critFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setCritFilter('all'); }} className="gap-1 text-muted-foreground">
            <X className="w-3.5 h-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {filtered.length === 0 && !isLoading ? (
          <EmptyState
            icon={Server}
            title="No assets found"
            description="Add your first CMDB item to start tracking configuration items"
            action={<Button variant="outline" onClick={() => { setEditingItem(null); setFormOpen(true); }}>Add Asset</Button>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-24 cursor-pointer hover:bg-muted/50" onClick={() => handleSort('asset_id')}>ID {sortBy === 'asset_id' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('type')}>Type {sortBy === 'type' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('environment')}>Environment {sortBy === 'environment' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>Status {sortBy === 'status' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('criticality')}>Criticality {sortBy === 'criticality' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('owner')}>Owner {sortBy === 'owner' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead>Links</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(item => (
                <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.asset_id || '—'}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.location && <p className="text-xs text-muted-foreground">{item.location}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">{item.type?.replace(/_/g, ' ')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs capitalize ${ENV_STYLES[item.environment] || ''}`}>
                      {item.environment}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs capitalize ${STATUS_STYLES[item.status] || ''}`}>
                      {item.status?.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs capitalize ${CRITICALITY_STYLES[item.criticality] || ''}`}>
                      {item.criticality}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.owner || '—'}</TableCell>
                  <TableCell>
                    {linkCount(item) > 0 ? (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <ExternalLink className="w-3 h-3" /> {linkCount(item)}
                      </Badge>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingItem(item); setFormOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}>
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

      <CmdbFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editingItem}
        onSave={handleSave}
        saving={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this CMDB item and cannot be undone.</AlertDialogDescription>
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