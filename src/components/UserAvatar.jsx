// import { Menu, Transition } from "@headlessui/react";
// import { Fragment, useState } from "react";
// import { FaUser, FaUserLock } from "react-icons/fa";
// import { IoLogOutOutline } from "react-icons/io5";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { getInitials } from "../utils";
// import { logout } from "../redux/slices/authSlice";

// const UserAvatar = () => {
//   const [open, setOpen] = useState(false);
//   const [openPassword, setOpenPassword] = useState(false);
//   const { user } = useSelector((state) => state.auth);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const logoutHandler = () => {
//     dispatch(logout());
//     console.log("logout");
//     navigate("/log-in");
//   };

//   return (
//     <>
//       <div>
//         <Menu as='div' className='relative inline-block text-left'>
//           <div>
//             <Menu.Button className='w-10 h-10 2xl:w-12 2xl:h-12 items-center justify-center rounded-full bg-blue-600'>
//               <span className='text-white font-semibold'>
//                 {getInitials(user?.name)}
//               </span>
//             </Menu.Button>
//           </div>

//           <Transition
//             as={Fragment}
//             enter='transition ease-out duration-100'
//             enterFrom='transform opacity-0 scale-95'
//             enterTo='transform opacity-100 scale-100'
//             leave='transition ease-in duration-75'
//             leaveFrom='transform opacity-100 scale-100'
//             leaveTo='transform opacity-0 scale-95'
//           >
//             <Menu.Items className='absolute right-0 mt-2 w-56 origin-top-right divide-gray-100 rounded-md bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none'>
//               <div className='p-4'>
//                 <Menu.Item>
//                   {({ active }) => (
//                     <button
//                       onClick={() => setOpen(true)}
//                       className='text-gray-700 group flex w-full items-center rounded-md px-2 py-2 text-base'
//                     >
//                       <FaUser className='mr-2' aria-hidden='true' />
//                       Profile
//                     </button>
//                   )}
//                 </Menu.Item>

//                 <Menu.Item>
//                   {({ active }) => (
//                     <button
//                       onClick={() => setOpenPassword(true)}
//                       className={`tetx-gray-700 group flex w-full items-center rounded-md px-2 py-2 text-base`}
//                     >
//                       <FaUserLock className='mr-2' aria-hidden='true' />
//                       Change Password
//                     </button>
//                   )}
//                 </Menu.Item>

//                 <Menu.Item>
//                   {({ active }) => (
//                     <button
//                       onClick={logoutHandler}
//                       className={`text-red-600 group flex w-full items-center rounded-md px-2 py-2 text-base`}
//                     >
//                       <IoLogOutOutline className='mr-2' aria-hidden='true' />
//                       Logout
//                     </button>
//                   )}
//                 </Menu.Item>
//               </div>
//             </Menu.Items>
//           </Transition>
//         </Menu>
//       </div>
//     </>
//   );
// };

// export default UserAvatar;







import { Menu, Transition, Dialog } from "@headlessui/react";
import { Fragment, useState } from "react";
import { FaUser, FaUserLock } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getInitials } from "../utils";
import { logout } from "../redux/slices/authSlice";

const UserAvatar = () => {
  const [openProfile, setOpenProfile] = useState(false);
  const [openPassword, setOpenPassword] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutHandler = () => {
    dispatch(logout());
    console.log("logout");
    navigate("/log-in");
  };

  const closeProfileModal = () => {
    setOpenProfile(false);
  };

  const openProfileModal = () => {
    setOpenProfile(true);
  };

  const closePasswordModal = () => {
    setOpenPassword(false);
  };

  const openPasswordModal = () => {
    setOpenPassword(true);
  };

  return (
    <>
      <div>
        <Menu as='div' className='relative inline-block text-left'>
          <div>
            <Menu.Button className='w-10 h-10 2xl:w-12 2xl:h-12 items-center justify-center rounded-full bg-blue-600'>
              <span className='text-white font-semibold'>
                {getInitials(user?.name)}
              </span>
            </Menu.Button>
          </div>

          <Transition
            as={Fragment}
            enter='transition ease-out duration-100'
            enterFrom='transform opacity-0 scale-95'
            enterTo='transform opacity-100 scale-100'
            leave='transition ease-in duration-75'
            leaveFrom='transform opacity-100 scale-100'
            leaveTo='transform opacity-0 scale-95'
          >
            <Menu.Items className='absolute right-0 mt-2 w-56 origin-top-right divide-gray-100 rounded-md bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none'>
              <div className='p-4'>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={openProfileModal}
                      className='text-gray-700 group flex w-full items-center rounded-md px-2 py-2 text-base'
                    >
                      <FaUser className='mr-2' aria-hidden='true' />
                      Profile
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={openPasswordModal}
                      className='text-gray-700 group flex w-full items-center rounded-md px-2 py-2 text-base'
                    >
                      <FaUserLock className='mr-2' aria-hidden='true' />
                      Change Password
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logoutHandler}
                      className='text-red-600 group flex w-full items-center rounded-md px-2 py-2 text-base'
                    >
                      <IoLogOutOutline className='mr-2' aria-hidden='true' />
                      Logout
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Profile Modal */}
      <Transition appear show={openProfile} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={closeProfileModal}>
          <div className="min-h-screen px-4 text-center">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                Profile
              </Dialog.Title>
              
              <div className="mt-2">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                    {user?.name}
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                    {user?.email}
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                    {user?.role}
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={closeProfileModal}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Change Password Modal */}
      <Transition appear show={openPassword} as={Fragment}>

        <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={closePasswordModal}>
          <div className="min-h-screen px-4 text-center">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                Change Password
              </Dialog.Title>
              
              <div className="mt-2">
                <form>
                  <div className="mb-4">
                    <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">Current Password</label>
                    <input
                      type="password"
                      id="current-password"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      id="new-password"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirm-password"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div className="mt-4">
                    <button
                      type="submit"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                    >
                      Change Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default UserAvatar;
