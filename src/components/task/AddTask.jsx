// // import React, { useState } from "react";
// // import ModalWrapper from "../ModalWrapper";
// // import { Dialog } from "@headlessui/react";
// // import Textbox from "../Textbox";
// // import { useForm } from "react-hook-form";
// // import UserList from "./UserList";
// // import SelectList from "../SelectList";
// // import { BiImages } from "react-icons/bi";
// // import Button from "../Button";
// // import { useDispatch, useSelector } from "react-redux";

// // import { createTask } from "../../redux/slices/taskSlice";
// // import { selectTaskStatus, selectTaskError } from "../../redux/slices/taskSlice";


// // const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
// // const PRIORITY = ["HIGH", "MEDIUM", "NORMAL", "LOW"];

// // const AddTask = ({ open, setOpen }) => {
// //   const dispatch = useDispatch();
// //   const status = useSelector(selectTaskStatus);
// //   const error = useSelector(selectTaskError);

// //   const {
// //     register, 
// //     handleSubmit,
// //     formState: { errors },
// //   } = useForm();

// //   const [team, setTeam] = useState([]);
// //   const [stage, setStage] = useState(LISTS[0]);
// //   const [priority, setPriority] = useState(PRIORITY[2]);
// //   const [assets, setAssets] = useState([]);
// //   const [uploading, setUploading] = useState(false);

// //   const submitHandler = async (data) => {

// //     const taskData = {

// //       title,
// //        team,
// //         stage,
// //          date, 
// //          priority

// //       // ...data,
// //       // stage,
// //       // priority,
// //       // team,
// //       // assets
// //     };

// //     setUploading(true);

// //     await dispatch(createTask(taskData));

// //     setUploading(false);
// //     if (status === "succeeded") {
// //       setOpen(false);
// //     }
// //   };

// //   const handleSelect = (e) => {
// //     setAssets([...e.target.files]);
// //   };

// //   return (
// //     <>
// //       <ModalWrapper open={open} setOpen={setOpen}>
// //         <form onSubmit={handleSubmit(submitHandler)}>
// //           <Dialog.Title
// //             as='h2'
// //             className='text-base font-bold leading-6 text-gray-900 mb-4'
// //           >
// //             ADD TASK
// //           </Dialog.Title>

// //           <div className='mt-2 flex flex-col gap-6'>

// //             <Textbox
// //               placeholder='Task Title'
// //               type='text'
// //               name='title'
// //               label='Task Title'
// //               className='w-full rounded'
// //               register={register("title", { required: "Title is required" })}
// //               error={errors.title ? errors.title.message : ""}
// //             />

// //             <UserList setTeam={setTeam} team={team} />

// //             <div className='flex gap-4'>
// //               <SelectList
// //                 label='Task Stage'
// //                 lists={LISTS}
// //                 selected={stage}
// //                 setSelected={setStage}
// //               />

// //               <div className='w-full'>
// //                 <Textbox
// //                   placeholder='Date'
// //                   type='date'
// //                   name='date'
// //                   label='Task Date'
// //                   className='w-full rounded'
// //                   register={register("date", {
// //                   required: "Date is required!",
// //                   })}
// //                   error={errors.date ? errors.date.message : ""}
// //                 />
// //               </div>
// //             </div>

// //             <div className='flex gap-4'>
// //               <SelectList
// //                 label='Priority Level'
// //                 lists={PRIORITY}
// //                 selected={priority}
// //                 setSelected={setPriority}
// //               />

// //               {/* <div className='w-full flex items-center justify-center mt-4'>
// //                 <label
// //                   className='flex items-center gap-1 text-base text-ascent-2 hover:text-ascent-1 cursor-pointer my-4'
// //                   htmlFor='imgUpload'
// //                 >
// //                   <input
// //                     type='file'
// //                     className='hidden'
// //                     id='imgUpload'
// //                     onChange={handleSelect}
// //                     accept='.jpg, .png, .jpeg'
// //                     multiple={true}
// //                   />
// //                   <BiImages />
// //                   <span>Add Assets</span>
// //                 </label>
// //               </div> */}
// //             </div>

