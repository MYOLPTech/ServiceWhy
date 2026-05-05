import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function EvidenceCollectionReport({ evidence = [], controls = [], onBack }) {
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

    pdf.save('Evidence-Collection-Report.pdf');
  };

  const approved = evidence.filter(e => e.status === 'approved').length;
  const pending = evidence.filter(e => e.status === 'pending_review').length;
  const rejected = evidence.filter(e => e.status === 'rejected').length;
  const expired = evidence.filter(e => e.status === 'expired').length;

  const groupByControl = evidence.reduce((acc, e) => {
    const controlId = e.control_id || 'Unlinked';
    if (!acc[controlId]) acc[controlId] = [];
    acc[controlId].push(e);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-bold">Evidence Collection Report</h1>
        <Button onClick={generatePDF} className="ml-auto">Download PDF</Button>
      </div>

      <div id="report-content" className="bg-white p-12 rounded-lg space-y-6">
        <div className="border-b pb-6">
          <h2 className="text-3xl font-bold mb-2">Evidence Collection Status Report</h2>
          <p className="text-gray-600">Status of evidence documentation for control verification</p>
          <p className="text-sm text-gray-500 mt-2">Generated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="border rounded p-3 bg-green-50">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">{approved}</p>
          </div>
          <div className="border rounded p-3 bg-yellow-50">
            <p className="text-sm text-gray-600">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-600">{pending}</p>
          </div>
          <div className="border rounded p-3 bg-red-50">
            <p className="text-sm text-gray-600">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{rejected}</p>
          </div>
          <div className="border rounded p-3 bg-gray-50">
            <p className="text-sm text-gray-600">Expired</p>
            <p className="text-2xl font-bold text-gray-600">{expired}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold">Evidence by Control</h3>
          {Object.entries(groupByControl).map(([controlId, items]) => (
            <div key={controlId} className="border rounded p-4">
              <h4 className="font-semibold mb-2">Control: {controlId}</h4>
              <div className="space-y-2">
                {items.map((e, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium">{e.title}</p>
                      {e.file_name && <p className="text-xs text-gray-600">File: {e.file_name}</p>}
                    </div>
                    <div className="text-right ml-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold bg-${e.status === 'approved' ? 'green' : e.status === 'pending_review' ? 'yellow' : e.status === 'rejected' ? 'red' : 'gray'}-100 text-${e.status === 'approved' ? 'green' : e.status === 'pending_review' ? 'yellow' : e.status === 'rejected' ? 'red' : 'gray'}-700`}>
                        {e.status?.replace(/_/g, ' ') || 'N/A'}
                      </span>
                      {e.expiry_date && <p className="text-xs text-gray-500 mt-1">Expires: {e.expiry_date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-green-50 border border-green-200 rounded p-4">
          <h3 className="font-semibold mb-2">Evidence Documentation</h3>
          <p className="text-sm text-gray-700">
            We maintain comprehensive evidence documentation to demonstrate control implementation and effectiveness. 
            All evidence is reviewed, approved, and monitored for expiry to ensure ongoing compliance.
          </p>
        </div>

        <div className="border-t pt-4 text-xs text-gray-500">
          <p>This report provides a snapshot of evidence collection status as of {new Date().toLocaleDateString()}.</p>
        </div>
      </div>
    </div>
  );
}