import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function ComplianceStatusReport({ controls = [], risks = [], onBack }) {
  const frameworks = ['SOC2', 'ISO27001', 'ASAE3150'];
  
  const getFrameworkStats = (framework) => {
    const fwControls = controls.filter(c => c.framework === framework);
    const implemented = fwControls.filter(c => c.status === 'implemented' || c.status === 'verified').length;
    const inProgress = fwControls.filter(c => c.status === 'in_progress').length;
    const notStarted = fwControls.filter(c => c.status === 'not_started').length;
    return { total: fwControls.length, implemented, inProgress, notStarted, percentage: Math.round((implemented / fwControls.length) * 100) || 0 };
  };

  const getRiskStats = () => {
    const critical = risks.filter(r => r.risk_score >= 80).length;
    const high = risks.filter(r => r.risk_score >= 60 && r.risk_score < 80).length;
    const medium = risks.filter(r => r.risk_score >= 40 && r.risk_score < 60).length;
    return { total: risks.length, critical, high, medium };
  };

  const generatePDF = async () => {
    const reportElement = document.getElementById('report-content');
    if (!reportElement) return;

    const canvas = await html2canvas(reportElement, { scale: 2, logging: false });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= 270;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= 270;
    }

    pdf.save('Compliance-Status-Report.pdf');
  };

  const riskStats = getRiskStats();

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-bold">Compliance Status Report</h1>
        <Button onClick={generatePDF} className="ml-auto">Download PDF</Button>
      </div>

      <div id="report-content" className="bg-white p-12 rounded-lg space-y-8">
        {/* Header */}
        <div className="border-b pb-6">
          <h2 className="text-3xl font-bold mb-2">Compliance Status Report</h2>
          <p className="text-gray-600">Executive Summary for Certification Review</p>
          <p className="text-sm text-gray-500 mt-2">Generated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Framework Overview */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Framework Compliance Status</h3>
          <div className="space-y-4">
            {frameworks.map(fw => {
              const stats = getFrameworkStats(fw);
              if (stats.total === 0) return null;
              return (
                <div key={fw} className="border rounded p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">{fw}</h4>
                    <span className="text-2xl font-bold text-green-600">{stats.percentage}%</span>
                  </div>
                  <div className="bg-gray-100 rounded h-3 overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-green-500" style={{ width: `${(stats.implemented / stats.total) * 100}%` }} />
                      <div className="bg-yellow-500" style={{ width: `${(stats.inProgress / stats.total) * 100}%` }} />
                      <div className="bg-red-200" style={{ width: `${(stats.notStarted / stats.total) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-6 mt-2 text-sm">
                    <div>Implemented: <strong>{stats.implemented}/{stats.total}</strong></div>
                    <div>In Progress: <strong>{stats.inProgress}/{stats.total}</strong></div>
                    <div>Not Started: <strong>{stats.notStarted}/{stats.total}</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Overview */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Risk Assessment Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded p-4 bg-red-50">
              <p className="text-sm text-gray-600">Critical Risks</p>
              <p className="text-3xl font-bold text-red-600">{riskStats.critical}</p>
            </div>
            <div className="border rounded p-4 bg-orange-50">
              <p className="text-sm text-gray-600">High Risks</p>
              <p className="text-3xl font-bold text-orange-600">{riskStats.high}</p>
            </div>
            <div className="border rounded p-4 bg-yellow-50">
              <p className="text-sm text-gray-600">Medium Risks</p>
              <p className="text-3xl font-bold text-yellow-600">{riskStats.medium}</p>
            </div>
            <div className="border rounded p-4 bg-blue-50">
              <p className="text-sm text-gray-600">Total Risks</p>
              <p className="text-3xl font-bold text-blue-600">{riskStats.total}</p>
            </div>
          </div>
        </div>

        {/* Compliance Statement */}
        <div className="bg-blue-50 border border-blue-200 rounded p-6">
          <h3 className="font-semibold mb-2">Compliance Statement</h3>
          <p className="text-sm text-gray-700">
            This report demonstrates our organization's commitment to compliance with applicable frameworks and regulations. 
            We have implemented comprehensive controls, conducted risk assessments, and maintain evidence documentation to support 
            our certification objectives. All identified gaps and risks are being actively managed with documented mitigation strategies.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 text-xs text-gray-500">
          <p>This report is confidential and intended for certification authorities and authorized stakeholders only.</p>
        </div>
      </div>
    </div>
  );
}