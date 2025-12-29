import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { toast } from 'sonner';

const TimeTracker = ({ task, onUpdate, userRole }) => {
  const [timeSpent, setTimeSpent] = useState(task.timeSpent || 0);
  const [isRunning, setIsRunning] = useState(task.timer_running || false);
  const [startTime, setStartTime] = useState(null);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    setTimeSpent(task.timeSpent || 0);
    setIsRunning(task.timer_running || false);
  }, [task]);

  useEffect(() => {
    if (isRunning && !intervalId) {
      const id = setInterval(() => {
        setTimeSpent(prev => prev + 1); // Increment by 1 second
      }, 1000);
      setIntervalId(id);
    } else if (!isRunning && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, intervalId]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    try {
      const taskId = task.id || task._id || task.public_id;
      await onUpdate(taskId, {
        timer_running: true,
        timer_started_at: new Date().toISOString()
      });
      setIsRunning(true);
      setStartTime(Date.now());
      toast.success('Timer started');
    } catch (error) {
      toast.error('Failed to start timer');
    }
  };

  const handlePause = async () => {
    try {
      const taskId = task.id || task._id || task.public_id;
      await onUpdate(taskId, {
        timer_running: false,
        timeSpent: timeSpent
      });
      setIsRunning(false);
      toast.success('Timer paused');
    } catch (error) {
      toast.error('Failed to pause timer');
    }
  };

  const handleStop = async () => {
    try {
      const taskId = task.id || task._id || task.public_id;
      await onUpdate(taskId, {
        timer_running: false,
        timeSpent: timeSpent,
        status: 'Completed'
      });
      setIsRunning(false);
      toast.success('Timer stopped and task completed');
    } catch (error) {
      toast.error('Failed to stop timer');
    }
  };

  const canTrackTime = userRole === 'admin' || userRole === 'manager' || userRole === 'employee';

  if (!canTrackTime) return null;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Time Tracking
        </h3>
        <div className={`text-lg font-mono font-bold ${
          isRunning ? 'text-green-600' : 'text-gray-900'
        }`}>
          {formatTime(timeSpent)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={task.status === 'Completed'}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            Start
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            <Pause className="w-4 h-4" />
            Pause
          </button>
        )}

        <button
          onClick={handleStop}
          disabled={!isRunning && timeSpent === 0}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Square className="w-4 h-4" />
          Complete
        </button>
      </div>

      {isRunning && (
        <div className="mt-3 text-sm text-green-600 font-medium">
          Timer is running...
        </div>
      )}

      {timeSpent > 0 && !isRunning && (
        <div className="mt-3 text-sm text-gray-600">
          Total time: {formatTime(timeSpent)}
        </div>
      )}
    </div>
  );
};

export default TimeTracker;