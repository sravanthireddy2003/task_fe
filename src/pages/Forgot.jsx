import React from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { forgotPassword, selectAuthStatus, selectAuthError } from '../redux/slices/authSlice';
import Button from '../components/Button';
import Textbox from '../components/Textbox';

const Forgot = () => {
  const dispatch = useDispatch();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();

  const onSubmit = (data) => {
    dispatch(forgotPassword(data)).then((res) => {
      if (res.type && res.type.endsWith('fulfilled')) {
        const message = res.payload?.message || 'OTP sent to email';
        toast.success(message);
        // navigate to reset page and pass email in state for convenience
        navigate('/reset', { state: { email: data.email } });
      } else {
        const err = res.payload || 'Failed to send OTP';
        toast.error(err);
      }
    }).catch((err) => {
      toast.error(err?.message || 'Failed to send OTP');
    });
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Textbox label="Email" name="email" placeholder="email@example.com" register={register('email', { required: 'Email required' })} />
          {status === 'failed' && error && <p className="text-red-500">{error}</p>}
          <Button type="submit" label={status === 'loading' ? 'Sending...' : 'Send OTP'} className="bg-blue-600 text-white rounded" />
        </form>
      </div>
    </div>
  );
};

export default Forgot;
