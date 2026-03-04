import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { resetPassword, selectAuthStatus, selectAuthError } from '../redux/slices/authSlice';
import PasswordStrength from '../components/PasswordStrength';
import Button from '../components/Button';
import Textbox from '../components/Textbox';
import * as Icons from '../icons';

const Reset = () => {
  const dispatch = useDispatch();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', otp: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email required';
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) newErrors.email = 'Invalid email';

    if (!formData.otp) newErrors.otp = 'OTP required';

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password required';
    } else if (
      formData.newPassword.length < 8 ||
      !/[A-Z]/.test(formData.newPassword) ||
      !/[0-9]/.test(formData.newPassword) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)
    ) {
      newErrors.newPassword = "Password must be at least 8 characters, 1 uppercase, 1 number, 1 special character";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password required';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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

    const payload = {
      email: data.email,
      otp: data.otp,
      newPassword: data.newPassword,
    };

    dispatch(resetPassword(payload))
      .then((res) => {
        if (res.type && res.type.endsWith('fulfilled')) {
          const msg = res.payload?.message || res.payload?.msg || 'Password reset successful. Please log in.';
          toast.success(msg);
          navigate('/log-in');
        } else {
          const err = res.payload?.message || res.payload || res.error || 'Reset failed';
          toast.error(err);
        }
      })
      .catch((err) => {
        toast.error(err?.message || 'Reset failed');
      });
  };

  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search).get('email') || location.state?.email;
      if (q) setFormData(prev => ({ ...prev, email: q }));
    } catch (e) { }
  }, [location]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-1"
        >
          &#8592; Back
        </button>

        <h2 className="text-page-title mb-6 text-center text-primary-700">Reset Password</h2>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <Textbox
            label="Email"
            name="email"
            placeholder="email@example.com"
            register={{
              value: formData.email,
              onChange: handleChange,
            }}
            error={errors.email}
            className="w-full"
          />
          <Textbox
            label="OTP"
            name="otp"
            placeholder="123456"
            register={{
              value: formData.otp,
              onChange: handleChange,
            }}
            error={errors.otp}
            className="w-full"
          />
          <Textbox
            label="New Password"
            name="newPassword"
            type="password"
            register={{ value: formData.newPassword, onChange: handleChange }}
            error={errors.newPassword}
            className="w-full"
            showPassword={showNew}
            onPasswordToggle={() => setShowNew(p => !p)}
            rightIcon={showNew ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
          />
          <PasswordStrength password={formData.newPassword} />
          <Textbox
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            register={{ value: formData.confirmPassword, onChange: handleChange }}
            error={errors.confirmPassword}
            className="w-full"
            showPassword={showConfirm}
            onPasswordToggle={() => setShowConfirm(p => !p)}
            rightIcon={showConfirm ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
          />

          {status === 'failed' && error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            type="submit"
            label={status === 'loading' ? 'Resetting...' : 'Reset Password'}
            className="btn btn-primary w-full"
          />
        </form>
      </div>
    </div>
  );
};

export default Reset;

