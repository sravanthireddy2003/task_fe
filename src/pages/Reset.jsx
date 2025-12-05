import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { resetPassword, selectAuthStatus, selectAuthError } from '../redux/slices/authSlice';
import PasswordStrength from '../components/PasswordStrength';
import Button from '../components/Button';
import Textbox from '../components/Textbox';

const Reset = () => {
  const dispatch = useDispatch();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue } = useForm();
  const [showSuccess, setShowSuccess] = useState(false);
  const pwd = watch('newPassword', '');
  const location = useLocation();

  const onSubmit = (data) => {
    // Ensure we send only the fields expected by the backend (email, otp, newPassword)
    const payload = {
      email: data.email,
      otp: data.otp,
      newPassword: data.newPassword,
    };

    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    dispatch(resetPassword(payload)).then((res) => {
      if (res.type && res.type.endsWith('fulfilled')) {
        const msg = res.payload?.message || res.payload?.msg || 'Password reset successful. Please log in.';
        toast.success(msg);
        // navigate to login
        navigate('/log-in');
      } else {
        const err = res.payload?.message || res.payload || res.error || 'Reset failed';
        toast.error(err);
      }
    }).catch((err) => {
      toast.error(err?.message || 'Reset failed');
    });
  };

  // Prefill email if passed via location.state or query param
  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search).get('email') || location.state?.email;
      if (q) setValue('email', q);
    } catch (e) {}
  }, [location, setValue]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
        {showSuccess ? (
          <p className="text-green-600">Password reset successful. Please log in.</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Textbox label="Email" name="email" placeholder="email@example.com" register={register('email', { required: 'Email required' })} />
            <Textbox label="OTP" name="otp" placeholder="123456" register={register('otp', { required: 'OTP required' })} />
            <Textbox label="New Password" name="newPassword" type="password" register={register('newPassword', { required: 'Password required', minLength: { value: 6, message: 'Minimum 6 characters' } })} />
            <PasswordStrength password={pwd} />
            <Textbox label="Confirm Password" name="confirmPassword" type="password" register={register('confirmPassword', { required: 'Confirm password required' })} />
            {status === 'failed' && error && <p className="text-red-500">{error}</p>}
            <Button type="submit" label={status === 'loading' ? 'Resetting...' : 'Reset Password'} className="bg-blue-600 text-white rounded" />
          </form>
        )}
      </div>
    </div>
  );
};

export default Reset;
