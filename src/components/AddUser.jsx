// import React from "react";
import { useForm } from "react-hook-form";
import ModalWrapper from "./ModalWrapper";
import { Dialog } from "@headlessui/react";
import Textbox from "./Textbox";
import Loading from "./Loader";
import Button from "./Button";
import { useSelector, useDispatch } from "react-redux";
import { authRegister } from "../redux/slices/authSlice";
 
const AddUser = ({ open, setOpen, userData }) => {
  const dispatch = useDispatch();
  let defaultValues = userData ?? {};
  const { isLoading, isUpdating } = useSelector((state) => state.auth);
 
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues });
 
  const handleOnSubmit = (data) => {
    // console.log(data)
    dispatch(authRegister(data));
  };
 
  return (
    <>
      <ModalWrapper open={open} setOpen={setOpen}>
        <form onSubmit={handleSubmit(handleOnSubmit)} className="">
          <Dialog.Title
            as="h2"
            className="text-base font-bold leading-6 text-gray-900 mb-4"
          >
            {userData ? "UPDATE PROFILE" : "ADD NEW USER"}
          </Dialog.Title>
          <div className="mt-2 flex flex-col gap-6">
            <Textbox
              placeholder="Full name"
              type="text"
              name="name"
              label="Full Name"
              className="w-full rounded"
              register={register("name", {
                required: "Full name is required!",
              })}
              error={errors.name ? errors.name.message : ""}
            />
            <Textbox
              placeholder="Title"
              type="text"
              name="title"
              label="Title"
              className="w-full rounded"
              register={register("title", {
                required: "Title is required!",
              })}
              error={errors.title ? errors.title.message : ""}
            />
            <Textbox
              placeholder="Email Address"
              type="email"
              name="email"
              label="Email Address"
              className="w-full rounded"
              register={register("email", {
                required: "Email Address is required!",
              })}
              error={errors.email ? errors.email.message : ""}
            />
            <Textbox
              placeholder="Password"
              type="password"
              name="password"
              label="Password"
              className="w-full rounded"
              register={register("password", {
                required: "Password is required!",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters long",
                },
              })}
              error={errors.password ? errors.password.message : ""}
            />
            <Textbox
              placeholder="Role"
              type="text"
              name="role"
              label="Role"
              className="w-full rounded"
              register={register("role", {
                required: "User role is required!",
              })}
              error={errors.role ? errors.role.message : ""}
            />
            {/* <div className="flex items-center">
              <input
                type="checkbox"
                id="isAdmin"
                {...register("isAdmin")}
                className="mr-2"
              />
              <label htmlFor="isAdmin" className="text-sm font-medium">
                Is Admin
              </label>
            </div> */}
 
<div className="flex justify-around">
<div className="flex items-center">
 
 
  <label htmlFor="role" className="text-sm font-medium mr-2">
    Role
  </label>
  <select
    id="role"
    {...register("role")}
    className="p-2 border rounded-md"
  >
    <option value="0">User</option>
    <option value="2">TeamLead</option>
    <option value="1">Admin</option>
  </select>
  </div>
 
  <div className="flex items-center">
  <input
                type="checkbox"
                id="isGuest"
                {...register("isGuest")}
                className="mr-2"
                // defaultChecked
                value={1}
               
              />
              <label htmlFor="isGuest" className="text-sm font-medium">
                Is Guest
              </label>
  </div>
</div>
 
            {/* <Textbox
              placeholder="Tasks"
              type="text"
              name="tasks"
              label="Tasks"
              className="w-full rounded"
              register={register("tasks")}
              error={errors.tasks ? errors.tasks.message : ""}
            /> */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                {...register("isActive")}
                className="mr-2"
                defaultChecked
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Is Active
              </label>
            </div>
          </div>
 
          {isLoading || isUpdating ? (
            <div className="py-5">
              <Loading />
            </div>
          ) : (
            <div className="py-3 mt-4 sm:flex sm:flex-row-reverse">
              <Button
                type="submit"
                className="bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
                label="Submit"
              />
              <Button
                type="button"
                className="bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto"
                onClick={() => setOpen(false)}
                label="Cancel"
              />
            </div>
          )}
        </form>
      </ModalWrapper>
    </>
  );
};
 
export default AddUser;



























// import React from "react";
// import { useForm } from "react-hook-form";
// import ModalWrapper from "./ModalWrapper";
// import { Dialog } from "@headlessui/react";
// import Textbox from "./Textbox";
// import Loading from "./Loader";
// import Button from "./Button";
// import { useSelector,useDispatch } from "react-redux";
// import { authRegister } from "../redux/slices/authSlice";

// const dispatch=useDispatch();

// const AddUser = ({ open, setOpen, userData }) => {
//   let defaultValues = userData ?? {};
//   const { user } = useSelector((state) => state.auth);

//   const isLoading = false,
//     isUpdating = false;

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm({ defaultValues });

//   const handleOnSubmit = (data) => { 
//     dispatch(authRegister(data));
//   };

//   return (
//     <>
//       <ModalWrapper open={open} setOpen={setOpen}>
//         <form onSubmit={handleSubmit(handleOnSubmit)} className=''>
//           <Dialog.Title
//             as='h2'
//             className='text-base font-bold leading-6 text-gray-900 mb-4'
//           >
//             {userData ? "UPDATE PROFILE" : "ADD NEW USER"}
//           </Dialog.Title>
//           <div className='mt-2 flex flex-col gap-6'>
//             <Textbox
//               placeholder='Full name'
//               type='text'
//               name='name'
//               label='Full Name'
//               className='w-full rounded'
//               register={register("name", {
//                 required: "Full name is required!",
//               })}
//               error={errors.name ? errors.name.message : ""}
//             />
//             <Textbox
//               placeholder='Title'
//               type='text'
//               name='title'
//               label='Title'
//               className='w-full rounded'
//               register={register("title", {
//                 required: "Title is required!",
//               })}
//               error={errors.title ? errors.title.message : ""}
//             />
//             <Textbox
//               placeholder='Email Address'
//               type='email'
//               name='email'
//               label='Email Address'
//               className='w-full rounded'
//               register={register("email", {
//                 required: "Email Address is required!",
//               })}
//               error={errors.email ? errors.email.message : ""}
//             />

//             <Textbox
//               placeholder='Role'
//               type='text'
//               name='role'
//               label='Role'
//               className='w-full rounded'
//               register={register("role", {
//                 required: "User role is required!",
//               })}
//               error={errors.role ? errors.role.message : ""}
//             />
//           </div>

//           {isLoading || isUpdating ? (
//             <div className='py-5'>
//               <Loading />
//             </div>
//           ) : (
//             <div className='py-3 mt-4 sm:flex sm:flex-row-reverse'>
//               <Button
//                 type='submit'
//                 className='bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700  sm:w-auto'
//                 label='Submit'
//               />

//               <Button
//                 type='button'
//                 className='bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto'
//                 onClick={() => setOpen(false)}
//                 label='Cancel'
//               />
//             </div>
//           )}
//         </form>
//       </ModalWrapper>
//     </>
//   );
// };

// export default AddUser;
