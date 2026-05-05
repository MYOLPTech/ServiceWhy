import React from 'react';

/**
 * SummaryStats — reusable stat cards header used across all register pages.
 * Pass an array of { label, value, tone } where tone is one of:
 *   'default' | 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'teal'
 */
const TONE_STYLES = {
  default: { bg: 'bg-card', text: 'text-foreground' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700' },
  green:   { bg: 'bg-green-50',   text: 'text-green-700' },
  red:     { bg: 'bg-red-50',     text: 'text-red-700' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-700' },
  teal:    { bg: 'bg-teal-50',    text: 'text-teal-700' },
  slate:   { bg: 'bg-slate-50',   text: 'text-slate-700' },
};

export default function SummaryStats({ stats = [] }) {
  if (!stats.length) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map(({ label, value, tone = 'default' }) => {
        const t = TONE_STYLES[tone] || TONE_STYLES.default;
        return (
          <div key={label} className={`${t.bg} rounded-xl border border-border/50 p-4 shadow-sm`}>
            <div className={`text-2xl font-bold ${t.text}`}>{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        );
      })}
    </div>
  );
}