// //             <div className='bg-gray-50 py-6 sm:flex sm:flex-row-reverse gap-4'>
// //               {uploading ? (
// //                 <span className='text-sm py-2 text-red-500'>Uploading assets...</span>
// //               ) : (
// //                 <Button
// //                   label='Submit'
// //                   type='submit'
// //                   className='bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto'
// //                 />
// //               )}

// //               <Button
// //                 type='button'
// //                 className='bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto'
// //                 onClick={() => setOpen(false)}
// //                 label='Cancel'
// //               />
// //             </div>
// //           </div>
// //           {status === "failed" && <div className="text-red-500">{error}</div>}
// //         </form>
// //       </ModalWrapper>
// //     </>
// //   );
// // };

// // export default AddTask;



























// // import React, { useState } from "react";
// // import ModalWrapper from "../ModalWrapper";
// // import { Dialog } from "@headlessui/react";
// // import Textbox from "../Textbox";
// // import { useForm } from "react-hook-form";
// // import UserList from "./UserList";
// // import SelectList from "../SelectList";
// // import { BiImages } from "react-icons/bi";
// // import Button from "../Button";
// // import { useDispatch, useSelector } from "react-redux";

// // import { createTask, selectTaskStatus, selectTaskError } from "../../redux/slices/taskSlice";

// // const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
// // const PRIORITY = ["HIGH", "MEDIUM", "NORMAL", "LOW"];

// // const AddTask = ({ open, setOpen }) => {
// //   const dispatch = useDispatch();
// //   const status = useSelector(selectTaskStatus);
// //   const error = useSelector(selectTaskError);

// //   const {
// //     register,
// //     handleSubmit,
// //     formState: { errors },
// //   } = useForm();

// //   const [team, setTeam] = useState([]);
// //   const [stage, setStage] = useState(LISTS[0]);
// //   const [priority, setPriority] = useState(PRIORITY[2]);
// //   const [assets, setAssets] = useState([]);
// //   const [uploading, setUploading] = useState(false);

// //   const submitHandler = async (data) => {
// //     const { title, date } = data;

// //     const taskData = {
// //       title,
// //       assigned_to: team,
// //       stage,
// //       taskDate: new Date(date).toISOString(),
// //       priority,
// //       assets,
// //       time_alloted
// //     };

// //     setUploading(true);

// //     await dispatch(createTask(taskData));

// //     setUploading(false);
// //     if (status === "succeeded") {
// //       setOpen(false);
// //     }
// //   };
// //   // const handleSelect = (e) => {
// //   //   // setAssets([...e.target.files]);
// //   //   const filesArray = Array.from(e.target.files);
// //   //   setAssets(filesArray);
// //   //   console.log(assets)
// //   // };
// //   const handleSelect = (e) => {
// //     const files = Array.from(e.target.files);
// //     const newAssets = files.map(file => URL.createObjectURL(file));
// //     setAssets(newAssets);
// //   };


// //   return (
// //     <>
// //       <ModalWrapper open={open} setOpen={setOpen}>
// //         <form onSubmit={handleSubmit(submitHandler)}>
// //           <Dialog.Title
// //             as='h2'
// //             className='text-base font-bold leading-6 text-gray-900 mb-4'
// //           >
// //             ADD TASK
// //           </Dialog.Title>

// //           <div className='mt-2 flex flex-col gap-6'>
// //             <Textbox
// //               placeholder='Task Title'
// //               type='text'
// //               name='title'
// //               label='Task Title'
// //               className='w-full rounded'
// //               register={register("title", { required: "Title is required" })}
// //               error={errors.title ? errors.title.message : ""}
// //             />
// //             <Textbox
// //               placeholder='Time Alloted'
// //               type='text'
// //               name='title'
// //               label='Time Alloted'
// //               className='w-full rounded'
// //               register={register("time_alloted")}
// //             />

