import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, Filter, ExternalLink, AlertTriangle, Shield, CheckSquare, ChevronDown, ChevronRight, Info, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import PageHeader from '../components/shared/PageHeader';

const FRAMEWORK_STYLES = {
  SOC2:     { bg: 'bg-blue-100 text-blue-800 border-blue-200',     dot: 'bg-blue-500',   label: 'SOC 2' },
  ISO27001: { bg: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500', label: 'ISO 27001' },
  ASAE3150: { bg: 'bg-teal-100 text-teal-800 border-teal-200',      dot: 'bg-teal-500',   label: 'ASAE 3150' },
  CDR:      { bg: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500', label: 'CDR' },
};

const STATUS_STYLES = {
  not_started:    'bg-slate-100 text-slate-700 border-slate-200',
  in_progress:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  compliant:      'bg-green-100 text-green-700 border-green-200',
  non_compliant:  'bg-red-100 text-red-700 border-red-200',
  not_applicable: 'bg-gray-100 text-gray-500 border-gray-200',
};

const STATUS_LABELS = {
  not_started:    'Not Started',
  in_progress:    'In Progress',
  compliant:      'Compliant',
  non_compliant:  'Non-Compliant',
  not_applicable: 'N/A',
};

const PRIORITY_STYLES = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-yellow-100 text-yellow-700',
  low:      'bg-slate-100 text-slate-600',
};

function LinkedItems({ ids = [], names = [], entityName, path, ItemIcon, color, obligationTitle }) {
  if (!ids || ids.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
  const href = `${path}?ids=${ids.join(',')}&from=${encodeURIComponent(obligationTitle)}`;
  const label = names.length > 0
    ? (names.length === 1 ? names[0] : `${names[0]} +${names.length - 1} more`)
    : `${ids.length} ${entityName.toLowerCase()}${ids.length !== 1 ? 's' : ''}`;
  return (
    <Link to={href} title={names.join(', ')}
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${color} hover:opacity-80 transition-opacity max-w-[200px] truncate`}>
      <ItemIcon className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function ObligationRow({ obligation, riskMap, controlMap, policyMap, taskMap }) {
  const [expanded, setExpanded] = useState(false);
  const fw = FRAMEWORK_STYLES[obligation.framework] || FRAMEWORK_STYLES.SOC2;
  const riskNames = (obligation.linked_risk_ids || []).map(id => riskMap[id]).filter(Boolean);
  const controlNames = (obligation.linked_control_ids || []).map(id => controlMap[id]).filter(Boolean);
  const policyNames = (obligation.linked_policy_ids || []).map(id => policyMap[id]).filter(Boolean);
  const taskNames = (obligation.linked_task_ids || []).map(id => taskMap[id]).filter(Boolean);

  return (
    <>
      <tr className="hover:bg-muted/20 transition-colors border-b border-border/40 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <td className="px-4 py-3 w-8">
          {expanded
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </td>
        <td className="px-2 py-3">
          <span className="font-mono text-xs text-muted-foreground">{obligation.obligation_id || '—'}</span>
        </td>
        <td className="px-2 py-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${fw.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${fw.dot}`} />
            {fw.label}
          </span>
        </td>
        <td className="px-2 py-3 max-w-xs">
          <div className="font-medium text-sm">{obligation.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{obligation.category}</div>
        </td>
        <td className="px-2 py-3">
          <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[obligation.status]}`}>
            {STATUS_LABELS[obligation.status]}
          </span>
        </td>
        <td className="px-2 py-3">
          <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[obligation.priority]}`}>
            {obligation.priority}
          </span>
        </td>
        <td className="px-2 py-3 text-sm text-muted-foreground">{obligation.owner || '—'}</td>
        <td className="px-2 py-3 text-xs text-muted-foreground font-mono">{obligation.source_reference || '—'}</td>
        <td className="px-2 py-3">
         <div className="flex flex-col gap-1">
           <LinkedItems ids={obligation.linked_risk_ids} names={riskNames} entityName="Risk" path="/risks" ItemIcon={AlertTriangle} color="border-red-200 text-red-700 bg-red-50" obligationTitle={obligation.title} />
           <LinkedItems ids={obligation.linked_control_ids} names={controlNames} entityName="Control" path="/controls" ItemIcon={Shield} color="border-blue-200 text-blue-700 bg-blue-50" obligationTitle={obligation.title} />
           <LinkedItems ids={obligation.linked_policy_ids} names={policyNames} entityName="Policy" path="/policies" ItemIcon={FileText} color="border-purple-200 text-purple-700 bg-purple-50" obligationTitle={obligation.title} />
           <LinkedItems ids={obligation.linked_task_ids} names={taskNames} entityName="Task" path="/tasks" ItemIcon={CheckSquare} color="border-green-200 text-green-700 bg-green-50" obligationTitle={obligation.title} />
         </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-muted/10 border-b border-border/40">
          <td colSpan={9} className="px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Obligation Description</h4>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{obligation.description}</p>
              </div>
              {obligation.evidence_notes && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Evidence Required</h4>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{obligation.evidence_notes}</p>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              {(obligation.linked_risk_ids?.length > 0) && (
                <Link to={`/risks?ids=${obligation.linked_risk_ids.join(',')}&from=${encodeURIComponent(obligation.title)}`} className="inline-flex items-center gap-1 text-red-600 hover:underline font-medium">
                  <AlertTriangle className="w-3 h-3" /> View {obligation.linked_risk_ids.length} linked risk{obligation.linked_risk_ids.length > 1 ? 's' : ''}
                </Link>
              )}
              {(obligation.linked_control_ids?.length > 0) && (
               <Link to={`/controls?ids=${obligation.linked_control_ids.join(',')}&from=${encodeURIComponent(obligation.title)}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium">
                 <Shield className="w-3 h-3" /> View {obligation.linked_control_ids.length} linked control{obligation.linked_control_ids.length > 1 ? 's' : ''}
               </Link>
              )}
              {(obligation.linked_policy_ids?.length > 0) && (
               <Link to={`/policies?ids=${obligation.linked_policy_ids.join(',')}&from=${encodeURIComponent(obligation.title)}`} className="inline-flex items-center gap-1 text-purple-600 hover:underline font-medium">
                 <FileText className="w-3 h-3" /> View {obligation.linked_policy_ids.length} linked polic{obligation.linked_policy_ids.length > 1 ? 'ies' : 'y'}
               </Link>
              )}
              {(obligation.linked_task_ids?.length > 0) && (
                <Link to={`/tasks?ids=${obligation.linked_task_ids.join(',')}&from=${encodeURIComponent(obligation.title)}`} className="inline-flex items-center gap-1 text-green-600 hover:underline font-medium">
                  <CheckSquare className="w-3 h-3" /> View {obligation.linked_task_ids.length} linked task{obligation.linked_task_ids.length > 1 ? 's' : ''}
                </Link>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ObligationRegister() {
  const [search, setSearch] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: obligations = [], isLoading } = useQuery({
    queryKey: ['obligations'],
    queryFn: () => base44.entities.Obligation.list('-created_date'),
  });

  const { data: allRisks = [] } = useQuery({ queryKey: ['risks'], queryFn: () => base44.entities.Risk.list() });
  const { data: allControls = [] } = useQuery({ queryKey: ['controls'], queryFn: () => base44.entities.Control.list() });
  const { data: allPolicies = [] } = useQuery({ queryKey: ['policies'], queryFn: () => base44.entities.Policy.list() });
  const { data: allTasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list() });
  
  const risks = allRisks.filter(r => !r.is_deleted);
  const controls = allControls.filter(c => !c.is_deleted);
  const policies = allPolicies.filter(p => !p.is_deleted);
  const tasks = allTasks.filter(t => !t.is_deleted);

  const riskMap = Object.fromEntries(risks.map(r => [r.id, r.title]));
  const controlMap = Object.fromEntries(controls.map(c => [c.id, c.title]));
  const policyMap = Object.fromEntries(policies.map(p => [p.id, p.title]));
  const taskMap = Object.fromEntries(tasks.map(t => [t.id, t.title]));

  const grouped = ['SOC2', 'ISO27001', 'ASAE3150', 'CDR'].reduce((acc, fw) => {
    acc[fw] = obligations.filter(o => {
      const matchesFw = frameworkFilter === 'all' || o.framework === frameworkFilter;
      const matchesSearch = !search || o.title?.toLowerCase().includes(search.toLowerCase()) || o.obligation_id?.toLowerCase().includes(search.toLowerCase()) || o.category?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return o.framework === fw && matchesFw && matchesSearch && matchesStatus;
    });
    return acc;
  }, {});

  const totalCompliant = obligations.filter(o => o.status === 'compliant').length;
  const totalNonCompliant = obligations.filter(o => o.status === 'non_compliant').length;
  const totalInProgress = obligations.filter(o => o.status === 'in_progress').length;

  const frameworksToShow = frameworkFilter === 'all'
    ? ['SOC2', 'ISO27001', 'ASAE3150', 'CDR']
    : [frameworkFilter];

  return (
    <div>
      <PageHeader
        title="Obligation Register"
        description="Track compliance obligations across SOC 2, ISO 27001, ASAE 3150, and CDR accreditation — linked to risks, controls, and tasks."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Obligations', value: obligations.length, color: 'text-foreground', bg: 'bg-card' },
          { label: 'Compliant', value: totalCompliant, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'In Progress', value: totalInProgress, color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Non-Compliant', value: totalNonCompliant, color: 'text-red-700', bg: 'bg-red-50' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl border border-border/50 p-4 shadow-sm`}>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search obligations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
          <SelectTrigger className="w-44"><Filter className="w-3 h-3 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frameworks</SelectItem>
            <SelectItem value="SOC2">SOC 2</SelectItem>
            <SelectItem value="ISO27001">ISO 27001</SelectItem>
            <SelectItem value="ASAE3150">ASAE 3150</SelectItem>
            <SelectItem value="CDR">CDR Accreditation</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="compliant">Compliant</SelectItem>
            <SelectItem value="non_compliant">Non-Compliant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-500" /> Risk link</span>
        <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-500" /> Control link</span>
        <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-purple-500" /> Policy link</span>
        <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3 text-green-500" /> Task link</span>
        <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Click any row to expand details</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {frameworksToShow.map(fw => {
            const items = grouped[fw] || [];
            if (items.length === 0) return null;
            const style = FRAMEWORK_STYLES[fw];
            const compliant = items.filter(o => o.status === 'compliant').length;
            const pct = items.length > 0 ? Math.round((compliant / items.length) * 100) : 0;
            return (
              <div key={fw} className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${style.dot}`} />
                    <h2 className="font-semibold text-base">{style.label} Obligations</h2>
                    <span className="text-xs text-muted-foreground">({items.length} obligations)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground">{compliant}/{items.length} compliant</div>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-green-700">{pct}%</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 text-left">
                        <th className="px-4 py-3 w-8" />
                        <th className="px-2 py-3 text-xs font-semibold text-muted-foreground w-28">ID</th>
                        <th className="px-2 py-3 text-xs font-semibold text-muted-foreground w-28">Framework</th>
                        <th className="px-2 py-3 text-xs font-semibold text-muted-foreground">Obligation</th>
                        <th className="px-2 py-3 text-xs font-semibold text-muted-foreground w-28">Status</th>
                        <th className="px-2 py-3 text-xs font-semibold text-muted-foreground w-24">Priority</th>
                        <th className="px-2 py-3 text-xs font-semibold text-muted-foreground w-32">Owner</th>
                        <th className="px-2 py-3 text-xs font-semibold text-muted-foreground w-32">Reference</th>
                        <th className="px-2 py-3 text-xs font-semibold text-muted-foreground">Linked Items</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(o => <ObligationRow key={o.id} obligation={o} riskMap={riskMap} controlMap={controlMap} policyMap={policyMap} taskMap={taskMap} />)}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}