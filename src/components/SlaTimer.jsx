import React, { useEffect, useState } from 'react';

const SlaTimer = ({ dueAt }) => {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!dueAt) return;
    const update = () => {
      const now = new Date();
      const then = new Date(dueAt);
      const diff = Math.max(0, then - now);
      const mins = Math.floor(diff / 60000);
      const hrs = Math.floor(mins / 60);
      const m = mins % 60;
      setRemaining(`${hrs}h ${m}m`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [dueAt]);

  if (!dueAt) return null;
  return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">{remaining}</span>;
};

export default SlaTimer;
