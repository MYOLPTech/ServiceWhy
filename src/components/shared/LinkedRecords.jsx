import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

export default function LinkedRecords({ label, items, selected, onToggle, renderLabel, renderSub }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">{label} <span className="text-muted-foreground font-normal">({selected.length} linked)</span></h4>
      <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
        {items.length === 0 && <p className="text-xs text-muted-foreground p-3">No {label.toLowerCase()} found</p>}
        {items.map(item => (
          <label key={item.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40 cursor-pointer">
            <Checkbox checked={selected.includes(item.id)} onCheckedChange={() => onToggle(item.id)} />
            <span className="flex-1 text-sm">{renderLabel(item)}</span>
            {renderSub && <span className="text-xs text-muted-foreground capitalize">{renderSub(item)?.replace(/_/g, ' ')}</span>}
          </label>
        ))}
      </div>
    </div>
  );
}