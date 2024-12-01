import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone } from 'react-icons/fi';
import axios from 'axios'; // Make sure to install axios: npm install axios

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
  "Daman and Diu", "Lakshadweep", "Delhi", "Puducherry", "Ladakh",
  "Jammu & Kashmir"
];

const AddClientsPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [submitError, setSubmitError] = useState(null);

  const onSubmit = async (data) => {
    try {
      // Send data to the backend API
      const response = await axios.post('http://localhost:4000/api/clients/clients', data);
      console.log('Client added successfully:', response.data);

      // Navigate to the client list or a success page
      navigate("/client");
    } catch (error) {
      if (error.response) {
        // Server responded with a status other than 2xx
        console.error('Server error:', error.response.data);
        setSubmitError(error.response.data.message || 'An error occurred while adding the client');
      } else if (error.request) {
        // Request was made, but no response was received
        console.error('Network error:', error.request);
        setSubmitError('Network error. Please try again.');
      } else {
        // Something happened in setting up the request
        console.error('Error:', error.message);
        setSubmitError('Unexpected error. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    navigate("/client");
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Add New Client</h2>
          
          {submitError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              {submitError}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* <div>
                  <label className="block text-sm font-medium mb-1">Reference</label>
                  <input
                    {...register("ref", { required: "Reference is required" })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Reference"
                  />
                  {errors.ref && <p className="text-red-500 text-sm mt-1">{errors.ref.message}</p>}
                </div> */}

                <div>
                  <label className="block text-sm font-medium mb-1">Client Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-3 text-gray-400" />
                    <input
                      {...register("name", { required: "Name is required" })}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Client Name"
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-3 text-gray-400" />
                    <input
                      {...register("email", { 
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address"
                        }
                      })}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Email"
                      type="email"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-3 text-gray-400" />
                    <input
                      {...register("phone", { 
                        required: "Phone is required",
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: "Phone number must be 10 digits"
                        }
                      })}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Phone"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <input
                    {...register("company")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Company"
                  />
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Street Address</label>
                  <textarea
                    {...register("address")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Street Address"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">District</label>
                  <input
                    {...register("district")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="District"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <select
                    {...register("state")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select State</option>
                    {indianStates.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Pincode</label>
                  <input
                    {...register("pincode", {
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: "Pincode must be 6 digits"
                      }
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Pincode"
                  />
                  {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode.message}</p>}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Submit
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddClientsPage;


// import React, { useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { useNavigate } from 'react-router-dom';
// import { FiUser, FiMail, FiPhone } from 'react-icons/fi';
// import axios from 'axios'; // Make sure to install axios: npm install axios

// const indianStates = [
//   "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
//   "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
//   "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
//   "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
//   "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
//   "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
//   "Daman and Diu", "Lakshadweep", "Delhi", "Puducherry", "Ladakh",
//   "Jammu & Kashmir"
// ];

// const AddClientsPage = () => {
//   const navigate = useNavigate();
//   const { register, handleSubmit, formState: { errors } } = useForm();
//   const [submitError, setSubmitError] = useState(null);

//   // const onSubmit = async (data) => {
//   //   try {
//   //     // Send data to backend API
//   //     const response = await axios.post('localhost:4000/api/clients/clients', data);
      
//   //     // Show success message or navigate to client list
//   //     console.log('Client added successfully:', response.data);
//   //     navigate("/client");
//   //   } catch (error) {
//   //     console.error('Error adding client:', error);
//   //     setSubmitError(error.response?.data?.error || 'An error occurred while adding the client');
//   //   }
//   // };

//   const onSubmit = async (data) => {
//     try {
//       // Ensure the API endpoint is correct
//       const response = await axios.post('http://localhost:4000/api/clients/clients', data);
//       console.log('Client added successfully:', response.data);
  
//       // Navigate to the client list or a success page
//       navigate("/client");
//     } catch (error) {
//       if (error.response) {
//         // Server responded with a status other than 2xx
//         console.error('Server error:', error.response.data);
//         setSubmitError(error.response.data.message || 'An error occurred while adding the client');
//       } else if (error.request) {
//         // Request was made, but no response was received
//         console.error('Network error:', error.request);
//         setSubmitError('Network error. Please try again.');
//       } else {
//         // Something happened in setting up the request
//         console.error('Error:', error.message);
//         setSubmitError('Unexpected error. Please try again.');
//       }
//     }
//   };
  

//   const handleCancel = () => {
//     navigate("/client");
//   };

//   return (
//     <div className="container mx-auto p-6">
//       <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
//         <div className="p-6">
//           <h2 className="text-2xl font-bold mb-6">Add New Client</h2>
          
//           {submitError && (
//             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
//               {submitError}
//             </div>
//           )}
          
//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//             {/* Rest of the form remains the same as in the original code */}
//             {/* Basic Information Section */}
//             <div>
//               <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Reference</label>
//                   <div className="relative">
//                     <input
//                       {...register("ref", { required: "Reference is required" })}
//                       className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       placeholder="Reference"
//                     />
//                   </div>
//                   {errors.ref && <p className="text-red-500 text-sm mt-1">{errors.ref.message}</p>}
//                 </div>

//                 {/* Other input fields remain the same */}
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Client Name</label>
//                   <div className="relative">
//                     <FiUser className="absolute left-3 top-3 text-gray-400" />
//                     <input
//                       {...register("name", { required: "Name is required" })}
//                       className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       placeholder="Client Name"
//                     />
//                   </div>
//                   {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
//                 </div>

//                 {/* Email input with validation */}
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Email</label>
//                   <div className="relative">
//                     <FiMail className="absolute left-3 top-3 text-gray-400" />
//                     <input
//                       {...register("email", { 
//                         required: "Email is required",
//                         pattern: {
//                           value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
//                           message: "Invalid email address"
//                         }
//                       })}
//                       className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       placeholder="Email"
//                       type="email"
//                     />
//                   </div>
//                   {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
//                 </div>

//                 {/* Phone input */}
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Phone</label>
//                   <div className="relative">
//                     <FiPhone className="absolute left-3 top-3 text-gray-400" />
//                     <input
//                       {...register("phone", { 
//                         required: "Phone is required",
//                         pattern: {
//                           value: /^[0-9]{10}$/,
//                           message: "Phone number must be 10 digits"
//                         }
//                       })}
//                       className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       placeholder="Phone"
//                     />
//                   </div>
//                   {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
//                 </div>

//                 {/* Company input */}
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Company</label>
//                   <div className="relative">
//                     <input
//                       {...register("company")}
//                       className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       placeholder="Company"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Address Information Section (remains the same) */}
//             <div>
//               <h3 className="text-lg font-semibold mb-4">Address Information</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-medium mb-1">Street Address</label>
//                   <div className="relative">
//                     <textarea
//                       {...register("address")}
//                       className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       placeholder="Street Address"
//                       rows="3"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">District</label>
//                   <input
//                     {...register("district")}
//                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="District"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">State</label>
//                   <select
//                     {...register("state")}
//                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   >
//                     <option value="">Select State</option>
//                     {indianStates.map((state) => (
//                       <option key={state} value={state}>{state}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Pincode</label>
//                   <input
//                     {...register("pincode", {
//                       pattern: {
//                         value: /^[0-9]{6}$/,
//                         message: "Pincode must be 6 digits"
//                       }
//                     })}
//                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Pincode"
//                   />
//                   {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode.message}</p>}
//                 </div>
//               </div>
//             </div>

//             {/* Financial Information Section (remains the same) */}
//             <div>
//               <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Tax ID</label>
//                   <input
//                     {...register("taxId")}
//                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Tax ID"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Payment Terms</label>
//                   <input
//                     {...register("paymentTerms")}
//                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="e.g., Net 30, Net 45"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Bank Account</label>
//                   <input
//                     {...register("bankAccount")}
//                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Bank Account Number"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Credit Limit</label>
//                   <input
//                     {...register("creditLimit", {
//                       pattern: {
//                         value: /^[0-9]+$/,
//                         message: "Credit Limit must be a number"
//                       }
//                     })}
//                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Credit Limit"
//                   />
//                   {errors.creditLimit && <p className="text-red-500 text-sm mt-1">{errors.creditLimit.message}</p>}
//                 </div>
//               </div>
//             </div>

//             <div className="flex justify-between mt-6">
//               <button
//                 type="button"
//                 className="text-gray-500 hover:underline"
//                 onClick={handleCancel}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//               >
//                 Submit
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddClientsPage;


// import React from 'react';
// import { useForm } from 'react-hook-form';
// import { useNavigate } from 'react-router-dom';
// import { FiUser, FiMail, FiPhone } from 'react-icons/fi';

// const indianStates = [
//   "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
//   "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
//   "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
//   "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
//   "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
//   "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
//   "Daman and Diu", "Lakshadweep", "Delhi", "Puducherry", "Ladakh",
//   "Jammu & Kashmir"
// ];

// const AddClientsPage = () => {
//   const navigate = useNavigate(); // Move useNavigate here
//   const { register, handleSubmit, formState: { errors } } = useForm();

//   const onSubmit = (data) => {
//     console.log("Submitted client data:", data);
//     navigate("/client");
//     // Add your submission logic here
//   };

//   const handleCancel = () => {
//     navigate("/client"); // Navigate back to /client when canceled
//   };

//   return (
//     <div className="container mx-auto p-6">
//       <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
//         <div className="p-6">
//           <h2 className="text-2xl font-bold mb-6">Add New Client</h2>
          
//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//             {/* Basic Information */}
//             <div>
//               <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Reference</label>
//                   <div className="relative">
//                     <input
//                       {...register("ref", { required: "Reference is required" })}
//                       className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       placeholder="Reference"
//                     />
//                   </div>
//                   {errors.ref && <p className="text-red-500 text-sm mt-1">{errors.ref.message}</p>}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Client Name</label>
//                   <div className="relative">
//                     <FiUser className="absolute left-3 top-3 text-gray-400" />
//                     <input
//                       {...register("name", { required: "Name is required" })}
//                       className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       placeholder="Client Name"
//                     />
//                   </div>
//                   {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Email</label>
//                   <div className="relative">
//                     <FiMail className="absolute left-3 top-3 text-gray-400" />
//                     <input
//                       {...register("email", { 
//                         required: "Email is required",
//                         pattern: {
//                           value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
//                           message: "Invalid email address"
//                         }
//                       })}
//                       className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       placeholder="Email"
//                       type="email"
//                     />
//                   </div>
//                   {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Phone</label>
//                   <div className="relative">
//                     <FiPhone className="absolute left-3 top-3 text-gray-400" />
//                     <input
//                       {...register("phone", { required: "Phone is required" })}
//                       className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       placeholder="Phone"
//                     />
//                   </div>
//                   {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Company</label>
//                   <div className="relative">
//                     <input
//                       {...register("company")}
//                       className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       placeholder="Company"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Address Information */}
//             <div>
//               <h3 className="text-lg font-semibold mb-4">Address Information</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-medium mb-1">Street Address</label>
//                   <div className="relative">
//                     <textarea
//                       {...register("address")}
//                       className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       placeholder="Street Address"
//                       rows="3"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">District</label>
//                   <input
//                     {...register("district")}
//                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="District"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">State</label>
//                   <select
//                     {...register("state")}
//                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   >
//                     <option value="">Select State</option>
//                     {indianStates.map((state) => (
//                       <option key={state} value={state}>{state}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Pincode</label>
//                   <input
//                     {...register("pincode")}
//                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Pincode"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Finance Information */}
//             <div>
//               <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Tax ID</label>
//                   <input
//                     {...register("taxId")}
//                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Tax ID"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Payment Terms</label>
//                   <input
//                     {...register("paymentTerms")}
//                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="e.g., Net 30, Net 45"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Bank Account</label>
//                   <input
//                     {...register("bankAccount")}
//                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Bank Account Number"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">Credit Limit</label>
//                   <input
//                     {...register("creditLimit")}
//                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Credit Limit"
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="flex justify-between mt-6">
//               <button
//                 type="button"
//                 className="text-gray-500 hover:underline"
//                 onClick={handleCancel} // Add click handler here
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//               >
//                 Submit
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddClientsPage;
