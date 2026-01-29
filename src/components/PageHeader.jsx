import React from 'react';
import clsx from 'clsx';
import RefreshButton from './RefreshButton';

const PageHeader = ({
  title,
  subtitle,
  onRefresh,
  refreshing = false,
  children,
  className = '',
  align = 'default', // default | center
}) => {
  const containerClasses = clsx(
    'flex flex-col gap-3 mb-6',
    {
      'md:flex-row md:items-center md:justify-between': align === 'default',
      'items-center text-center md:text-left md:flex-row md:items-center md:justify-between': align === 'center',
    },
    className,
  );

  return (
    <div className={containerClasses}>
      <div>
        {title && (
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 self-start md:self-auto">
        {onRefresh && (
          <RefreshButton onClick={onRefresh} loading={refreshing} />
        )}
        {children}
      </div>
    </div>
  );
};

export default PageHeader;
