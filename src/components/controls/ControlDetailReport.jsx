import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function ControlDetailReport({ control, open, onOpenChange }) {
  if (!control) return null;

  const generatePDF = async () => {
    const reportElement = document.getElementById('control-report-content');
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

    pdf.save(`${control.control_id}-${control.title}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <DialogTitle>{control.control_id} - Full Report</DialogTitle>
            <Button size="sm" onClick={generatePDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4">
          <div id="control-report-content" className="bg-white p-8 space-y-6">
            {/* Header */}
            <div className="border-b pb-4">
              <h1 className="text-3xl font-bold">{control.title}</h1>
              <p className="text-gray-600 mt-1">{control.description}</p>
              <div className="flex gap-4 mt-3 text-sm">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{control.control_id}</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">{control.framework}</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">{control.category || 'N/A'}</span>
                <span className={`px-2 py-1 rounded text-white ${control.status === 'verified' ? 'bg-green-600' : control.status === 'implemented' ? 'bg-blue-600' : control.status === 'in_progress' ? 'bg-yellow-600' : 'bg-gray-600'}`}>
                  {control.status?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Core Information */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Status & Ownership</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Priority:</strong> {control.priority?.charAt(0).toUpperCase() + control.priority?.slice(1)}</p>
                  <p><strong>Owner:</strong> {control.owner || 'Not assigned'}</p>
                  <p><strong>Target Date:</strong> {control.target_date || 'Not set'}</p>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Implementation</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Type:</strong> {control.implementation_type?.charAt(0).toUpperCase() + control.implementation_type?.slice(1) || 'Not specified'}</p>
                  <p><strong>Frequency:</strong> {control.frequency || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Implementation Overview */}
            {control.implementation_overview && (
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Implementation Overview</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">{control.implementation_overview}</p>
              </div>
            )}

            {/* Implementation Steps */}
            {control.implementation_steps && control.implementation_steps.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Implementation Steps</h3>
                <div className="space-y-3">
                  {control.implementation_steps.map((step, idx) => (
                    <div key={idx} className="border rounded p-3 bg-gray-50">
                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">{idx + 1}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{step.title}</p>
                          <p className="text-sm text-gray-700 mt-1">{step.description}</p>
                          {step.responsible_role && <p className="text-xs text-gray-600 mt-2"><strong>Role:</strong> {step.responsible_role}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Automation & Manual Details */}
            {(control.automation_details || control.manual_procedures) && (
              <div className="grid grid-cols-2 gap-6">
                {control.automation_details && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 pb-2 border-b">Automation Details</h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">{control.automation_details}</p>
                  </div>
                )}
                {control.manual_procedures && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 pb-2 border-b">Manual Procedures</h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">{control.manual_procedures}</p>
                  </div>
                )}
              </div>
            )}

            {/* Testing & Validation */}
            {control.testing_and_validation && (
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Testing & Validation</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">{control.testing_and_validation}</p>
              </div>
            )}

            {/* Best Practices */}
            {control.best_practices && control.best_practices.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Best Practices</h3>
                <ul className="list-disc pl-6 space-y-1">
                  {control.best_practices.map((practice, idx) => (
                    <li key={idx} className="text-sm text-gray-700">{practice}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Common Pitfalls */}
            {control.common_pitfalls && control.common_pitfalls.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Common Pitfalls to Avoid</h3>
                <div className="space-y-2">
                  {control.common_pitfalls.map((pitfall, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <span className="text-red-600 font-bold mt-0.5">✗</span>
                      <p className="text-gray-700">{pitfall}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tools & Systems */}
            {control.tools_and_systems && control.tools_and_systems.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Recommended Tools & Systems</h3>
                <div className="flex flex-wrap gap-2">
                  {control.tools_and_systems.map((tool, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Implementation Notes */}
            {control.implementation_notes && (
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Implementation Notes</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">{control.implementation_notes}</p>
              </div>
            )}

            {/* Evidence Required */}
            {control.evidence_required && (
              <div>
                <h3 className="font-bold text-lg mb-3 pb-2 border-b">Evidence Required</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">{control.evidence_required}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t pt-4 text-xs text-gray-500">
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p>This is a confidential control implementation guide.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}