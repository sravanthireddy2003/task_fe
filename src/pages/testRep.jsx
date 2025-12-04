import React, { useEffect, useState } from "react";
import moment from "moment";
import "./testRep.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { MdModeEdit } from "react-icons/md";
import { Dialog } from "@headlessui/react";
import CryptoJS from "crypto-js";

const WeekCalendar = () => {
  const [tasks, setTasks] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(moment());
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [hours, setHours] = useState("");
  const [selectedTasks, setSelectedTasks] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 
  const [fetchedTaskHours, setFetchedTaskHours] = useState([]);
  const[fetchTaskhours,setfetchTaskhours] =useState([]);
  const tasksPerPage = 5;
  const startOfWeek = currentWeek.clone().startOf("week");
  const endOfWeek = currentWeek.clone().endOf("week");
  const daysOfWeek = Array.from({ length: 7 }).map((_, i) =>
    startOfWeek.clone().add(i, "days")
  );

  const handlePrevWeek = () => {
    setCurrentWeek(currentWeek.clone().subtract(1, "week"));
  };

  const handleNextWeek = () => {
    setCurrentWeek(currentWeek.clone().add(1, "week"));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev, 1) - 1);
  };

  const handleNextPage = () => {
    setCurrentPage((prev) =>
      Math.min(prev + 1, Math.ceil(tasks.length / tasksPerPage))
    );
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks((prevSelected) => ({
      ...prevSelected,
      [taskId]: !prevSelected[taskId],
    }));
  };

  useEffect(() => {
    const fetchTasks = async () => {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const userId = userInfo._id;
      try {
        const fetchWithTenant = (await import('../utils/fetchWithTenant')).default;
        const response = await fetchWithTenant(
          `/api/tasks/taskdropdownfortaskHrs?user_id=${userId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const fetchTaskHours = async () => {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const userId = userInfo._id;

      try {
        const fetchWithTenant = (await import('../utils/fetchWithTenant')).default;
        const response = await fetchWithTenant(
          `/api/tasks/fetchtaskhours?user_id=${userId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch task hours");
        }
        const data = await response.json();
        setFetchedTaskHours(data);
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchTaskHours();
  }, [currentWeek, refreshTrigger]);

  const getTaskHours = (taskId, date) => {
    const taskHour = fetchedTaskHours.find(
      th => th.task_id === taskId && moment(th.date).format("YYYY-MM-DD") === date
    );
    return taskHour ? taskHour.hours : 0;
  };


  
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);

  const handleEditClick = (task, day) => {
    if (!selectedTasks[task.id]) return; 
    setEditingTask(task); 
    setEditingDay(day); 
    setHours(task.hours?.[day.format("YYYY-MM-DD")] || "");
    setIsEditing(true);
  };
  
  const closeDialog = () => {
    setIsEditing(false);
    setEditingTask(null);
    setEditingDay(null);
    setHours("");
  };

  const handleSave = async () => {
    if (editingTask && editingDay) {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const userId = userInfo._id;
  
      const data = {
        taskId: editingTask.id,
        userId,
        date: editingDay.format("YYYY-MM-DD"),
        hours: parseFloat(hours),
      };
  
      const secret = "secretKeysecretK";
      const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), secret).toString();
      try {
        const fetchWithTenant = (await import('../utils/fetchWithTenant')).default;
        const response = await fetchWithTenant(
          `/api/tasks/taskhours`,
          {
            method: "POST",
            body: JSON.stringify({ encryptedData }), // Wrap encryptedData in an object
          }
        );
  
        if (!response.ok) {
          throw new Error("Failed to save hours");
        }
        setRefreshTrigger(prev => prev + 1);
        closeDialog();
  
        // Update the task's hours locally
        const updatedTasks = tasks.map((task) => {
          if (task.id === editingTask.id) {
            return {
              ...task,
              hours: {
                ...task.hours,
                [editingDay.format("YYYY-MM-DD")]: parseFloat(hours),
              },
            };
          }
          return task;
        });
  
        setTasks(updatedTasks);
        closeDialog();
      } catch (error) {
        console.error(error.message);
      }
    }
  };
  
  
  return (
    <div className="week-calendar">
      <div className="navigation flex justify-center space-x-4 my-4 align-center">
        <button
          className="flex bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handlePrevWeek}
        >
          <FaChevronLeft />
        </button>

        <h2>
          {startOfWeek.format("MMM D")} - {endOfWeek.format("MMM D")}
        </h2>

        <button
          className="flex bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleNextWeek}
        >
          <FaChevronRight />
        </button>
      </div>

<table className="calendar-table">
        <thead>
          <tr>
            <th className="w-1/4">Task Title</th>
            {daysOfWeek.map((day) => (
              <th key={day.format("YYYY-MM-DD")}>
                {day.format("ddd, MMM DD")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentTasks.map((task) => (
            <tr key={task.id}>
              <td>
                <input
                  type="checkbox"
                  checked={!!selectedTasks[task.id]}
                  onChange={() => toggleTaskSelection(task.id)}
                />
                &nbsp;&nbsp; {task.title}
              </td>
              {daysOfWeek.map((day) => {
                const isWeekend = day.day() === 0 || day.day() === 6;
                const taskHours = getTaskHours(task.id, day.format("YYYY-MM-DD"));
                return (
                  <td
                    key={day.format("YYYY-MM-DD")}
                    className={isWeekend ? "bg-red-500" : ""}
                  >
                    <div className="flex justify-between items-center p-2">
                      <h3 className="text-lg">{taskHours}</h3>
                      <MdModeEdit
                        className={`cursor-pointer text-gray-700 ${
                          !selectedTasks[task.id] ? "opacity-50" : ""
                        }`}
                        onClick={() => handleEditClick(task, day)}
                        disabled={!selectedTasks[task.id]}
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <td className="font-bold text-left">Total Hrs/day</td>
            {daysOfWeek.map((day) => {
              const totalHours = currentTasks.reduce((sum, task) => {
                const hours = getTaskHours(task.id, day.format("YYYY-MM-DD"));
                return sum + hours;
              }, 0);

              const bgColor = totalHours < 8 ? 'bg-orange-500' : 'bg-green-500';

              return (
                <td 
                  key={day.format("YYYY-MM-DD")} 
                  className={`font-bold text-center ${bgColor}`}
                >
                  {totalHours}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>



      <div className="flex justify-between items-center mt-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {Math.ceil(tasks.length / tasksPerPage)}
        </span>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleNextPage}
          disabled={currentPage === Math.ceil(tasks.length / tasksPerPage)}
        >
          Next
        </button>
      </div>  

      <Dialog
        open={isEditing}
        onClose={closeDialog}
        className="fixed z-10 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
              Edit Hours for {editingDay?.format("YYYY-MM-DD")}
            </Dialog.Title>

            <input
  type="number"
  value={hours}
  onChange={(e) => setHours(e.target.value)}
  className="hour-input p-2 border rounded-md w-full mt-4"
  placeholder="Enter hours"
/>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={handleSave}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={closeDialog}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default WeekCalendar;

