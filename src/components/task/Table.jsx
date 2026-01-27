import React, { useState } from "react";
import { toast } from "sonner";
import { BGS, PRIOTITYSTYELS, TASK_TYPE, formatDate } from "../../utils";
import clsx from "clsx";
import * as Icons from "../../icons";
import UserInfo from "../UserInfo";
import Button from "../Button";
import ConfirmatioDialog from "../Dialogs";

const ICONS = {
  high: <Icons.ChevronsUp className="w-4 h-4" />,
  medium: <Icons.ChevronUp className="w-4 h-4" />,
  low: <Icons.ChevronDown className="w-4 h-4" />,
};

const Table = ({ tasks }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selected, setSelected] = useState(null);

  const deleteClicks = (id) => {
    setSelected(id);
    setOpenDialog(true);
  };

  const deleteHandler = () => {};

  // Improved date formatting function
  const formatTaskDate = (dateString) => {
    try {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? "N/A" : formatDate(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const TableHeader = () => (
    <thead className='w-full border-b border-gray-300'>
      <tr className='w-full text-black text-left'>
        <th className='py-2'>Task Title</th>
        <th className='py-2'>Priority</th>
        <th className='py-2'>Created At</th>
        <th className='py-2'>Assets</th>
        <th className='py-2'>Team</th>
        <th className='py-2'>Actions</th>
      </tr>
    </thead>
  );

  const TableRow = ({ task }) => {
    // Safely handle team data
    const teamMembers = Array.isArray(task?.team) ? task.team : [];
    
    return (
      <tr className='border-b border-gray-200 text-gray-600 hover:bg-gray-300/10'>
        <td className='py-2'>
          <div className='flex items-center gap-2'>
            <div
              className={clsx("w-4 h-4 rounded-full", TASK_TYPE[task.stage])}
            />
            <p className='w-full line-clamp-2 text-base text-black'>
              {task?.title || "Untitled Task"}
            </p>
          </div>
        </td>

        <td className='py-2'>
          <div className='flex gap-1 items-center'>
            <span className={clsx("text-lg", PRIOTITYSTYELS[task?.priority?.toLowerCase()])}>
              {ICONS[task?.priority?.toLowerCase()]}
            </span>
            <span className='capitalize line-clamp-1'>
              {task?.priority || "N/A"} Priority
            </span>
          </div>
        </td>

        <td className='py-2'>
          <span className='text-sm text-gray-600'>
            {formatTaskDate(task?.date || task?.createdAt)}
          </span>
        </td>

        <td className='py-2'>
            <div className='flex items-center gap-3'>
              <div className='flex gap-1 items-center text-sm text-gray-600'>
                <Icons.MessageSquare className="w-4 h-4" />
                <span>{task?.activities?.length || 0}</span>
              </div>
              <div className='flex gap-1 items-center text-sm text-gray-600'>
                <Icons.Paperclip className="w-4 h-4" />
                <span>{task?.assets?.length || 0}</span>
              </div>
              <div className='flex gap-1 items-center text-sm text-gray-600'>
                <Icons.ListChecks className="w-4 h-4" />
                <span>0/{task?.subTasks?.length || 0}</span>
              </div>
            </div>
        </td>

<td className='py-2'>
  <div className='flex'>
    {(task?.team || task?.assigned_users)?.length > 0 ? (
      (task.team || task.assigned_users).map((m, index) => (
        <div
          key={m._id || index}
          className={clsx(
            "w-7 h-7 rounded-full text-white flex items-center justify-center text-sm -mr-1",
            BGS[index % BGS?.length]
          )}
        >
          <UserInfo user={m} />
        </div>
      ))
    ) : (
      <span className='text-sm text-gray-500'>No team assigned</span>
    )}
  </div>
</td>

        <td className='py-2 flex gap-2 md:gap-4 justify-end'>
          <Button
            className='text-blue-600 hover:text-blue-500 sm:px-0 text-sm md:text-base'
            label='Edit'
            type='button'
          />

          <Button
            className='text-red-700 hover:text-red-500 sm:px-0 text-sm md:text-base'
            label='Delete'
            type='button'
            onClick={() => deleteClicks(task._id)}
          />
        </td>
      </tr>
    );
  };

  return (
    <>
      <div className='bg-gray-50/60 p-4 rounded-xl'>
        <div className='bg-white px-2 md:px-4 pt-4 pb-4 shadow-md rounded-xl border border-gray-200'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm text-gray-800'>
              <TableHeader />
              <tbody>
                {tasks?.length > 0 ? (
                  tasks.map((task, index) => (
                    <TableRow key={task._id || index} task={task} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className='py-4 text-center text-gray-500'>
                      No tasks found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmatioDialog
        open={openDialog}
        setOpen={setOpenDialog}
        onClick={deleteHandler}
      />
    </>
  );
};

export default Table;