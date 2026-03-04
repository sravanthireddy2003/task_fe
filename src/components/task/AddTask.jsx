import React, { useState, useEffect } from "react";
import ModalWrapper from "../ModalWrapper";
import { Dialog, Listbox } from "@headlessui/react";
import Textbox from "../Textbox";
import SelectList from "../SelectList";
import Button from "../Button";
import { useDispatch, useSelector } from "react-redux";
import { createTask } from "../../redux/slices/taskSlice";
import { fetchClients, selectClients } from "../../redux/slices/clientSlice";
import { fetchUsers, selectUsers } from "../../redux/slices/userSlice";
import { selectTasks } from "../../redux/slices/taskSlice";

const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
const PRIORITY = ["HIGH", "MEDIUM", "LOW"];

const AddTask = ({ open, setOpen }) => {
  const dispatch = useDispatch();
  const clients = useSelector(selectClients);
  const users = useSelector(selectUsers);
  const tasks = useSelector(selectTasks);

  const [formData, setFormData] = useState({ title: '', date: '', time_alloted: '', description: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    const titleStr = formData.title?.trim() || '';
    if (!titleStr) newErrors.title = 'Title is required';
    else {
      const isDuplicate = tasks.some(t => t.title?.toLowerCase() === titleStr.toLowerCase());
      if (isDuplicate) newErrors.title = "Task title already exists!";
    }
    if (!formData.date) newErrors.date = 'Date is required';
    if (formData.time_alloted && isNaN(Number(formData.time_alloted))) {
      newErrors.time_alloted = 'Must be a valid number';
    } else if (Number(formData.time_alloted) < 0) {
      newErrors.time_alloted = 'Must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const [team, setTeam] = useState([]);
  const [stage, setStage] = useState(LISTS[0]);
  const [priority, setPriority] = useState(PRIORITY[2]);
  const [client_id, setClientId] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchClients());
    dispatch(fetchUsers());
  }, [dispatch]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const { title, date, time_alloted, description } = formData;

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
        setFormData({ title: '', date: '', time_alloted: '', description: '' });
        setClientId("");
        setTeam([]);
        setStage(LISTS[0]);
        setPriority(PRIORITY[2]);
      }
    } catch (error) { }

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
      <form onSubmit={submitHandler}>
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
            register={{
              value: formData.title,
              onChange: handleChange,
            }}
            error={errors.title}
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
                register={{
                  value: formData.date,
                  onChange: handleChange,
                }}
                error={errors.date}
              />
            </div>
            <div className="w-1/2">
              <Textbox
                placeholder="Time Alloted"
                type="text"
                name="time_alloted"
                label="Time Alloted"
                className="w-full rounded"
                register={{
                  value: formData.time_alloted,
                  onChange: handleChange,
                }}
                error={errors.time_alloted}
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
                    â–¼
                  </span>
                </Listbox.Button>

                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {users?.map((user) => (
                    <Listbox.Option
                      key={user._id}
                      value={user}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-blue-600 text-white" : "text-gray-900"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                            {user?.name || "Unnamed User"}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-green-600">âœ“</span>
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
              name="description"
              value={formData.description}
              onChange={handleChange}
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


