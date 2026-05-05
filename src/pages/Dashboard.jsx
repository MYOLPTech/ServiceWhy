import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, FileCheck, AlertTriangle, CheckSquare, FileText, ArrowRight, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import StatCard from '../components/dashboard/StatCard';
import FrameworkProgress from '../components/dashboard/FrameworkProgress';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import FrameworkBadge from '../components/shared/FrameworkBadge';
import { format } from 'date-fns';

export default function Dashboard() {
  const [datapumpLoading, setDatapumpLoading] = useState(false);

  const { data: controls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list(),
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });
  const { data: risks = [] } = useQuery({
    queryKey: ['risks'],
    queryFn: () => base44.entities.Risk.list(),
  });
  const { data: allPolicies = [] } = useQuery({
    queryKey: ['policies'],
    queryFn: () => base44.entities.Policy.list(),
  });
  const policies = allPolicies.filter(p => !p.is_deleted);
  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.entities.Evidence.list(),
  });

  const handleDatapump = async () => {
    setDatapumpLoading(true);
    try {
      const response = await base44.functions.invoke('datapump', {});
      const { files } = response.data;

      // Create downloadable files
      for (const [key, fileData] of Object.entries(files)) {
        const blob = new Blob([fileData.content], { type: key === 'json' ? 'application/json' : 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast.success('Data export generated and downloaded');
    } catch (error) {
      toast.error('Failed to generate data export');
    } finally {
      setDatapumpLoading(false);
    }
  };

  const implementedControls = controls.filter(c => c.status === 'implemented' || c.status === 'verified').length;
  const openRisks = risks.filter(r => r.status === 'open' || r.status === 'in_treatment').length;
  const pendingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length;
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length;

  const soc2Controls = controls.filter(c => c.framework === 'SOC2');
  const asaeControls = controls.filter(c => c.framework === 'ASAE3150');
  const isoControls = controls.filter(c => c.framework === 'ISO27001');

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Compliance Dashboard"
        description="Monitor your SOC 2, ASAE 3150, and ISO 27001 compliance journey"
        actions={
          <Button onClick={handleDatapump} disabled={datapumpLoading} className="gap-2">
            <Database className="w-4 h-4" />
            {datapumpLoading ? 'Generating...' : 'DATAPUMP'}
          </Button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Controls"
          value={`${implementedControls}/${controls.length}`}
          subtitle="Implemented"
          icon={Shield}
        />
        <StatCard
          title="Open Risks"
          value={openRisks}
          subtitle={`of ${risks.length} total`}
          icon={AlertTriangle}
        />
        <StatCard
          title="Pending Tasks"
          value={pendingTasks}
          subtitle={overdueTasks > 0 ? `${overdueTasks} overdue` : 'On track'}
          icon={CheckSquare}
        />
        <StatCard
          title="Evidence"
          value={evidence.length}
          subtitle={`${evidence.filter(e => e.status === 'approved').length} approved`}
          icon={FileCheck}
        />
      </div>

      {/* Framework Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <FrameworkProgress framework="SOC2" controls={soc2Controls} />
        <FrameworkProgress framework="ASAE3150" controls={asaeControls} />
        <FrameworkProgress framework="ISO27001" controls={isoControls} />
      </div>

      {/* Recent Tasks & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <h3 className="text-sm font-semibold">Recent Tasks</h3>
            <Link to="/tasks" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/50">
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground p-5 text-center">No tasks yet</p>
            ) : (
              recentTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {task.framework && <FrameworkBadge framework={task.framework} />}
                      {task.due_date && (
                        <span className="text-[11px] text-muted-foreground">
                          Due {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5">
          <h3 className="text-sm font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { icon: Shield, label: 'Manage Controls', path: '/controls', desc: `${controls.length} controls` },
              { icon: FileCheck, label: 'Upload Evidence', path: '/evidence', desc: `${evidence.length} items` },
              { icon: AlertTriangle, label: 'Risk Register', path: '/risks', desc: `${openRisks} open` },
              { icon: FileText, label: 'View Policies', path: '/policies', desc: `${policies.length} policies` },
              { icon: CheckSquare, label: 'Track Tasks', path: '/tasks', desc: `${pendingTasks} pending` },
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}