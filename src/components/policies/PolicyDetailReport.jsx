import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

export default function PolicyDetailReport({ policy, open, onOpenChange }) {
  if (!policy) return null;

  const generatePDF = async () => {
    const reportElement = document.getElementById('policy-report-content');
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

    pdf.save(`${policy.policy_id}-${policy.title}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <DialogTitle>{policy.policy_id} - Full Report</DialogTitle>
            <Button size="sm" onClick={generatePDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4">
          <div id="policy-report-content" className="bg-white p-8 space-y-6">
            {/* Header */}
            <div className="border-b pb-4">
              <h1 className="text-3xl font-bold">{policy.title}</h1>
              <p className="text-gray-600 mt-1">{policy.description}</p>
              <div className="flex gap-4 mt-3 text-sm flex-wrap">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{policy.policy_id}</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">{policy.category?.replace(/_/g, ' ')}</span>
                {policy.frameworks && policy.frameworks.map(fw => (
                  <span key={fw} className="px-2 py-1 bg-gray-100 text-gray-700 rounded">{fw === 'SOC2' ? 'SOC 2' : fw === 'ASAE3150' ? 'ASAE 3150' : 'ISO 27001'}</span>
                ))}
                <span className={`px-2 py-1 rounded text-white ${policy.status === 'published' ? 'bg-green-600' : policy.status === 'approved' ? 'bg-blue-600' : policy.status === 'in_review' ? 'bg-yellow-600' : policy.status === 'retired' ? 'bg-red-600' : 'bg-gray-600'}`}>
                  {policy.status?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Policy Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Version:</strong> {policy.version || 'Not specified'}</p>
                  <p><strong>Owner:</strong> {policy.owner || 'Not assigned'}</p>
                  <p><strong>Approver:</strong> {policy.approver || 'Not assigned'}</p>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Dates</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Approved Date:</strong> {policy.approved_date ? format(new Date(policy.approved_date), 'MMM d, yyyy') : 'Not set'}</p>
                  <p><strong>Review Date:</strong> {policy.review_date ? format(new Date(policy.review_date), 'MMM d, yyyy') : 'Not set'}</p>
                </div>
              </div>
            </div>

            {/* Policy Content */}
            {policy.policy_content && (
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Policy Document</h3>
                <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: policy.policy_content }} />
              </div>
            )}

            {/* File Reference */}
            {policy.file_url && (
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Attached Document</h3>
                <p className="text-sm text-gray-700">
                  <a href={policy.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View attached document
                  </a>
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t pt-4 text-xs text-gray-500">
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p>This is a confidential policy document.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}