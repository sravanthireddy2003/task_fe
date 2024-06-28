// import React, { useState } from "react";
// import ModalWrapper from "../ModalWrapper";
// import { Dialog } from "@headlessui/react";
// import Textbox from "../Textbox";
// import { useForm } from "react-hook-form";
// import UserList from "./UserList";
// import SelectList from "../SelectList";
// import { BiImages } from "react-icons/bi";
// import Button from "../Button";
// import { useDispatch, useSelector } from "react-redux";

// import { createTask } from "../../redux/slices/taskSlice";
// import { selectTaskStatus, selectTaskError } from "../../redux/slices/taskSlice";


// const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
// const PRIORITY = ["HIGH", "MEDIUM", "NORMAL", "LOW"];

// const AddTask = ({ open, setOpen }) => {
//   const dispatch = useDispatch();
//   const status = useSelector(selectTaskStatus);
//   const error = useSelector(selectTaskError);

//   const {
//     register, 
//     handleSubmit,
//     formState: { errors },
//   } = useForm();

//   const [team, setTeam] = useState([]);
//   const [stage, setStage] = useState(LISTS[0]);
//   const [priority, setPriority] = useState(PRIORITY[2]);
//   const [assets, setAssets] = useState([]);
//   const [uploading, setUploading] = useState(false);

//   const submitHandler = async (data) => {

//     const taskData = {

//       title,
//        team,
//         stage,
//          date, 
//          priority

//       // ...data,
//       // stage,
//       // priority,
//       // team,
//       // assets
//     };

//     setUploading(true);

//     await dispatch(createTask(taskData));

//     setUploading(false);
//     if (status === "succeeded") {
//       setOpen(false);
//     }
//   };

//   const handleSelect = (e) => {
//     setAssets([...e.target.files]);
//   };

//   return (
//     <>
//       <ModalWrapper open={open} setOpen={setOpen}>
//         <form onSubmit={handleSubmit(submitHandler)}>
//           <Dialog.Title
//             as='h2'
//             className='text-base font-bold leading-6 text-gray-900 mb-4'
//           >
//             ADD TASK
//           </Dialog.Title>

//           <div className='mt-2 flex flex-col gap-6'>

//             <Textbox
//               placeholder='Task Title'
//               type='text'
//               name='title'
//               label='Task Title'
//               className='w-full rounded'
//               register={register("title", { required: "Title is required" })}
//               error={errors.title ? errors.title.message : ""}
//             />

//             <UserList setTeam={setTeam} team={team} />

//             <div className='flex gap-4'>
//               <SelectList
//                 label='Task Stage'
//                 lists={LISTS}
//                 selected={stage}
//                 setSelected={setStage}
//               />

//               <div className='w-full'>
//                 <Textbox
//                   placeholder='Date'
//                   type='date'
//                   name='date'
//                   label='Task Date'
//                   className='w-full rounded'
//                   register={register("date", {
//                   required: "Date is required!",
//                   })}
//                   error={errors.date ? errors.date.message : ""}
//                 />
//               </div>
//             </div>

//             <div className='flex gap-4'>
//               <SelectList
//                 label='Priority Level'
//                 lists={PRIORITY}
//                 selected={priority}
//                 setSelected={setPriority}
//               />

//               {/* <div className='w-full flex items-center justify-center mt-4'>
//                 <label
//                   className='flex items-center gap-1 text-base text-ascent-2 hover:text-ascent-1 cursor-pointer my-4'
//                   htmlFor='imgUpload'
//                 >
//                   <input
//                     type='file'
//                     className='hidden'
//                     id='imgUpload'
//                     onChange={handleSelect}
//                     accept='.jpg, .png, .jpeg'
//                     multiple={true}
//                   />
//                   <BiImages />
//                   <span>Add Assets</span>
//                 </label>
//               </div> */}
//             </div>

//             <div className='bg-gray-50 py-6 sm:flex sm:flex-row-reverse gap-4'>
//               {uploading ? (
//                 <span className='text-sm py-2 text-red-500'>Uploading assets...</span>
//               ) : (
//                 <Button
//                   label='Submit'
//                   type='submit'
//                   className='bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto'
//                 />
//               )}

//               <Button
//                 type='button'
//                 className='bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto'
//                 onClick={() => setOpen(false)}
//                 label='Cancel'
//               />
//             </div>
//           </div>
//           {status === "failed" && <div className="text-red-500">{error}</div>}
//         </form>
//       </ModalWrapper>
//     </>
//   );
// };

