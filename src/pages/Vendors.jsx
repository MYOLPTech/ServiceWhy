import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/shared/StatusBadge';
import VendorFormDialog from '@/components/vendors/VendorFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Trash2 } from 'lucide-react';

export default function Vendors() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingVendor, setEditingVendor] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list()
  });

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
    mutationFn: (id) => base44.entities.Vendor.delete(id),
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
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Contract</TableHead>
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