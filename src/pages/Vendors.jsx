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
import { Plus, Search, Trash2, Eye } from 'lucide-react';

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
    <div className="p-6">
      <PageHeader 
        title="Vendor Management" 
        description="Manage vendors, assess risks, and track certifications"
        actions={
          <Button onClick={() => { setEditingVendor(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4" />New Vendor
          </Button>
        }
      />

      <SummaryStats stats={[
        { label: 'Total Vendors', value: vendors.length },
        { label: 'Active', value: vendors.filter(v => v.status === 'active').length, tone: 'green' },
        { label: 'High / Critical Risk', value: vendors.filter(v => ['critical', 'high'].includes(v.risk_level)).length, tone: 'red' },
        { label: 'Under Review', value: vendors.filter(v => v.status === 'under_review' || v.due_diligence_status === 'in_progress').length, tone: 'blue' },
      ]} />

      <div className="bg-white rounded-lg border p-4 mb-6 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>
        <div className="flex gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {['cloud_services','security','infrastructure','software','consulting','hardware','managed_services','audit_firms','telecommunications','other'].map(c => (
                <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {['active','inactive','under_review','pending_approval','offboarding'].map(s => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredVendors.length === 0 ? (
        <EmptyState 
          title="No vendors found" 
          description="Create your first vendor to get started" 
          action={<Button onClick={() => { setEditingVendor(null); setDialogOpen(true); }}>Add Vendor</Button>}
        />
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>Vendor {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('category')}>Category {sortBy === 'category' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>Status {sortBy === 'status' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('risk_level')}>Risk Level {sortBy === 'risk_level' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('compliance_status')}>Compliance {sortBy === 'compliance_status' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('contract_status')}>Contract {sortBy === 'contract_status' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">
                    <div>
                      {v.vendor_id && <span className="text-xs text-muted-foreground font-mono">{v.vendor_id} – </span>}
                      {v.name}
                    </div>
                    {v.primary_contact && <p className="text-xs text-muted-foreground mt-0.5">{v.primary_contact}</p>}
                  </TableCell>
                  <TableCell className="text-sm capitalize">{v.category?.replace(/_/g, ' ')}</TableCell>
                  <TableCell><StatusBadge status={v.status} /></TableCell>
                  <TableCell><StatusBadge status={v.risk_level} /></TableCell>
                  <TableCell><StatusBadge status={v.compliance_status} /></TableCell>
                  <TableCell className="text-sm capitalize">{v.contract_status?.replace(/_/g, ' ')}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => { setReportVendor(v); setReportOpen(true); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingVendor(v); setDialogOpen(true); }}>Edit</Button>
                    <Button size="sm" variant="ghost" text-destructive onClick={() => setDeleteTarget(v)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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