// //             <UserList setTeam={setTeam} team={team} />

// //             <div className='flex gap-4'>
// //               <SelectList
// //                 label='Task Stage'
// //                 lists={LISTS}
// //                 selected={stage}
// //                 setSelected={setStage}
// //               />

// //               <div className='w-full'>
// //                 <Textbox
// //                   placeholder='Date'
// //                   type='date'
// //                   name='date'
// //                   label='Task Date'
// //                   className='w-full rounded'
// //                   register={register("date", {
// //                     required: "Date is required!",
// //                   })}
// //                   error={errors.date ? errors.date.message : ""}
// //                 />
// //               </div>
// //             </div>

// //             <div className='flex gap-4'>
// //               <SelectList
// //                 label='Priority Level'
// //                 lists={PRIORITY}
// //                 selected={priority}
// //                 setSelected={setPriority}
// //               />

// //                     <div className='w-full flex items-center justify-center mt-4'>
// //                 <label
// //                   className='flex items-center gap-1 text-base text-ascent-2 hover:text-ascent-1 cursor-pointer my-4'
// //                   htmlFor='imgUpload'
// //                 >
// //                   <input
// //                     type='file'
// //                     className='hidden'
// //                     id='imgUpload'
// //                     onChange={handleSelect}
// //                     accept='.jpg, .png, .jpeg'
// //                     multiple={true}
// //                   />
// //                   <BiImages />
// //                   <span>Add Assets</span>
// //                 </label>
// //               </div> 
// //             </div>
// //             <div className='bg-gray-50 py-6 sm:flex sm:flex-row-reverse gap-4'>
// //               {uploading ? (
// //                 <span className='text-sm py-2 text-red-500'>Uploading assets...</span>
// //               ) : (
// //                 <Button
// //                   label='Submit'
// //                   type='submit'
// //                   className='bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto'
// //                 />
// //               )}

// //               <Button
// //                 type='button'
// //                 className='bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto'
// //                 onClick={() => setOpen(false)}
// //                 label='Cancel'
// //               />
// //             </div>
// //           </div>
// //           {status === "failed" && <div className="text-red-500">{error}</div>}
// //         </form>
// //       </ModalWrapper>
// //     </>
// //   );
// // };

// // export default AddTask;









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

// import { createTask, selectTaskStatus, selectTaskError } from "../../redux/slices/taskSlice";

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
//     const { title, date, time_alloted } = data;

//     const taskData = {
//       title,
//       assigned_to: team,
//       stage,
//       taskDate: new Date(date).toISOString(),
//       priority,
//       assets,
//       time_alloted
//     };

//     setUploading(true);

//     await dispatch(createTask(taskData));
    
//     setUploading(false);
//     if (status === "succeeded") {
//       setOpen(false);
//     }
//   };

//   // const handleSelect = (e) => {
//   //   const files = Array.from(e.target.files);
//   //   const newAssets = files.map(file => URL.createObjectURL(file));
//   //   setAssets(newAssets);
//   // };

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
//            <Textbox
//   placeholder='Time Allotted'
//   type='number'
//   name='time_alloted'
//   label='Time Allotted (in hours)'
//   className='w-full rounded'
//   register={register("time_alloted", {
//     required: "Time allotted is required",
//     min: { value: 1, message: "Minimum time is 1 hour" },
//     max: { value: 24, message: "Maximum time is 24 hours" }
//   })}
// />

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
//                     required: "Date is required!",
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
//               </div>
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
//               )} */}

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













// import React, { useState } from "react";
// import ModalWrapper from "../ModalWrapper";
// import { Dialog } from "@headlessui/react";
// import Textbox from "../Textbox";
// import { useForm } from "react-hook-form";  
// import UserList from "./UserList";
// import SelectList from "../SelectList";
// import Button from "../Button";
// import { useDispatch, useSelector } from "react-redux";
// import { createTask, selectTaskStatus, selectTaskError } from "../../redux/slices/taskSlice";

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

