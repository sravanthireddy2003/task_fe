import React from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { changePassword, selectAuthStatus, selectAuthError, logout } from "../redux/slices/authSlice";
import PasswordStrength from "../components/PasswordStrength";
import Button from "../components/Button";
import Textbox from "../components/Textbox";

const ChangePassword = () => {
  const dispatch = useDispatch();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const newPassword = watch("newPassword", "");

 const onSubmit = async (data) => {
  try {
    // Debug log to ensure handler runs
    console.debug("ChangePassword onSubmit payload:", data);

    // Normalize payload to support different backend key expectations
    const payload = {
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
      // common snake_case variants some backends expect
      old_password: data.oldPassword,
      new_password: data.newPassword,
    };

    console.debug("Dispatching changePassword with payload:", payload);
    const res = await dispatch(changePassword(payload)).unwrap();
    console.debug("changePassword result:", res);

    toast.success(res?.message || "Password changed successfully. Please log in again.");
    dispatch(logout());
    navigate("/log-in");
  } catch (err) {
    console.error("changePassword error:", err);
    const message = err?.message || err || "Failed to change password";
    toast.error(message);
  }
};

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Change Password</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Textbox
            label="Old Password"
            name="oldPassword"
            type="password"
            register={register("oldPassword", { required: "Old password required" })}
            error={errors.oldPassword?.message}
          />

          <Textbox
            label="New Password"
            name="newPassword"
            type="password"
            register={register("newPassword", { required: "New password required" })}
            error={errors.newPassword?.message}
          />

          <PasswordStrength password={newPassword} />

          <Textbox
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            register={register("confirmPassword", {
              required: "Please confirm new password",
              validate: (val) => val === newPassword || "Passwords do not match"
            })}
            error={errors.confirmPassword?.message}
          />

          <Button
            type="submit"
            label={status === "loading" ? "Updating..." : "Change Password"}
            className="bg-blue-600 text-white rounded hover:bg-blue-700 transition py-2"
            disabled={status === "loading"}
          />

          {status === "failed" && error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}

          {/* Back to dashboard link */}
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-4 text-blue-600 hover:underline text-center w-full"
          >
            Back to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
