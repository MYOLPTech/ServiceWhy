import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

export default function ImportProgressDialog({ open, status, progress, totals, currentPhase, errors }) {
  const pct = totals && totals.total > 0 ? Math.round((progress / totals.total) * 100) : 0;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Importing Excel</DialogTitle>
          <DialogDescription>{status}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Progress value={pct} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentPhase}</span>
            <span>{progress} / {totals?.total ?? '?'} ({pct}%)</span>
          </div>

          {totals && (
            <div className="grid grid-cols-3 gap-2 text-xs pt-2">
              <div className="rounded-md bg-muted p-2 text-center">
                <div className="font-semibold">{totals.create}</div>
                <div className="text-muted-foreground">to create</div>
              </div>
              <div className="rounded-md bg-muted p-2 text-center">
                <div className="font-semibold">{totals.update}</div>
                <div className="text-muted-foreground">to update</div>
              </div>
              <div className="rounded-md bg-muted p-2 text-center">
                <div className="font-semibold">{totals.skip}</div>
                <div className="text-muted-foreground">unchanged</div>
              </div>
            </div>
          )}

          {errors?.length > 0 && (
            <div className="text-xs text-destructive max-h-24 overflow-y-auto border border-destructive/30 rounded p-2">
              {errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
              {errors.length > 5 && <div className="text-muted-foreground">+{errors.length - 5} more</div>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}