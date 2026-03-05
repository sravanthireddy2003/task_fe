import React, { useEffect, useState } from 'react';

const TenantSelector = ({ onChange }) => {
  const [tenant, setTenant] = useState(() => {
    try {
      return localStorage.getItem('tenantId') || import.meta.env.VITE_TENANT_ID || '';
    } catch (e) {
      return import.meta.env.VITE_TENANT_ID || '';
    }
  });

  useEffect(() => {
    if (tenant) {
      try {
        localStorage.setItem('tenantId', tenant);
      } catch (e) {}
    }
    if (onChange) onChange(tenant);
  }, [tenant, onChange]);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700">Tenant</label>
      <input
        type="text"
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        value={tenant}
        onChange={(e) => setTenant(e.target.value)}
        placeholder="tenant_1"
      />
      <p className="text-xs text-gray-500 mt-1">Enter your tenant id — this is sent as `x-tenant-id` on API calls.</p>
    </div>
  );
};

export default TenantSelector;