//   const [uploading, setUploading] = useState(false);

//   const submitHandler = async (data) => {
//     const { title, date, time_alloted } = data;

//     const taskData = {
//       title,
//       assigned_to: team,
//       stage,
//       taskDate: new Date(date).toISOString(),
//       priority,
//       time_alloted,
//     };

//     setUploading(true);
//     await dispatch(createTask(taskData));
//     setUploading(false);

//     if (status === "succeeded") {
//       setOpen(false);
//     }
//   };

//   return (
//     <ModalWrapper open={open} setOpen={setOpen}>
//       <form onSubmit={handleSubmit(submitHandler)}>
//         <Dialog.Title as="h2" className="text-base font-bold leading-6 text-gray-900 mb-4">
//           ADD TASK
//         </Dialog.Title>

//         <div className="mt-2 flex flex-col gap-6">
//           <Textbox
//             placeholder="Task Title"
//             type="text"
//             name="title"
//             label="Task Title"
//             className="w-full rounded"
//             register={register("title", { required: "Title is required" })}
//             error={errors.title ? errors.title.message : ""}
//           />

//           <Textbox
//             placeholder="Time Alloted"
//             type="text"
//             name="time_alloted"
//             label="Time Alloted"
//             className="w-full rounded"
//             register={register("time_alloted")}
//           />

//           <UserList setTeam={setTeam} team={team} />

//           <div className="flex gap-4">
//             <SelectList label="Task Stage" lists={LISTS} selected={stage} setSelected={setStage} />

//             <div className="w-full">
//               <Textbox
//                 placeholder="Date"
//                 type="date"
//                 name="date"
//                 label="Task Date"
//                 className="w-full rounded"
//                 register={register("date", { required: "Date is required!" })}
//                 error={errors.date ? errors.date.message : ""}
//               />
//             </div>
//           </div>

//           <div className="flex gap-4">
//             <SelectList
//               label="Priority Level"
//               lists={PRIORITY}
//               selected={priority}
//               setSelected={setPriority}
//             />
//           </div>

//           <div className="bg-gray-50 py-6 sm:flex sm:flex-row-reverse gap-4">
//             {uploading ? (
//               <span className="text-sm py-2 text-red-500">Uploading task...</span>
//             ) : (
//               <Button
//                 label="Submit"
//                 type="submit"
//                 className="bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
//               />
//             )}

//             <Button
//               type="button"
//               className="bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto"
//               onClick={() => setOpen(false)}
//               label="Cancel"
//             />
//           </div>
//         </div>
//         {status === "failed" && <div className="text-red-500">{error}</div>}
//       </form>
//     </ModalWrapper>
//   );
// };

// export default AddTask;












// import React, { useState, useEffect } from "react";
// import ModalWrapper from "../ModalWrapper";
// import { Dialog } from "@headlessui/react";
// import Textbox from "../Textbox";
// import { useForm } from "react-hook-form";  
// import UserList from "./UserList";
// import SelectList from "../SelectList";
// import Button from "../Button";
// import axios from "axios";  // Assuming you are using axios for API requests

// const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
// const PRIORITY = ["HIGH", "MEDIUM", "NORMAL", "LOW"];

// const AddTask = ({ open, setOpen }) => {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm();

//   const [team, setTeam] = useState([]);
//   const [stage, setStage] = useState(LISTS[0]);
//   const [priority, setPriority] = useState(PRIORITY[2]);
//   const [client_id, setClientId] = useState(null);  // New state for client selection
//   const [clients, setClients] = useState([]);  // State to store clients
//   const [uploading, setUploading] = useState(false);

//   // Fetch clients when the component mounts
//   useEffect(() => {
//     const fetchClients = async () => {
//       try {
//         const response = await axios.get("http://localhost:4000/api/clients/clients");  // Replace with your actual API endpoint
//         setClients(response.data);  // Set the clients list in state
//       } catch (error) {
//         console.error("Error fetching clients:", error);
//       }
//     };
//     fetchClients();
//   }, []);

