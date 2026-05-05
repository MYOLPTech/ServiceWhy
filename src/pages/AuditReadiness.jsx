import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ClipboardCheck, Shield, FileCheck, AlertTriangle, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

function ChecklistSection({ title, items, color }) {
  const completed = items.filter(i => i.met).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn("text-sm font-bold", color)}>{title}</h3>
        <span className="text-xs text-muted-foreground">{completed}/{total} met</span>
      </div>
      <Progress value={pct} className="h-2 mb-4" />
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            {item.met ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuditReadiness() {
  const { data: controls = [] } = useQuery({ queryKey: ['controls'], queryFn: () => base44.entities.Control.list() });
  const { data: evidence = [] } = useQuery({ queryKey: ['evidence'], queryFn: () => base44.entities.Evidence.list() });
  const { data: risks = [] } = useQuery({ queryKey: ['risks'], queryFn: () => base44.entities.Risk.list() });
  const { data: policies = [] } = useQuery({ queryKey: ['policies'], queryFn: () => base44.entities.Policy.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list() });

  const buildChecklist = (framework) => {
    const fwControls = controls.filter(c => c.framework === framework);
    const fwEvidence = evidence.filter(e => {
      const ctrl = controls.find(c => c.id === e.control_id);
      return ctrl?.framework === framework;
    });
    const fwPolicies = policies.filter(p => (p.frameworks || []).includes(framework));
    const fwTasks = tasks.filter(t => t.framework === framework || t.framework === 'All');

    const implementedControls = fwControls.filter(c => c.status === 'implemented' || c.status === 'verified');
    const approvedEvidence = fwEvidence.filter(e => e.status === 'approved');
    const publishedPolicies = fwPolicies.filter(p => p.status === 'published' || p.status === 'approved');
    const completedTasks = fwTasks.filter(t => t.status === 'completed');
    const openRisks = risks.filter(r => r.status === 'open');

    return [
      {
        label: 'Controls Implemented',
        detail: `${implementedControls.length} of ${fwControls.length} controls are implemented or verified`,
        met: fwControls.length > 0 && implementedControls.length === fwControls.length,
      },
      {
        label: 'Evidence Collected & Approved',
        detail: `${approvedEvidence.length} of ${fwEvidence.length} evidence items approved`,
        met: fwEvidence.length > 0 && approvedEvidence.length >= fwControls.length * 0.8,
      },
      {
        label: 'Policies Published',
        detail: `${publishedPolicies.length} of ${fwPolicies.length} policies published`,
        met: fwPolicies.length > 0 && publishedPolicies.length === fwPolicies.length,
      },
      {
        label: 'Tasks Completed',
        detail: `${completedTasks.length} of ${fwTasks.length} tasks completed`,
        met: fwTasks.length > 0 && completedTasks.length === fwTasks.length,
      },
      {
        label: 'No Critical Open Risks',
        detail: `${openRisks.length} open risk(s) remaining`,
        met: openRisks.length === 0,
      },
    ];
  };

  const soc2Items = buildChecklist('SOC2');
  const asaeItems = buildChecklist('ASAE3150');
  const isoItems = buildChecklist('ISO27001');

  const allItems = [...soc2Items, ...asaeItems, ...isoItems];
  const totalMet = allItems.filter(i => i.met).length;
  const overallPct = allItems.length > 0 ? Math.round((totalMet / allItems.length) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Audit Readiness"
        description="Assess your readiness for compliance audits across all frameworks"
      />

      {/* Overall Score */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-8 mb-8 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-primary/20 mb-4">
          <span className="text-3xl font-bold text-primary">{overallPct}%</span>
        </div>
        <h2 className="text-lg font-semibold">Overall Audit Readiness</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {totalMet} of {allItems.length} requirements met across all frameworks
        </p>
        <Progress value={overallPct} className="h-3 max-w-md mx-auto mt-4" />
      </div>

      {/* Per-Framework Checklists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChecklistSection title="SOC 2 Type II" items={soc2Items} color="text-blue-600" />
        <ChecklistSection title="ASAE 3150" items={asaeItems} color="text-emerald-600" />
        <ChecklistSection title="ISO 27001" items={isoItems} color="text-violet-600" />
      </div>
    </div>
  );
}