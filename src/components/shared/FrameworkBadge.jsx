import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const frameworkStyles = {
  SOC2: 'bg-blue-50 text-blue-700 border-blue-200',
  ASAE3150: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ISO27001: 'bg-violet-50 text-violet-700 border-violet-200',
  All: 'bg-slate-100 text-slate-600 border-slate-200',
};

const frameworkLabels = {
  SOC2: 'SOC 2',
  ASAE3150: 'ASAE 3150',
  ISO27001: 'ISO 27001',
  All: 'All',
};

export default function FrameworkBadge({ framework }) {
  if (!framework) return null;
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium border", frameworkStyles[framework] || 'bg-muted text-muted-foreground')}>
      {frameworkLabels[framework] || framework}
    </Badge>
  );
}