import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className }) {
  return (
    <div className={cn(
      "bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
      {trend && (
        <div className={cn(
          "mt-3 text-xs font-medium flex items-center gap-1",
          trendUp ? "text-green-600" : "text-red-500"
        )}>
          <span>{trendUp ? '↑' : '↓'} {trend}</span>
        </div>
      )}
    </div>
  );
}