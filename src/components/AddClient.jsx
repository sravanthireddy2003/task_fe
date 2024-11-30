
// import React, { useState } from "react";
// import ModalWrapper from "../components/ModalWrapper";
// import { Dialog } from "@headlessui/react";
// import Textbox from "../components/Textbox";
// import { useForm } from "react-hook-form";
// import Button from "../components/Button";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";

// // import { createClient, selectClientStatus, selectClientError } from "../../redux/slices/clientSlice";

// const AddClient = ({ open, setOpen }) => {
//   const dispatch = useDispatch();
//   const status = useSelector(selectClientStatus);
//   const error = useSelector(selectClientError);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm();

//   const submitHandler = async (data) => {
//     const { name, address, pan, organization, gst, tin } = data;

//     const clientData = {
//       name,
//       address,
//       pan,
//       organization,
//       gst,
//       tin,
//     };

//     await dispatch(createClient(clientData));

//     if (status === "succeeded") {
//       setOpen(false);
//     }
//   };

//   return (
//     <>
//       <ModalWrapper open={open} setOpen={setOpen}>
//         <form onSubmit={handleSubmit(submitHandler)}>
//           <Dialog.Title
//             as='h2'
//             className='text-base font-bold leading-6 text-gray-900 mb-4'
//           >
//             ADD CLIENT
//           </Dialog.Title>

//           <div className='mt-2 flex flex-col gap-6'>
//             <Textbox
//               placeholder='Client Name'
//               type='text'
//               name='name'
//               label='Client Name'
//               className='w-full rounded'
//               register={register("name", { required: "Client Name is required" })}
//               error={errors.name ? errors.name.message : ""}
//             />

//             <Textbox
//               placeholder='Address'
//               type='text'
//               name='address'
//               label='Address'
//               className='w-full rounded'
//               register={register("address", { required: "Address is required" })}
//               error={errors.address ? errors.address.message : ""}
//             />

//             <Textbox
//               placeholder='PAN'
//               type='text'
//               name='pan'
//               label='PAN Number'
//               className='w-full rounded'
//               register={register("pan", { required: "PAN is required" })}
//               error={errors.pan ? errors.pan.message : ""}
//             />

//             <Textbox
//               placeholder='Organization'
//               type='text'
//               name='organization'
//               label='Organization'
//               className='w-full rounded'
//               register={register("organization", { required: "Organization is required" })}
//               error={errors.organization ? errors.organization.message : ""}
//             />

//             <Textbox
//               placeholder='GST'
//               type='text'
//               name='gst'
//               label='GST Number'
//               className='w-full rounded'
//               register={register("gst", { required: "GST number is required" })}
//               error={errors.gst ? errors.gst.message : ""}
//             />

//             <Textbox
//               placeholder='TIN'
//               type='text'
//               name='tin'
//               label='TIN Number'
//               className='w-full rounded'
//               register={register("tin", { required: "TIN number is required" })}
//               error={errors.tin ? errors.tin.message : ""}
//             />

//             <div className='bg-gray-50 py-6 sm:flex sm:flex-row-reverse gap-4'>
//               <Button
//                 label='Submit'
//                 type='submit'
//                 className='bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto'
//               />

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

// export default AddClient;
