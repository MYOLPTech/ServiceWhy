import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function RiskAssessmentReport({ risks = [], onBack }) {
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

    pdf.save('Risk-Assessment-Report.pdf');
  };

  const sortedRisks = [...risks].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
  const riskLevel = (score) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-bold">Risk Assessment Report</h1>
        <Button onClick={generatePDF} className="ml-auto">Download PDF</Button>
      </div>

      <div id="report-content" className="bg-white p-12 rounded-lg space-y-6">
        <div className="border-b pb-6">
          <h2 className="text-3xl font-bold mb-2">Risk Assessment Report</h2>
          <p className="text-gray-600">Comprehensive risk inventory with mitigation strategies</p>
          <p className="text-sm text-gray-500 mt-2">Generated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[{ label: 'Critical', color: 'red', count: sortedRisks.filter(r => riskLevel(r.risk_score || 0) === 'Critical').length },
            { label: 'High', color: 'orange', count: sortedRisks.filter(r => riskLevel(r.risk_score || 0) === 'High').length },
            { label: 'Medium', color: 'yellow', count: sortedRisks.filter(r => riskLevel(r.risk_score || 0) === 'Medium').length },
            { label: 'Low', color: 'green', count: sortedRisks.filter(r => riskLevel(r.risk_score || 0) === 'Low').length }
          ].map(cat => (
            <div key={cat.label} className={`border rounded p-3 bg-${cat.color}-50`}>
              <p className="text-sm text-gray-600">{cat.label}</p>
              <p className={`text-2xl font-bold text-${cat.color}-600`}>{cat.count}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold">Risk Inventory</h3>
          {sortedRisks.map(r => (
            <div key={r.id} className="border rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold">{r.risk_id || 'N/A'}: {r.title}</h4>
                <span className={`px-2 py-1 rounded text-xs font-semibold bg-${riskLevel(r.risk_score || 0).toLowerCase()}-100 text-${riskLevel(r.risk_score || 0).toLowerCase()}-700`}>
                  {riskLevel(r.risk_score || 0)} ({r.risk_score || 0})
                </span>
              </div>
              {r.description && <p className="text-sm text-gray-600 mb-2">{r.description}</p>}
              {r.treatment_plan && (
                <div className="text-sm mt-2">
                  <p className="font-semibold">Mitigation: {r.treatment || 'N/A'}</p>
                  <p className="text-gray-600">{r.treatment_plan}</p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">Status: {r.status?.replace(/_/g, ' ') || 'N/A'}</p>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 text-xs text-gray-500">
          <p>This risk assessment is part of our ongoing compliance and risk management program.</p>
        </div>
      </div>
    </div>
  );
}