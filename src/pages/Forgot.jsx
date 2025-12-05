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
    dispatch(forgotPassword(data)).then((res) => {
      if (res.type && res.type.endsWith('fulfilled')) {
        const message = (res.payload && (res.payload.message || res.payload.msg)) || 'OTP sent to email';
        toast.success(message);
        // navigate to reset page and pass email in state for convenience
        navigate('/reset', { state: { email: data.email } });
      } else {
        // res.payload may be a string or object
        const errMsg = res.payload?.message || res.payload || res.error || 'Failed to send OTP';
        toast.error(errMsg);
      }
    }).catch((err) => {
      toast.error(err?.message || 'Failed to send OTP');
    });
  };

  // If email passed in location state (e.g., after signup), prefill the input
  React.useEffect(() => {
    try {
      const s = window.history.state && window.history.state.usr && window.history.state.usr.state;
      // fallback: some routers put state differently; attempt to read location.state
      // We'll also check URL query param ?email=
      const params = new URLSearchParams(window.location.search);
      const emailFromQuery = params.get('email');
      const emailToSet = emailFromQuery || (s && s.email) || null;
      if (emailToSet) setValue('email', emailToSet);
    } catch (e) {}
  }, [setValue]);

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