//   const submitHandler = async (data) => {
//     const { title, date, time_alloted } = data;

//     const taskData = {
//       title,
//       assigned_to: team,
//       stage,
//       taskDate: new Date(date).toISOString(),
//       priority,
//       time_alloted,
//       client_id,  // Include the selected client ID
//     };

//     setUploading(true);

//     try {
//       const response = await axios.post("http://localhost:4000/api/tasks/createjson", taskData);  // Replace with your actual API endpoint
//       if (response.status === 200) {
//         setOpen(false);
//       }
//     } catch (error) {
//       console.error("Error creating task:", error);
//     }

//     setUploading(false);
//   };

//   return (
//     <ModalWrapper open={open} setOpen={setOpen}>
//       <form onSubmit={handleSubmit(submitHandler)}>
//         <Dialog.Title as="h2" className="text-base font-bold leading-6 text-gray-900 mb-4">
//           ADD TASK
//         </Dialog.Title>

//         <div className="mt-2 flex flex-col gap-6">
//           <Textbox
//             placeholder="Task Title"
//             type="text"
//             name="title"
//             label="Task Title"
//             className="w-full rounded"
//             register={register("title", { required: "Title is required" })}
//             error={errors.title ? errors.title.message : ""}
//           />

//           <Textbox
//             placeholder="Time Alloted"
//             type="text"
//             name="time_alloted"
//             label="Time Alloted"
//             className="w-full rounded"
//             register={register("time_alloted")}
//           />

//           <UserList setTeam={setTeam} team={team} />

//           <div className="flex gap-4">
//             <SelectList label="Task Stage" lists={LISTS} selected={stage} setSelected={setStage} />

//             <div className="w-full">
//               <Textbox
//                 placeholder="Date"
//                 type="date"
//                 name="date"
//                 label="Task Date"
//                 className="w-full rounded"
//                 register={register("date", { required: "Date is required!" })}
//                 error={errors.date ? errors.date.message : ""}
//               />
//             </div>
//           </div>

//           <div className="flex gap-4">
//             <SelectList
//               label="Priority Level"
//               lists={PRIORITY}
//               selected={priority}
//               setSelected={setPriority}
//             />
//           </div>

//           {/* <div className="flex gap-4">
//             <SelectList
//               label="Select Client"
//               lists={clients.map((client) => client.name)}  // Assuming clients have a 'name' property
//               selected={client_id}  // Use client_id here
//               setSelected={setClientId}  // Update client_id on selection
//             />
//           </div> */}

// {/* <SelectList
//   label="Select Client"
//   lists={clients.map((client) => ({ id: client.id, name: client.name }))}  // Assuming 'client.id' and 'client.name'
//   selected={client_id}  // This should hold the client ID
//   setSelected={setClientId}  // Update client_id when a client is selected
// /> */}

// <Select
//   value={selected}
//   onChange={(e) => setSelected(e.target.value)}
// >
//   {lists.map((name, index) => (
//     <option key={index} value={name}>
//       {name}
//     </option>
//   ))}
// </Select>
//           <div className="bg-gray-50 py-6 sm:flex sm:flex-row-reverse gap-4">
//             {uploading ? (
//               <span className="text-sm py-2 text-red-500">Uploading task...</span>
//             ) : (
//               <Button
//                 label="Submit"
//                 type="submit"
//                 className="bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
//               />
//             )}

//             <Button
//               type="button"
//               className="bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto"
//               onClick={() => setOpen(false)}
//               label="Cancel"
//             />
//           </div>
//         </div>
//         {status === "failed" && <div className="text-red-500">{error}</div>}
//       </form>
//     </ModalWrapper>
//   );
// };

// export default AddTask;





