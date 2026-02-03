import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as Icons from "../../icons";
import { useDispatch, useSelector } from "react-redux";
import {
  createClient,
  updateClient,
  fetchClients,
  attachDocument,
} from "../../redux/slices/clientSlice";
import { fetchUsers, selectUsers } from "../../redux/slices/userSlice";
import ModalWrapper from "../ModalWrapper";

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli",
  "Daman and Diu",
  "Lakshadweep",
  "Delhi",
  "Puducherry",
  "Ladakh",
  "Jammu & Kashmir",
];

const ClientForm = ({
  open = false,
  setOpen = null,
  client = null,
  onSuccess = null,
  isModal = false,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [files, setFiles] = useState([]);
  const users = useSelector(selectUsers) || [];
  const isEditMode = !!client;

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Pre-fill form when client is provided (edit mode)
  useEffect(() => {
    if (client) {
      setValue("name", client.name || "");
      setValue("email", client.email || "");
      setValue("phone", client.phone || "");
      setValue("company", client.company || "");
      setValue("address", client.address || "");
      setValue("district", client.district || "");
      setValue("state", client.state || "");
      setValue("pincode", client.pincode || "");
      setValue("taxId", client.taxId || "");
      setValue("industry", client.industry || "");
      setValue("notes", client.notes || "");
      setValue("status", client.status || "Active");
      setValue("managerId", client.manager_public_id || client.managerId || "");
    } else {
      reset();
    }
  }, [client, setValue, reset]);

  const isManager = (u) => {
    if (!u) return false;
    const role = (u.role || u.designation || u.title || u.roleName || "")
      .toString()
      .toLowerCase();
    if (role.includes("manager")) return true;
    if (
      Array.isArray(u.roles) &&
      u.roles.some((r) =>
        (r || "").toString().toLowerCase().includes("manager"),
      )
    )
      return true;
    if (
      (u.roleId || u.role_id || u.roleName) &&
      ("" + (u.roleId || u.role_id || u.roleName))
        .toLowerCase()
        .includes("manager")
    )
      return true;
    return false;
  };

  const managers = Array.isArray(users) ? users.filter(isManager) : [];

  const formatError = (err) => {
    if (!err) return null;
    if (typeof err === "string") return err;
    if (err.message) return err.message;
    if (err.error) return err.error;
    if (err.data) {
      if (typeof err.data === "string") return err.data;
      if (err.data.message) return err.data.message;
      if (err.data.error) return err.data.error;
    }
    try {
      return JSON.stringify(err);
    } catch (e) {
      return String(err);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(null);

      let result;
      if (isEditMode) {
        // Update mode
        result = await dispatch(
          updateClient({
            clientId: client.id,
            clientData: data,
          }),
        );
      } else {
        // Create mode
        result = await dispatch(createClient(data));
      }

      if (
        isEditMode
          ? updateClient.fulfilled.match(result)
          : createClient.fulfilled.match(result)
      ) {
        const payload = result.payload;
        if (payload && (payload.success === false || payload.error)) {
          const errMsg = payload.error || payload.message || "Operation failed";
          setSubmitError(errMsg);
          return;
        }

        const updated = payload?.data || payload;
        const successMsg = `Client "${updated?.name || updated?.company || "Updated"}" ${isEditMode ? "updated" : "added"} successfully.`;
        setSubmitSuccess(successMsg);
        dispatch(fetchClients());

        // Handle document uploads for new clients only
        if (!isEditMode && files.length > 0) {
          try {
            const clientId = updated?.id || updated?._id || updated?.public_id;
            if (clientId) {
              for (const f of files) {
                const form = new FormData();
                form.append("file", f, f.name);
                form.append("file_name", f.name);
                try {
                  const userJson =
                    localStorage.getItem("userInfo") ||
                    localStorage.getItem("user");
                  if (userJson) {
                    const u = JSON.parse(userJson);
                    if (u && (u.id || u._id || u.public_id))
                      form.append("uploaded_by", u.id || u._id || u.public_id);
                  }
                } catch (e) {
                  // ignore
                }

                const tenantId = localStorage.getItem("tenantId") || "";
                if (tenantId) form.append("tenantId", tenantId);

                const attachResult = await dispatch(
                  attachDocument({ clientId, document: form }),
                );
                if (!attachDocument.fulfilled.match(attachResult)) {
                  const errMsg =
                    formatError(attachResult.payload) ||
                    attachResult.error?.message ||
                    "Failed to upload document";
                  setSubmitError(errMsg);
                  return;
                }
              }
            }
          } catch (err) {
            console.warn("Failed to attach documents:", err);
            setSubmitError(err?.message || "Failed to attach documents");
            return;
          }
        }

        if (isModal) {
          setOpen?.(false);
          onSuccess?.();
        } else {
          navigate("/admin/clients", {
            state: { created: true, message: successMsg },
          });
        }
      } else {
        const err =
          formatError(result.payload) ||
          result.error?.message ||
          "Operation failed";
        setSubmitError(err);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitError(error?.message || "Unexpected error. Please try again.");
    }
  };

  const handleClose = () => {
    if (isModal && setOpen) {
      setOpen(false);
    } else {
      navigate("/admin/clients");
    }
  };

  const formContent = (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-12 px-8 pb-8"
    >
      {/* Error Alert */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* Success Alert */}
      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-700">{submitSuccess}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-5">
        <h4 className="text-2xl font-bold text-gray-900">
          Basic Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Name *
            </label>
            <input
              {...register("name", { required: "Name is required" })}
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Enter client name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-2 font-medium">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Email *
            </label>
            <input
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email",
                },
              })}
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Enter email address"
              type="email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Phone *
            </label>
            <input
              {...register("phone", {
                required: "Phone is required",
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: "10 digits required",
                },
              })}
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Enter 10-digit phone"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Company
            </label>
            <input
              {...register("company")}
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Enter company name"
            />
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-5">
        <h4 className="text-2xl font-bold text-gray-900">Address</h4>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Street Address
          </label>
          <textarea
            {...register("address")}
            className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            placeholder="Enter street address"
            rows="4"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              District
            </label>
            <input
              {...register("district")}
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Enter district"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              State
            </label>
            <select
              {...register("state")}
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            >
              <option value="">Select State</option>
              {indianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Pincode
            </label>
            <input
              {...register("pincode", {
                pattern: { value: /^[0-9]{6}$/, message: "6 digits" },
              })}
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Enter pincode"
            />
            {errors.pincode && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {errors.pincode.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="space-y-5">
        <h4 className="text-2xl font-bold text-gray-900">Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              GST/Tax ID
            </label>
            <input
              {...register("taxId")}
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Enter GST ID"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Industry
            </label>
            <input
              {...register("industry")}
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Enter industry"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Notes
          </label>
          <textarea
            {...register("notes")}
            className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            placeholder="Enter additional notes"
            rows="4"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Status
            </label>
            <select
              {...register("status")}
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Lead">Lead</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Manager
            </label>
            <select
              {...register("managerId")}
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            >
              <option value="">-- Select Manager (optional) --</option>
              {managers.map((m) => (
                <option
                  key={m.public_id || m._id || m.id}
                  value={m.public_id || m._id || m.id}
                >
                  {m.name || m.firstName || m.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents (only for new clients) */}
      {!isEditMode && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Attach Documents
          </label>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-base"
          />
          <p className="text-sm text-gray-600 mt-3 font-medium">PDF, DOCX, images</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-200">
        <button
          type="button"
          onClick={handleClose}
          className="px-10 py-4 text-lg rounded-xl font-semibold text-gray-700 border-2 border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-10 py-4 text-lg rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          {isEditMode ? "Update Client" : "Add Client"}
        </button>
      </div>
    </form>
  );

  const headerContent = (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">
        {isEditMode ? "Edit Client" : "Add New Client"}
      </h2>
      {isModal && (
        <button
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Icons.X className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  // If modal mode, return wrapped in ModalWrapper
  if (isModal) {
    return (
      <ModalWrapper open={open} setOpen={setOpen}>
        <div className="mb-8 px-8">{headerContent}</div>
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {formContent}
        </div>
      </ModalWrapper>
    );
  }

  // If page mode, return as page
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[90rem] mx-auto bg-white rounded-xl shadow border">
        <div className="p-6 border-b border-gray-200">{headerContent}</div>
        <div className="p-12">{formContent}</div>
      </div>
    </div>
  );
};

export default ClientForm;
