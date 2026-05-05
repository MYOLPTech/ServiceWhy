import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, BarChart3, CheckCircle2, AlertTriangle, User, Building, ClipboardList } from 'lucide-react';
import ComplianceStatusReport from '@/components/reports/ComplianceStatusReport';
import ControlAssessmentReport from '@/components/reports/ControlAssessmentReport';
import RiskAssessmentReport from '@/components/reports/RiskAssessmentReport';
import VendorRiskReport from '@/components/reports/VendorRiskReport';
import EvidenceCollectionReport from '@/components/reports/EvidenceCollectionReport';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);

  const { data: controls = [] } = useQuery({ queryKey: ['controls'], queryFn: () => base44.entities.Control.list() });
  const { data: risks = [] } = useQuery({ queryKey: ['risks'], queryFn: () => base44.entities.Risk.list() });
  const { data: vendors = [] } = useQuery({ queryKey: ['vendors'], queryFn: () => base44.entities.Vendor.list() });
  const { data: evidence = [] } = useQuery({ queryKey: ['evidence'], queryFn: () => base44.entities.Evidence.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list() });
  const { data: policies = [] } = useQuery({ queryKey: ['policies'], queryFn: () => base44.entities.Policy.list() });

  const reports = [
    {
      id: 'compliance-status',
      title: 'Compliance Status Report',
      description: 'Executive summary of compliance posture across frameworks. Shows control implementation status, compliance gaps, and remediation progress.',
      icon: CheckCircle2,
      color: 'text-green-600'
    },
    {
      id: 'control-assessment',
      title: 'Control Assessment Report',
      description: 'Detailed control inventory across SOC2, ISO27001, and ASAE3150. Includes implementation status, evidence requirements, and target dates.',
      icon: ClipboardList,
      color: 'text-blue-600'
    },
    {
      id: 'risk-assessment',
      title: 'Risk Assessment Report',
      description: 'Risk inventory with scoring, categorization, and mitigation strategies. Demonstrates risk management framework.',
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      id: 'vendor-risk',
      title: 'Vendor Risk Report',
      description: 'Third-party risk assessment including vendor certifications, due diligence status, and compliance gaps.',
      icon: Building,
      color: 'text-purple-600'
    },
    {
      id: 'evidence-collection',
      title: 'Evidence Collection Report',
      description: 'Status of evidence collection for each control. Shows pending reviews, approved evidence, and expiry dates.',
      icon: FileText,
      color: 'text-indigo-600'
    }
  ];

  const reportComponents = {
    'compliance-status': ComplianceStatusReport,
    'control-assessment': ControlAssessmentReport,
    'risk-assessment': RiskAssessmentReport,
    'vendor-risk': VendorRiskReport,
    'evidence-collection': EvidenceCollectionReport
  };

  if (selectedReport) {
    const ReportComponent = reportComponents[selectedReport];
    return (
      <ReportComponent 
        controls={controls} 
        risks={risks} 
        vendors={vendors} 
        evidence={evidence}
        tasks={tasks}
        policies={policies}
        onBack={() => setSelectedReport(null)}
      />
    );
  }

  return (
    <div className="p-6">
      <PageHeader 
        title="Compliance Reports" 
        description="Generate reports for certification, audits, and stakeholder review"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map(report => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedReport(report.id)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${report.color}`} />
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription className="mt-1">{report.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={(e) => { e.stopPropagation(); setSelectedReport(report.id); }}>
                  <Download className="w-4 h-4 mr-2" />
                  Generate PDF
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}