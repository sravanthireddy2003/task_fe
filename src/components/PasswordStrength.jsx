import React from 'react';

// Simple password strength meter and validator
const strengthLabel = (score) => {
  if (score <= 1) return 'Very Weak';
  if (score === 2) return 'Weak';
  if (score === 3) return 'Fair';
  if (score === 4) return 'Good';
  return 'Strong';
};

export function evaluatePassword(password) {
  let score = 0;
  if (!password) return { score, label: strengthLabel(score) };
  // length
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return { score, label: strengthLabel(score) };
}

const PasswordStrength = ({ password }) => {
  const { score, label } = evaluatePassword(password);
  const percent = (score / 4) * 100;
  const bg = score <= 1 ? 'bg-red-500' : score === 2 ? 'bg-yellow-400' : score === 3 ? 'bg-blue-400' : 'bg-green-500';

  return (
    <div className="w-full">
      <div className="h-2 w-full bg-gray-200 rounded overflow-hidden">
        <div className={`${bg} h-full`} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-sm text-gray-600 mt-1">Strength: {label}</p>
      <ul className="text-xs text-gray-500 mt-2">
        <li>• At least 8 characters</li>
        <li>• Uppercase letter</li>
        <li>• Number</li>
        <li>• Special character</li>
      </ul>
    </div>
  );
};

export default PasswordStrength;
