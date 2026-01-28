import React, { useMemo } from 'react';
import SlaTimer from './SlaTimer';

// Colored SLA badge that wraps SlaTimer and chooses color based on remaining time

const SlaBadge = ({ dueAt }) => {
  const { toneClass } = useMemo(() => {
    if (!dueAt) return { toneClass: 'bg-gray-100 text-gray-600 border-gray-200' };
    const now = new Date();
    const then = new Date(dueAt);
    const diffMs = then - now;
    if (Number.isNaN(diffMs)) return { toneClass: 'bg-gray-100 text-gray-600 border-gray-200' };

    if (diffMs <= 0) {
      // Overdue
      return { toneClass: 'bg-red-100 text-red-700 border-red-200' };
    }
    const diffMinutes = diffMs / 60000;
    if (diffMinutes <= 60) {
      // Due within an hour
      return { toneClass: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    return { toneClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }, [dueAt]);

  if (!dueAt) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${toneClass}`}>
      <span>SLA</span>
      <SlaTimer dueAt={dueAt} />
    </span>
  );
};

export default SlaBadge;
