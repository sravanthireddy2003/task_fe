import React from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { changePassword, selectAuthStatus, selectAuthError, logout, selectUser } from "../redux/slices/authSlice";
import PasswordStrength from "../components/PasswordStrength";
import Button from "../components/Button";
import Textbox from "../components/Textbox";
import { getDefaultLandingPath } from "../utils";

const ChangePassword = () => {
  const dispatch = useDispatch();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const user = useSelector(selectUser);
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
    <div className='w-full min-h-screen flex items-center justify-center flex-col lg:flex-row bg-[#f3f4f6] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#302943] via-slate-900 to-black'>
      <div className='w-full md:w-auto flex gap-0 md:gap-40 flex-col md:flex-row items-center justify-center'>
        {/* Left Side (Optional - keep simple centered card for now) */}

        {/* Form Card */}
        <div className='w-full md:w-[450px] p-4 md:p-8 flex flex-col justify-center items-center bg-white dark:bg-black/20 dark:backdrop-blur-3xl rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10'>
          <div className="w-full flex-col mb-6">
            <h2 className='text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-blue-600 to-indigo-500 mb-2'>
              Change Password
            </h2>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              Ensure your account stays secure by updating your password.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className='w-full flex flex-col gap-5'>
            <Textbox
              label="Old Password"
              placeholder="Enter your current password"
              name="oldPassword"
              type="password"
              className="w-full rounded-xl"
              register={register("oldPassword", { required: "Old password required" })}
              error={errors.oldPassword?.message}
            />

            <Textbox
              label="New Password"
              placeholder="Enter new password"
              name="newPassword"
              type="password"
              className="w-full rounded-xl"
              register={register("newPassword", { required: "New password required" })}
              error={errors.newPassword?.message}
            />

            <PasswordStrength password={newPassword} />

            <Textbox
              label="Confirm Password"
              placeholder="Confirm new password"
              name="confirmPassword"
              type="password"
              className="w-full rounded-xl"
              register={register("confirmPassword", {
                required: "Please confirm new password",
                validate: (val) => val === newPassword || "Passwords do not match"
              })}
              error={errors.confirmPassword?.message}
            />

            {status === "failed" && error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                <span className="font-bold">Error:</span> {error}
              </div>
            )}

            <Button
              type="submit"
              label={status === "loading" ? "Updating..." : "Update Password"}
              className='w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
              disabled={status === "loading"}
            />
          </form>

          {/* Back Link */}
          <div className="mt-8 w-full border-t border-gray-100 dark:border-white/10 pt-4 text-center">
            <button
              onClick={() => {
                const target = getDefaultLandingPath(user);
                navigate(target, { replace: true });
              }}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors flex items-center justify-center gap-2"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// yhujjjjj
export default ChangePassword;
// change passwors\