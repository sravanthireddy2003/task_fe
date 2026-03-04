import React, { useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { Dialog } from "@headlessui/react";
import Textbox from "./Textbox";
import Button from "./Button";
import { toast } from "sonner";
import fetchWithTenant from "../utils/fetchWithTenant";

const AddWorkingHours = ({ open, setOpen, idWH }) => {
  const [formData, setFormData] = useState({ date: "", start_time: "", end_time: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.start_time) newErrors.start_time = "Start time is required";
    if (!formData.end_time) newErrors.end_time = "End time is required";

    if (formData.start_time && formData.end_time) {
      if (formData.end_time <= formData.start_time) {
        newErrors.end_time = "End time must be after start time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    const workingHoursData = {
      task_id: idWH,
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
    };

    try {
      const response = await fetchWithTenant(`/api/tasks/working-hours`, {
        method: "POST",
        body: JSON.stringify(workingHoursData),
      });

      if (response.success || response.ok) {
        toast.success("Working hours added successfully");
        setFormData({ date: "", start_time: "", end_time: "" });
        setOpen(false);
      } else {
        toast.error(response.message || response.error || "Failed to add working hours");
      }
    } catch (error) {
      toast.error(error?.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ModalWrapper open={open} setOpen={setOpen}>
        <form onSubmit={handleOnSubmit} className="">
          <Dialog.Title as="h2" className="text-base font-bold leading-6 text-gray-900 mb-4">
            ADD WORKING HOURS
          </Dialog.Title>
          <div className="mt-2 flex flex-col gap-6">
            <Textbox
              placeholder="Date"
              type="date"
              name="date"
              label="Date"
              className="w-full rounded"
              register={{
                value: formData.date,
                onChange: handleChange,
              }}
              error={errors.date}
            />
            <div className="flex items-center gap-4">
              <Textbox
                placeholder="Start Time"
                type="time"
                name="start_time"
                label="Start Time"
                className="w-full rounded"
                register={{
                  value: formData.start_time,
                  onChange: handleChange,
                }}
                error={errors.start_time}
              />
              <Textbox
                placeholder="End Time"
                type="time"
                name="end_time"
                label="End Time"
                className="w-full rounded"
                register={{
                  value: formData.end_time,
                  onChange: handleChange,
                }}
                error={errors.end_time}
              />
            </div>
          </div>
          <div className="py-3 mt-4 flex sm:flex-row-reverse gap-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 sm:ml-3 sm:w-auto ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              label={isSubmitting ? "Adding..." : "Add Hours"}
            />
            <Button
              type="button"
              disabled={isSubmitting}
              className="bg-white border text-sm font-semibold text-gray-900 sm:w-auto"
              onClick={() => {
                setFormData({ date: "", start_time: "", end_time: "" });
                setErrors({});
                setOpen(false);
              }}
              label="Cancel"
            />
          </div>
        </form>
      </ModalWrapper>
    </>
  );
};

export default AddWorkingHours;









