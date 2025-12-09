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
import UpdateTaskStatus from "./task/UpdateTaskStatus"; 
import { BGS, PRIOTITYSTYELS, TASK_TYPE } from "../utils";
import {
  getSubTask,
  selectSubTasks,
  selectTaskById,
  updateTaskStatuss,
} from "../redux/slices/taskSlice";

const ICONS = {
  HIGH: <MdKeyboardDoubleArrowUp />,
  MEDIUM: <MdKeyboardArrowUp />,
  LOW: <MdKeyboardArrowDown />,
};

const TaskCard = ({ taskId }) => {
  const task = useSelector((state) => selectTaskById(state, taskId));
    const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [openStage, setOpenStage] = useState(false);
  const [localTask, setLocalTask] = useState(task);
  const subtasks = useSelector(selectSubTasks);


useEffect(() => {
  if (task?.task_id) {
    dispatch(getSubTask(task.task_id));
    setLocalTask(task);  // Only set if task_id changes
  }
}, [dispatch, task?.task_id]);

  
  const handleStatusUpdate = async (status) => {
    const id = task?.task_id ?? task?.id ?? task?._id;
    if (!id) return;

    try {
      const result = await dispatch(
        updateTaskStatuss({
          id: id.toString(),
          data: { stage: status },
        })
      ).unwrap();

      if (result) {
        setLocalTask((prev) => ({ ...prev, stage: status }));
      }
    } catch (error) {
      console.error("Update failed:", error);
      setLocalTask((prev) => ({ ...prev }));
    }
};

  if (!task) {
  return (
    <div className="w-full h-fit bg-white shadow-md p-4 rounded">
      Task not found.
    </div>
  );
}

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
            <span className="uppercase">{localTask?.priority || "N/A"} Priority</span>
          </div>

          {user && <TaskDialog task={localTask} />}
        </div>

        <div className="flex items-center gap-2">
          <div className={clsx("w-4 h-4 rounded-full", TASK_TYPE[localTask?.stage])} />
          <h4 className="line-clamp-1 text-black">{localTask?.title || "Untitled Task"}</h4>
        </div>
        <span className="text-sm text-gray-600">
          {localTask?.createdAt ? moment(localTask.createdAt).fromNow() : "Recently"}
        </span>

        <div className="w-full border-t border-gray-200 my-2" />
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex gap-1 items-center text-sm text-gray-600">
              <BiMessageAltDetail />
              <span>{localTask?.activities?.length || 0}</span>
            </div>
            <div className="flex gap-1 items-center text-sm text-gray-600">
              <MdAttachFile />
              <span>{localTask?.assets?.length || 0}</span>
            </div>
            <div className="flex gap-1 items-center text-sm text-gray-600">
              <FaList />
              <span>0/{subtasks?.length || 0}</span>
            </div>
          </div>

          <div className="flex flex-row-reverse">
            {localTask?.assigned_users?.map((m, index) => (
              <div
                key={m?._id || index}
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
            className="w-full flex gap-4 items-center text-sm text-gray-500 font-semibold"
          >
            <IoMdAdd className="text-lg" />
            <span>ADD SUBTASK</span>
          </button>
        </div>

        <div className="w-full pb-2">
          <button
            onClick={() => setOpenStage(true)}
            className="w-full flex gap-4 items-center text-sm text-gray-500 font-semibold"
          >
            <span
              className={`${
                localTask?.stage === "COMPLETED"
                  ? "text-green-500"
                  : localTask?.stage === "IN PROGRESS"
                  ? "text-yellow-500"
                  : localTask?.stage === "TODO"
                  ? "text-blue-500"
                  : "text-gray-500"
              }`}
            >
              {localTask?.stage || "NOT SET"}
            </span>
          </button>
        </div>
      </div>

      <AddSubTask
        open={open}
        setOpen={setOpen}
        id={localTask?.task_id ?? localTask?.id ?? localTask?._id}
      />

      <UpdateTaskStatus
        openStage={openStage}
        setOpenStage={setOpenStage}
        id={localTask?.task_id ?? localTask?.id ?? localTask?._id}
        onStatusUpdate={handleStatusUpdate}
      />
    </>
  );
};

export default TaskCard;
