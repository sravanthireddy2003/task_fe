import React, { useState } from "react";
import ModalWrapper from "../ModalWrapper";
import { Dialog } from "@headlessui/react";
import Textbox from "../Textbox";
import Button from "../Button";
import { useDispatch } from "react-redux";
import { createSubTask } from "../../redux/slices/taskSlice";

const AddSubTask = ({ open, setOpen, id }) => {
  const [formData, setFormData] = useState({ title: '', date: '', tag: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = 'Title is required!';
    if (!formData.date) newErrors.date = 'Date is required!';
    if (!formData.tag) newErrors.tag = 'Tag is required!';
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

    const subtaskData = {
      id,
      title: formData.title,
      due_date: formData.date,
      tag: formData.tag,
    };
    dispatch(createSubTask(subtaskData));
    setOpen(false);
  };

  return (
    <>
      <ModalWrapper open={open} setOpen={setOpen}>
        <form onSubmit={handleOnSubmit} className=''>
          <Dialog.Title
            as='h2'
            className='text-base font-bold leading-6 text-gray-900 mb-4'
          >
            ADD SUB-TASK
          </Dialog.Title>
          <div className='mt-2 flex flex-col gap-6'>
            <Textbox
              placeholder='Sub-Task title'
              type='text'
              name='title'
              label='Title'
              className='w-full rounded'
              register={{
                value: formData.title,
                onChange: handleChange,
              }}
              error={errors.title}
            />

            <div className='flex items-center gap-4'>
              <Textbox
                placeholder='Date'
                type='date'
                name='date'
                label='Task Date'
                className='w-full rounded'
                register={{
                  value: formData.date,
                  onChange: handleChange,
                }}
                error={errors.date}
              />
              <Textbox
                placeholder='Tag'
                type='text'
                name='tag'
                label='Tag'
                className='w-full rounded'
                register={{
                  value: formData.tag,
                  onChange: handleChange,
                }}
                error={errors.tag}
              />
            </div>
          </div>
          <div className='py-3 mt-4 flex sm:flex-row-reverse gap-4'>
            <Button
              type='submit'
              className='bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 sm:ml-3 sm:w-auto'
              label='Add Task'
            />

            <Button
              type='button'
              className='bg-white border text-sm font-semibold text-gray-900 sm:w-auto'
              onClick={() => setOpen(false)}
              label='Cancel'
            />
          </div>
        </form>
      </ModalWrapper>
    </>
  );
};

export default AddSubTask;

