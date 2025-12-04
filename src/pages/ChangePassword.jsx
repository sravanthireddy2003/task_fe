import React from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { changePassword, selectAuthStatus, selectAuthError, logout } from '../redux/slices/authSlice';
import PasswordStrength from '../components/PasswordStrength';
import Button from '../components/Button';
import Textbox from '../components/Textbox';

const ChangePassword = () => {
  const dispatch = useDispatch();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const navigate = useNavigate();
  const { register, handleSubmit, watch } = useForm();
  const pwd = watch('newPassword', '');

  const onSubmit = (data) => {
    dispatch(changePassword(data)).then((res) => {
      if (res.type && res.type.endsWith('fulfilled')) {
        toast.success(res.payload?.message || 'Password changed successfully. Please log in again.');
        // clear auth and navigate to login
        dispatch(logout());
        navigate('/log-in');
      } else {
        const err = res.payload || 'Change password failed';
        toast.error(err);
      }
    }).catch((err) => {
      toast.error(err?.message || 'Change password failed');
    });
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Change Password</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Textbox label="Old Password" name="oldPassword" type="password" register={register('oldPassword', { required: 'Old password required' })} />
          <Textbox label="New Password" name="newPassword" type="password" register={register('newPassword', { required: 'New password required' })} />
          <PasswordStrength password={pwd} />
          {status === 'failed' && error && <p className="text-red-500">{error}</p>}
          <Button type="submit" label={status === 'loading' ? 'Updating...' : 'Change Password'} className="bg-blue-600 text-white rounded" />
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
