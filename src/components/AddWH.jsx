import { useForm } from "react-hook-form";
import ModalWrapper from "./ModalWrapper";
import { Dialog } from "@headlessui/react";
import Textbox from "./Textbox";
import Button from "./Button";

const AddWorkingHours = ({ open, setOpen, idWH }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleOnSubmit = async (data) => {
    const workingHoursData = {
      task_id: idWH,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
    };
    console.log(idWH);  // Corrected variable name
  
    try {
      const fetchWithTenant = (await import('../utils/fetchWithTenant')).default;
      const response = await fetchWithTenant(`/api/tasks/working-hours`, {
        method: "POST",
        body: JSON.stringify(workingHoursData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(result.message);
        setOpen(false);
      } else {
        const errorData = await response.json();
        console.error("Error:", errorData.error || errorData.message || 'Unknown');
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  return (
    <>
      <ModalWrapper open={open} setOpen={setOpen}>
        <form onSubmit={handleSubmit(handleOnSubmit)} className="">
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
              register={register("date", {
                required: "Date is required!",
              })}
              error={errors.date ? errors.date.message : ""}
            />
            <div className="flex items-center gap-4">
              <Textbox
                placeholder="Start Time"
                type="time"
                name="start_time"
                label="Start Time"
                className="w-full rounded"
                register={register("start_time", {
                  required: "Start time is required!",
                })}
                error={errors.start_time ? errors.start_time.message : ""}
              />
              <Textbox
                placeholder="End Time"
                type="time"
                name="end_time"
                label="End Time"
                className="w-full rounded"
                register={register("end_time", {
                  required: "End time is required!",
                })}
                error={errors.end_time ? errors.end_time.message : ""}
              />
            </div>
          </div>
          <div className="py-3 mt-4 flex sm:flex-row-reverse gap-4">
            <Button
              type="submit"
              className="bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 sm:ml-3 sm:w-auto"
              label="Add Hours"
            />
            <Button
              type="button"
              className="bg-white border text-sm font-semibold text-gray-900 sm:w-auto"
              onClick={() => setOpen(false)}
              label="Cancel"
            />
          </div>
        </form>
      </ModalWrapper>
    </>
  );
};

export default AddWorkingHours;









// import { useForm } from "react-hook-form";
// import ModalWrapper from "./ModalWrapper";
// import { Dialog } from "@headlessui/react";
// import Textbox from "./Textbox";
// import Button from "./Button";
// import { useDispatch } from "react-redux";
// // import { createWorkingHours } from "../../redux/slices/workingHoursSlice";

// const AddWorkingHours = ({ open, setOpen }) => {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm();

//   const dispatch = useDispatch();

//   const handleOnSubmit = async (data) => {
//     const workingHoursData = {
//       date: data.date,
//       start_time: data.start_time,
//       end_time: data.end_time,
//     };
//     dispatch(createWorkingHours(workingHoursData));
//     setOpen(false);
//   // };



//   try {
//     const response = await fetch(`${import.meta.env.VITE_SERVERURL}/api/tasks/working-hours`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(workingHoursData),
//     });

//     if (response.ok) {
//       const result = await response.json();
//       console.log(result.message); // Success message from server
//       setOpen(false);
//     } else {
//       const errorData = await response.json();
//       console.error('Error:', errorData.error);
//     }
//   } catch (error) {
//     console.error('Network error:', error);
//   }
// };
//   return (
//     <>
//       <ModalWrapper open={open} setOpen={setOpen}>
//         <form onSubmit={handleSubmit(handleOnSubmit)} className=''>
//           <Dialog.Title
//             as='h2'
//             className='text-base font-bold leading-6 text-gray-900 mb-4'
//           >
//             ADD WORKING HOURS
//           </Dialog.Title>
//           <div className='mt-2 flex flex-col gap-6'>
//             <Textbox
//               placeholder='Date'
//               type='date'
//               name='date'
//               label='Date'
//               className='w-full rounded'
//               register={register("date", {
//                 required: "Date is required!",
//               })}
//               error={errors.date ? errors.date.message : ""}
//             />
//             <div className='flex items-center gap-4'>
//               <Textbox
//                 placeholder='Start Time'
//                 type='time'
//                 name='start_time'
//                 label='Start Time'
//                 className='w-full rounded'
//                 register={register("start_time", {
//                   required: "Start time is required!",
//                 })}
//                 error={errors.start_time ? errors.start_time.message : ""}
//               />
//               <Textbox
//                 placeholder='End Time'
//                 type='time'
//                 name='end_time'
//                 label='End Time'
//                 className='w-full rounded'
//                 register={register("end_time", {
//                   required: "End time is required!",
//                 })}
//                 error={errors.end_time ? errors.end_time.message : ""}
//               />
//             </div>
//           </div>
//           <div className='py-3 mt-4 flex sm:flex-row-reverse gap-4'>
//             <Button
//               type='submit'
//               className='bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 sm:ml-3 sm:w-auto'
//               label='Add Hours'
//             />

//             <Button
//               type='button'
//               className='bg-white border text-sm font-semibold text-gray-900 sm:w-auto'
//               onClick={() => setOpen(false)}
//               label='Cancel'
//             />
//           </div>
//         </form>
//       </ModalWrapper>
//     </>
//   );
// };

// export default AddWorkingHours;
