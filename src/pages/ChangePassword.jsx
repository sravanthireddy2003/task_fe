import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { changePassword, selectAuthStatus, selectAuthError, logout, selectUser } from "../redux/slices/authSlice";
import PasswordStrength from "../components/PasswordStrength";
import Button from "../components/Button";
import Textbox from "../components/Textbox";
import { getDefaultLandingPath } from "../utils";
import * as Icons from "../icons";

const ChangePassword = () => {
  const dispatch = useDispatch();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.oldPassword) newErrors.oldPassword = "Old password required";

    // Check password rules: min 8 chars, 1 uppercase, 1 number, 1 special character
    if (!formData.newPassword) {
      newErrors.newPassword = "New password required";
    } else if (
      formData.newPassword.length < 8 ||
      !/[A-Z]/.test(formData.newPassword) ||
      !/[0-9]/.test(formData.newPassword) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)
    ) {
      newErrors.newPassword = "Password must be at least 8 characters, 1 uppercase, 1 number, 1 special character";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm new password";
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const data = formData;
    try {
      // Normalize payload to support different backend key expectations
      const payload = {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
        // common snake_case variants some backends expect
        old_password: data.oldPassword,
        new_password: data.newPassword,
      };

      const res = await dispatch(changePassword(payload)).unwrap();

      toast.success(res?.message || "Password changed successfully. Please log in again.");
      dispatch(logout());
      navigate("/log-in");
    } catch (err) {
      const message = err?.message || err || "Failed to change password";
      toast.error(message);
    }
  };

  return (
    <div className='w-full min-h-screen flex items-center justify-center flex-col lg:flex-row bg-gray-50'>
      <div className='w-full md:w-auto flex gap-0 md:gap-40 flex-col md:flex-row items-center justify-center'>
        {/* Left Side (Optional - keep simple centered card for now) */}

        {/* Form Card */}
        <div className='w-full md:w-[450px] p-4 md:p-8 flex flex-col justify-center items-center bg-white rounded-3xl shadow-2xl border border-gray-200'>
          <div className="w-full flex-col mb-6">
            <h2 className='text-page-title text-gray-900 mb-2'>
              Change Password
            </h2>
            <p className='text-sm text-gray-500'>
              Ensure your account stays secure by updating your password.
            </p>
          </div>

          <form onSubmit={onSubmit} className='w-full flex flex-col gap-5'>
            <Textbox
              label="Old Password"
              placeholder="Enter your current password"
              name="oldPassword"
              type="password"
              className="w-full rounded-xl"
              register={{ value: formData.oldPassword, onChange: handleChange }}
              error={errors.oldPassword}
              showPassword={showOld}
              onPasswordToggle={() => setShowOld(p => !p)}
              rightIcon={showOld ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
            />

            <Textbox
              label="New Password"
              placeholder="Enter new password"
              name="newPassword"
              type="password"
              className="w-full rounded-xl"
              register={{ value: formData.newPassword, onChange: handleChange }}
              error={errors.newPassword}
              showPassword={showNew}
              onPasswordToggle={() => setShowNew(p => !p)}
              rightIcon={showNew ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
            />

            <PasswordStrength password={formData.newPassword} />

            <Textbox
              label="Confirm Password"
              placeholder="Confirm new password"
              name="confirmPassword"
              type="password"
              className="w-full rounded-xl"
              register={{ value: formData.confirmPassword, onChange: handleChange }}
              error={errors.confirmPassword}
              showPassword={showConfirm}
              onPasswordToggle={() => setShowConfirm(p => !p)}
              rightIcon={showConfirm ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
            />

            {status === "failed" && error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                <span className="font-bold">Error:</span> {error}
              </div>
            )}

            <Button
              type="submit"
              label={status === "loading" ? "Updating..." : "Update Password"}
              className='btn btn-primary w-full h-12'
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
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center justify-center gap-2"
            >
              â† Back to Dashboard
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

