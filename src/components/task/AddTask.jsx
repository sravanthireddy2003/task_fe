import React, { useState, useEffect } from "react";
import ModalWrapper from "../ModalWrapper";
import { Dialog } from "@headlessui/react";
import Textbox from "../Textbox";
import { useForm } from "react-hook-form";
import UserList from "./UserList";
import SelectList from "../SelectList";
import Button from "../Button";
import axios from "axios";

const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
const PRIORITY = ["HIGH", "MEDIUM", "LOW"];

const AddTask = ({ open, setOpen }) => {
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
  const [clients, setClients] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVERURL}/api/clients/clients`);
        setClients(response.data);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
    fetchClients();
  }, []);

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
      const response = await axios.post(`${import.meta.env.VITE_SERVERURL}/api/tasks/createjson`, taskData);
      if (response.status === 201) {
        setOpen(false);
        reset();
        setClientId("");
        setTeam([]);
        setStage(LISTS[0]);
        setPriority(PRIORITY[2]);
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }

    setUploading(false);
    setOpen(false);
  };

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      <form onSubmit={handleSubmit(submitHandler)}>
        <Dialog.Title as="h2" className="text-base font-bold leading-6 text-gray-900 mb-4">
          ADD TASK
        </Dialog.Title>

        <div className="mt-2 flex flex-col gap-4">
          {/* Client Selection at Top */}
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

        

          {/* Inline Rows for Compact Layout */}
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

          <UserList setTeam={setTeam} team={team} />
            {/* Description Textarea */}
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