// // AddTask.js
// import React, { useState, useEffect } from "react";
// import ModalWrapper from "../ModalWrapper";
// import { Dialog } from "@headlessui/react";
// import Textbox from "../Textbox";
// import { useForm } from "react-hook-form";
// import UserList from "./UserList";
// import SelectList from "../SelectList";
// import Button from "../Button";
// import axios from "axios";  // Assuming you are using axios for API requests

// const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
// const PRIORITY = ["HIGH", "MEDIUM", "LOW"];

// const AddTask = ({ open, setOpen }) => {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm();

//   const [team, setTeam] = useState([]);
//   const [stage, setStage] = useState(LISTS[0]);
//   const [priority, setPriority] = useState(PRIORITY[2]);
//   const [client_id, setClientId] = useState("");  // State to store selected client ID
//   const [clients, setClients] = useState([]);  // State to store clients
//   const [uploading, setUploading] = useState(false);

//   // Fetch clients when the component mounts
//   useEffect(() => {
//     const fetchClients = async () => {
//       try {
//         const response = await axios.get("http://localhost:4000/api/clients/clients");  // Replace with your actual API endpoint
//         setClients(response.data);  // Set the clients list in state
//       } catch (error) {
//         console.error("Error fetching clients:", error);
//       }
//     };
//     fetchClients();
//   }, []);

//   const submitHandler = async (data) => {
//     const { title, date, time_alloted } = data;

//     const taskData = {
//       title,
//       assigned_to: team,
//       stage,
//       taskDate: new Date(date).toISOString(),
//       priority,
//       time_alloted,
//       client_id,  // Include the selected client ID
//     };

//     setUploading(true);

//     try {
//       const response = await axios.post("http://localhost:4000/api/tasks/createjson", taskData);  // Replace with your actual API endpoint
//       if (response.status === 200) {
//         setOpen(false);
//       }
//     } catch (error) {
//       console.error("Error creating task:", error);
//     }

//     setUploading(false);
//   };

//   return (
//     <ModalWrapper open={open} setOpen={setOpen}>
//       <form onSubmit={handleSubmit(submitHandler)}>
//         <Dialog.Title as="h2" className="text-base font-bold leading-6 text-gray-900 mb-4">
//           ADD TASK
//         </Dialog.Title>

//         <div className="mt-2 flex flex-col gap-6">
//           <Textbox
//             placeholder="Task Title"
//             type="text"
//             name="title"
//             label="Task Title"
//             className="w-full rounded"
//             register={register("title", { required: "Title is required" })}
//             error={errors.title ? errors.title.message : ""}
//           />

//           <Textbox
//             placeholder="Time Alloted"
//             type="text"
//             name="time_alloted"
//             label="Time Alloted"
//             className="w-full rounded"
//             register={register("time_alloted")}
//           />

//           <UserList setTeam={setTeam} team={team} />

//           <div className="flex gap-4">
//             <SelectList label="Task Stage" lists={LISTS} selected={stage} setSelected={setStage} />

//             <div className="w-full">
//               <Textbox
//                 placeholder="Date"
//                 type="date"
//                 name="date"
//                 label="Task Date"
//                 className="w-full rounded"
//                 register={register("date", { required: "Date is required!" })}
//                 error={errors.date ? errors.date.message : ""}
//               />
//             </div>
//           </div>

//           <div className="flex gap-4">
//             <SelectList
//               label="Priority Level"
//               lists={PRIORITY}
//               selected={priority}
//               setSelected={setPriority}
//             />
//           </div>

//           <div className="flex gap-4">
//           {/* <SelectList
//   label="Select Client"
//   lists={clients}
//   selected={client_id}  
//   setSelected={setClientId}  
//  /> */}
//  <SelectList
//   label="Select Client"
//   lists={clients.map(client => client.name)} 
//   selected={client_id ? 
//     clients.find(client => client.id === client_id)?.name || '' 
//     : ''
//   }  // Show the name of the selected client
//   setSelected={(selectedName) => {
//     const selectedClient = clients.find(client => client.name === selectedName);
    
