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
  const { register, handleSubmit, setValue } = useForm();

  const onSubmit = (data) => {
    dispatch(forgotPassword(data))
      .then((res) => {
        if (res.type && res.type.endsWith('fulfilled')) {
          const message = (res.payload && (res.payload.message || res.payload.msg)) || 'OTP sent to email';
          toast.success(message);
          navigate('/reset', { state: { email: data.email } });
        } else {
          const errMsg = res.payload?.message || res.payload || res.error || 'Failed to send OTP';
          toast.error(errMsg);
        }
      })
      .catch((err) => {
        toast.error(err?.message || 'Failed to send OTP');
      });
  };

  React.useEffect(() => {
    try {
      const s = window.history.state?.usr?.state;
      const params = new URLSearchParams(window.location.search);
      const emailFromQuery = params.get('email');
      const emailToSet = emailFromQuery || (s && s.email) || null;
      if (emailToSet) setValue('email', emailToSet);
    } catch (e) {}
  }, [setValue]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl p-10 border border-white/30">
        <h2 className="text-3xl font-bold text-blue-800 mb-2 text-center">Forgot Password</h2>
        <p className="text-center text-gray-600 mb-6">
          Enter your email address and we’ll send you an OTP to reset your password.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Email Input */}
          <Textbox
            label="Email"
            name="email"
            placeholder="email@example.com"
            className="w-full h-12 rounded-full border border-gray-300 px-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            register={register('email', { required: 'Email is required' })}
          />
          {status === 'failed' && error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
          {/* Send OTP Button */}
          <Button
            type="submit"
            label={status === 'loading' ? 'Sending...' : 'Send OTP'}
            className="w-full h-12 bg-blue-700 text-white rounded-full font-semibold hover:bg-blue-800 transition"
          />
          <p className="text-center text-gray-600 text-sm mt-2">
            Remembered your password?{' '}
            <span
              onClick={() => navigate('/login')}
              className="text-blue-700 font-semibold hover:underline cursor-pointer"
            >
              Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Forgot;
