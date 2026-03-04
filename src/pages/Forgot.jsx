import React, { useState } from 'react';
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
  const [formData, setFormData] = useState({ email: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const data = formData;
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
      if (emailToSet) setFormData(prev => ({ ...prev, email: emailToSet }));
    } catch (e) { }
  }, []);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-10 border border-gray-200">
        <h2 className="text-page-title mb-2 text-center text-primary-700">Forgot Password</h2>
        <p className="text-center text-body-text mb-6">
          Enter your email address and weâ€™ll send you an OTP to reset your password.
        </p>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {/* Email Input */}
          <Textbox
            label="Email"
            name="email"
            placeholder="email@example.com"
            className="input"
            register={{
              value: formData.email,
              onChange: handleChange,
            }}
            error={errors.email}
          />
          {status === 'failed' && error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
          {/* Send OTP Button */}
          <Button
            type="submit"
            label={status === 'loading' ? 'Sending...' : 'Send OTP'}
            className="btn btn-primary w-full"
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