//     // Set the client_id to the ID of the selected client
//     setClientId(selectedClient ? selectedClient.id : '');
//   }} 
// />
//           </div>

//           <div className="bg-gray-50 py-6 sm:flex sm:flex-row-reverse gap-4">
//             {uploading ? (
//               <span className="text-sm py-2 text-red-500">Uploading task...</span>
//             ) : (
//               <Button
//                 label="Submit"
//                 type="submit"
//                 className="bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
//               />
//             )}

//             <Button
//               type="button"
//               className="bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto"
//               onClick={() => setOpen(false)}
//               label="Cancel"
//             />
//           </div>
//         </div>
//       </form>
//     </ModalWrapper>
//   );
// };

// export default AddTask;











import React, { useState, useEffect } from "react";
import ModalWrapper from "../ModalWrapper";
import { Dialog } from "@headlessui/react";
import Textbox from "../Textbox";
import { useForm } from "react-hook-form";
import UserList from "./UserList";
import SelectList from "../SelectList";
import Button from "../Button";
import axios from "axios"; // Assuming you are using axios for API requests

const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
const PRIORITY = ["HIGH", "MEDIUM", "LOW"];

const AddTask = ({ open, setOpen }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset, // Use reset to reset the form fields after successful submission
  } = useForm();

  const [team, setTeam] = useState([]);
  const [stage, setStage] = useState(LISTS[0]);
  const [priority, setPriority] = useState(PRIORITY[2]);
  const [client_id, setClientId] = useState(""); // State to store selected client ID
  const [clients, setClients] = useState([]); // State to store clients
  const [uploading, setUploading] = useState(false);

  // Fetch clients when the component mounts
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/clients/clients"); // Replace with your actual API endpoint
        setClients(response.data); // Set the clients list in state
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
    fetchClients();
  }, []);

  const submitHandler = async (data) => {
    const { title, date, time_alloted } = data;

    const taskData = {
      title,
      assigned_to: team,
      stage,
      taskDate: new Date(date).toISOString(),
      priority,
      time_alloted,
      client_id, // Include the selected client ID
    };

    setUploading(true);

    try {
      const response = await axios.post("http://localhost:4000/api/tasks/createjson", taskData); // Replace with your actual API endpoint
      if (response.status === 200) {
        // Close the modal and reset the form after submission
        setOpen(false);
        reset(); // Reset form values
        setClientId(""); // Clear the client selection
        setTeam([]); // Clear the team selection
        setStage(LISTS[0]); // Reset to default stage
        setPriority(PRIORITY[2]); // Reset to default priority
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

        <div className="mt-2 flex flex-col gap-6">
          <Textbox
            placeholder="Task Title"
            type="text"
            name="title"
            label="Task Title"
            className="w-full rounded"
            register={register("title", { required: "Title is required" })}
            error={errors.title ? errors.title.message : ""}
          />

          <Textbox
            placeholder="Time Alloted"
            type="text"
            name="time_alloted"
            label="Time Alloted"
            className="w-full rounded"
            register={register("time_alloted")}
          />

          <UserList setTeam={setTeam} team={team} />

          <div className="flex gap-4">
            <SelectList label="Task Stage" lists={LISTS} selected={stage} setSelected={setStage} />

            <div className="w-full">
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
          </div>

          <div className="flex gap-4">
            <SelectList label="Priority Level" lists={PRIORITY} selected={priority} setSelected={setPriority} />
          </div>

          <div className="flex gap-4">
            <SelectList
              label="Select Client"
              lists={clients.map((client) => client.name)}
              selected={client_id ? clients.find((client) => client.id === client_id)?.name || "" : ""}
              setSelected={(selectedName) => {
                const selectedClient = clients.find((client) => client.name === selectedName);
                setClientId(selectedClient ? selectedClient.id : "");
              }}
            />
          </div>

          <div className="bg-gray-50 py-6 sm:flex sm:flex-row-reverse gap-4">
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
