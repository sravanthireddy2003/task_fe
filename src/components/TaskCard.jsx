import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import TaskDialog from "./task/TaskDialog";
import UserInfo from "./UserInfo";
import AddSubTask from "./task/AddSubTask";
import UpdateTaskStatus from "./task/UpdateTaskStatus";
import { BGS, PRIOTITYSTYELS, TASK_TYPE } from "../utils";
import Button from "./Button";
import * as Icons from "../icons";
import {
  getSubTask,
  selectSubTasks,
  selectTaskById,
  updateTaskStatuss,
} from "../redux/slices/taskSlice";

const ICONS = {
  HIGH: <Icons.ChevronsUp className="w-4 h-4" />,
  MEDIUM: <Icons.ChevronUp className="w-4 h-4" />,
  LOW: <Icons.ChevronDown className="w-4 h-4" />,
};

const TaskCard = ({ taskId, task: propTask }) => {
  const taskFromStore = useSelector((state) => selectTaskById(state, taskId));
  const task = propTask || taskFromStore;
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [openStage, setOpenStage] = useState(false);
  const [localTask, setLocalTask] = useState(task);
  const subtasks = useSelector(selectSubTasks);

  useEffect(() => {
    if (task?.task_id || task?.id || task?.public_id) {
      const id = task?.task_id || task?.id || task?.public_id;
      dispatch(getSubTask(id));
      setLocalTask(task);
    }
  }, [dispatch, task?.task_id, task?.id, task?.public_id]);

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

  const getStatusColor = (stage) => {
    switch (stage?.toLowerCase()) {
      case 'todo':
      case 'to do':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in progress':
      case 'in_progress':
        return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'review':
        return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'completed':
      case 'done':
        return 'bg-success-100 text-success-800 border-success-200';
      case 'blocked':
        return 'bg-error-100 text-error-800 border-error-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-error-600';
      case 'medium':
        return 'text-warning-600';
      case 'low':
        return 'text-success-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!task) {
    return (
      <div className="w-full h-fit card">
        Task not found.
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-fit card cursor-pointer">
        <div className="w-full flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className={clsx("px-2 py-1 text-xs font-medium rounded-full border", getStatusColor(localTask?.stage))}>
              {localTask?.stage || "To Do"}
            </span>
            <div className={clsx("flex items-center gap-1 text-sm font-medium", getPriorityColor(localTask?.priority))}>
              <span className="text-base">{ICONS[localTask?.priority]}</span>
              <span className="uppercase">{localTask?.priority || "N/A"}</span>
            </div>
          </div>

          {user && <TaskDialog task={localTask} />}
        </div>

        <div className="mb-2">
          <h4 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1">
            {localTask?.title || "Untitled Task"}
          </h4>
          {localTask?.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {localTask.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>Created {localTask?.createdAt ? moment(localTask.createdAt).fromNow() : "recently"}</span>
          {localTask?.due_date && (
            <span className="text-warning-600 font-medium">
              Due {moment(localTask.due_date).fromNow()}
            </span>
          )}
        </div>

        <div className="w-full border-t border-gray-100 my-3" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Icons.MessageSquare className="w-4 h-4" />
              <span>{localTask?.activities?.length || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Icons.Paperclip className="w-4 h-4" />
              <span>{localTask?.assets?.length || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Icons.ListChecks className="w-4 h-4" />
              <span>0/{subtasks?.length || 0}</span>
            </div>
          </div>

          <div className="flex flex-row-reverse">
            {localTask?.assigned_users?.slice(0, 3).map((m, index) => (
              <div
                key={m?._id || index}
                className={clsx(
                  "w-8 h-8 rounded-full text-white flex items-center justify-center text-sm -mr-2 border-2 border-white",
                  BGS[index % BGS?.length]
                )}
              >
                <UserInfo user={m} />
              </div>
            ))}
            {localTask?.assigned_users?.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium -mr-2 border-2 border-white">
                +{localTask.assigned_users.length - 3}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setOpen(true)}
            variant="secondary"
            size="sm"
            icon={Icons.Plus}
            label="Add Subtask"
            className="flex-1"
          />

          <Button
            onClick={() => setOpenStage(true)}
            variant="secondary"
            size="sm"
            label="Update Status"
            className="flex-1"
          />
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
