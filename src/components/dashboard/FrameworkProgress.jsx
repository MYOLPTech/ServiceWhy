import React from 'react';
import { cn } from '@/lib/utils';

const frameworkMeta = {
  SOC2: { name: 'SOC 2 Type II', color: 'text-blue-600', bg: 'bg-blue-600', lightBg: 'bg-blue-50', border: 'border-blue-200' },
  ASAE3150: { name: 'ASAE 3150', color: 'text-emerald-600', bg: 'bg-emerald-600', lightBg: 'bg-emerald-50', border: 'border-emerald-200' },
  ISO27001: { name: 'ISO 27001', color: 'text-violet-600', bg: 'bg-violet-600', lightBg: 'bg-violet-50', border: 'border-violet-200' },
};

export default function FrameworkProgress({ framework, controls }) {
  const meta = frameworkMeta[framework];
  const total = controls.length;
  const implemented = controls.filter(c => c.status === 'implemented' || c.status === 'verified').length;
  const inProgress = controls.filter(c => c.status === 'in_progress').length;
  const percent = total > 0 ? Math.round((implemented / total) * 100) : 0;

  return (
    <div className={cn("bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300")}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={cn("text-sm font-bold", meta.color)}>{meta.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{total} controls total</p>
        </div>
        <div className={cn("w-14 h-14 rounded-full flex items-center justify-center border-4", meta.border, meta.lightBg)}>
          <span className={cn("text-sm font-bold", meta.color)}>{percent}%</span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
        <div className={cn("h-full rounded-full transition-all duration-700", meta.bg)} style={{ width: `${percent}%` }} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="py-2 px-1 rounded-lg bg-muted/50">
          <p className="text-lg font-bold">{implemented}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Done</p>
        </div>
        <div className="py-2 px-1 rounded-lg bg-muted/50">
          <p className="text-lg font-bold">{inProgress}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Active</p>
        </div>
        <div className="py-2 px-1 rounded-lg bg-muted/50">
          <p className="text-lg font-bold">{total - implemented - inProgress}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pending</p>
        </div>
      </div>
    </div>
  );
}