// export default AddTask;


import React, { useState } from "react";
import ModalWrapper from "../ModalWrapper";
import { Dialog } from "@headlessui/react";
import Textbox from "../Textbox";
import { useForm } from "react-hook-form";
import UserList from "./UserList";
import SelectList from "../SelectList";
import { BiImages } from "react-icons/bi";
import Button from "../Button";
import { useDispatch, useSelector } from "react-redux";

import { createTask, selectTaskStatus, selectTaskError } from "../../redux/slices/taskSlice";

const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
const PRIORITY = ["HIGH", "MEDIUM", "NORMAL", "LOW"];

const AddTask = ({ open, setOpen }) => {
  const dispatch = useDispatch();
  const status = useSelector(selectTaskStatus);
  const error = useSelector(selectTaskError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [team, setTeam] = useState([]);
  const [stage, setStage] = useState(LISTS[0]);
  const [priority, setPriority] = useState(PRIORITY[2]);
  const [assets, setAssets] = useState([]);
  const [uploading, setUploading] = useState(false);

  const submitHandler = async (data) => {
    const { title, date } = data;

    const taskData = {
      title,
      assigned_to: team,
      stage,
      taskDate: new Date(date).toISOString(),
      priority,
      assets
    };

    setUploading(true);

    await dispatch(createTask(taskData));

    setUploading(false);
    if (status === "succeeded") {
      setOpen(false);
    }
  };
  // const handleSelect = (e) => {
  //   // setAssets([...e.target.files]);
  //   const filesArray = Array.from(e.target.files);
  //   setAssets(filesArray);
  //   console.log(assets)
  // };
  const handleSelect = (e) => {
    const files = Array.from(e.target.files);
    const newAssets = files.map(file => URL.createObjectURL(file));
    setAssets(newAssets);
  };


  return (
    <>
      <ModalWrapper open={open} setOpen={setOpen}>
        <form onSubmit={handleSubmit(submitHandler)}>
          <Dialog.Title
            as='h2'
            className='text-base font-bold leading-6 text-gray-900 mb-4'
          >
            ADD TASK
          </Dialog.Title>

          <div className='mt-2 flex flex-col gap-6'>
            <Textbox
              placeholder='Task Title'
              type='text'
              name='title'
              label='Task Title'
              className='w-full rounded'
              register={register("title", { required: "Title is required" })}
              error={errors.title ? errors.title.message : ""}
            />

            <UserList setTeam={setTeam} team={team} />

            <div className='flex gap-4'>
              <SelectList
                label='Task Stage'
                lists={LISTS}
                selected={stage}
                setSelected={setStage}
              />

              <div className='w-full'>
                <Textbox
                  placeholder='Date'
                  type='date'
                  name='date'
                  label='Task Date'
                  className='w-full rounded'
                  register={register("date", {
                    required: "Date is required!",
                  })}
                  error={errors.date ? errors.date.message : ""}
                />
              </div>
            </div>

            <div className='flex gap-4'>
              <SelectList
                label='Priority Level'
                lists={PRIORITY}
                selected={priority}
                setSelected={setPriority}
              />

                    <div className='w-full flex items-center justify-center mt-4'>
                <label
                  className='flex items-center gap-1 text-base text-ascent-2 hover:text-ascent-1 cursor-pointer my-4'
                  htmlFor='imgUpload'
                >
                  <input
                    type='file'
                    className='hidden'
                    id='imgUpload'
                    onChange={handleSelect}
                    accept='.jpg, .png, .jpeg'
                    multiple={true}
                  />
                  <BiImages />
                  <span>Add Assets</span>
                </label>
              </div> 
            </div>
            <div className='bg-gray-50 py-6 sm:flex sm:flex-row-reverse gap-4'>
              {uploading ? (
                <span className='text-sm py-2 text-red-500'>Uploading assets...</span>
              ) : (
                <Button
                  label='Submit'
                  type='submit'
                  className='bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto'
                />
              )}

              <Button
                type='button'
                className='bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto'
                onClick={() => setOpen(false)}
                label='Cancel'
              />
            </div>
          </div>
          {status === "failed" && <div className="text-red-500">{error}</div>}
        </form>
      </ModalWrapper>
    </>
  );
};

export default AddTask;
