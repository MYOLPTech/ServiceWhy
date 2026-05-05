import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function VendorDetailReport({ vendor, open, onOpenChange }) {
  if (!vendor) return null;

  const generatePDF = async () => {
    const reportElement = document.getElementById('vendor-report-content');
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

    pdf.save(`${vendor.name}-Report.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <DialogTitle>{vendor.name} - Full Report</DialogTitle>
            <Button size="sm" onClick={generatePDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4">
          <div id="vendor-report-content" className="bg-white p-8 space-y-6">
            {/* Header */}
            <div className="border-b pb-4">
              <h1 className="text-3xl font-bold">{vendor.name}</h1>
              <p className="text-gray-600">{vendor.description || 'No description'}</p>
              <div className="flex gap-4 mt-3 text-sm">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{vendor.vendor_id}</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">{vendor.category?.replace(/_/g, ' ') || 'N/A'}</span>
                <span className={`px-2 py-1 rounded text-white bg-${vendor.status === 'active' ? 'green' : vendor.status === 'under_review' ? 'yellow' : 'red'}-600`}>
                  {vendor.status?.replace(/_/g, ' ') || 'N/A'}
                </span>
              </div>
            </div>

            {/* Core Information */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Contact Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Primary Contact:</strong> {vendor.primary_contact || 'N/A'}</p>
                  <p><strong>Email:</strong> {vendor.contact_email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {vendor.contact_phone || 'N/A'}</p>
                  <p><strong>Website:</strong> {vendor.website ? <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{vendor.website}</a> : 'N/A'}</p>
                  <p><strong>Owner:</strong> {vendor.owner || 'N/A'}</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Business Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Criticality:</strong> {vendor.criticality?.charAt(0).toUpperCase() + vendor.criticality?.slice(1) || 'N/A'}</p>
                  <p><strong>Data Access Level:</strong> {vendor.data_access_level?.replace(/_/g, ' ') || 'N/A'}</p>
                  <p><strong>Contract Status:</strong> {vendor.contract_status?.replace(/_/g, ' ') || 'N/A'}</p>
                  <p><strong>Compliance Status:</strong> {vendor.compliance_status?.replace(/_/g, ' ') || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div>
              <h3 className="font-bold text-lg mb-3 pb-2 border-b">Risk Assessment</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="border rounded p-3">
                  <p className="text-sm text-gray-600">Risk Level</p>
                  <p className={`text-2xl font-bold text-${vendor.risk_level}-600`}>{vendor.risk_level?.toUpperCase() || 'N/A'}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm text-gray-600">Risk Score</p>
                  <p className="text-2xl font-bold">{vendor.risk_score || 0}/100</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm text-gray-600">Due Diligence</p>
                  <p className="text-sm font-semibold">{vendor.due_diligence_status?.replace(/_/g, ' ') || 'N/A'}</p>
                </div>
              </div>
              {vendor.risk_assessment && (
                <div className="mb-3">
                  <p className="text-sm font-semibold mb-1">Risk Assessment:</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{vendor.risk_assessment}</p>
                </div>
              )}
              {vendor.mitigation_strategy && (
                <div>
                  <p className="text-sm font-semibold mb-1">Mitigation Strategy:</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{vendor.mitigation_strategy}</p>
                </div>
              )}
            </div>

            {/* Contractual Information */}
            <div>
              <h3 className="font-bold text-lg mb-3 pb-2 border-b">Contract & SLA</h3>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="text-sm">
                  <p className="text-gray-600">Start Date</p>
                  <p className="font-semibold">{vendor.contract_start_date || 'N/A'}</p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-600">End Date</p>
                  <p className="font-semibold">{vendor.contract_end_date || 'N/A'}</p>
                </div>
              </div>
              {vendor.sla_coverage && (
                <div className="text-sm">
                  <p className="text-gray-600 mb-1">SLA Coverage & Terms</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{vendor.sla_coverage}</p>
                </div>
              )}
            </div>

            {/* Audit Information */}
            <div>
              <h3 className="font-bold text-lg mb-3 pb-2 border-b">Audit Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Last Audit</p>
                  <p className="font-semibold">{vendor.last_audit_date || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Next Audit</p>
                  <p className="font-semibold">{vendor.next_audit_date || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Due Diligence Date</p>
                  <p className="font-semibold">{vendor.due_diligence_date || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Certifications */}
            {vendor.certifications && vendor.certifications.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Certifications</h3>
                <div className="space-y-2">
                  {vendor.certifications.map((cert, idx) => (
                    <div key={idx} className="border rounded p-3 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold">{cert.name}</p>
                        <span className={`px-2 py-1 rounded text-xs font-semibold bg-${cert.status === 'certified' ? 'green' : cert.status === 'expired' ? 'red' : 'yellow'}-100 text-${cert.status === 'certified' ? 'green' : cert.status === 'expired' ? 'red' : 'yellow'}-700`}>
                          {cert.status?.replace(/_/g, ' ') || 'N/A'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        {cert.issue_date && <p>Issued: {cert.issue_date}</p>}
                        {cert.expiry_date && <p>Expires: {cert.expiry_date}</p>}
                      </div>
                      {cert.certificate_url && <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs underline mt-1 inline-block">View Certificate</a>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applicable Frameworks */}
            {vendor.applicable_frameworks && vendor.applicable_frameworks.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Applicable Frameworks</h3>
                <div className="flex flex-wrap gap-2">
                  {vendor.applicable_frameworks.map(fw => (
                    <span key={fw} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {fw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {vendor.notes && (
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Additional Notes</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{vendor.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t pt-4 text-xs text-gray-500">
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p>This is a confidential vendor assessment report.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}