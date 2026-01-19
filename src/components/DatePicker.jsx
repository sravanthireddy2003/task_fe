import React from 'react';
import moment from 'moment';

const DatePicker = ({ id, label, value, onChange }) => {
  // value expected as YYYY-MM-DD or empty
  return (
    <div className='flex flex-col'>
      <label htmlFor={id} className='text-gray-700 mb-1'>{label}:</label>
      <input
        id={id}
        type='date'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='border border-gray-300 p-2 rounded'
      />
    </div>
  );
};

export default DatePicker;
