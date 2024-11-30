import React, { useState, useEffect } from "react";
import clsx from "clsx";
import {
  MdAttachFile,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
} from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import { BiMessageAltDetail } from "react-icons/bi";
import { FaList } from "react-icons/fa";
import moment from "moment";
import TaskDialog from "./task/TaskDialog"; 
import UserInfo from "./UserInfo";
import { IoMdAdd } from "react-icons/io";
import AddSubTask from "./task/AddSubTask";
import AddWH from "./AddWH";
import { BGS, PRIOTITYSTYELS, TASK_TYPE, formatDate } from "../utils";
import { getSubTask, selectSubTasks } from "../redux/slices/taskSlice";
import UpdateTaskStatus from "./task/UpdateTaskStatus";

const ICONS = {
  HIGH: <MdKeyboardDoubleArrowUp />,
  MEDIUM: <MdKeyboardArrowUp />,
  LOW: <MdKeyboardArrowDown />,
};

const TaskCard = ({ task }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [openStage, setOpenStage] = useState(false);
  const [localTask, setLocalTask] = useState(task); // Local state for task

  const subtasks = [];

  useEffect(() => {
    dispatch(getSubTask(task.task_id));
  }, [dispatch, task.task_id]);

  const handleStatusUpdate = async (status) => {
    const updatedTaskData = {
      id: task.task_id,
      status: status,
    };

    // Update local state immediately
    setLocalTask((prevTask) => ({
      ...prevTask,
      stage: status,
    }));

    try {
      const response = await fetch(`/api/tasks/updatetask/${task.task_id}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTaskData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Task updated successfully:', result);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <>
      <div className="w-full h-fit bg-white shadow-md p-4 rounded">
        <div className="w-full flex justify-between">
          <div
            className={clsx(
              "flex flex-1 gap-1 items-center text-sm font-medium",
              PRIOTITYSTYELS[localTask?.priority]
            )}
          >
            <span className="text-lg">{ICONS[localTask?.priority]}</span>
            <span className="uppercase">{localTask?.priority} Priority</span>
          </div>

          {user && <TaskDialog task={localTask} />}
        </div>

        <>
          <div className="flex items-center gap-2">
            <div
              className={clsx("w-4 h-4 rounded-full", TASK_TYPE[localTask.stage])}
            />
            <h4 className="line-clamp-1 text-black">{localTask?.title}</h4>
          </div>
          <span className="text-sm text-gray-600">
            {moment(localTask?.createdAt).fromNow()}
          </span>
        </>

        <div className="w-full border-t border-gray-200 my-2" />
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex gap-1 items-center text-sm text-gray-600">
              <BiMessageAltDetail />
              <span>{localTask?.activities?.length}</span>
            </div>
            <div className="flex gap-1 items-center text-sm text-gray-600 ">
              <MdAttachFile />
              <span>{localTask?.assets?.length}</span>
            </div>
            <div className="flex gap-1 items-center text-sm text-gray-600 ">
              <FaList />
              <span>0/{subtasks?.length} </span>
            </div>
          </div>

          <div className="flex flex-row-reverse">
            {localTask?.assigned_users?.map((m, index) => (
              <div
                key={index}
                className={clsx(
                  "w-7 h-7 rounded-full text-white flex items-center justify-center text-sm -mr-1",
                  BGS[index % BGS?.length]
                )}
              >
                <UserInfo user={m} />
              </div>
            ))}
          </div>
        </div>

        <div className="w-full pb-2">
          <button
            onClick={() => setOpen(true)}
            className="w-full flex gap-4 items-center text-sm text-gray-500 font-semibold disabled:cursor-not-allowed disabled::text-gray-300"
          >
            <IoMdAdd className="text-lg" />
            <span>ADD SUBTASK</span>
          </button>
        </div>

        <div className="w-full pb-2">
          <button
            onClick={() => setOpenStage(true)}
            className="w-full flex gap-4 items-center text-sm text-gray-500 font-semibold disabled:cursor-not-allowed disabled::text-gray-300"
          >
            <span
              className={`${
                localTask.stage === "COMPLETED"
                  ? "text-green-500"
                  : localTask.stage === "IN PROGRESS"
                  ? "text-yellow-500"
                  : localTask.stage === "TODO"
                  ? "text-blue-500"
                  : "text-gray-500"
              }`}
            >
              {localTask.stage}
            </span>
          </button>
        </div>
      </div>

      <AddSubTask open={open} setOpen={setOpen} id={task.task_id} />

      <UpdateTaskStatus
        openStage={openStage}
        setOpenStage={setOpenStage}
        id={task.task_id}
        onStatusUpdate={handleStatusUpdate}
      />
    </>
  );
};

export default TaskCard;











// import React, { useState, useEffect } from "react";
// import clsx from "clsx";
// import {
//   MdAttachFile,
//   MdKeyboardArrowDown,
//   MdKeyboardArrowUp,
//   MdKeyboardDoubleArrowUp,
// } from "react-icons/md";
// import { useSelector, useDispatch } from "react-redux";
// import { BiMessageAltDetail } from "react-icons/bi";
// import { FaList } from "react-icons/fa";
// import moment from "moment";
// import TaskDialog from "./task/TaskDialog";
// import UserInfo from "./UserInfo";
// import { IoMdAdd } from "react-icons/io";
// import AddSubTask from "./task/AddSubTask";
// import { BGS, PRIOTITYSTYELS, TASK_TYPE } from "../utils";
// import { getSubTask } from "../redux/slices/taskSlice";
// import UpdateTaskStatus from "./task/UpdateTaskStatus";

// const ICONS = {
//   HIGH: <MdKeyboardDoubleArrowUp />,
//   MEDIUM: <MdKeyboardArrowUp />,
//   LOW: <MdKeyboardArrowDown />,
// };

// const TaskCard = ({ task }) => {
//   const dispatch = useDispatch();
//   const { user } = useSelector((state) => state.auth);
//   const [open, setOpen] = useState(false);
//   const [openStage, setOpenStage] = useState(false);
//   const [localTask, setLocalTask] = useState(null);

//   const subtasks = [];

//   useEffect(() => {
//     if (task && task.task_id) {
//       setLocalTask(task);
//       dispatch(getSubTask(task.task_id));
//     }
//   }, [dispatch, task]);

//   const handleStatusUpdate = async (status) => {
//     if (!localTask) return;

//     const updatedTaskData = {
//       id: localTask.task_id,
//       status: status,
//     };

//     setLocalTask((prevTask) => ({
//       ...prevTask,
//       stage: status,
//     }));

//     try {
//       const response = await fetch(`/api/tasks/updatetask/${localTask.task_id}`, {
//         method: 'PUT',
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(updatedTaskData),
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }

//       const result = await response.json();
//       console.log('Task updated successfully:', result);
//     } catch (error) {
//       console.error('Error updating task:', error);
//     }
//   };

//   if (!localTask) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <>
//       <div className="w-full h-fit bg-white shadow-md p-4 rounded">
//         <div className="w-full flex justify-between">
//           <div
//             className={clsx(
//               "flex flex-1 gap-1 items-center text-sm font-medium",
//               PRIOTITYSTYELS[localTask.priority]
//             )}
//           >
//             <span className="text-lg">{ICONS[localTask.priority]}</span>
//             <span className="uppercase">{localTask.priority} Priority</span>
//           </div>

//           {user && <TaskDialog task={localTask} />}
//         </div>

//         <>
//           <div className="flex items-center gap-2">
//             <div
//               className={clsx("w-4 h-4 rounded-full", TASK_TYPE[localTask.stage])}
//             />
//             <h4 className="line-clamp-1 text-black">{localTask.title}</h4>
//           </div>
//           <span className="text-sm text-gray-600">
//             {moment(localTask.createdAt).fromNow()}
//           </span>
//         </>

//         <div className="w-full border-t border-gray-200 my-2" />
//         <div className="flex items-center justify-between mb-2">
//           <div className="flex items-center gap-3">
//             <div className="flex gap-1 items-center text-sm text-gray-600">
//               <BiMessageAltDetail />
//               <span>{localTask.activities?.length || 0}</span>
//             </div>
//             <div className="flex gap-1 items-center text-sm text-gray-600 ">
//               <MdAttachFile />
//               <span>{localTask.assets?.length || 0}</span>
//             </div>
//             <div className="flex gap-1 items-center text-sm text-gray-600 ">
//               <FaList />
//               <span>0/{subtasks.length} </span>
//             </div>
//           </div>

//           <div className="flex flex-row-reverse">
//             {localTask.assigned_users?.map((m, index) => (
//               <div
//                 key={index}
//                 className={clsx(
//                   "w-7 h-7 rounded-full text-white flex items-center justify-center text-sm -mr-1",
//                   BGS[index % BGS.length]
//                 )}
//               >
//                 <UserInfo user={m} />
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className="w-full pb-2">
//           <button
//             onClick={() => setOpen(true)}
//             className="w-full flex gap-4 items-center text-sm text-gray-500 font-semibold disabled:cursor-not-allowed disabled:text-gray-300"
//           >
//             <IoMdAdd className="text-lg" />
//             <span>ADD SUBTASK</span>
//           </button>
//         </div>

//         <div className="w-full pb-2">
//           <button
//             onClick={() => setOpenStage(true)}
//             className="w-full flex gap-4 items-center text-sm text-gray-500 font-semibold disabled:cursor-not-allowed disabled:text-gray-300"
//           >
//             <span
//               className={`${
//                 localTask.stage === "COMPLETED"
//                   ? "text-green-500"
//                   : localTask.stage === "IN PROGRESS"
//                   ? "text-yellow-500"
//                   : localTask.stage === "TODO"
//                   ? "text-blue-500"
//                   : "text-gray-500"
//               }`}
//             >
//               {localTask.stage}
//             </span>
//           </button>
//         </div>
//       </div>

//       <AddSubTask open={open} setOpen={setOpen} id={localTask.task_id} />
//       <UpdateTaskStatus
//         openStage={openStage}
//         setOpenStage={setOpenStage}
//         id={localTask.task_id}
//         onStatusUpdate={handleStatusUpdate}
//       />
//     </>
//   );
// };

// export default TaskCard;


