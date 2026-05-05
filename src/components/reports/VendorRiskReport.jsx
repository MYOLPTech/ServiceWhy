import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function VendorRiskReport({ vendors = [], onBack }) {
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

    pdf.save('Vendor-Risk-Report.pdf');
  };

  const sortedVendors = [...vendors].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-bold">Vendor Risk Report</h1>
        <Button onClick={generatePDF} className="ml-auto">Download PDF</Button>
      </div>

      <div id="report-content" className="bg-white p-12 rounded-lg space-y-6">
        <div className="border-b pb-6">
          <h2 className="text-3xl font-bold mb-2">Third-Party Vendor Risk Assessment</h2>
          <p className="text-gray-600">Vendor management and compliance status</p>
          <p className="text-sm text-gray-500 mt-2">Generated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="border rounded p-3 bg-blue-50">
            <p className="text-sm text-gray-600">Total Vendors</p>
            <p className="text-2xl font-bold text-blue-600">{vendors.length}</p>
          </div>
          <div className="border rounded p-3 bg-green-50">
            <p className="text-sm text-gray-600">Active Vendors</p>
            <p className="text-2xl font-bold text-green-600">{vendors.filter(v => v.status === 'active').length}</p>
          </div>
          <div className="border rounded p-3 bg-orange-50">
            <p className="text-sm text-gray-600">Under Review</p>
            <p className="text-2xl font-bold text-orange-600">{vendors.filter(v => v.status === 'under_review').length}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold">Vendor Risk Summary</h3>
          {sortedVendors.map(v => (
            <div key={v.id} className="border rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold">{v.vendor_id || 'N/A'}: {v.name}</h4>
                  <p className="text-sm text-gray-600">{v.category?.replace(/_/g, ' ') || 'N/A'} - {v.primary_contact || 'No contact'}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs font-semibold bg-${v.risk_level}-100 text-${v.risk_level}-700`}>
                    {v.risk_level?.toUpperCase() || 'N/A'} ({v.risk_score || 0})
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{v.compliance_status?.replace(/_/g, ' ') || 'N/A'}</p>
                </div>
              </div>
              
              <div className="text-sm space-y-1 mb-2">
                <p><strong>Data Access:</strong> {v.data_access_level?.replace(/_/g, ' ') || 'N/A'}</p>
                <p><strong>Contract:</strong> {v.contract_status?.replace(/_/g, ' ') || 'N/A'}</p>
                {v.certifications?.filter(c => c.status === 'certified').length > 0 && (
                  <p><strong>Certifications:</strong> {v.certifications.filter(c => c.status === 'certified').map(c => c.name).join(', ')}</p>
                )}
              </div>

              {v.risk_assessment && <p className="text-sm text-gray-600 border-t pt-2">{v.risk_assessment}</p>}
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="font-semibold mb-2">Third-Party Risk Management</h3>
          <p className="text-sm text-gray-700">
            We maintain a comprehensive vendor management program that includes due diligence assessments, 
            ongoing risk monitoring, contract reviews, and certification tracking. All vendors are evaluated 
            for compliance with applicable regulations and contractual obligations.
          </p>
        </div>

        <div className="border-t pt-4 text-xs text-gray-500">
          <p>This report is confidential and intended for internal stakeholders and auditors only.</p>
        </div>
      </div>
    </div>
  );
}