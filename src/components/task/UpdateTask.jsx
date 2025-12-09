import React, { useState, useEffect } from "react";
import ModalWrapper from "../ModalWrapper";
import { Dialog, Listbox } from "@headlessui/react";
import Textbox from "../Textbox";
import { useForm } from "react-hook-form";
import SelectList from "../SelectList";
import Button from "../Button";
import { useDispatch, useSelector } from "react-redux";
import { updateTask, selectTaskById } from "../../redux/slices/taskSlice";
import { httpGetService } from "../../App/httpHandler";
import { fetchUsers, selectUsers } from "../../redux/slices/userSlice";

const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
const PRIORITY = ["HIGH", "MEDIUM", "LOW"];

const UpdateTask = ({ open, setOpen, taskId }) => {
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm();

  const task = useSelector((state) => selectTaskById(state, taskId));
  const users = useSelector(selectUsers);

  const [team, setTeam] = useState([]);
  const [stage, setStage] = useState(LISTS[0]);
  const [priority, setPriority] = useState(PRIORITY[2]);
  const [client_id, setClientId] = useState("");
  const [clients, setClients] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Pre-fill form on task load
  useEffect(() => {
    if (task) {
      setTeam(task.assigned_to || []);
      setStage(task.stage || LISTS[0]);
      setPriority(task.priority || PRIORITY[2]);
      setClientId(task.client_id || "");

      setValue("title", task.title || "");
      setValue("date", task.taskDate?.split("T")[0] || "");
      setValue("time_alloted", task.time_alloted || "");
      setValue("description", task.description || "");
    }
  }, [task, setValue]);

  // Fetch client list
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await httpGetService("api/clients");
        setClients(response);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
    fetchClients();
  }, []);

  // Handle user selection
  const handleUserChange = (selectedUsers) => {
    setTeam(selectedUsers.map((u) => u._id));
  };

  const selectedUserObjects = users.filter((u) => team.includes(u._id));

  const submitHandler = async (data) => {
    if (!taskId) {
      alert("Task ID is missing. Please try again.");
      return;
    }

    const updatedTaskData = {
      stage,
      title: data.title,
      priority,
      description: data.description,
      assigned_to: team,
      client_id,
      taskDate: new Date(data.date).toISOString(),
      time_alloted: data.time_alloted,
    };

    setUploading(true);

    try {
      const result = await dispatch(updateTask({ id: taskId, updatedTaskData }));

      if (updateTask.fulfilled.match(result)) {
        setOpen(false);
        reset();
      } else if (updateTask.rejected.match(result)) {
        alert(`Update failed: ${result.payload || result.error}`);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update task");
    } finally {
      setUploading(false);
    }
  };

  if (!task) return null;

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      <form onSubmit={handleSubmit(submitHandler)}>
        <Dialog.Title className="text-base font-bold leading-6 text-gray-900 mb-4">
          UPDATE TASK
        </Dialog.Title>

        <div className="mt-2 flex flex-col gap-4">
          <SelectList
            label="Select Client"
            lists={clients.map((c) => c.name)}
            selected={
              client_id
                ? clients.find((c) => c._id === client_id)?.name || ""
                : ""
            }
            setSelected={(name) => {
              const found = clients.find((c) => c.name === name);
              setClientId(found ? found._id : "");
            }}
          />

          <Textbox
            placeholder="Task Title"
            type="text"
            name="title"
            label="Task Title"
            className="w-full rounded"
            register={register("title", { required: "Title is required" })}
            error={errors.title?.message}
          />

          <div className="flex gap-4">
            <div className="w-1/2">
              <SelectList
                label="Priority Level"
                lists={PRIORITY}
                selected={priority}
                setSelected={setPriority}
              />
            </div>
            <div className="w-1/2">
              <SelectList
                label="Task Stage"
                lists={LISTS}
                selected={stage}
                setSelected={setStage}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-1/2">
              <Textbox
                placeholder="Date"
                type="date"
                name="date"
                label="Task Date"
                className="w-full rounded"
                register={register("date", { required: "Date is required" })}
                error={errors.date?.message}
              />
            </div>
            <div className="w-1/2">
              <Textbox
                placeholder="Time Alloted"
                type="number"
                name="time_alloted"
                label="Time Alloted"
                className="w-full rounded"
                register={register("time_alloted", {
                  valueAsNumber: true,
                  min: { value: 0, message: "Must be a positive number" },
                })}
                error={errors.time_alloted?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Users
            </label>
            <Listbox value={selectedUserObjects} onChange={handleUserChange} multiple>
              <div className="relative mt-1">
                <Listbox.Button className="relative w-full cursor-default rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                  <span className="block truncate">
                    {selectedUserObjects.length > 0
                      ? selectedUserObjects.map((u) => u.name).join(", ")
                      : "Select users"}
                  </span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                    ▼
                  </span>
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {users.map((user) => (
                    <Listbox.Option
                      key={user._id}
                      value={user}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? "bg-indigo-600 text-white" : "text-gray-900"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                            {user.name || "Unnamed User"}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-green-600">✓</span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Task Description
            </label>
            <textarea
              id="description"
              placeholder="Enter task description (optional)"
              className="w-full rounded border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              rows="3"
              {...register("description")}
            />
          </div>

          <div className="bg-gray-50 py-4 sm:flex sm:flex-row-reverse gap-4">
            <Button
              label={uploading ? "Updating..." : "Update"}
              type="submit"
              className={`${
                uploading ? "opacity-50 cursor-not-allowed" : ""
              } bg-green-600 px-8 text-sm font-semibold text-white hover:bg-green-700 sm:w-auto`}
              disabled={uploading}
            />
            <Button
              type="button"
              className="bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto"
              onClick={() => setOpen(false)}
              label="Cancel"
            />
          </div>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default UpdateTask;
