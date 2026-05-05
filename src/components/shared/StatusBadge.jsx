import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles = {
  not_started: 'bg-slate-100 text-slate-600 border-slate-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  implemented: 'bg-blue-50 text-blue-700 border-blue-200',
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  not_applicable: 'bg-slate-50 text-slate-400 border-slate-200',
  pending_review: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  expired: 'bg-slate-50 text-slate-400 border-slate-200',
  open: 'bg-red-50 text-red-700 border-red-200',
  in_treatment: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  accepted: 'bg-blue-50 text-blue-700 border-blue-200',
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  in_review: 'bg-amber-50 text-amber-700 border-amber-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  retired: 'bg-slate-50 text-slate-400 border-slate-200',
  todo: 'bg-slate-100 text-slate-600 border-slate-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-blue-50 text-blue-700 border-blue-200',
};

const labelMap = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  not_applicable: 'N/A',
  pending_review: 'Pending Review',
  in_treatment: 'In Treatment',
  in_review: 'In Review',
  audit_prep: 'Audit Prep',
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  const label = labelMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium border", statusStyles[status] || 'bg-muted text-muted-foreground')}>
      {label}
    </Badge>
  );
}