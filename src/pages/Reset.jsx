import React, { useState } from 'react';
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
  const { register, handleSubmit, watch } = useForm();
  const [showSuccess, setShowSuccess] = useState(false);
  const pwd = watch('newPassword', '');

  const onSubmit = (data) => {
    dispatch(resetPassword(data)).then((res) => {
      if (res.type && res.type.endsWith('fulfilled')) {
        toast.success(res.payload?.message || 'Password reset successful. Please log in.');
        // navigate to login
        navigate('/log-in');
      } else {
        const err = res.payload || 'Reset failed';
        toast.error(err);
      }
    }).catch((err) => {
      toast.error(err?.message || 'Reset failed');
    });
  };

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
            <Textbox label="New Password" name="newPassword" type="password" register={register('newPassword', { required: 'Password required' })} />
            <PasswordStrength password={pwd} />
            {status === 'failed' && error && <p className="text-red-500">{error}</p>}
            <Button type="submit" label={status === 'loading' ? 'Resetting...' : 'Reset Password'} className="bg-blue-600 text-white rounded" />
          </form>
        )}
      </div>
    </div>
  );
};

export default Reset;
