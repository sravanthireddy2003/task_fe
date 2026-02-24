import React, { useState, useEffect } from "react";
import ModalWrapper from "../ModalWrapper";
import { Dialog, Listbox } from "@headlessui/react";
import Textbox from "../Textbox";
import { useForm } from "react-hook-form";
import SelectList from "../SelectList";
import Button from "../Button";
import { useDispatch, useSelector } from "react-redux";
import { createTask } from "../../redux/slices/taskSlice";
import { fetchClients, selectClients } from "../../redux/slices/clientSlice";
import { fetchUsers, selectUsers } from "../../redux/slices/userSlice";

const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
const PRIORITY = ["HIGH", "MEDIUM", "LOW"];

const AddTask = ({ open, setOpen }) => {
  const dispatch = useDispatch();
  const clients = useSelector(selectClients);
  const users = useSelector(selectUsers);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const [team, setTeam] = useState([]);
  const [stage, setStage] = useState(LISTS[0]);
  const [priority, setPriority] = useState(PRIORITY[2]);
  const [client_id, setClientId] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchClients());
    dispatch(fetchUsers());
  }, [dispatch]);

  const submitHandler = async (data) => {
    const { title, date, time_alloted, description } = data;

    const taskData = {
      title,
      assigned_to: team,
      stage,
      taskDate: new Date(date).toISOString(),
      priority,
      time_alloted,
      description,
      client_id,
    };

    setUploading(true);

    try {
      const result = await dispatch(createTask(taskData));
      if (result.meta.requestStatus === "fulfilled") {
        setOpen(false);
        reset();
        setClientId("");
        setTeam([]);
        setStage(LISTS[0]);
        setPriority(PRIORITY[2]);
      }
    } catch (error) {}

    setUploading(false);
  };

  // Map selected user IDs to user objects
  const selectedUserObjects = users?.filter((user) => team.includes(user._id));

  const handleUserChange = (selectedUsers) => {
    const selectedIds = selectedUsers.map((u) => u._id);
    setTeam(selectedIds);
  };

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      <form onSubmit={handleSubmit(submitHandler)}>
        <Dialog.Title as="h2" className="text-base font-bold leading-6 text-gray-900 mb-4">
          ADD TASK
        </Dialog.Title>

        <div className="mt-2 flex flex-col gap-4">
          <SelectList
            label="Select Client"
            lists={clients.map((client) => client.name)}
            selected={client_id ? clients.find((client) => client.id === client_id)?.name || "" : ""}
            setSelected={(selectedName) => {
              const selectedClient = clients.find((client) => client.name === selectedName);
              setClientId(selectedClient ? selectedClient.id : "");
            }}
          />

          <Textbox
            placeholder="Task Title"
            type="text"
            name="title"
            label="Task Title"
            className="w-full rounded"
            register={register("title", { required: "Title is required" })}
            error={errors.title ? errors.title.message : ""}
          />

          <div className="flex gap-4">
            <div className="w-1/2">
              <SelectList label="Priority Level" lists={PRIORITY} selected={priority} setSelected={setPriority} />
            </div>
            <div className="w-1/2">
              <SelectList label="Task Stage" lists={LISTS} selected={stage} setSelected={setStage} />
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
                register={register("date", { required: "Date is required!" })}
                error={errors.date ? errors.date.message : ""}
              />
            </div>
            <div className="w-1/2">
              <Textbox
                placeholder="Time Alloted"
                type="text"
                name="time_alloted"
                label="Time Alloted"
                className="w-full rounded"
                register={register("time_alloted")}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign Users</label>
            <Listbox value={selectedUserObjects} onChange={handleUserChange} multiple>
              <div className="relative mt-1">
                <Listbox.Button className="relative w-full cursor-default rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                  <span className="block truncate">
                    {selectedUserObjects.length > 0
                      ? selectedUserObjects.map((u) => u?.name).join(", ")
                      : "Select users"}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                    ▼
                  </span>
                </Listbox.Button>

                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {users?.map((user) => (
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
                            {user?.name || "Unnamed User"}
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
            {uploading ? (
              <span className="text-sm py-2 text-red-500">Uploading task...</span>
            ) : (
              <Button
                label="Submit"
                type="submit"
                className="bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
              />
            )}

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

export default AddTask;
