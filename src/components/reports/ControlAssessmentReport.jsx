import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function ControlAssessmentReport({ controls = [], onBack }) {
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

    pdf.save('Control-Assessment-Report.pdf');
  };

  const groupedControls = controls.reduce((acc, c) => {
    const fw = c.framework || 'Unknown';
    if (!acc[fw]) acc[fw] = [];
    acc[fw].push(c);
    return acc;
  }, {});

  const statusColor = (status) => {
    const colors = { 'implemented': 'green', 'verified': 'green', 'in_progress': 'yellow', 'not_started': 'red', 'not_applicable': 'gray' };
    return colors[status] || 'gray';
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-bold">Control Assessment Report</h1>
        <Button onClick={generatePDF} className="ml-auto">Download PDF</Button>
      </div>

      <div id="report-content" className="bg-white p-12 rounded-lg space-y-6">
        <div className="border-b pb-6">
          <h2 className="text-3xl font-bold mb-2">Control Assessment Report</h2>
          <p className="text-gray-600">Detailed inventory of implemented and planned controls</p>
          <p className="text-sm text-gray-500 mt-2">Generated: {new Date().toLocaleDateString()}</p>
        </div>

        {Object.entries(groupedControls).map(([framework, fwControls]) => (
          <div key={framework}>
            <h3 className="text-lg font-bold mb-3 pb-2 border-b">{framework} Controls ({fwControls.length})</h3>
            <div className="space-y-2 text-sm">
              {fwControls.map(c => (
                <div key={c.id} className="border rounded p-3 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold">{c.control_id || 'N/A'}: {c.title}</div>
                    {c.description && <p className="text-gray-600 mt-1">{c.description.substring(0, 100)}...</p>}
                    {c.owner && <p className="text-xs text-gray-500 mt-1">Owner: {c.owner}</p>}
                  </div>
                  <div className="ml-4 text-right flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded bg-${statusColor(c.status)}-100 text-${statusColor(c.status)}-700 font-semibold`}>
                      {c.status?.replace(/_/g, ' ') || 'Not Set'}
                    </span>
                    {c.target_date && <p className="text-xs text-gray-500 mt-1">Target: {c.target_date}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="border-t pt-4 text-xs text-gray-500">
          <p>This report provides detailed information on control implementation status and is confidential.</p>
        </div>
      </div>
    </div>
  );
}