import React, { useState } from 'react';
import moment from 'moment';
import './testRep.css';

const WeekCalendar = () => {
  const [currentWeek, setCurrentWeek] = useState(moment());

  const startOfWeek = currentWeek.startOf('week');
  const daysOfWeek = Array.from({ length: 7 }).map((_, i) =>
    startOfWeek.clone().add(i, 'days')
  );

  const handlePrevWeek = () => {
    setCurrentWeek(currentWeek.clone().subtract(1, 'week'));
  };

  const handleNextWeek = () => {
    setCurrentWeek(currentWeek.clone().add(1, 'week'));
  };

  return (
    <div className="week-calendar">
      <div className="navigation">
        <button onClick={handlePrevWeek}>Previous Week</button>
        <button onClick={handleNextWeek}>Next Week</button>
      </div>
      <table className="calendar-table">
        <thead>
          <tr>
            {daysOfWeek.map(day => (
              <th key={day.format('YYYY-MM-DD')}>
                {day.format('ddd, MMM DD')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {daysOfWeek.map(day => (
              <td key={day.format('YYYY-MM-DD')}>
                {/* Placeholder for events or data */}
              </td>
            ))}
          </tr>
          <tr>
            {daysOfWeek.map(day => (
              <td key={day.format('YYYY-MM-DD')}>
                <input
                  type="number"
                  placeholder="Hours"
                  className="hour-input"
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default WeekCalendar;
