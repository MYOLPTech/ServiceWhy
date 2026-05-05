import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PolicyContentViewer({ policy, onClose }) {
  if (!policy) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">{policy.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Version {policy.version || '1.0'} · {policy.owner || 'Unassigned'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          {policy.policy_content ? (
            <div
              className="prose prose-sm max-w-none text-foreground
                prose-headings:text-foreground prose-headings:font-semibold
                prose-h1:text-2xl prose-h1:border-b prose-h1:pb-3 prose-h1:mb-6
                prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
                prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
                prose-p:text-sm prose-p:leading-relaxed prose-p:text-muted-foreground
                prose-li:text-sm prose-li:text-muted-foreground
                prose-strong:text-foreground
                prose-table:text-sm
                prose-th:bg-muted prose-th:text-foreground prose-th:font-medium
                prose-td:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: policy.policy_content }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <p className="text-sm">No policy content written yet.</p>
              <p className="text-xs mt-1">Edit this policy to add the full policy document.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}