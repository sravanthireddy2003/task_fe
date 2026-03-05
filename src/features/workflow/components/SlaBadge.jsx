import React from 'react';
import { Badge } from 'antd';

const SlaBadge = ({ dueAt }) => {
  if (!dueAt) return null;
  const now = Date.now();
  const then = new Date(dueAt).getTime();
  const ms = Math.max(0, then - now);
  const hours = ms / (1000 * 60 * 60);
  let status = 'default';
  if (hours > 6) status = 'success';
  else if (hours > 1) status = 'warning';
  else status = 'error';

  const label = hours > 24 ? `${Math.round(hours)}h` : `${Math.max(0, Math.round(hours))}h`;
  return <Badge status={status} text={<span className="text-xs">{label}</span>} />;
};

export default SlaBadge;
