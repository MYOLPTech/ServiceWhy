import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import SummaryStats from '@/components/shared/SummaryStats';
import StatusBadge from '@/components/shared/StatusBadge';
import VendorFormDialog from '@/components/vendors/VendorFormDialog';
import VendorDetailReport from '@/components/vendors/VendorDetailReport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Trash2, Eye, Pencil, Building2 } from 'lucide-react';

export default function Vendors() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [editingVendor, setEditingVendor] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportVendor, setReportVendor] = useState(null);
  const queryClient = useQueryClient();

  const handleSort = (column) => {
    if (sortBy === column) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortDir('asc'); }
  };

  const { data: allVendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list()
  });
  const vendors = allVendors.filter(v => !v.is_deleted);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Vendor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setDialogOpen(false);
      setEditingVendor(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vendor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setDialogOpen(false);
      setEditingVendor(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Vendor.update(id, { is_deleted: true, deleted_date: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setDeleteTarget(null);
    }
  });

  const handleSave = (formData) => {
    if (editingVendor) {
      updateMutation.mutate({ id: editingVendor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredVendors = vendors.filter(v => {
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) || (v.vendor_id || '').includes(search);
    const matchCategory = categoryFilter === 'all' || v.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  }).sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>;
  }

  return (
    <div>
      <PageHeader
        title="Vendor Management"
        description="Manage vendors, assess risks, and track certifications"
        actions={
          <Button onClick={() => { setEditingVendor(null); setDialogOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Vendor
          </Button>
        }
      />

      <SummaryStats stats={[
        { label: 'Total Vendors', value: vendors.length },
        { label: 'Active', value: vendors.filter(v => v.status === 'active').length, tone: 'green' },
        { label: 'High / Critical Risk', value: vendors.filter(v => ['critical', 'high'].includes(v.risk_level)).length, tone: 'red' },
        { label: 'Under Review', value: vendors.filter(v => v.status === 'under_review' || v.due_diligence_status === 'in_progress').length, tone: 'blue' },
      ]} />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {['cloud_services','security','infrastructure','software','consulting','hardware','managed_services','audit_firms','telecommunications','other'].map(c => (
              <SelectItem key={c} value={c} className="capitalize">{c.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {['active','inactive','under_review','pending_approval','offboarding'].map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {filteredVendors.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No vendors found"
            description="Create your first vendor to get started"
            action={<Button variant="outline" onClick={() => { setEditingVendor(null); setDialogOpen(true); }}>Add Vendor</Button>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-24 cursor-pointer hover:bg-muted/50" onClick={() => handleSort('vendor_id')}>ID {sortBy === 'vendor_id' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>Vendor {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('category')}>Category {sortBy === 'category' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>Status {sortBy === 'status' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('risk_level')}>Risk Level {sortBy === 'risk_level' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('compliance_status')}>Compliance {sortBy === 'compliance_status' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('contract_status')}>Contract {sortBy === 'contract_status' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map(v => (
                <TableRow key={v.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">{v.vendor_id || '—'}</TableCell>
                  <TableCell className="font-medium text-sm">
                    <div>{v.name}</div>
                    {v.primary_contact && <p className="text-xs text-muted-foreground mt-0.5">{v.primary_contact}</p>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">{v.category?.replace(/_/g, ' ') || '—'}</TableCell>
                  <TableCell><StatusBadge status={v.status} /></TableCell>
                  <TableCell><StatusBadge status={v.risk_level} /></TableCell>
                  <TableCell><StatusBadge status={v.compliance_status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">{v.contract_status?.replace(/_/g, ' ') || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-accent" title="View full report" onClick={() => { setReportVendor(v); setReportOpen(true); }}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingVendor(v); setDialogOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(v)}>
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

      <VendorFormDialog open={dialogOpen} onOpenChange={setDialogOpen} vendor={editingVendor} onSave={handleSave} saving={createMutation.isPending || updateMutation.isPending} />

      <VendorDetailReport vendor={reportVendor} open={reportOpen} onOpenChange={setReportOpen} />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex justify-end gap-3 pt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteTarget.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}