import { useForm } from "react-hook-form";
import ModalWrapper from "../ModalWrapper";
import { Dialog } from "@headlessui/react";
import Button from "../Button";

const UpdateTaskStatus = ({ openStage, setOpenStage, id, onStatusUpdate }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

const handleOnSubmit = (data) => {
  if (!data.status) return;
  
  onStatusUpdate(data.status);  
  setOpenStage(false);
};

  return (
    <>
      <ModalWrapper open={openStage} setOpen={setOpenStage}>
        <form onSubmit={handleSubmit(handleOnSubmit)} className=''>
          <Dialog.Title
            as='h2'
            className='text-base font-bold leading-6 text-gray-900 mb-4'
          >
            UPDATE TASK STATUS
          </Dialog.Title>
          <div className='mt-2 flex flex-col gap-6'>
            <div className='flex flex-col'>
              <label htmlFor='status' className='font-semibold'>
                Status
              </label>

              <select
                id='status'
                name='status'
                className='w-full rounded border-gray-300'
                {...register("status", {
                  required: "Status is required!",
                })}
              >
                <option value=''>Select status</option>
                <option value='IN PROGRESS'>IN PROGRESS</option>
                <option value='COMPLETED'>COMPLETED</option>
                <option value='TODO'>TODO</option>
              </select>
              {errors.status && (
                <span className='text-red-600'>{errors.status.message}</span>
              )}
            </div>
          </div>
          <div className='py-3 mt-4 flex sm:flex-row-reverse gap-4'>
            <Button
              type='submit'
              className='bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 sm:ml-3 sm:w-auto'
              label='Update Status'
            />

            <Button
              type='button'
              className='bg-white border text-sm font-semibold text-gray-900 sm:w-auto'
              onClick={() => setOpenStage(false)}
              label='Cancel'
            />
          </div>
        </form>
      </ModalWrapper>
    </>
  );
};

export default UpdateTaskStatus;